"use client";
import { useState, useEffect } from "react";

const ROLES = [
  { value: "", label: "ทุก Role" },
  { value: "admin", label: "Admin" },
  { value: "tier1", label: "Tier 1 (Helpdesk)" },
  { value: "tier2", label: "Tier 2 (IT Support)" },
  { value: "end_user", label: "End User" },
];

const roleBadge = (role) => ({
  admin: "badge-danger",
  tier2: "badge-primary",
  tier1: "badge-warning",
  end_user: "badge-gray",
}[role] || "badge-gray");

export default function MasterUsers() {
  const [items, setItems] = useState([]);
  const [bus, setBus] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportExcel = async () => {
    if (!confirm("คุณต้องการนำเข้ารายการผู้ใช้ทั้งหมดจากไฟล์ Excel (user_TW) หรือไม่? (ใช้เวลาประมาณ 10-30 วินาที)")) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/master/users/import", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(`นำเข้าสำเร็จ: ${data.success} ผู้ใช้ (ล้มเหลว ${data.errors.length} รายการ)`);
        fetchData();
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsImporting(false);
    }
  };

  // Search / Filter state
  const [searchText, setSearchText] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");

  const initialForm = {
    email: "", full_name: "", phone: "", role: "end_user",
    bu_id: "", location_id: "", password: ""
  };
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    try {
      const [usersRes, masterRes] = await Promise.all([
        fetch("/api/master/users"),
        fetch("/api/master")
      ]);
      const usersData = await usersRes.json();
      const masterData = await masterRes.json();
      if (Array.isArray(usersData)) setItems(usersData);
      if (masterData.bus) setBus(masterData.bus);
      if (masterData.locations) setLocations(masterData.locations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editItem && !form.password) {
      alert("กรุณาตั้งรหัสผ่านสำหรับผู้ใช้ใหม่");
      return;
    }
    const url = editItem ? `/api/master/users/${editItem.user_id}` : "/api/master/users";
    const method = editItem ? "PUT" : "POST";
    const payload = { ...form };
    if (payload.bu_id) payload.bu_id = parseInt(payload.bu_id);
    else payload.bu_id = null;
    if (payload.location_id) payload.location_id = parseInt(payload.location_id);
    else payload.location_id = null;
    if (!payload.password) delete payload.password;

    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        fetchData(); setShowForm(false); setEditItem(null); setForm(initialForm);
      } else {
        const err = await res.json(); alert(err.error || "Error");
      }
    } catch (error) {
      alert("Error submitting data");
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      email: item.email,
      full_name: item.full_name,
      phone: item.phone || "",
      role: item.role,
      bu_id: item.bu_id ? String(item.bu_id) : "",
      location_id: item.location_id ? String(item.location_id) : "",
      password: ""
    });
    setShowPassword(false);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("ปิดใช้งานผู้ใช้นี้?")) return;
    await fetch(`/api/master/users/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleReactivate = async (id) => {
    await fetch(`/api/master/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true })
    });
    fetchData();
  };

  // Filtered items
  const filtered = items.filter(item => {
    const q = searchText.toLowerCase();
    const matchText = !q ||
      item.full_name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.phone?.toLowerCase().includes(q) ||
      item.bu?.bu_code?.toLowerCase().includes(q) ||
      item.bu?.bu_name?.toLowerCase().includes(q);
    const matchRole = !filterRole || item.role === filterRole;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && item.is_active) ||
      (filterStatus === "inactive" && !item.is_active);
    return matchText && matchRole && matchStatus;
  });

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
          <i className="fa-solid fa-users" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>
          Users Management
          <span style={{ marginLeft: "10px", fontSize: ".8rem", fontWeight: 400, color: "var(--text-muted)" }}>
            ({filtered.length} รายการ)
          </span>
        </h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            className="btn btn-outline" 
            onClick={handleImportExcel}
            disabled={isImporting}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <i className="fa-solid fa-file-excel" style={{ color: "#10b981" }}></i> {isImporting ? "กำลังนำเข้า..." : "นำเข้าผู้ใช้จาก Excel"}
          </button>
          <button className="btn btn-success" onClick={() => { setShowForm(true); setEditItem(null); setForm(initialForm); setShowPassword(false); }}>
            <i className="fa-solid fa-plus"></i> เพิ่ม User ใหม่
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-body" style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: "1", minWidth: "220px" }}>
              <i className="fa-solid fa-magnifying-glass" style={{
                position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
                color: "var(--text-muted)", fontSize: ".85rem"
              }}></i>
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหา ชื่อ, Email, เบอร์โทร, BU..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>

            {/* Role Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fa-solid fa-layer-group" style={{ color: "var(--text-muted)", fontSize: ".85rem" }}></i>
              <select
                className="form-control"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                style={{ minWidth: "160px" }}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ display: "flex", gap: "4px" }}>
              {[
                { val: "active", label: "Active" },
                { val: "inactive", label: "Inactive" },
                { val: "all", label: "ทั้งหมด" }
              ].map(s => (
                <button
                  key={s.val}
                  onClick={() => setFilterStatus(s.val)}
                  className={`btn btn-sm ${filterStatus === s.val ? "btn-primary" : "btn-outline"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Clear button */}
            {(searchText || filterRole || filterStatus !== "active") && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearchText(""); setFilterRole(""); setFilterStatus("active"); }}>
                <i className="fa-solid fa-xmark"></i> ล้าง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "700px", margin: 0, maxHeight: "92vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">
                <i className={`fa-solid ${editItem ? "fa-pen" : "fa-user-plus"}`} style={{ marginRight: "8px", color: "var(--primary)" }}></i>
                {editItem ? "แก้ไขข้อมูล User" : "เพิ่ม User ใหม่"}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditItem(null); setForm(initialForm); }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Row 1: Email + Full Name */}
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Email <span className="req">*</span></label>
                    <input type="email" className="form-control" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="user@example.com" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>ชื่อ-นามสกุล <span className="req">*</span></label>
                    <input className="form-control" value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="เช่น สมชาย ใจดี" required />
                  </div>
                </div>

                {/* Row 2: Phone + Role */}
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>เบอร์โทรศัพท์</label>
                    <div style={{ position: "relative" }}>
                      <i className="fa-solid fa-phone" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: ".82rem" }}></i>
                      <input
                        type="tel"
                        className="form-control"
                        value={form.phone}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setForm(f => ({ ...f, phone: digits }));
                        }}
                        placeholder="เช่น 0812345678"
                        maxLength={10}
                        inputMode="numeric"
                        pattern="[0-9]{9,10}"
                        style={{ paddingLeft: "34px" }}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Role (กลุ่มผู้ใช้) <span className="req">*</span></label>
                    <select className="form-control" value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      <option value="end_user">End User (ผู้ใช้งานทั่วไป)</option>
                      <option value="tier1">Tier 1 — Helpdesk</option>
                      <option value="tier2">Tier 2 — IT Support</option>
                      <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: BU + Location */}
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Business Unit (BU)</label>
                    <select className="form-control" value={form.bu_id}
                      onChange={e => setForm(f => ({ ...f, bu_id: e.target.value }))}>
                      <option value="">-- ไม่ระบุ --</option>
                      {bus.map(b => <option key={b.bu_id} value={b.bu_id}>{b.bu_code} — {b.bu_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Location</label>
                    <select className="form-control" value={form.location_id}
                      onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}>
                      <option value="">-- ไม่ระบุ --</option>
                      {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.location_code} — {l.location_name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 4: Password */}
                <div className="form-group">
                  <label>
                    <i className="fa-solid fa-lock" style={{ marginRight: "6px", color: "var(--primary)" }}></i>
                    {editItem ? "รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)" : "รหัสผ่าน *"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={editItem ? "เว้นว่างถ้าไม่ต้องการเปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่านเริ่มต้น"}
                      style={{ paddingRight: "42px" }}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                  {editItem && (
                    <p style={{ fontSize: ".73rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      <i className="fa-solid fa-circle-info" style={{ marginRight: "4px" }}></i>
                      กรอกเฉพาะเมื่อต้องการรีเซ็ตรหัสผ่านให้ผู้ใช้คนนี้
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditItem(null); setForm(initialForm); }}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fa-solid fa-check"></i> {editItem ? "อัปเดต" : "บันทึก"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ height: "200px" }}>
              <div className="loader-wrap"><div className="loader-pulse"></div></div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ชื่อ-นามสกุล</th>
                    <th>Email</th>
                    <th><i className="fa-solid fa-phone" style={{ marginRight: "4px" }}></i>เบอร์โทร</th>
                    <th>Role</th>
                    <th>BU</th>
                    <th>Location</th>
                    <th>Password</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.user_id} style={{ opacity: item.is_active ? 1 : 0.5 }}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: "32px", height: "32px", borderRadius: "50%",
                            background: "var(--primary)", color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: ".75rem", fontWeight: 700, flexShrink: 0
                          }}>
                            {item.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          {item.full_name}
                        </div>
                      </td>
                      <td style={{ fontSize: ".82rem" }}>{item.email}</td>
                      <td style={{ fontSize: ".82rem" }}>
                        {item.phone ? (
                          <a href={`tel:${item.phone}`} style={{ color: "var(--primary-light)", textDecoration: "none" }}>
                            <i className="fa-solid fa-phone" style={{ marginRight: "4px", fontSize: ".75rem" }}></i>
                            {item.phone}
                          </a>
                        ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </td>
                      <td>
                        <span className={`badge ${roleBadge(item.role)}`} style={{ textTransform: "uppercase", fontSize: ".7rem" }}>
                          {item.role}
                        </span>
                      </td>
                      <td style={{ fontSize: ".82rem" }}>
                        {item.bu ? <span className="chip">{item.bu.bu_code}</span> : "—"}
                      </td>
                      <td style={{ fontSize: ".82rem" }}>{item.location?.location_code || "—"}</td>
                      <td style={{ fontSize: ".82rem" }}>
                        {item.password ? (
                          <span style={{ color: "var(--success)" }}>
                            <i className="fa-solid fa-lock" style={{ marginRight: "4px" }}></i>ตั้งแล้ว
                          </span>
                        ) : (
                          <span style={{ color: "var(--danger)" }}>
                            <i className="fa-solid fa-lock-open" style={{ marginRight: "4px" }}></i>ยังไม่ตั้ง
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${item.is_active ? "badge-success" : "badge-gray"}`}>
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-outline btn-sm" title="แก้ไข" onClick={() => handleEdit(item)}>
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          {item.is_active ? (
                            <button className="btn btn-ghost btn-sm" title="ปิดใช้งาน" style={{ color: "var(--danger)" }} onClick={() => handleDelete(item.user_id)}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          ) : (
                            <button className="btn btn-ghost btn-sm" title="เปิดใช้งาน" style={{ color: "var(--success)" }} onClick={() => handleReactivate(item.user_id)}>
                              <i className="fa-solid fa-rotate-right"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                        <i className="fa-solid fa-search" style={{ marginRight: "8px" }}></i>
                        ไม่พบผู้ใช้ที่ตรงกับการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
