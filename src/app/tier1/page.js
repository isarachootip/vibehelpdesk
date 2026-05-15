"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Tier1Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'NEW': return <span className="badge badge-error">New</span>;
      case 'IN_PROGRESS': return <span className="badge badge-primary">Assessing</span>;
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            <i className="fa-solid fa-inbox" style={{ marginRight: "10px", color: "var(--primary)" }}></i>
            Tier 1 Support (รับเรื่อง / ประเมิน)
          </h2>
          <p className="text-muted" style={{ fontSize: ".85rem", marginTop: "4px" }}>
            แสดงรายการแจ้งปัญหาที่เพิ่งเข้ามาใหม่ และงานที่กำลังประเมินโดย Helpdesk (Tier 1)
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchData}>
          <i className="fa-solid fa-rotate-right"></i> Refresh
        </button>
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
                    <th>Ticket No.</th>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>System / Location</th>
                    <th>Reporter</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.ticket_id} style={{ background: ticket.status === 'NEW' ? "rgba(239, 68, 68, 0.05)" : "transparent" }}>
                      <td>
                        <Link href={`/tier1/ticket/${ticket.ticket_id}`}>
                          <span className="chip" style={{ fontWeight: "bold", cursor: "pointer", border: ticket.status === 'NEW' ? "1px solid var(--danger)" : "" }}>
                            {ticket.ticket_no}
                          </span>
                        </Link>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {new Date(ticket.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ maxWidth: "250px" }}>
                        <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ticket.subject}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--danger)", marginTop: "4px" }}>
                          <i className="fa-solid fa-fire"></i> Priority: {ticket.priority}
                        </div>
                      </td>
                      <td>
                        <span className="chip" style={{ backgroundColor: "var(--surface)", fontSize: "0.8rem", marginBottom: "4px", display: "inline-block" }}>
                          {ticket.system?.system_name || "-"}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          <i className="fa-solid fa-location-dot"></i> {ticket.location?.location_name || "-"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ticket.reporter?.full_name || "-"}</div>
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
                      </td>
                      <td>{getStatusBadge(ticket.status)}</td>
                      <td>
                        <Link href={`/tier1/ticket/${ticket.ticket_id}`} className="btn btn-primary btn-sm">
                          {ticket.status === 'NEW' ? (
                            <><i className="fa-solid fa-hand-pointer"></i> รับเรื่อง</>
                          ) : (
                            <><i className="fa-solid fa-magnifying-glass"></i> ประเมิน</>
                          )}
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        <i className="fa-solid fa-inbox fa-2x" style={{ color: "var(--text-muted)", marginBottom: "10px", opacity: 0.5 }}></i>
                        <p>ไม่มีรายการแจ้งปัญหาใหม่ (Zero Inbox)</p>
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
