"use client";

import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, Title,
  LineElement, PointElement, Filler,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, Title,
  LineElement, PointElement, Filler
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Trend chart state
  const [trendPeriod, setTrendPeriod] = useState("mtd");
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [agingTab, setAgingTab] = useState("summary");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTrendLoading(true);
    fetch(`/api/dashboard/trend?period=${trendPeriod}`)
      .then((r) => r.json())
      .then((d) => { setTrendData(d); setTrendLoading(false); })
      .catch(() => setTrendLoading(false));
  }, [trendPeriod]);

  if (loading) return <div className="flex-center" style={{height:"300px"}}><div className="loader-wrap"><div className="loader-pulse"></div><p>Loading Dashboard...</p></div></div>;
  if (!data) return <div className="empty-state"><i className="fa-solid fa-database"></i><h3>ยังไม่มีข้อมูล</h3><p>กรุณาเชื่อมต่อฐานข้อมูล</p></div>;

  const stats = data?.stats || { total:0, open:0, resolved:0, closed:0, critical:0, escalated:0, new:0 };
  const recentTickets = data?.recentTickets || [];
  const ticketsByBU = data?.ticketsByBU || [];
  const ticketsBySystem = data?.ticketsBySystem || [];
  const ticketsByPriority = data?.ticketsByPriority || [];
  const ticketsByStatus = data?.ticketsByStatus || [];

  const priorityColor = p => ({ Critical:"badge-danger", High:"badge-warning", Medium:"badge-primary", Low:"badge-gray" }[p] || "badge-gray");
  const statusColor = s => ({ NEW:"badge-primary", IN_PROGRESS:"badge-warning", ESCALATED:"badge-danger", ESCALATED_TIER3:"badge-danger", RESOLVED:"badge-success", CLOSED:"badge-gray", REOPENED:"badge-danger" }[s] || "badge-gray");
  const statusLabel = s => ({ NEW:"รอรับเรื่อง", IN_PROGRESS:"กำลังดำเนินการ", ESCALATED:"ส่งต่อ Tier 2", ESCALATED_TIER3:"ส่งต่อ Tier 3", RESOLVED:"แก้ไขแล้ว", CLOSED:"ปิดงาน", REOPENED:"เปิดใหม่", CANCELLED:"ยกเลิก" }[s] || s);

  // Chart: Status Doughnut
  const statusChartData = {
    labels: ticketsByStatus.map(s => statusLabel(s.status)),
    datasets: [{
      data: ticketsByStatus.map(s => s._count.ticket_id),
      backgroundColor: ["#3b82f6","#f59e0b","#ef4444","#22c55e","#6b7280","#ec4899"],
      borderColor: "transparent",
      borderWidth: 0,
    }],
  };

  // Chart: Priority Doughnut
  const priorityChartData = {
    labels: ticketsByPriority.map(p => p.priority),
    datasets: [{
      data: ticketsByPriority.map(p => p._count.ticket_id),
      backgroundColor: ["#ef4444","#f59e0b","#3b82f6","#6b7280"],
      borderColor: "transparent",
      borderWidth: 0,
    }],
  };

  // Chart: BU Bar
  const buChartData = {
    labels: ticketsByBU.map(b => b.bu_code || "N/A"),
    datasets: [{
      label: "Tickets",
      data: ticketsByBU.map(b => b._count.ticket_id),
      backgroundColor: ticketsByBU.map((_, i) => [`#3b82f6`,`#8b5cf6`,`#22c55e`,`#f59e0b`,`#ef4444`,`#ec4899`,`#14b8a6`,`#6366f1`][i % 8]),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  // Chart: System Bar
  const sysChartData = {
    labels: ticketsBySystem.map(s => s.system_code || "N/A"),
    datasets: [{
      label: "Tickets",
      data: ticketsBySystem.map(s => s._count.ticket_id),
      backgroundColor: ticketsBySystem.map((_, i) => [`#f59e0b`,`#3b82f6`,`#22c55e`,`#a855f7`,`#ef4444`][i % 5]),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "bottom", labels: { color: "#94a3b8", font: { size: 11 }, padding: 12, usePointStyle: true, pointStyle: "circle" } },
    },
  };

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 11 } } },
      y: { grid: { color: "rgba(148,163,184,.1)" }, ticks: { color: "#94a3b8", font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
    },
  };

  // --- Trend / Line chart ---
  const periodLabel = { mtd: "Month to Date", weekly: "7 วันล่าสุด", yearly: "Year to Date" };

  const formatTrendLabel = (key) => {
    if (trendPeriod === "yearly") {
      const [y, m] = key.split("-");
      return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
    }
    const d = new Date(key);
    return d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
  };

  const trendChartData = trendData ? {
    labels: trendData.labels.map(formatTrendLabel),
    datasets: [
      {
        label: "Total",
        data: trendData.datasets.total,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.12)",
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#6366f1",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Open",
        data: trendData.datasets.open,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.08)",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#f59e0b",
        tension: 0.4,
        fill: false,
        borderDash: [4, 3],
      },
      {
        label: "Resolved / Closed",
        data: trendData.datasets.resolved,
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.08)",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#22c55e",
        tension: 0.4,
        fill: false,
      },
    ],
  } : null;

  const trendOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top",
        align: "end",
        labels: { color: "#94a3b8", font: { size: 11 }, padding: 16, usePointStyle: true, pointStyle: "circle" },
      },
      tooltip: {
        backgroundColor: "rgba(30,30,45,0.92)",
        titleColor: "#e2e8f0",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(99,102,241,0.3)",
        borderWidth: 1,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 }, maxRotation: 45 },
      },
      y: {
        grid: { color: "rgba(148,163,184,0.1)" },
        ticks: { color: "#94a3b8", font: { size: 11 }, stepSize: 1, precision: 0 },
        beginAtZero: true,
      },
    },
  };

  return (
    <>
      {/* Stats Row */}
      <div className="stats-grid">
        {[
          { n: stats.total, l: "Total Tickets", icon: "fa-ticket", cls: "blue" },
          { n: stats.open, l: "Open Tickets", icon: "fa-clock", cls: "yellow" },
          { n: stats.resolved + stats.closed, l: "Resolved / Closed", icon: "fa-check-circle", cls: "green" },
          { n: stats.critical, l: "Critical Open", icon: "fa-triangle-exclamation", cls: "red" },
          { n: stats.escalated, l: "Escalated", icon: "fa-arrow-up-right-from-square", cls: "purple" },
          { n: stats.new, l: "Waiting (NEW)", icon: "fa-inbox", cls: "blue" },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className={`stat-icon ${s.cls}`}><i className={`fa-solid ${s.icon}`}></i></div>
            <div><div className="stat-number">{s.n}</div><div className="stat-label">{s.l}</div></div>
          </div>
        ))}
      </div>

      {/* ── Trend Line Chart ── */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <h2 className="card-title">
            <i className="fa-solid fa-chart-line" style={{ marginRight: "8px", color: "#6366f1" }}></i>
            จำนวน Ticket รายวัน
            <span style={{ marginLeft: "8px", fontSize: ".78rem", color: "#94a3b8", fontWeight: 400 }}>
              ({periodLabel[trendPeriod]})
            </span>
          </h2>

          {/* Period Tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { key: "weekly", label: "Weekly" },
              { key: "mtd",    label: "MTD" },
              { key: "yearly", label: "Yearly" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTrendPeriod(key)}
                style={{
                  padding: "5px 14px",
                  fontSize: ".78rem",
                  fontWeight: 600,
                  borderRadius: "20px",
                  border: "1.5px solid",
                  cursor: "pointer",
                  transition: "all 0.18s",
                  borderColor: trendPeriod === key ? "#6366f1" : "var(--border)",
                  background: trendPeriod === key ? "#6366f1" : "transparent",
                  color: trendPeriod === key ? "#fff" : "var(--text-secondary)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary mini-stats */}
        {trendData?.summary && (
          <div style={{ display: "flex", gap: "24px", padding: "0 20px 12px", borderBottom: "1px solid var(--border-light)" }}>
            {[
              { label: "Total",            value: trendData.summary.total,    color: "#6366f1" },
              { label: "Open",             value: trendData.summary.open,     color: "#f59e0b" },
              { label: "Resolved/Closed",  value: trendData.summary.resolved, color: "#22c55e" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: s.color, flexShrink: 0 }}></span>
                <span style={{ fontSize: ".8rem", color: "var(--text-secondary)" }}>{s.label}</span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card-body" style={{ height: "280px", position: "relative" }}>
          {trendLoading ? (
            <div className="flex-center" style={{ height: "100%" }}>
              <div className="loader-wrap"><div className="loader-pulse"></div><p>กำลังโหลด...</p></div>
            </div>
          ) : trendChartData ? (
            <Line data={trendChartData} options={trendOpts} />
          ) : (
            <p className="text-muted" style={{ textAlign: "center", paddingTop: "80px" }}>ไม่มีข้อมูล</p>
          )}
        </div>
      </div>

      {/* Charts Row 1: Status + Priority */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
        <div className="card">
          <div className="card-header"><h2 className="card-title"><i className="fa-solid fa-chart-pie" style={{marginRight:"8px",color:"var(--primary-light)"}}></i>Tickets by Status</h2></div>
          <div className="card-body" style={{ height:"260px", display:"flex", justifyContent:"center" }}>
            {ticketsByStatus.length > 0 ? <Doughnut data={statusChartData} options={{...chartOpts, cutout:"55%"}} /> : <p className="text-muted">No data</p>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title"><i className="fa-solid fa-chart-pie" style={{marginRight:"8px",color:"#f59e0b"}}></i>Tickets by Priority</h2></div>
          <div className="card-body" style={{ height:"260px", display:"flex", justifyContent:"center" }}>
            {ticketsByPriority.length > 0 ? <Doughnut data={priorityChartData} options={{...chartOpts, cutout:"55%"}} /> : <p className="text-muted">No data</p>}
          </div>
        </div>
      </div>

      {/* Charts Row 2: BU + System Bar Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
        <div className="card">
          <div className="card-header"><h2 className="card-title"><i className="fa-solid fa-building" style={{marginRight:"8px",color:"var(--primary-light)"}}></i>Tickets by BU</h2></div>
          <div className="card-body" style={{ height:"260px" }}>
            {ticketsByBU.length > 0 ? <Bar data={buChartData} options={barOpts} /> : <p className="text-muted">No data</p>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title"><i className="fa-solid fa-server" style={{marginRight:"8px",color:"#22c55e"}}></i>Top Systems</h2></div>
          <div className="card-body" style={{ height:"260px" }}>
            {ticketsBySystem.length > 0 ? <Bar data={sysChartData} options={barOpts} /> : <p className="text-muted">No data</p>}
          </div>
        </div>
      </div>

      {/* Aging Report Card */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h2 className="card-title">
            <i className="fa-solid fa-hourglass-half" style={{ marginRight: "8px", color: "var(--warning)" }}></i>
            Aging Report (รายงานสรุปงานค้างแยกตาม Tier)
          </h2>
          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "summary", label: "สรุปทุก Tier" },
              { id: "tier1", label: "งานค้าง Tier 1" },
              { id: "tier2", label: "งานค้าง Tier 2" },
              { id: "tier3", label: "งานค้าง Tier 3" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAgingTab(tab.id)}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: agingTab === tab.id ? "var(--primary)" : "var(--border)",
                  backgroundColor: agingTab === tab.id ? "var(--primary)" : "transparent",
                  color: agingTab === tab.id ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ padding: agingTab === "summary" ? "20px" : "0" }}>
          {agingTab === "summary" ? (
            <div className="table-wrap">
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Support Level</th>
                    <th style={{ textAlign: "center" }}>&lt; 24 ชั่วโมง</th>
                    <th style={{ textAlign: "center" }}>1-3 วัน</th>
                    <th style={{ textAlign: "center" }}>3-7 วัน</th>
                    <th style={{ textAlign: "center" }}>&gt; 7 วัน</th>
                    <th style={{ textAlign: "center" }}>รวมงานค้างทั้งหมด</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "tier1", label: "Tier 1 Helpdesk Support", color: "var(--primary)" },
                    { key: "tier2", label: "Tier 2 Specialist Support", color: "var(--warning)" },
                    { key: "tier3", label: "Tier 3 Deep Resolution Support", color: "var(--danger)" },
                  ].map(row => {
                    const rowData = data.agingReport?.[row.key] || { '< 24h': 0, '1-3d': 0, '3-7d': 0, '> 7d': 0, tickets: [] };
                    const totalOpen = rowData.tickets.length;
                    return (
                      <tr key={row.key}>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: row.color, marginRight: "8px" }}></span>
                          {row.label}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={rowData['< 24h'] > 0 ? "badge badge-success" : ""} style={{ fontSize: "0.85rem", padding: "4px 8px" }}>
                            {rowData['< 24h']}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={rowData['1-3d'] > 0 ? "badge badge-warning" : ""} style={{ fontSize: "0.85rem", padding: "4px 8px" }}>
                            {rowData['1-3d']}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={rowData['3-7d'] > 0 ? "badge badge-danger" : ""} style={{ fontSize: "0.85rem", padding: "4px 8px", backgroundColor: "#f97316", color: "white" }}>
                            {rowData['3-7d']}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={rowData['> 7d'] > 0 ? "badge badge-danger" : ""} style={{ fontSize: "0.85rem", padding: "4px 8px" }}>
                            {rowData['> 7d']}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", fontSize: "0.95rem" }}>
                          <span className="chip" style={{ backgroundColor: totalOpen > 0 ? "rgba(79, 70, 229, 0.1)" : "rgba(0,0,0,0.05)", color: totalOpen > 0 ? "var(--primary)" : "var(--text-muted)" }}>
                            {totalOpen} เคส
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Job No.</th>
                    <th>Subject</th>
                    <th>System</th>
                    <th>ผู้รับผิดชอบ</th>
                    <th>สถานะ</th>
                    <th>ระยะเวลาค้างสะสม (Aging)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(data.agingReport?.[agingTab]?.tickets || []).length > 0 ? (
                    (data.agingReport[agingTab].tickets).map(t => {
                      let ageColor = "var(--success)";
                      if (t.ageDays > 7) ageColor = "var(--danger)";
                      else if (t.ageDays > 3) ageColor = "#f97316";
                      else if (t.ageDays > 1) ageColor = "var(--warning)";

                      return (
                        <tr key={t.ticket_id}>
                          <td className="font-mono" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{t.ticket_no}</td>
                          <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</td>
                          <td><span className="chip">{t.system_name || "-"}</span></td>
                          <td style={{ fontSize: "0.85rem" }}>{t.assigneeName}</td>
                          <td>
                            <span className="badge" style={{ fontSize: "0.75rem", textTransform: "uppercase" }}>
                              {t.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: ageColor, marginRight: "8px" }}></span>
                            {t.ageDays >= 1 ? `${t.ageDays} วัน` : `${t.ageHours} ชั่วโมง`}
                          </td>
                          <td>
                            <a href={`/tickets/${t.ticket_id}`} className="btn btn-outline btn-sm">View</a>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                        <i className="fa-solid fa-circle-check fa-2x" style={{ color: "var(--success)", marginBottom: "8px", display: "block" }}></i>
                        ไม่มีงานค้างสะสมใน Tier นี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><i className="fa-solid fa-clock-rotate-left" style={{marginRight:"8px",color:"var(--primary-light)"}}></i>Recent Tickets</h2>
          <a href="/tickets/create" className="btn btn-primary btn-sm"><i className="fa-solid fa-plus"></i> แจ้งปัญหาใหม่</a>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Job No.</th><th>Subject</th><th>BU</th><th>System</th><th>Priority</th><th>Status</th><th>Reporter</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {recentTickets.length > 0 ? recentTickets.map(t => (
                  <tr key={t.ticket_id}>
                    <td className="font-mono" style={{fontSize:".76rem",fontWeight:600}}>{t.ticket_no}</td>
                    <td style={{maxWidth:"200px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.subject}</td>
                    <td><span className="chip">{t.bu?.bu_code}</span></td>
                    <td><span className="chip">{t.system?.system_code}</span></td>
                    <td><span className={`badge ${priorityColor(t.priority)}`}>{t.priority}</span></td>
                    <td><span className={`badge ${statusColor(t.status)}`}>{statusLabel(t.status)}</span></td>
                    <td style={{fontSize:".82rem"}}>{t.reporter?.full_name}</td>
                    <td style={{fontSize:".76rem",whiteSpace:"nowrap"}}>{new Date(t.created_at).toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</td>
                    <td><a href={`/tickets/${t.ticket_id}`} className="btn btn-outline btn-sm">View</a></td>
                  </tr>
                )) : (
                  <tr><td colSpan="9" className="text-center text-muted" style={{padding:"32px"}}>ยังไม่มี Ticket</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
