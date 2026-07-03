"use client";
import { useState, useEffect } from "react";

export default function MasterBU() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ 
    bu_code: "", bu_name: "", bu_description: "", 
    contact_person: "", phone: "", line_id: "", website: "", logo_url: "" 
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("files", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.files && data.files[0]) {
        setForm(f => ({ ...f, logo_url: data.files[0].file_url }));
      } else {
        alert(data.error || "อัปโหลดล้มเหลว");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปโหลด");
    }
  };

  const fetchData = () => {
    fetch("/api/master/bu").then(r => r.json()).then(d => { if (Array.isArray(d)) setItems(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/master/bu/${editItem.bu_id}` : "/api/master/bu";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { fetchData(); setShowForm(false); setEditItem(null); setForm({ bu_code: "", bu_name: "", bu_description: "", contact_person: "", phone: "", line_id: "", website: "", logo_url: "" }); }
    else { const err = await res.json(); alert(err.error || "Error"); }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ 
      bu_code: item.bu_code, bu_name: item.bu_name, bu_description: item.bu_description || "",
      contact_person: item.contact_person || "", phone: item.phone || "", 
      line_id: item.line_id || "", website: item.website || "", logo_url: item.logo_url || ""
    });
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
        <button className="btn btn-success" onClick={() => { setShowForm(true); setEditItem(null); setForm({ bu_code: "", bu_name: "", bu_description: "", contact_person: "", phone: "", line_id: "", website: "", logo_url: "" }); }}>
          <i className="fa-solid fa-plus"></i> เพิ่ม BU ใหม่
        </button>
      </div>

      {showForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "600px", margin: 0, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">{editItem ? "แก้ไข BU" : "เพิ่ม BU ใหม่"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditItem(null); }} style={{ padding: "4px 8px" }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>BU Code <span className="req">*</span></label>
                    <input className="form-control" value={form.bu_code} onChange={e => setForm(f => ({ ...f, bu_code: e.target.value }))} placeholder="เช่น TWD" required />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>BU Name <span className="req">*</span></label>
                    <input className="form-control" value={form.bu_name} onChange={e => setForm(f => ({ ...f, bu_name: e.target.value }))} placeholder="เช่น Thaiwatsadu" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Contact Person</label>
                    <input className="form-control" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} placeholder="ชื่อผู้ติดต่อ" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Phone</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="เบอร์โทรศัพท์" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Line ID</label>
                    <input className="form-control" value={form.line_id} onChange={e => setForm(f => ({ ...f, line_id: e.target.value }))} placeholder="Line ID" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Website</label>
                    <input className="form-control" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Description</label>
                    <input className="form-control" value={form.bu_description} onChange={e => setForm(f => ({ ...f, bu_description: e.target.value }))} placeholder="คำอธิบาย (optional)" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>BU Logo (โลโก้แบรนด์)</label>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                      {form.logo_url ? (
                        <img src={form.logo_url} alt="Logo Preview" style={{ width: "40px", height: "40px", objectFit: "contain", border: "1px solid var(--border)", borderRadius: "4px", padding: "2px" }} />
                      ) : (
                        <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-lighter)", border: "1px dashed var(--border)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "0.8rem" }}>No Logo</div>
                      )}
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} id="logo-upload-input" />
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => document.getElementById('logo-upload-input').click()}>
                        <i className="fa-solid fa-cloud-arrow-up"></i> อัปโหลดรูปภาพ
                      </button>
                      {form.logo_url && (
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setForm(f => ({ ...f, logo_url: "" }))}>
                          ลบรูป
                        </button>
                      )}
                    </div>
                    <input className="form-control" style={{ marginTop: "8px", fontSize: "0.85rem" }} value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="หรือระบุ URL รูปภาพโลโก้ตรงนี้..." />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditItem(null); }}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary"><i className="fa-solid fa-check"></i> {editItem ? "อัปเดต" : "บันทึก"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Logo</th><th>BU Code</th><th>BU Name</th><th>Description</th><th>Contact Info</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.bu_id} style={{ opacity: item.is_active ? 1 : 0.5 }}>
                    <td>
                      {item.logo_url ? (
                        <img src={item.logo_url} alt={item.bu_code} style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                      ) : (
                        <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-lighter)", borderRadius: "4px", color: "var(--text-muted)", fontSize: "0.75rem" }}>-</div>
                      )}
                    </td>
                    <td><span className="chip">{item.bu_code}</span></td>
                    <td style={{ fontWeight: 600 }}>{item.bu_name}</td>
                    <td className="text-muted" style={{ fontSize: ".82rem" }}>{item.bu_description || "-"}</td>
                    <td style={{ fontSize: ".8rem" }}>
                      {item.contact_person && <div><i className="fa-solid fa-user text-muted" style={{width: "14px"}}></i> {item.contact_person}</div>}
                      {item.phone && <div><i className="fa-solid fa-phone text-muted" style={{width: "14px"}}></i> {item.phone}</div>}
                      {item.line_id && <div><i className="fa-brands fa-line text-muted" style={{width: "14px", color: "#06c755"}}></i> {item.line_id}</div>}
                      {item.website && <div><i className="fa-solid fa-globe text-muted" style={{width: "14px"}}></i> <a href={item.website} target="_blank" rel="noreferrer" style={{color: "var(--primary)"}}>Link</a></div>}
                      {!item.contact_person && !item.phone && !item.line_id && !item.website && <span className="text-muted">-</span>}
                    </td>
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
