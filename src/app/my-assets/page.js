"use client";
import { useState, useEffect } from "react";

const statusStyle = {
  IN_USE:   { label: "กำลังใช้งาน", cls: "badge-success" },
  SPARE:    { label: "สำรอง",       cls: "badge-primary" },
  REPAIR:   { label: "ส่งซ่อม",    cls: "badge-warning" },
  RETIRED:  { label: "เลิกใช้แล้ว", cls: "badge-gray" },
  LOST:     { label: "สูญหาย",     cls: "badge-danger" },
};

export default function MyAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get current user
    fetch("/api/auth/me")
      .then(r => {
        if (!r.ok) throw new Error("Not authenticated");
        return r.json();
      })
      .then(data => {
        setUser(data.user);
        // 2. Get assets assigned to user
        return fetch(`/api/assets?user_id=${data.user.user_id}`);
      })
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        setAssets(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: "300px" }}>
        <div className="loader-wrap">
          <div className="loader-pulse"></div>
          <p>กำลังโหลดอุปกรณ์ของคุณ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <i className="fa-solid fa-triangle-exclamation fa-2x" style={{ color: "var(--danger)", marginBottom: "12px" }}></i>
        <p>กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานหน้านี้</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
          <i className="fa-solid fa-laptop" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
          อุปกรณ์ของฉัน (My Assets)
        </h2>
        <p className="text-muted" style={{ fontSize: ".82rem", marginTop: "4px" }}>
          รายการอุปกรณ์ IT และเครื่องคอมพิวเตอร์ที่อยู่ในความรับผิดชอบของคุณ ({assets.length} ชิ้น)
        </p>
      </div>

      {assets.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <i className="fa-solid fa-laptop-code fa-3x" style={{ color: "var(--text-muted)", opacity: 0.15, display: "block", marginBottom: "16px" }}></i>
          <h4 style={{ fontWeight: 700, marginBottom: "8px" }}>คุณไม่มีทรัพย์สินที่ถือครอง</h4>
          <p className="text-muted" style={{ fontSize: ".82rem" }}>ปัจจุบันไม่มีคอมพิวเตอร์หรืออุปกรณ์ IT ที่ลงทะเบียนในชื่อของคุณ</p>
          <a href="/tickets/create" className="btn btn-primary btn-sm" style={{ marginTop: "16px" }}>
            <i className="fa-solid fa-paper-plane"></i> แจ้งขออุปกรณ์ใหม่
          </a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {assets.map(a => {
            const ss = statusStyle[a.status] || { label: a.status, cls: "badge-gray" };
            return (
              <div key={a.asset_id} className="card" style={{ overflow: "hidden", position: "relative" }}>
                {/* Border Accent depending on status */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "4px",
                  background: a.status === "IN_USE" ? "var(--success)" : "var(--primary)"
                }}></div>

                <div className="card-body" style={{ padding: "20px" }}>
                  {/* Top line with Icon & Asset Code */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: ".9rem", color: "var(--primary)" }}>
                      <i className={`fa-solid ${a.asset_type?.icon || "fa-laptop"}`} style={{ fontSize: "1.1rem" }}></i>
                      {a.asset_code}
                    </span>
                    <span className={`badge ${ss.cls}`} style={{ fontSize: ".7rem" }}>{ss.label}</span>
                  </div>

                  {/* Brand & Model */}
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>
                    {a.brand || "—"} {a.model}
                  </h3>

                  {/* Serial Number */}
                  {a.serial_no && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".76rem", color: "var(--text-secondary)", marginBottom: "14px" }}>
                      <span style={{ fontWeight: 600 }}>S/N:</span>
                      <span className="font-mono">{a.serial_no}</span>
                    </div>
                  )}

                  <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "12px 0" }} />

                  {/* Details grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: ".8rem" }}>
                    <div>
                      <div style={{ color: "var(--text-muted)", fontSize: ".72rem", marginBottom: "2px" }}>ตำแหน่งที่ตั้ง</div>
                      <div style={{ fontWeight: 600 }}>
                        <i className="fa-solid fa-location-dot" style={{ marginRight: "4px", color: "var(--danger)", fontSize: ".75rem" }}></i>
                        {a.location ? a.location.location_code : "ไม่ระบุ"}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "var(--text-muted)", fontSize: ".72rem", marginBottom: "2px" }}>หมดประกัน</div>
                      <div style={{ fontWeight: 600 }}>
                        <i className="fa-solid fa-shield-halved" style={{ marginRight: "4px", color: "var(--warning)", fontSize: ".75rem" }}></i>
                        {a.warranty_end
                          ? new Date(a.warranty_end).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })
                          : "ไม่ระบุ"}
                      </div>
                    </div>
                    {a.ip_address && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <div style={{ color: "var(--text-muted)", fontSize: ".72rem", marginBottom: "2px" }}>Network (IP / MAC)</div>
                        <div className="font-mono" style={{ fontSize: ".74rem", fontWeight: 600 }}>
                          {a.ip_address} {a.mac_address ? `/ ${a.mac_address}` : ""}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "18px", justifyContent: "flex-end" }}>
                    <a href={`/tickets/create?asset_id=${a.asset_id}`} className="btn btn-outline btn-sm" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
                      <i className="fa-solid fa-wrench"></i> แจ้งซ่อมเครื่องนี้
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
