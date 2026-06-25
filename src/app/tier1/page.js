"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Tier1Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("active");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/tier1");
      const data = await res.json();
      if (Array.isArray(data)) setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const priorityColor = (p) => ({
    Critical: { bg: "#ef4444", color: "#fff" },
    High: { bg: "#f59e0b", color: "#fff" },
    Medium: { bg: "#3b82f6", color: "#fff" },
    Low: { bg: "#6b7280", color: "#fff" },
  }[p] || { bg: "#6b7280", color: "#fff" });

  const statusBadge = (status) => {
    const map = {
      NEW: { cls: "badge-error", label: "รอรับเรื่อง" },
      IN_PROGRESS: { cls: "badge-primary", label: "กำลังดำเนินการ" },
      ESCALATED: { cls: "badge-warning", label: "ส่งต่อ Tier 2" },
      ESCALATED_TIER3: { cls: "badge-danger", label: "ส่งต่อ Tier 3" },
      RESOLVED: { cls: "badge-success", label: "แก้ไขแล้ว" },
      CLOSED: { cls: "badge-gray", label: "ปิดงาน" },
      REOPENED: { cls: "badge-danger", label: "เปิดใหม่" },
      CANCELLED: { cls: "badge-gray", label: "ยกเลิก" },
    };
    const s = map[status] || { cls: "badge-gray", label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus === "active") return ["NEW", "IN_PROGRESS"].includes(t.status);
    if (filterStatus === "escalated") return ["ESCALATED", "ESCALATED_TIER3"].includes(t.status);
    if (filterStatus === "closed") return ["RESOLVED", "CLOSED", "CANCELLED"].includes(t.status);
    return true; // "all"
  });

  const countByFilter = (f) => {
    if (f === "active") return tickets.filter(t => ["NEW", "IN_PROGRESS"].includes(t.status)).length;
    if (f === "escalated") return tickets.filter(t => ["ESCALATED", "ESCALATED_TIER3"].includes(t.status)).length;
    if (f === "closed") return tickets.filter(t => ["RESOLVED", "CLOSED", "CANCELLED"].includes(t.status)).length;
    return tickets.length;
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            <i className="fa-solid fa-inbox" style={{ marginRight: "10px", color: "var(--primary)" }}></i>
            Tier 1 Support — รับเรื่อง & ติดตาม
          </h2>
          <p className="text-muted" style={{ fontSize: ".85rem", marginTop: "4px" }}>
            รายการแจ้งปัญหาทั้งหมด — Tier 1 มองเห็นและติดตามทุกสถานะ
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchData}>
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[
          { key: "active", label: "🔵 Active (รับเรื่อง/กำลังดำเนินการ)" },
          { key: "escalated", label: "🟠 ส่งต่อ Tier 2/3" },
          { key: "closed", label: "✅ ปิดแล้ว / แก้ไขแล้ว" },
          { key: "all", label: "📋 ทั้งหมด" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            style={{
              padding: "6px 14px",
              fontSize: ".8rem",
              fontWeight: 600,
              borderRadius: "20px",
              border: "1.5px solid",
              cursor: "pointer",
              transition: "all 0.18s",
              borderColor: filterStatus === f.key ? "var(--primary)" : "var(--border)",
              background: filterStatus === f.key ? "var(--primary)" : "transparent",
              color: filterStatus === f.key ? "#fff" : "var(--text-secondary)",
            }}
          >
            {f.label}
            <span style={{
              marginLeft: "6px", fontSize: ".72rem",
              background: filterStatus === f.key ? "rgba(255,255,255,.25)" : "var(--border)",
              borderRadius: "10px", padding: "1px 6px"
            }}>
              {countByFilter(f.key)}
            </span>
          </button>
        ))}
      </div>

      <div className="card glass-panel">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
              <p style={{ marginTop: "10px" }}>กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Priority / Status / Ticket No.</th>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>System / Location</th>
                    <th>Reporter</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map(ticket => {
                    const pc = priorityColor(ticket.priority);
                    return (
                      <tr key={ticket.ticket_id} style={{ background: ticket.status === 'NEW' ? "rgba(239, 68, 68, 0.05)" : "transparent" }}>
                        <td>
                          {/* Priority + Status on LEFT of ticket number */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{
                              background: pc.bg, color: pc.color,
                              fontSize: ".65rem", fontWeight: 700, padding: "2px 6px",
                              borderRadius: "4px", textTransform: "uppercase", flexShrink: 0
                            }}>
                              {ticket.priority}
                            </span>
                            {statusBadge(ticket.status)}
                            <Link href={`/tier1/ticket/${ticket.ticket_id}`}>
                              <span className="chip" style={{ fontWeight: "bold", cursor: "pointer", fontSize: ".8rem" }}>
                                {ticket.ticket_no}
                              </span>
                            </Link>
                          </div>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                          {new Date(ticket.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ maxWidth: "250px" }}>
                          <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ticket.subject}
                          </div>
                        </td>
                        <td>
                          <span className="chip" style={{ backgroundColor: "var(--surface)", fontSize: "0.8rem", marginBottom: "4px", display: "inline-block" }}>
                            {ticket.system?.system_name || ticket.hardware?.hardware_name || "-"}
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            <i className="fa-solid fa-location-dot"></i> {ticket.location?.location_name || ticket.location_text || "-"}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{ticket.reporter?.full_name || ticket.reporter_name || "-"}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ticket.bu?.bu_code || "-"}</div>
                        </td>
                        <td>
                          {ticket.tier1 ? (
                            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)" }}>
                              <i className="fa-solid fa-user-check"></i> {ticket.tier1.full_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>- ยังไม่รับเรื่อง -</span>
                          )}
                          {ticket.tier2 && (
                            <div style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "2px" }}>
                              <i className="fa-solid fa-arrow-up-right-from-square"></i> T2: {ticket.tier2.full_name}
                            </div>
                          )}
                        </td>
                        <td>
                          <Link href={`/tier1/ticket/${ticket.ticket_id}`} className="btn btn-primary btn-sm">
                            {ticket.status === 'NEW' ? (
                              <><i className="fa-solid fa-hand-pointer"></i> รับเรื่อง</>
                            ) : (
                              <><i className="fa-solid fa-magnifying-glass"></i> เปิดดู</>
                            )}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        <i className="fa-solid fa-inbox fa-2x" style={{ color: "var(--text-muted)", marginBottom: "10px", opacity: 0.5 }}></i>
                        <p>ไม่มีรายการในหมวดนี้</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
