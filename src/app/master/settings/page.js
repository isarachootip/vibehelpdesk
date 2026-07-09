"use client";

import { useState, useEffect } from "react";

const ANNOUNCEMENT_TYPES = [
  { value: "warning", label: "⚠️ Warning (เหลือง)", color: "#b45309", bg: "rgba(245,158,11,0.12)" },
  { value: "danger",  label: "🔴 Danger (แดง) — ระบบล่ม / เร่งด่วน", color: "#dc2626", bg: "rgba(239,68,68,0.12)" },
  { value: "info",    label: "ℹ️ Info (น้ำเงิน)", color: "#1d4ed8", bg: "rgba(59,130,246,0.1)" },
  { value: "success", label: "✅ Success (เขียว)", color: "#047857", bg: "rgba(16,185,129,0.1)" },
];

// Parse config_value — support both old plain string and new JSON format
function parseAnnouncement(raw) {
  if (!raw || raw === "disabled") return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.message) return parsed;
  } catch (_) {}
  // Legacy: plain string
  return { message: raw, type: "warning", start_at: null, end_at: null };
}

// Helpers
const toLocalInput = (iso) => {
  if (!iso) return "";
  return iso.slice(0, 16); // "YYYY-MM-DDTHH:MM"
};

const fromLocalInput = (val) => val ? new Date(val).toISOString() : null;

const getStatus = (ann) => {
  const now = new Date();
  if (ann.start_at && new Date(ann.start_at) > now) return "scheduled";
  if (ann.end_at && new Date(ann.end_at) < now) return "expired";
  return "active";
};

const statusBadge = {
  active:    { label: "แสดงอยู่", color: "#047857", bg: "rgba(16,185,129,0.1)", icon: "fa-circle-dot" },
  scheduled: { label: "รอแสดง",   color: "#1d4ed8", bg: "rgba(59,130,246,0.1)", icon: "fa-clock" },
  expired:   { label: "หมดอายุ",  color: "#6b7280", bg: "rgba(107,114,128,0.1)", icon: "fa-circle-xmark" },
};

// Format date for display
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", {
    day: "2-digit", month: "short", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function SystemSettings() {
  const [lineConfigs, setLineConfigs] = useState([
    { config_key: "LINE_CHANNEL_SECRET", config_value: "", is_secret: true, description: "LINE Channel Secret จากแถบ Basic settings" },
    { config_key: "LINE_CHANNEL_ACCESS_TOKEN", config_value: "", is_secret: true, description: "LINE Channel Access Token จากแถบ Messaging API" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState({});

  // Announcement state
  const [activeAnnouncements, setActiveAnnouncements] = useState([]);
  const [savingAnn, setSavingAnn] = useState(false);

  // New announcement form
  const emptyForm = { message: "", type: "warning", start_at: "", end_at: "" };
  const [annForm, setAnnForm] = useState(emptyForm);
  const [now, setNow] = useState(new Date());

  // Tick clock every 30s to update status badges
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLineConfigs(prev => prev.map(p => {
            const found = data.find(d => d.config_key === p.config_key);
            return found ? { ...p, ...found } : p;
          }));
          // Load announcements — parse JSON value
          const anns = data
            .filter(c => c.config_key?.startsWith("announcement_") && c.config_value && c.config_value !== "disabled")
            .map(c => {
              const parsed = parseAnnouncement(c.config_value);
              return parsed ? { ...parsed, _key: c.config_key } : null;
            })
            .filter(Boolean);
          setActiveAnnouncements(anns);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLineChange = (index, value) => {
    setLineConfigs(prev => {
      const updated = [...prev];
      updated[index].config_value = value;
      return updated;
    });
  };

  const handleSaveLineSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs: lineConfigs }),
      });
      if (res.ok) alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      else alert("เกิดข้อผิดพลาดในการบันทึก");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!annForm.message.trim()) return;
    setSavingAnn(true);
    const key = `announcement_${Date.now()}`;
    const payload = {
      message: annForm.message.trim(),
      type: annForm.type,
      start_at: annForm.start_at ? fromLocalInput(annForm.start_at) : null,
      end_at: annForm.end_at ? fromLocalInput(annForm.end_at) : null,
    };
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: [{
            config_key: key,
            config_value: JSON.stringify(payload),
            description: annForm.type,
            is_secret: false,
          }],
        }),
      });
      if (res.ok) {
        setActiveAnnouncements(prev => [...prev, { ...payload, _key: key }]);
        setAnnForm(emptyForm);
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSavingAnn(false);
    }
  };

  const handleRemoveAnnouncement = async (key) => {
    if (!confirm("ต้องการลบประกาศนี้?")) return;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: [{ config_key: key, config_value: "disabled", description: "disabled", is_secret: false }],
        }),
      });
      if (res.ok) setActiveAnnouncements(prev => prev.filter(a => a._key !== key));
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: "300px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>;

  const typeInfo = (t) => ANNOUNCEMENT_TYPES.find(a => a.value === t) || ANNOUNCEMENT_TYPES[0];
  const previewStyle = {
    danger:  { bg: "linear-gradient(90deg,#7f1d1d,#991b1b)", text: "#fef2f2", icon: "fa-circle-exclamation" },
    warning: { bg: "linear-gradient(90deg,#78350f,#92400e)", text: "#fffbeb", icon: "fa-triangle-exclamation" },
    info:    { bg: "linear-gradient(90deg,#1e3a5f,#1e40af)", text: "#eff6ff", icon: "fa-circle-info" },
    success: { bg: "linear-gradient(90deg,#064e3b,#065f46)", text: "#ecfdf5", icon: "fa-circle-check" },
  };

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
          <i className="fa-solid fa-cogs" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
          System Settings
        </h2>
        <p className="text-muted" style={{ fontSize: ".82rem" }}>ตั้งค่าระบบ การเชื่อมต่อ และประกาศแจ้งเตือน (สำหรับ Admin)</p>
      </div>

      {/* ─── Announcements ─── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa-solid fa-bullhorn" style={{ marginRight: "8px", color: "#f59e0b" }}></i>
            ประกาศแจ้งเตือนระบบ (System Announcements)
          </h3>
          <span style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>
            {activeAnnouncements.length} ประกาศ
          </span>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ fontSize: ".82rem", marginBottom: "20px" }}>
            ประกาศจะแสดงเป็น Banner วิ่งด้านบนทุกหน้า รองรับการตั้งเวลาเริ่มต้นและหมดอายุอัตโนมัติ
          </p>

          {/* ── Active Announcements List ── */}
          {activeAnnouncements.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "10px" }}>
                รายการประกาศ ({activeAnnouncements.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {activeAnnouncements.map(ann => {
                  const status = getStatus(ann);
                  const sb = statusBadge[status];
                  const ti = typeInfo(ann.type);
                  return (
                    <div key={ann._key} style={{
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      overflow: "hidden",
                      background: "var(--card-bg)",
                    }}>
                      {/* Mini preview bar */}
                      <div style={{
                        background: previewStyle[ann.type]?.bg || "#333",
                        color: previewStyle[ann.type]?.text || "#fff",
                        padding: "6px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}>
                        <i className={`fa-solid ${previewStyle[ann.type]?.icon}`}></i>
                        <span style={{ flex: 1 }}>{ann.message}</span>
                      </div>
                      {/* Details row */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        padding: "10px 14px", flexWrap: "wrap",
                      }}>
                        {/* Status */}
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "5px",
                          padding: "3px 10px", borderRadius: "12px",
                          fontSize: ".72rem", fontWeight: 700,
                          background: sb.bg, color: sb.color,
                          flexShrink: 0,
                        }}>
                          <i className={`fa-solid ${sb.icon}`}></i>
                          {sb.label}
                        </span>
                        {/* Type */}
                        <span style={{
                          padding: "3px 10px", borderRadius: "12px",
                          fontSize: ".72rem", fontWeight: 700,
                          background: ti.bg, color: ti.color,
                          flexShrink: 0,
                        }}>
                          {ti.label.split(" ")[0]} {ann.type}
                        </span>
                        {/* Times */}
                        <span style={{ fontSize: ".76rem", color: "var(--text-secondary)", display: "flex", gap: "12px" }}>
                          <span>
                            <i className="fa-solid fa-play" style={{ marginRight: "4px", color: "var(--success)", fontSize: ".7rem" }}></i>
                            {ann.start_at ? fmtDate(ann.start_at) : "ทันที"}
                          </span>
                          <span>
                            <i className="fa-solid fa-stop" style={{ marginRight: "4px", color: "var(--danger)", fontSize: ".7rem" }}></i>
                            {ann.end_at ? fmtDate(ann.end_at) : "ไม่หมดอายุ"}
                          </span>
                        </span>
                        <div style={{ flex: 1 }}></div>
                        <button
                          onClick={() => handleRemoveAnnouncement(ann._key)}
                          className="btn btn-outline btn-sm"
                          style={{ color: "var(--danger)", borderColor: "var(--danger)", flexShrink: 0 }}
                        >
                          <i className="fa-solid fa-trash"></i> ลบ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Add New Announcement Form ── */}
          <div style={{
            border: "1.5px dashed var(--border)",
            borderRadius: "12px",
            padding: "20px",
            background: "var(--border-light)",
          }}>
            <div style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--text-primary)", marginBottom: "16px" }}>
              <i className="fa-solid fa-plus-circle" style={{ marginRight: "6px", color: "var(--primary)" }}></i>
              เพิ่มประกาศใหม่
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Message */}
              <div className="form-group" style={{ marginBottom: 0, gridColumn: "1 / -1" }}>
                <label>ข้อความประกาศ <span className="req">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น ขณะนี้ระบบ SAP ล่ม กรุณาติดต่อ IT..."
                  value={annForm.message}
                  onChange={e => setAnnForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              {/* Type */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>ประเภทการแจ้งเตือน</label>
                <select
                  className="form-control"
                  value={annForm.type}
                  onChange={e => setAnnForm(f => ({ ...f, type: e.target.value }))}
                >
                  {ANNOUNCEMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Spacer */}
              <div></div>

              {/* Start At */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>
                  <i className="fa-solid fa-play" style={{ marginRight: "5px", color: "var(--success)", fontSize: ".8rem" }}></i>
                  เริ่มแสดงเมื่อ
                  <span style={{ marginLeft: "6px", fontSize: ".72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                    (เว้นว่าง = แสดงทันที)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={annForm.start_at}
                  onChange={e => setAnnForm(f => ({ ...f, start_at: e.target.value }))}
                />
              </div>

              {/* End At */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>
                  <i className="fa-solid fa-stop" style={{ marginRight: "5px", color: "var(--danger)", fontSize: ".8rem" }}></i>
                  หมดอายุเมื่อ
                  <span style={{ marginLeft: "6px", fontSize: ".72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                    (เว้นว่าง = ไม่หมดอายุ)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={annForm.end_at}
                  onChange={e => setAnnForm(f => ({ ...f, end_at: e.target.value }))}
                />
              </div>
            </div>

            {/* Quick presets */}
            <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: ".75rem", color: "var(--text-muted)", fontWeight: 600 }}>ตั้งเวลาด่วน:</span>
              {[
                { label: "1 ชั่วโมง", hours: 1 },
                { label: "4 ชั่วโมง", hours: 4 },
                { label: "วันนี้ (สิ้นสุด)", hours: null, endOfDay: true },
                { label: "1 วัน", hours: 24 },
                { label: "1 สัปดาห์", hours: 24 * 7 },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: ".72rem", padding: "3px 10px" }}
                  onClick={() => {
                    const end = new Date();
                    if (preset.endOfDay) {
                      end.setHours(23, 59, 0, 0);
                    } else {
                      end.setHours(end.getHours() + preset.hours);
                    }
                    setAnnForm(f => ({ ...f, end_at: toLocalInput(end.toISOString()) }));
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Preview */}
            {annForm.message && (
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  ตัวอย่าง Preview:
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0",
                  borderRadius: "8px", overflow: "hidden",
                  border: `1px solid var(--border)`,
                  fontSize: "0.85rem", fontWeight: 700,
                }}>
                  <div style={{
                    background: previewStyle[annForm.type]?.bg,
                    color: previewStyle[annForm.type]?.text,
                    padding: "8px 16px",
                    display: "flex", alignItems: "center", gap: "8px",
                    fontSize: "0.78rem", whiteSpace: "nowrap",
                  }}>
                    <i className={`fa-solid ${previewStyle[annForm.type]?.icon}`}></i>
                    ประกาศด่วน
                  </div>
                  <div style={{
                    background: previewStyle[annForm.type]?.bg,
                    color: previewStyle[annForm.type]?.text,
                    padding: "8px 16px", flex: 1,
                    borderLeft: "1px solid rgba(255,255,255,0.2)",
                  }}>
                    {annForm.message}
                    {(annForm.start_at || annForm.end_at) && (
                      <span style={{ opacity: 0.7, fontSize: ".72rem", marginLeft: "12px" }}>
                        ({annForm.start_at ? `เริ่ม ${toLocalInput(annForm.start_at).replace("T", " ")}` : "แสดงทันที"}{annForm.end_at ? ` — หมด ${annForm.end_at.replace("T", " ")}` : ""})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleAddAnnouncement}
                className="btn btn-primary"
                disabled={!annForm.message.trim() || savingAnn}
              >
                {savingAnn
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...</>
                  : <><i className="fa-solid fa-bullhorn"></i> บันทึกประกาศ</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LINE Integration ─── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa-brands fa-line" style={{ marginRight: "8px", color: "#06c755" }}></i>
            LINE OA Integration
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSaveLineSettings}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
              {lineConfigs.map((conf, index) => (
                <div key={conf.config_key} className="form-group">
                  <label>
                    {conf.config_key}
                    {conf.is_secret && <span style={{ marginLeft: "8px", fontSize: ".7rem", color: "var(--danger)" }}><i className="fa-solid fa-lock"></i> Secret</span>}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={conf.is_secret && !visibleSecrets[conf.config_key] ? "password" : "text"}
                      className="form-control"
                      value={conf.config_value || ""}
                      onChange={e => handleLineChange(index, e.target.value)}
                      placeholder={`ใส่ค่า ${conf.config_key}`}
                      style={{ paddingRight: "40px" }}
                    />
                    {conf.is_secret && (
                      <button
                        type="button"
                        onClick={() => setVisibleSecrets(prev => ({ ...prev, [conf.config_key]: !prev[conf.config_key] }))}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: "4px"
                        }}
                      >
                        <i className={`fa-solid ${visibleSecrets[conf.config_key] ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                    )}
                  </div>
                  {conf.description && <p className="text-muted" style={{ fontSize: ".75rem", marginTop: "4px" }}>{conf.description}</p>}
                </div>
              ))}
              <div style={{ marginTop: "8px" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...</>
                    : <><i className="fa-solid fa-save"></i> บันทึกการตั้งค่า</>
                  }
                </button>
              </div>
            </div>
          </form>
          <div style={{ marginTop: "24px", padding: "14px", background: "rgba(6,199,85,.05)", border: "1px solid rgba(6,199,85,.2)", borderRadius: "var(--radius-sm)" }}>
            <h4 style={{ fontSize: ".88rem", fontWeight: 600, color: "#06c755", marginBottom: "6px" }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: "6px" }}></i>
              Webhook URL สำหรับตั้งค่าใน LINE Developers Console:
            </h4>
            <code style={{ background: "var(--bg)", padding: "8px 12px", borderRadius: "4px", display: "block", fontSize: ".85rem", border: "1px solid var(--border)" }}>
              https://[domain.com]/api/webhooks/line
            </code>
          </div>
        </div>
      </div>
    </>
  );
}
