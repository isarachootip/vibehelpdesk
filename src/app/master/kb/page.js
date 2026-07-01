"use client";
import { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "POS", label: "เครื่องคิดเงิน / POS" },
  { id: "Network", label: "เครือข่าย / Internet / VPN" },
  { id: "Printer", label: "เครื่องพิมพ์ / Printer" },
  { id: "Computer", label: "ฮาร์ดแวร์ / เครื่องช้า" },
  { id: "Software", label: "ซอฟต์แวร์ / ระบบงาน" },
];

export default function KnowledgeBaseMasterPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "POS" });

  const fetchData = () => {
    setLoading(true);
    fetch("/api/kb")
      .then(res => res.json())
      .then(data => {
        setArticles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditItem(null);
    setForm({ title: "", content: "", category: "POS" });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title,
      content: item.content,
      category: item.category
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const method = editItem ? "PUT" : "POST";
    const url = editItem ? `/api/kb/${editItem.id}` : "/api/kb";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      fetchData();
      setShowModal(false);
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("ยืนยันต้องการลบบทความคลังความรู้นี้?")) return;
    const res = await fetch(`/api/kb/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            <i className="fa-solid fa-book-open" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
            จัดการระบบคลังความรู้ (KM / FAQs Management)
          </h2>
          <p className="text-muted" style={{ fontSize: ".82rem", marginTop: "4px" }}>
            สร้างและเผยแพร่บทความคู่มือ วิธีแก้ปัญหาเบื้องต้น หรือขั้นตอนการทำงาน
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus"></i> เพิ่มบทความใหม่
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ height: "200px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>
          ) : articles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px" }}>
              <p className="text-muted">ยังไม่มีการเพิ่มคู่มือการใช้งาน/คำถามที่พบบ่อย</p>
              <button className="btn btn-primary" style={{ marginTop: "12px" }} onClick={openNew}>เขียนบทความแรก</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>หัวข้อบทความ</th>
                    <th>หมวดหมู่</th>
                    <th>ยอดผู้ชม</th>
                    <th>อัปเดตล่าสุด</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(art => (
                    <tr key={art.id}>
                      <td>
                        <strong style={{ fontSize: ".86rem", color: "var(--text)" }}>{art.title}</strong>
                        <div style={{ fontSize: ".76rem", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "480px" }}>
                          {art.content.replace(/<[^>]+>/g, '').slice(0, 100)}
                        </div>
                      </td>
                      <td>
                        <span className="chip" style={{ fontSize: ".76rem" }}>{art.category}</span>
                      </td>
                      <td style={{ fontSize: ".8rem" }}>
                        <i className="fa-solid fa-eye" style={{ color: "var(--primary-light)", marginRight: "4px" }}></i>
                        {art.views} ครั้ง
                      </td>
                      <td style={{ fontSize: ".76rem", color: "var(--text-muted)" }}>
                        {new Date(art.updated_at).toLocaleString("th-TH")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(art)}>
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(art.id)}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form Editor */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "680px", margin: 0, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">{editItem ? "แก้ไขบทความคลังความรู้" : "เขียนบทความใหม่"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="card-body" style={{ overflowY: "auto", flex: 1 }}>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>หัวข้อคู่มือ / คำถาม (เช่น วิธีกดรีเซ็ตเครื่องบันทึก POS) <span className="req">*</span></label>
                  <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label>หมวดหมู่ระบบช่วยเหลือ <span className="req">*</span></label>
                  <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                    {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>เนื้อหาคู่มือ / ขั้นตอนวิธีแก้ปัญหา (รองรับเว้นวรรค/ขึ้นบรรทัดใหม่) <span className="req">*</span></label>
                  <textarea className="form-control" rows={12} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required style={{ fontFamily: "inherit", lineHeight: 1.6 }} />
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "กำลังบันทึก..." : "เผยแพร่คู่มือ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
