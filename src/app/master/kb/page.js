"use client";
import { useState, useEffect, useMemo } from "react";

const CATEGORIES = [
  { id: "POS",      label: "เครื่องคิดเงิน / POS",        icon: "fa-cash-register",  color: "#22c55e" },
  { id: "Network",  label: "เครือข่าย / Internet / VPN",  icon: "fa-network-wired",   color: "#06b6d4" },
  { id: "Printer",  label: "เครื่องพิมพ์ / Printer",      icon: "fa-print",           color: "#f59e0b" },
  { id: "Computer", label: "ฮาร์ดแวร์ / เครื่องช้า",      icon: "fa-desktop",         color: "#3b82f6" },
  { id: "Software", label: "ซอฟต์แวร์ / ระบบงาน",         icon: "fa-laptop-code",     color: "#8b5cf6" },
];

const catMeta = (id) => CATEGORIES.find(c => c.id === id) || { label: id, icon: "fa-circle", color: "#6b7280" };

export default function KnowledgeBaseMasterPage() {
  const [articles, setArticles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  // ── Search / filter ──
  const [searchText, setSearchText]   = useState("");
  const [filterCat, setFilterCat]     = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");   // all | active | inactive

  // ── Modal ──
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ title: "", content: "", category: "POS" });

  // ── Preview modal ──
  const [previewItem, setPreviewItem] = useState(null);

  // ── Fetch (all articles including inactive for admin) ──
  const fetchData = () => {
    setLoading(true);
    fetch("/api/kb/admin")
      .then(r => r.json())
      .then(data => { setArticles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // ── Client-side filter ──
  const filtered = useMemo(() => {
    return articles.filter(a => {
      const matchSearch = !searchText
        || a.title.toLowerCase().includes(searchText.toLowerCase())
        || a.content.toLowerCase().includes(searchText.toLowerCase());
      const matchCat = filterCat === "all" || a.category === filterCat;
      const matchStatus =
        filterStatus === "all"     ? true :
        filterStatus === "active"  ? a.is_active :
                                     !a.is_active;
      return matchSearch && matchCat && matchStatus;
    });
  }, [articles, searchText, filterCat, filterStatus]);

  // ── Stats summary ──
  const stats = useMemo(() => ({
    total:    articles.length,
    active:   articles.filter(a => a.is_active).length,
    inactive: articles.filter(a => !a.is_active).length,
    views:    articles.reduce((s, a) => s + (a.views || 0), 0),
  }), [articles]);

  // ── Open new / edit ──
  const openNew = () => {
    setEditItem(null);
    setForm({ title: "", content: "", category: "POS" });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, content: item.content, category: item.category });
    setShowModal(true);
  };

  // ── Submit create / update ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const method = editItem ? "PUT" : "POST";
    const url    = editItem ? `/api/kb/${editItem.id}` : "/api/kb";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) { fetchData(); setShowModal(false); }
    else        { alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล"); }
    setSaving(false);
  };

  // ── Toggle active ──
  const handleToggleActive = async (art) => {
    setTogglingId(art.id);
    await fetch(`/api/kb/${art.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:     art.title,
        content:   art.content,
        category:  art.category,
        is_active: !art.is_active,
      }),
    });
    setTogglingId(null);
    fetchData();
  };

  // ── Hard delete (confirm) ──
  const handleDelete = async (id) => {
    if (!confirm("ยืนยันต้องการลบบทความนี้ถาวร?\n(ข้อมูลจะถูกลบออกจากระบบทั้งหมด)")) return;
    const res = await fetch(`/api/kb/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  // ── Render ──
  return (
    <>
      {/* ─── Page Header ─────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            <i className="fa-solid fa-book-open" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
            จัดการคลังความรู้ (KM / FAQs)
          </h2>
          <p className="text-muted" style={{ fontSize: ".82rem", marginTop: "4px" }}>
            สร้าง แก้ไข และเผยแพร่บทความ คู่มือ หรือวิธีแก้ปัญหาเบื้องต้น
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <i className="fa-solid fa-plus"></i> เพิ่มบทความใหม่
        </button>
      </div>

      {/* ─── Stats Cards ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "บทความทั้งหมด",  value: stats.total,    icon: "fa-book",      color: "#6366f1" },
          { label: "เผยแพร่แล้ว",    value: stats.active,   icon: "fa-circle-check", color: "#22c55e" },
          { label: "ซ่อนอยู่",        value: stats.inactive, icon: "fa-eye-slash", color: "#f59e0b" },
          { label: "ยอดผู้อ่านรวม",  value: stats.views,    icon: "fa-eye",       color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} className="card" style={{ margin: 0, padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: "1rem" }}></i>
            </div>
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filter Bar ───────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-body" style={{ padding: "12px 16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: ".85rem" }}></i>
            <input
              className="form-control"
              placeholder="ค้นหาชื่อบทความ หรือเนื้อหา..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ paddingLeft: "36px", margin: 0 }}
            />
          </div>

          {/* Category filter */}
          <select className="form-control" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ flex: "0 0 220px", margin: 0 }}>
            <option value="all">หมวดหมู่ทั้งหมด</option>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>

          {/* Status filter */}
          <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: "0 0 160px", margin: 0 }}>
            <option value="all">สถานะทั้งหมด</option>
            <option value="active">เผยแพร่แล้ว</option>
            <option value="inactive">ซ่อนอยู่</option>
          </select>

          {/* Clear */}
          {(searchText || filterCat !== "all" || filterStatus !== "all") && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearchText(""); setFilterCat("all"); setFilterStatus("all"); }}>
              <i className="fa-solid fa-xmark"></i> ล้างตัวกรอง
            </button>
          )}

          <span className="text-muted" style={{ fontSize: ".78rem", marginLeft: "auto" }}>แสดง {filtered.length} / {articles.length} รายการ</span>
        </div>
      </div>

      {/* ─── Table ────────────────────────────────────────── */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ height: "200px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 24px" }}>
              <i className="fa-regular fa-folder-open fa-3x" style={{ color: "var(--text-muted)", opacity: 0.3, display: "block", marginBottom: "16px" }}></i>
              <p className="text-muted" style={{ marginBottom: "12px" }}>
                {articles.length === 0 ? "ยังไม่มีบทความในระบบ" : "ไม่พบบทความที่ตรงกับเงื่อนไข"}
              </p>
              {articles.length === 0 && (
                <button className="btn btn-primary" onClick={openNew}>เขียนบทความแรก</button>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "40%" }}>หัวข้อบทความ</th>
                    <th>หมวดหมู่</th>
                    <th style={{ textAlign: "center" }}>สถานะ</th>
                    <th style={{ textAlign: "center" }}>ผู้อ่าน</th>
                    <th>อัปเดตล่าสุด</th>
                    <th style={{ textAlign: "center" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(art => {
                    const cat = catMeta(art.category);
                    return (
                      <tr key={art.id} style={{ opacity: art.is_active ? 1 : 0.55 }}>
                        {/* Title + preview */}
                        <td>
                          <strong style={{ fontSize: ".86rem", color: "var(--text)", display: "block" }}>{art.title}</strong>
                          <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "420px" }}>
                            {art.content.replace(/<[^>]+>/g, "").slice(0, 100)}
                          </div>
                        </td>

                        {/* Category badge */}
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "5px",
                            padding: "3px 10px", borderRadius: "20px", fontSize: ".72rem", fontWeight: 700,
                            background: `${cat.color}18`, color: cat.color,
                          }}>
                            <i className={`fa-solid ${cat.icon}`}></i> {cat.label}
                          </span>
                        </td>

                        {/* Active toggle */}
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => handleToggleActive(art)}
                            disabled={togglingId === art.id}
                            title={art.is_active ? "คลิกเพื่อซ่อน" : "คลิกเพื่อเผยแพร่"}
                            style={{
                              border: "none", cursor: "pointer", background: "none",
                              padding: "4px 10px", borderRadius: "20px",
                              fontSize: ".72rem", fontWeight: 700,
                              color: art.is_active ? "#22c55e" : "#f59e0b",
                              background: art.is_active ? "#22c55e18" : "#f59e0b18",
                              transition: "all .2s",
                            }}
                          >
                            {togglingId === art.id
                              ? <i className="fa-solid fa-spinner fa-spin"></i>
                              : art.is_active
                                ? <><i className="fa-solid fa-circle-check"></i> เผยแพร่</>
                                : <><i className="fa-solid fa-eye-slash"></i> ซ่อน</>
                            }
                          </button>
                        </td>

                        {/* Views */}
                        <td style={{ textAlign: "center", fontSize: ".82rem" }}>
                          <i className="fa-solid fa-eye" style={{ color: "var(--primary-light)", marginRight: "4px" }}></i>
                          {(art.views || 0).toLocaleString()}
                        </td>

                        {/* Updated at */}
                        <td style={{ fontSize: ".75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {new Date(art.updated_at).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button className="btn btn-ghost btn-sm" title="ดูตัวอย่าง" onClick={() => setPreviewItem(art)}>
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button className="btn btn-outline btn-sm" title="แก้ไข" onClick={() => openEdit(art)}>
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              title="ลบถาวร"
                              style={{ color: "var(--danger)" }}
                              onClick={() => handleDelete(art.id)}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─── Create / Edit Modal ──────────────────────────── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "720px", margin: 0, maxHeight: "92vh", display: "flex", flexDirection: "column" }}>

            {/* Header */}
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className={`fa-solid ${editItem ? "fa-pen" : "fa-plus"}`} style={{ color: "var(--primary)" }}></i>
                {editItem ? "แก้ไขบทความคลังความรู้" : "เขียนบทความใหม่"}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Form body */}
            <div className="card-body" style={{ overflowY: "auto", flex: 1 }}>
              <form id="kb-form" onSubmit={handleSubmit}>
                {/* Title */}
                <div className="form-group">
                  <label>
                    หัวข้อบทความ <span className="req">*</span>
                    <span style={{ float: "right", fontSize: ".72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                      {form.title.length} ตัวอักษร
                    </span>
                  </label>
                  <input
                    className="form-control"
                    placeholder="เช่น วิธีแก้ปัญหากระดาษติดเครื่องพิมพ์"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                    maxLength={255}
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <label>หมวดหมู่ <span className="req">*</span></label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.id })}
                        style={{
                          padding: "8px 14px", borderRadius: "20px", border: "1.5px solid",
                          borderColor: form.category === cat.id ? cat.color : "var(--border)",
                          background: form.category === cat.id ? `${cat.color}18` : "var(--bg-secondary)",
                          color: form.category === cat.id ? cat.color : "var(--text-secondary)",
                          fontWeight: 700, fontSize: ".78rem", cursor: "pointer", transition: "all .15s",
                          display: "flex", alignItems: "center", gap: "6px",
                        }}
                      >
                        <i className={`fa-solid ${cat.icon}`}></i> {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="form-group">
                  <label>
                    เนื้อหา / ขั้นตอนวิธีแก้ปัญหา <span className="req">*</span>
                    <span style={{ float: "right", fontSize: ".72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                      {form.content.length} ตัวอักษร
                    </span>
                  </label>
                  <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                    <i className="fa-solid fa-circle-info" style={{ marginRight: "4px" }}></i>
                    รองรับการเว้นบรรทัดและ Emoji ได้เลย เช่น ✅ 1. เปิดเครื่อง → 2. กด OK
                  </div>
                  <textarea
                    className="form-control"
                    rows={14}
                    placeholder={"เช่น:\n✅ ขั้นตอนที่ 1: ปิดเครื่องพิมพ์\n✅ ขั้นตอนที่ 2: เปิดฝาครอบด้านบน\n✅ ขั้นตอนที่ 3: ดึงกระดาษออกเบาๆ\n✅ ขั้นตอนที่ 4: ปิดฝาและเปิดเครื่องใหม่\n\nหากปัญหายังไม่หาย กรุณาแจ้ง IT Helpdesk"}
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    required
                    style={{ fontFamily: "inherit", lineHeight: 1.7, resize: "vertical" }}
                  />
                </div>
              </form>
            </div>

            {/* Footer buttons */}
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "flex-end", gap: "8px", flexShrink: 0 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button type="submit" form="kb-form" className="btn btn-primary" disabled={saving}>
                {saving
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...</>
                  : <><i className={`fa-solid ${editItem ? "fa-floppy-disk" : "fa-paper-plane"}`}></i> {editItem ? "บันทึกการแก้ไข" : "เผยแพร่บทความ"}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Preview Modal ────────────────────────────────── */}
      {previewItem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "680px", margin: 0, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", flexShrink: 0 }}>
              <div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "2px 10px", borderRadius: "20px", fontSize: ".72rem", fontWeight: 700,
                  background: `${catMeta(previewItem.category).color}18`, color: catMeta(previewItem.category).color,
                  marginBottom: "6px",
                }}>
                  <i className={`fa-solid ${catMeta(previewItem.category).icon}`}></i>
                  {catMeta(previewItem.category).label}
                </span>
                <h3 className="card-title" style={{ marginTop: "4px", fontSize: "1.06rem" }}>{previewItem.title}</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreviewItem(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="card-body" style={{ overflowY: "auto", flex: 1, padding: "20px", fontSize: ".88rem", lineHeight: 1.7, color: "var(--text)" }}>
              <div style={{ whiteSpace: "pre-wrap" }}>{previewItem.content}</div>
            </div>
            <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".74rem", color: "var(--text-muted)", flexShrink: 0 }}>
              <span><i className="fa-solid fa-eye" style={{ marginRight: "4px" }}></i>อ่านแล้ว {(previewItem.views || 0).toLocaleString()} ครั้ง</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setPreviewItem(null); openEdit(previewItem); }}>
                  <i className="fa-solid fa-pen"></i> แก้ไข
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewItem(null)}>ปิด</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
