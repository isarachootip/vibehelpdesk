"use client";

import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{height:"300px"}}><div className="loader-wrap"><div className="loader-pulse"></div><p>Loading Dashboard...</p></div></div>;
  if (!data) return <div className="empty-state"><i className="fa-solid fa-database"></i><h3>ยังไม่มีข้อมูล</h3><p>กรุณาเชื่อมต่อฐานข้อมูล</p></div>;

  const stats = data?.stats || { total:0, open:0, resolved:0, closed:0, critical:0, escalated:0, new:0 };
  const recentTickets = data?.recentTickets || [];
  const ticketsByBU = data?.ticketsByBU || [];
  const ticketsBySystem = data?.ticketsBySystem || [];
  const ticketsByPriority = data?.ticketsByPriority || [];
  const ticketsByStatus = data?.ticketsByStatus || [];

  const priorityColor = p => ({ Critical:"badge-danger", High:"badge-warning", Medium:"badge-primary", Low:"badge-gray" }[p] || "badge-gray");
  const statusColor = s => ({ NEW:"badge-primary", IN_PROGRESS:"badge-warning", ESCALATED:"badge-danger", RESOLVED:"badge-success", CLOSED:"badge-gray", REOPENED:"badge-danger" }[s] || "badge-gray");
  const statusLabel = s => ({ NEW:"รอรับเรื่อง", IN_PROGRESS:"กำลังดำเนินการ", ESCALATED:"ส่งต่อ Tier 2", RESOLVED:"แก้ไขแล้ว", CLOSED:"ปิดงาน", REOPENED:"เปิดใหม่", CANCELLED:"ยกเลิก" }[s] || s);

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
