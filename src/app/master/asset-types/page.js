"use client";
import { useState, useEffect } from "react";

const ICON_OPTIONS = [
  { icon: "fa-desktop",           label: "Desktop PC" },
  { icon: "fa-laptop",            label: "Notebook" },
  { icon: "fa-print",             label: "Printer" },
  { icon: "fa-network-wired",     label: "Network" },
  { icon: "fa-server",            label: "Server" },
  { icon: "fa-mobile-alt",        label: "Mobile" },
  { icon: "fa-tablet-alt",        label: "Tablet" },
  { icon: "fa-camera",            label: "Camera" },
  { icon: "fa-tv",                label: "Monitor/TV" },
  { icon: "fa-phone",             label: "IP Phone" },
  { icon: "fa-cash-register",     label: "POS" },
  { icon: "fa-hdd",               label: "Storage" },
  { icon: "fa-box",               label: "Other" },
];

export default function AssetTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ type_code: "", type_name: "", icon: "fa-box", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchTypes = () => {
    fetch("/api/assets/types")
      .then(r => r.json())
      .then(d => { setTypes(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTypes(); }, []);

  const openNew = () => {
    setEditItem(null);
    setForm({ type_code: "", type_name: "", icon: "fa-box", description: "" });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ type_code: item.type_code, type_name: item.type_name, icon: item.icon || "fa-box", description: item.description || "" });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const url    = editItem ? `/api/assets/types/${editItem.type_id}` : "/api/assets/types";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { fetchTypes(); setShowForm(false); }
    else { const e = await res.json(); alert(e.error || "Error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("ต้องการลบประเภทนี้?")) return;
    await fetch(`/api/assets/types/${id}`, { method: "DELETE" });
    fetchTypes();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            <i className="fa-solid fa-tags" style={{ marginRight: "8px", color: "#8b5cf6" }}></i>
            ประเภท Asset
          </h2>
          <p className="text-muted" style={{ fontSize: ".82rem", marginTop: "4px" }}>จัดการประเภทของ IT Asset เช่น Desktop, Notebook, Printer</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus"></i> เพิ่มประเภทใหม่
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "520px", margin: 0 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">{editItem ? "แก้ไขประเภท Asset" : "เพิ่มประเภท Asset"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label>รหัสประเภท (Code) <span className="req">*</span></label>
                    <input className="form-control" placeholder="เช่น COMPUTER, PRINTER" value={form.type_code}
                      onChange={e => setForm(f => ({ ...f, type_code: e.target.value.toUpperCase() }))} required />
                  </div>
                  <div className="form-group">
                    <label>ชื่อประเภท <span className="req">*</span></label>
                    <input className="form-control" placeholder="เช่น คอมพิวเตอร์ตั้งโต๊ะ" value={form.type_name}
                      onChange={e => setForm(f => ({ ...f, type_name: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>ไอคอน</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: "6px", marginTop: "6px" }}>
                    {ICON_OPTIONS.map(o => (
                      <button key={o.icon} type="button" onClick={() => setForm(f => ({ ...f, icon: o.icon }))}
                        style={{
                          padding: "8px 6px", borderRadius: "8px", border: "1.5px solid",
                          borderColor: form.icon === o.icon ? "var(--primary)" : "var(--border)",
                          background: form.icon === o.icon ? "rgba(99,102,241,0.1)" : "transparent",
                          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                          fontSize: ".7rem", color: form.icon === o.icon ? "var(--primary)" : "var(--text-secondary)",
                        }}>
                        <i className={`fa-solid ${o.icon}`} style={{ fontSize: "1.2rem" }}></i>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>คำอธิบาย</label>
                  <input className="form-control" placeholder="รายละเอียดประเภทนี้..." value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> บันทึก...</> : <><i className="fa-solid fa-check"></i> บันทึก</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex-center" style={{ height: "200px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "14px" }}>
          {types.map(t => (
            <div key={t.type_id} className="card" style={{ transition: "transform 0.15s", cursor: "default" }}
              onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div className="card-body" style={{ textAlign: "center", padding: "24px 16px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <i className={`fa-solid ${t.icon || "fa-box"}`} style={{ fontSize: "1.5rem", color: "#8b5cf6" }}></i>
                </div>
                <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: "4px" }}>{t.type_name}</div>
                <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginBottom: "8px" }}>{t.type_code}</div>
                <div style={{ fontSize: ".75rem", color: "var(--primary)", fontWeight: 600, marginBottom: "14px" }}>
                  {t._count?.assets || 0} รายการ
                </div>
                {t.description && <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "12px" }}>{t.description}</div>}
                <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)}>
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(t.type_id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Add new card */}
          <div className="card" style={{ border: "2px dashed var(--border)", cursor: "pointer", transition: "border-color 0.15s" }}
            onClick={openNew}
            onMouseOver={e => e.currentTarget.style.borderColor = "var(--primary)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <div className="card-body" style={{ textAlign: "center", padding: "24px 16px", color: "var(--text-muted)" }}>
              <i className="fa-solid fa-plus-circle" style={{ fontSize: "2rem", marginBottom: "10px", display: "block", color: "var(--primary)", opacity: 0.5 }}></i>
              <div style={{ fontSize: ".85rem", fontWeight: 600 }}>เพิ่มประเภทใหม่</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
