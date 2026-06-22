"use client";

import { useState, useEffect } from "react";

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "all", priority: "all", search: "" });

  const fetchTickets = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.priority !== "all") params.set("priority", filters.priority);
    if (filters.search) params.set("search", filters.search);

    fetch(`/api/tickets?${params}`)
      .then((res) => res.json())
      .then((d) => { setTickets(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, [filters.status, filters.priority]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTickets();
  };

  const priorityColor = (p) => {
    switch (p) { case "Critical": return "badge-danger"; case "High": return "badge-warning"; case "Medium": return "badge-primary"; default: return "badge-gray"; }
  };

  const statusColor = (s) => {
    switch (s) {
      case "NEW": return "badge-primary"; case "IN_PROGRESS": return "badge-warning"; case "ESCALATED": return "badge-danger";
      case "RESOLVED": return "badge-success"; case "CLOSED": return "badge-gray"; case "REOPENED": return "badge-danger"; default: return "badge-gray";
    }
  };

  const statusLabel = (s) => {
    switch (s) {
      case "NEW": return "รอรับเรื่อง"; case "IN_PROGRESS": return "กำลังดำเนินการ"; case "ESCALATED": return "ส่งต่อ Tier 2";
      case "RESOLVED": return "แก้ไขแล้ว"; case "CLOSED": return "ปิดงาน"; case "REOPENED": return "เปิดใหม่"; case "CANCELLED": return "ยกเลิก"; default: return s;
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            <i className="fa-solid fa-list" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>
            All Tickets
          </h2>
          <p className="text-muted" style={{ fontSize: ".82rem" }}>รายการ Ticket ทั้งหมด ({tickets.length} รายการ)</p>
        </div>
        <a href="/tickets/create" className="btn btn-success">
          <i className="fa-solid fa-plus"></i> แจ้งปัญหาใหม่
        </a>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>สถานะ</label>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="all">ทั้งหมด</option>
            <option value="NEW">รอรับเรื่อง</option>
            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
            <option value="ESCALATED">ส่งต่อ Tier 2</option>
            <option value="RESOLVED">แก้ไขแล้ว</option>
            <option value="CLOSED">ปิดงาน</option>
            <option value="REOPENED">เปิดใหม่</option>
          </select>
        </div>
        <div className="filter-group">
          <label>ความเร่งด่วน</label>
          <select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
            <option value="all">ทั้งหมด</option>
            <option value="Critical">🔴 Critical</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🔵 Medium</option>
            <option value="Low">⚪ Low</option>
          </select>
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>ค้นหา</label>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Job No., Subject, Symptom..."
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              <i className="fa-solid fa-search"></i>
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ padding: "48px" }}>
              <div className="loader-wrap"><div className="loader-pulse"></div><p>Loading...</p></div>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job No.</th>
                    <th>Subject</th>
                    <th>BU</th>
                    <th>System</th>
                    <th>ประเภท</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>ผู้แจ้ง</th>
                    <th>Tier 1</th>
                    <th>Tier 2</th>
                    <th>วันที่สร้าง</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length > 0 ? tickets.map((t) => (
                    <tr key={t.ticket_id}>
                      <td className="font-mono" style={{ fontSize: ".76rem", fontWeight: 600 }}>{t.ticket_no}</td>
                      <td style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</td>
                      <td><span className="chip">{t.bu?.bu_code}</span></td>
                      <td>
                        <span className="chip">{t.system?.system_code}</span><br/>
                        <span style={{fontSize:".8rem",color:"var(--text-secondary)"}}>{t.system?.system_name}</span>
                      </td>
                      <td style={{ fontSize: ".8rem" }}>
                        {t.problem_type === "hardware" ? (
                          <span style={{ color: "var(--warning)" }}><i className="fa-solid fa-microchip"></i> HW</span>
                        ) : (
                          <span style={{ color: "var(--primary-light)" }}><i className="fa-solid fa-code"></i> SW</span>
                        )}
                      </td>
                      <td><span className={`badge ${priorityColor(t.priority)}`}>{t.priority}</span></td>
                      <td><span className={`badge ${statusColor(t.status)}`}>{statusLabel(t.status)}</span></td>
                      <td>
                        {t.reporter?.full_name || t.reporter_name || "-"}<br/>
                        <span style={{fontSize:".75rem",color:"var(--text-muted)"}}>{t.reporter?.email || t.reporter_email || "-"}</span>
                      </td>
                      <td style={{ fontSize: ".8rem" }}>{t.tier1?.full_name || "-"}</td>
                      <td style={{ fontSize: ".8rem" }}>{t.tier2?.full_name || "-"}</td>
                      <td style={{ fontSize: ".76rem", whiteSpace: "nowrap" }}>
                        {new Date(t.created_at).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>
                        <a href={`/tickets/${t.ticket_id}`} className="btn btn-outline btn-sm">
                          <i className="fa-solid fa-eye"></i>
                        </a>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="12" className="text-center text-muted" style={{ padding: "48px" }}>
                        <i className="fa-solid fa-inbox" style={{ fontSize: "2rem", marginBottom: "8px", display: "block" }}></i>
                        ไม่พบ Ticket ตามเงื่อนไข
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
