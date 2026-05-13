"use client";
import { useState, useEffect } from "react";

export default function MasterUsers() {
  const [items, setItems] = useState([]);
  const [bus, setBus] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const initialForm = { email: "", full_name: "", phone: "", role: "end_user", bu_id: "", location_id: "" };
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
    const url = editItem ? `/api/master/users/${editItem.user_id}` : "/api/master/users";
    const method = editItem ? "PUT" : "POST";
    
    // Prepare data
    const payload = { ...form };
    if (payload.bu_id) payload.bu_id = parseInt(payload.bu_id);
    if (payload.location_id) payload.location_id = parseInt(payload.location_id);
    
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
      location_id: item.location_id ? String(item.location_id) : "" 
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("ปิดใช้งานผู้ใช้นี้?")) return;
    await fetch(`/api/master/users/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}><i className="fa-solid fa-users" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>Users Management</h2>
        <button className="btn btn-success" onClick={() => { setShowForm(true); setEditItem(null); setForm(initialForm); }}>
          <i className="fa-solid fa-plus"></i> เพิ่ม User ใหม่
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "16px" }}>
          <div className="card-header"><h3 className="card-title">{editItem ? "แก้ไข User" : "เพิ่ม User ใหม่"}</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Email <span className="req">*</span></label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="เช่น user@example.com" required disabled={!!editItem} />
                </div>
                <div className="form-group">
                  <label>Full Name <span className="req">*</span></label>
                  <input className="form-control" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="เช่น สมชาย ใจดี" required />
                </div>
                <div className="form-group" style={{ maxWidth: "150px" }}>
                  <label>Role <span className="req">*</span></label>
                  <select className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="end_user">End User</option>
                    <option value="tier1">Tier 1 (Helpdesk)</option>
                    <option value="tier2">Tier 2 (IT Support)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="เช่น 0812345678" />
                </div>
                <div className="form-group">
                  <label>Business Unit (BU)</label>
                  <select className="form-control" value={form.bu_id} onChange={e => setForm(f => ({ ...f, bu_id: e.target.value }))}>
                    <option value="">-- ไม่ระบุ --</option>
                    {bus.map(b => <option key={b.bu_id} value={b.bu_id}>{b.bu_code} - {b.bu_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <select className="form-control" value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}>
                    <option value="">-- ไม่ระบุ --</option>
                    {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.location_code} - {l.location_name}</option>)}
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
              <thead><tr><th>Full Name</th><th>Email</th><th>Role</th><th>BU</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.user_id} style={{ opacity: item.is_active ? 1 : 0.5 }}>
                    <td style={{ fontWeight: 600 }}>{item.full_name}</td>
                    <td>{item.email}</td>
                    <td>
                      <span className={`badge ${item.role === 'admin' ? 'badge-danger' : item.role === 'tier2' ? 'badge-primary' : item.role === 'tier1' ? 'badge-warning' : 'badge-gray'}`}>
                        {item.role}
                      </span>
                    </td>
                    <td style={{ fontSize: ".82rem" }}>{item.bu?.bu_code || "-"}</td>
                    <td style={{ fontSize: ".82rem" }}>{item.location?.location_code || "-"}</td>
                    <td><span className={`badge ${item.is_active ? "badge-success" : "badge-gray"}`}>{item.is_active ? "Active" : "Inactive"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}><i className="fa-solid fa-pen"></i></button>
                        {item.is_active && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(item.user_id)}><i className="fa-solid fa-trash"></i></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && <tr><td colSpan="7" className="text-center">ไม่มีข้อมูล</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
