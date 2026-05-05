"use client";
import { useState, useEffect } from "react";

export default function MasterBU() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ bu_code: "", bu_name: "", bu_description: "" });

  const fetchData = () => {
    fetch("/api/master/bu").then(r => r.json()).then(d => { if (Array.isArray(d)) setItems(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/master/bu/${editItem.bu_id}` : "/api/master/bu";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { fetchData(); setShowForm(false); setEditItem(null); setForm({ bu_code: "", bu_name: "", bu_description: "" }); }
    else { const err = await res.json(); alert(err.error || "Error"); }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ bu_code: item.bu_code, bu_name: item.bu_name, bu_description: item.bu_description || "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("ปิดใช้งาน BU นี้?")) return;
    await fetch(`/api/master/bu/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}><i className="fa-solid fa-building" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>Business Units</h2>
        <button className="btn btn-success" onClick={() => { setShowForm(true); setEditItem(null); setForm({ bu_code: "", bu_name: "", bu_description: "" }); }}>
          <i className="fa-solid fa-plus"></i> เพิ่ม BU ใหม่
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: "16px" }}>
          <div className="card-header"><h3 className="card-title">{editItem ? "แก้ไข BU" : "เพิ่ม BU ใหม่"}</h3></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group" style={{ maxWidth: "200px" }}>
                  <label>BU Code <span className="req">*</span></label>
                  <input className="form-control" value={form.bu_code} onChange={e => setForm(f => ({ ...f, bu_code: e.target.value }))} placeholder="เช่น TWD" required />
                </div>
                <div className="form-group">
                  <label>BU Name <span className="req">*</span></label>
                  <input className="form-control" value={form.bu_name} onChange={e => setForm(f => ({ ...f, bu_name: e.target.value }))} placeholder="เช่น Thaiwatsadu" required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input className="form-control" value={form.bu_description} onChange={e => setForm(f => ({ ...f, bu_description: e.target.value }))} placeholder="คำอธิบาย (optional)" />
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

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>BU Code</th><th>BU Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.bu_id} style={{ opacity: item.is_active ? 1 : 0.5 }}>
                    <td><span className="chip">{item.bu_code}</span></td>
                    <td style={{ fontWeight: 600 }}>{item.bu_name}</td>
                    <td className="text-muted" style={{ fontSize: ".82rem" }}>{item.bu_description || "-"}</td>
                    <td><span className={`badge ${item.is_active ? "badge-success" : "badge-gray"}`}>{item.is_active ? "Active" : "Inactive"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}><i className="fa-solid fa-pen"></i></button>
                        {item.is_active && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(item.bu_id)}><i className="fa-solid fa-trash"></i></button>}
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
