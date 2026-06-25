"use client";

import { useState, useEffect } from "react";

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUser(d.user); })
      .catch(() => {});

    fetch("/api/dashboard/user")
      .then(r => r.json())
      .then(d => {
        setTickets(d.myTickets || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusColor = s => ({
    NEW: "badge-primary",
    IN_PROGRESS: "badge-warning",
    ESCALATED: "badge-danger",
    ESCALATED_TIER3: "badge-danger",
    RESOLVED: "badge-success",
    CLOSED: "badge-gray",
    REOPENED: "badge-danger",
    CANCELLED: "badge-gray",
  }[s] || "badge-gray");

  const statusLabel = s => ({
    NEW: "รอรับเรื่อง",
    IN_PROGRESS: "กำลังดำเนินการ",
    ESCALATED: "ส่งต่อ Tier 2",
    ESCALATED_TIER3: "ส่งต่อ Tier 3",
    RESOLVED: "แก้ไขแล้ว",
    CLOSED: "ปิดงาน",
    REOPENED: "เปิดใหม่",
    CANCELLED: "ยกเลิก",
  }[s] || s);

  const priorityColor = p => ({
    Critical: "badge-danger",
    High: "badge-warning",
    Medium: "badge-primary",
    Low: "badge-gray",
  }[p] || "badge-gray");

  const statusGroups = ["ALL", "NEW", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"];

  const filtered = filterStatus === "ALL"
    ? tickets
    : tickets.filter(t => t.status === filterStatus || (filterStatus === "ESCALATED" && t.status === "ESCALATED_TIER3"));

  const counts = {
    ALL: tickets.length,
    NEW: tickets.filter(t => t.status === "NEW").length,
    IN_PROGRESS: tickets.filter(t => t.status === "IN_PROGRESS").length,
    ESCALATED: tickets.filter(t => ["ESCALATED", "ESCALATED_TIER3"].includes(t.status)).length,
    RESOLVED: tickets.filter(t => t.status === "RESOLVED").length,
    CLOSED: tickets.filter(t => t.status === "CLOSED").length,
  };

  const tabColors = {
    ALL: "#6366f1",
    NEW: "#3b82f6",
    IN_PROGRESS: "#f59e0b",
    ESCALATED: "#ef4444",
    RESOLVED: "#10b981",
    CLOSED: "#6b7280",
  };

  const tabLabels = {
    ALL: "ทั้งหมด",
    NEW: "รอรับเรื่อง",
    IN_PROGRESS: "กำลังดำเนินการ",
    ESCALATED: "ส่งต่อทีมผู้เชี่ยวชาญ",
    RESOLVED: "แก้ไขแล้ว",
    CLOSED: "ปิดงาน",
  };

  return (
    <>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
            <i className="fa-solid fa-list-check" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
            Ticket ของฉัน
          </h2>
          <p className="text-muted" style={{ fontSize: ".82rem", marginTop: "4px" }}>
            {user?.full_name && `แสดง Ticket ทั้งหมดที่คุณ (${user.full_name}) แจ้งในระบบ`}
          </p>
        </div>
        <a href="/tickets/create" className="btn btn-primary">
          <i className="fa-solid fa-plus"></i> แจ้งปัญหาใหม่
        </a>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {statusGroups.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              border: "1.5px solid",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.8rem",
              transition: "all 0.15s",
              borderColor: filterStatus === s ? tabColors[s] : "var(--border)",
              background: filterStatus === s ? tabColors[s] : "transparent",
              color: filterStatus === s ? "#fff" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {tabLabels[s]}
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              minWidth: "20px", height: "18px",
              borderRadius: "10px",
              background: filterStatus === s ? "rgba(255,255,255,0.25)" : "var(--border-light)",
              color: filterStatus === s ? "#fff" : "var(--text-muted)",
              fontSize: "0.7rem",
              fontWeight: 700,
              padding: "0 5px",
            }}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ height: "200px" }}>
              <div className="loader-wrap"><div className="loader-pulse"></div><p>กำลังโหลด...</p></div>
            </div>
          ) : filtered.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job No.</th>
                    <th>หัวข้อปัญหา</th>
                    <th>ระบบงาน</th>
                    <th>ความเร่งด่วน</th>
                    <th>สถานะ</th>
                    <th>วันที่แจ้ง</th>
                    <th>อัปเดตล่าสุด</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const isActive = ["NEW", "IN_PROGRESS", "ESCALATED", "ESCALATED_TIER3", "REOPENED"].includes(t.status);
                    return (
                      <tr key={t.ticket_id} style={{ opacity: isActive ? 1 : 0.75 }}>
                        <td className="font-mono" style={{ fontSize: ".76rem", fontWeight: 600 }}>{t.ticket_no}</td>
                        <td style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.subject}
                        </td>
                        <td>
                          <span className="chip">{t.system?.system_code || t.system?.system_name || "-"}</span>
                        </td>
                        <td>
                          <span className={`badge ${priorityColor(t.priority)}`}>{t.priority}</span>
                        </td>
                        <td>
                          <span className={`badge ${statusColor(t.status)}`}>{statusLabel(t.status)}</span>
                        </td>
                        <td style={{ fontSize: ".76rem", whiteSpace: "nowrap" }}>
                          {new Date(t.created_at).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </td>
                        <td style={{ fontSize: ".76rem", whiteSpace: "nowrap" }}>
                          {new Date(t.updated_at || t.created_at).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td>
                          <a href={`/tickets/${t.ticket_id}`} className="btn btn-outline btn-sm">
                            ดูรายละเอียด
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "56px 24px" }}>
              <i className="fa-solid fa-inbox fa-3x" style={{ color: "var(--text-muted)", opacity: 0.25, marginBottom: "16px", display: "block" }}></i>
              <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "0.95rem" }}>
                {filterStatus === "ALL" ? "คุณยังไม่มี Ticket ในระบบ" : `ไม่มี Ticket ที่มีสถานะ "${tabLabels[filterStatus]}"`}
              </p>
              {filterStatus === "ALL" && (
                <a href="/tickets/create" className="btn btn-primary">
                  <i className="fa-solid fa-plus"></i> แจ้งปัญหาแรกของคุณ
                </a>
              )}
              {filterStatus !== "ALL" && (
                <button onClick={() => setFilterStatus("ALL")} className="btn btn-outline btn-sm">
                  ดูทั้งหมด
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
