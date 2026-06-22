"use client";

import { useState, useEffect } from "react";

export default function SystemSettings() {
  const [configs, setConfigs] = useState([
    { config_key: "LINE_CHANNEL_SECRET", config_value: "", is_secret: true, description: "LINE Channel Secret จากแถบ Basic settings" },
    { config_key: "LINE_CHANNEL_ACCESS_TOKEN", config_value: "", is_secret: true, description: "LINE Channel Access Token จากแถบ Messaging API" }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setConfigs(prev => prev.map(p => {
            const found = data.find(d => d.config_key === p.config_key);
            return found ? { ...p, ...found } : p;
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (index, value) => {
    setConfigs(prev => {
      const updated = [...prev];
      updated[index].config_value = value;
      return updated;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs })
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

  if (loading) {
    return <div className="flex-center" style={{ height: "300px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>;
  }

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
          <i className="fa-solid fa-cogs" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
          System Settings
        </h2>
        <p className="text-muted" style={{ fontSize: ".82rem" }}>ตั้งค่าระบบและการเชื่อมต่อภายนอก (สำหรับ Admin)</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa-brands fa-line" style={{ marginRight: "8px", color: "#06c755" }}></i>
            LINE OA Integration
          </h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
              {configs.map((conf, index) => (
                <div key={conf.config_key} className="form-group">
                  <label>
                    {conf.config_key}
                    {conf.is_secret && <span style={{ marginLeft: "8px", fontSize: ".7rem", color: "var(--danger)" }}><i className="fa-solid fa-lock"></i> Secret</span>}
                  </label>
                  <input 
                    type={conf.is_secret ? "password" : "text"} 
                    className="form-control" 
                    value={conf.config_value || ""} 
                    onChange={(e) => handleChange(index, e.target.value)}
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
