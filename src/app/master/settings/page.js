"use client";

import { useState, useEffect } from "react";

const ANNOUNCEMENT_TYPES = [
  { value: "warning", label: "⚠️ Warning (เหลือง)", color: "#b45309" },
  { value: "danger", label: "🔴 Danger (แดง) — ระบบล่ม / เร่งด่วน", color: "#dc2626" },
  { value: "info", label: "ℹ️ Info (น้ำเงิน)", color: "#1d4ed8" },
  { value: "success", label: "✅ Success (เขียว)", color: "#047857" },
];

export default function SystemSettings() {
  const [lineConfigs, setLineConfigs] = useState([
    { config_key: "LINE_CHANNEL_SECRET", config_value: "", is_secret: true, description: "LINE Channel Secret จากแถบ Basic settings" },
    { config_key: "LINE_CHANNEL_ACCESS_TOKEN", config_value: "", is_secret: true, description: "LINE Channel Access Token จากแถบ Messaging API" }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Announcement state
  const [annMessage, setAnnMessage] = useState("");
  const [annType, setAnnType] = useState("warning");
  const [activeAnnouncements, setActiveAnnouncements] = useState([]);
  const [savingAnn, setSavingAnn] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setLineConfigs(prev => prev.map(p => {
            const found = data.find(d => d.config_key === p.config_key);
            return found ? { ...p, ...found } : p;
          }));

          // Load active announcements
          const anns = data.filter(c => c.config_key?.startsWith("announcement_") && c.config_value && c.config_value !== "disabled");
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
        body: JSON.stringify({ configs: lineConfigs })
      });
      if (res.ok) {
        alert("บันทึกการตั้งค่าเรียบร้อยแล้ว");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!annMessage.trim()) return;
    setSavingAnn(true);
    const key = `announcement_${Date.now()}`;
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: [{
            config_key: key,
            config_value: annMessage.trim(),
            description: annType,
            is_secret: false,
          }]
        })
      });
      if (res.ok) {
        setActiveAnnouncements(prev => [...prev, { config_key: key, config_value: annMessage.trim(), description: annType }]);
        setAnnMessage("");
        setAnnType("warning");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSavingAnn(false);
    }
  };

  const handleRemoveAnnouncement = async (configKey) => {
    if (!confirm("ต้องการลบประกาศนี้?")) return;
    try {
      // Set to "disabled" to effectively remove it
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: [{
            config_key: configKey,
            config_value: "disabled",
            description: "disabled",
            is_secret: false,
          }]
        })
      });
      if (res.ok) {
        setActiveAnnouncements(prev => prev.filter(a => a.config_key !== configKey));
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  if (loading) {
    return <div className="flex-center" style={{ height: "300px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>;
  }

  const typeInfo = (t) => ANNOUNCEMENT_TYPES.find(a => a.value === t) || ANNOUNCEMENT_TYPES[0];

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
          <i className="fa-solid fa-cogs" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
          System Settings
        </h2>
        <p className="text-muted" style={{ fontSize: ".82rem" }}>ตั้งค่าระบบและการเชื่อมต่อภายนอก (สำหรับ Admin)</p>
      </div>

      {/* ─── Announcements ─── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa-solid fa-bullhorn" style={{ marginRight: "8px", color: "#f59e0b" }}></i>
            ประกาศแจ้งเตือนระบบ (System Announcements)
          </h3>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ fontSize: ".82rem", marginBottom: "16px" }}>
            ข้อความประกาศจะแสดงเป็น Banner สีที่ด้านบนของทุกหน้า และผู้ใช้สามารถปิดประกาศได้เอง
          </p>

          {/* Active announcements list */}
          {activeAnnouncements.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
                ประกาศที่ใช้งานอยู่ ({activeAnnouncements.length} รายการ)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeAnnouncements.map(ann => {
                  const info = typeInfo(ann.description);
                  return (
                    <div key={ann.config_key} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "10px 14px",
                      background: "var(--border-light)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "12px", fontSize: ".72rem",
                        fontWeight: 700, background: `${info.color}18`, color: info.color,
                        flexShrink: 0,
                      }}>
                        {info.label.split(" ")[0]} {ann.description?.toUpperCase()}
                      </span>
                      <span style={{ flex: 1, fontSize: ".85rem", color: "var(--text-primary)" }}>{ann.config_value}</span>
                      <button
                        onClick={() => handleRemoveAnnouncement(ann.config_key)}
                        className="btn btn-outline btn-sm"
                        style={{ color: "var(--danger)", borderColor: "var(--danger)", flexShrink: 0 }}
                      >
                        <i className="fa-solid fa-trash"></i> ลบ
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new announcement */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "700px" }}>
            <div style={{ fontWeight: 600, fontSize: ".85rem", color: "var(--text-primary)", marginBottom: "2px" }}>
              <i className="fa-solid fa-plus-circle" style={{ marginRight: "6px", color: "var(--primary)" }}></i>
              เพิ่มประกาศใหม่
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>ประเภทการแจ้งเตือน</label>
              <select
                className="form-control"
                value={annType}
                onChange={e => setAnnType(e.target.value)}
                style={{ maxWidth: "360px" }}
              >
                {ANNOUNCEMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>ข้อความประกาศ</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น ขณะนี้ระบบ SAP ล่ม กรุณาแจ้งปัญหาผ่านระบบ Helpdesk ..."
                  value={annMessage}
                  onChange={e => setAnnMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddAnnouncement(); }}
                />
                <button
                  onClick={handleAddAnnouncement}
                  className="btn btn-primary"
                  disabled={!annMessage.trim() || savingAnn}
                  style={{ flexShrink: 0 }}
                >
                  {savingAnn ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...</> : <><i className="fa-solid fa-bullhorn"></i> ประกาศ</>}
                </button>
              </div>
            </div>

            {/* Preview */}
            {annMessage && (() => {
              const s = {
                danger:  { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  text: "#dc2626", icon: "fa-circle-exclamation" },
                warning: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.4)",  text: "#b45309", icon: "fa-triangle-exclamation" },
                info:    { bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.3)",  text: "#1d4ed8", icon: "fa-circle-info" },
                success: { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)", text: "#047857", icon: "fa-circle-check" },
              }[annType] || {};
              return (
                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>ตัวอย่าง Preview:</div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 16px",
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: "8px",
                    color: s.text,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}>
                    <i className={`fa-solid ${s.icon}`}></i>
                    <span>{annMessage}</span>
                  </div>
                </div>
              );
            })()}
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
                  <input 
                    type={conf.is_secret ? "password" : "text"} 
                    className="form-control" 
                    value={conf.config_value || ""} 
                    onChange={(e) => handleLineChange(index, e.target.value)}
                    placeholder={`ใส่ค่า ${conf.config_key}`}
                  />
                  {conf.description && <p className="text-muted" style={{ fontSize: ".75rem", marginTop: "4px" }}>{conf.description}</p>}
                </div>
              ))}
              
              <div style={{ marginTop: "16px" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...</>
                  ) : (
                    <><i className="fa-solid fa-save"></i> บันทึกการตั้งค่า</>
                  )}
                </button>
              </div>
            </div>
          </form>

          <div style={{ marginTop: "32px", padding: "16px", background: "rgba(6,199,85,.05)", border: "1px solid rgba(6,199,85,.2)", borderRadius: "var(--radius-sm)" }}>
            <h4 style={{ fontSize: ".9rem", fontWeight: 600, color: "#06c755", marginBottom: "8px" }}>
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
