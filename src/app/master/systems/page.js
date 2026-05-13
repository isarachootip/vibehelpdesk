"use client";
import { useState, useEffect } from "react";

export default function MasterSystems() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ system_code: "", system_name: "", system_type: "software", group_name: "", owner_user_id: "" });

  const fetchData = () => {
    Promise.all([
      fetch("/api/master/systems").then(r => r.json()),
      fetch("/api/master").then(r => r.json()),
    ]).then(([sys, master]) => {
      if (Array.isArray(sys)) setItems(sys);
      if (master?.users) setUsers(master.users.filter(u => u.role === "tier2"));
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/master/systems/${editItem.system_id}` : "/api/master/systems";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { fetchData(); setShowForm(false); setEditItem(null); setForm({ system_code: "", system_name: "", system_type: "software", group_name: "", owner_user_id: "" }); }
    else { const err = await res.json(); alert(err.error || "Error"); }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ system_code: item.system_code, system_name: item.system_name, system_type: item.system_type, group_name: item.group_name || "", owner_user_id: item.owner_user_id ? String(item.owner_user_id) : "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("ปิดใช้งาน System นี้?")) return;
    await fetch(`/api/master/systems/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}><i className="fa-solid fa-server" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>Systems / Error Categories</h2>
        <button className="btn btn-success" onClick={() => { setShowForm(true); setEditItem(null); setForm({ system_code: "", system_name: "", system_type: "software", group_name: "", owner_user_id: "" }); }}>
          <i className="fa-solid fa-plus"></i> เพิ่ม System ใหม่
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "16px" }}>
          <div className="card-header"><h3 className="card-title">{editItem ? "แก้ไข System" : "เพิ่ม System ใหม่"}</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group" style={{ maxWidth: "200px" }}>
                  <label>System Group (Code) <span className="req">*</span></label>
                  <input className="form-control" value={form.system_code} onChange={e => setForm(f => ({ ...f, system_code: e.target.value }))} placeholder="เช่น POS" required />
                </div>
                <div className="form-group">
                  <label>System Name <span className="req">*</span></label>
                  <input className="form-control" value={form.system_name} onChange={e => setForm(f => ({ ...f, system_name: e.target.value }))} placeholder="เช่น Point of Sale" required />
                </div>
                <div className="form-group" style={{ maxWidth: "150px" }}>
                  <label>Type</label>
                  <select className="form-control" value={form.system_type} onChange={e => setForm(f => ({ ...f, system_type: e.target.value }))}>
                    <option value="software">Software</option>
                    <option value="hardware">Hardware</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category Group</label>
                  <input className="form-control" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} placeholder="เช่น WEB/App, AI/Chat, Data/Report" />
                </div>
                <div className="form-group">
                  <label>IT Owner (Tier 2)</label>
                  <select className="form-control" value={form.owner_user_id} onChange={e => setForm(f => ({ ...f, owner_user_id: e.target.value }))}>
                    <option value="">-- ไม่ระบุ --</option>
                    {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="submit" className="btn btn-primary btn-sm"><i className="fa-solid fa-check"></i> {editItem ? "อัปเดต" : "บันทึก"}</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditItem(null); }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Code</th><th>Name</th><th>Type</th><th>Group</th><th>IT Owner</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.system_id} style={{ opacity: item.is_active ? 1 : 0.5 }}>
                    <td><span className="chip">{item.system_code}</span></td>
                    <td style={{ fontWeight: 600 }}>{item.system_name}</td>
                    <td style={{ fontSize: ".82rem" }}>{item.system_type === "hardware" ? <span style={{ color: "var(--warning)" }}><i className="fa-solid fa-microchip"></i> HW</span> : <span style={{ color: "var(--primary-light)" }}><i className="fa-solid fa-code"></i> SW</span>}</td>
                    <td className="text-muted" style={{ fontSize: ".82rem" }}>{item.group_name || "-"}</td>
                    <td style={{ fontSize: ".82rem" }}>{item.owner_user?.full_name || "-"}</td>
                    <td><span className={`badge ${item.is_active ? "badge-success" : "badge-gray"}`}>{item.is_active ? "Active" : "Inactive"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}><i className="fa-solid fa-pen"></i></button>
                        {item.is_active && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(item.system_id)}><i className="fa-solid fa-trash"></i></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
