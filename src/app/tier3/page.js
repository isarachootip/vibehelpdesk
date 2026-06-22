"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Tier3Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/tickets/tier3");
      const data = await res.json();
      if (Array.isArray(data)) setTickets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (ticket) => {
    switch (ticket.status) {
      case 'ESCALATED_TIER3': 
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span className="badge badge-error">Escalated to Tier 3</span>
            {ticket.tier3?.full_name && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>({ticket.tier3.full_name})</span>}
          </div>
        );
      case 'IN_PROGRESS': 
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span className="badge badge-warning">In Progress</span>
            {ticket.tier3?.full_name && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>({ticket.tier3.full_name})</span>}
          </div>
        );
      case 'RESOLVED': return <span className="badge badge-success">Resolved</span>;
      default: return <span className="badge badge-gray">{ticket.status}</span>;
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          <i className="fa-solid fa-screwdriver-wrench" style={{ marginRight: "10px", color: "var(--primary)" }}></i>
          Tier 3 Support Dashboard (Deep Resolution)
        </h2>
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
                    <th>System</th>
                    <th>Location</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.ticket_id}>
                      <td><span className="chip" style={{ fontWeight: "bold" }}>{ticket.ticket_no}</span></td>
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
                        <span className="chip" style={{ backgroundColor: "var(--surface)", fontSize: "0.8rem" }}>
                          {ticket.system?.system_name || "-"}
                        </span>
                      </td>
                      <td>{ticket.location?.location_name || ticket.location_text || "-"}</td>
                      <td>
                        <div>{ticket.reporter?.full_name || ticket.reporter_name || "-"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{ticket.bu?.bu_code || "-"}</div>
                      </td>
                      <td>{getStatusBadge(ticket)}</td>
                      <td>
                        <Link href={`/tier3/ticket/${ticket.ticket_id}`} className="btn btn-primary btn-sm">
                          <i className="fa-solid fa-arrow-right"></i> เปิดดู
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                        <i className="fa-solid fa-check-circle fa-2x" style={{ color: "var(--success)", marginBottom: "10px" }}></i>
                        <p>ไม่มีรายการค้างแก้ระดับ Tier 3</p>
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
