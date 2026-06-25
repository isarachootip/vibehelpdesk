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

// ─── Workflow View for General Users ───────────────────────────────────────
function WorkflowView({ user }) {
  const [userDashboard, setUserDashboard] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/user")
      .then(r => r.json())
      .then(d => { setUserDashboard(d); setLoadingTickets(false); })
      .catch(() => setLoadingTickets(false));
  }, []);

  const statusColor = s => ({ NEW:"badge-primary", IN_PROGRESS:"badge-warning", ESCALATED:"badge-danger", ESCALATED_TIER3:"badge-danger", RESOLVED:"badge-success", CLOSED:"badge-gray", REOPENED:"badge-danger" }[s] || "badge-gray");
  const statusLabel = s => ({ NEW:"รอรับเรื่อง", IN_PROGRESS:"กำลังดำเนินการ", ESCALATED:"ส่งต่อ Tier 2", ESCALATED_TIER3:"ส่งต่อ Tier 3", RESOLVED:"แก้ไขแล้ว", CLOSED:"ปิดงาน", REOPENED:"เปิดใหม่", CANCELLED:"ยกเลิก" }[s] || s);

  const workflowSteps = [
    {
      step: 1,
      icon: "fa-file-circle-plus",
      color: "#6366f1",
      bgColor: "rgba(99,102,241,0.1)",
      title: "แจ้งปัญหา",
      desc: "กรอกข้อมูลปัญหาที่พบ พร้อมระบุระบบงาน ความเร่งด่วน และรายละเอียดให้ครบถ้วน",
      action: { label: "แจ้งปัญหาใหม่", href: "/tickets/create", icon: "fa-plus" },
    },
    {
      step: 2,
      icon: "fa-inbox",
      color: "#3b82f6",
      bgColor: "rgba(59,130,246,0.1)",
      title: "Tier 1 รับเรื่อง",
      desc: "ทีม IT Helpdesk รับเรื่องและประเมินปัญหาภายใน 15 นาที พร้อมแจ้งสถานะให้คุณทราบ",
      action: null,
    },
    {
      step: 3,
      icon: "fa-wrench",
      color: "#f59e0b",
      bgColor: "rgba(245,158,11,0.1)",
      title: "ดำเนินการแก้ไข",
      desc: "ทีมผู้เชี่ยวชาญ (Tier 2/3) ดำเนินการแก้ไขตามความซับซ้อนของปัญหา และอัปเดตสถานะอย่างต่อเนื่อง",
      action: null,
    },
    {
      step: 4,
      icon: "fa-circle-check",
      color: "#10b981",
      bgColor: "rgba(16,185,129,0.1)",
      title: "ยืนยันและปิดงาน",
      desc: "เมื่อปัญหาได้รับการแก้ไข คุณจะได้รับการแจ้งเตือน กรุณายืนยันว่าปัญหาได้รับการแก้ไขเรียบร้อย",
      action: null,
    },
  ];

  const slaInfo = [
    { priority: "Critical", color: "#ef4444", bgColor: "rgba(239,68,68,0.1)", icon: "fa-fire", response: "15 นาที", resolve: "4 ชั่วโมง", example: "ระบบหลักล่ม, ข้อมูลสูญหาย" },
    { priority: "High", color: "#f59e0b", bgColor: "rgba(245,158,11,0.1)", icon: "fa-arrow-up", response: "1 ชั่วโมง", resolve: "8 ชั่วโมง", example: "ฟีเจอร์สำคัญใช้งานไม่ได้" },
    { priority: "Medium", color: "#3b82f6", bgColor: "rgba(59,130,246,0.1)", icon: "fa-minus", response: "4 ชั่วโมง", resolve: "2 วันทำการ", example: "ปัญหาที่มีผลกระทบบางส่วน" },
    { priority: "Low", color: "#6b7280", bgColor: "rgba(107,114,128,0.1)", icon: "fa-arrow-down", response: "1 วันทำการ", resolve: "5 วันทำการ", example: "คำถามทั่วไป, ปรับแต่งเล็กน้อย" },
  ];

  const stats = userDashboard?.stats || {};
  const myTickets = userDashboard?.myTickets || [];

  return (
    <div>
      {/* Welcome Header */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        borderRadius: "16px",
        padding: "28px 32px",
        marginBottom: "24px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }}></div>
        <div style={{ position: "absolute", bottom: "-40px", right: "60px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }}></div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
            <i className="fa-solid fa-hand-wave" style={{ marginRight: "6px" }}></i>
            ยินดีต้อนรับสู่ IT Helpdesk
          </div>
          <h1 style={{ fontSize: "1.7rem", fontWeight: 800, marginBottom: "8px", lineHeight: 1.2 }}>
            สวัสดี, {user?.full_name?.split(" ")[0] || "คุณผู้ใช้"} 👋
          </h1>
          <p style={{ opacity: 0.85, fontSize: "0.95rem", maxWidth: "500px", lineHeight: 1.6 }}>
            หากพบปัญหาด้าน IT กรุณาแจ้งปัญหาผ่านระบบนี้ ทีมงานพร้อมให้บริการและจะติดตามสถานะให้คุณตลอดเวลา
          </p>
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a href="/tickets/create" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 22px", background: "#fff", color: "#4f46e5",
              borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem",
              textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              transition: "transform 0.15s",
            }}>
              <i className="fa-solid fa-plus"></i> แจ้งปัญหาใหม่
            </a>
            <a href="/tickets/my" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 22px", background: "rgba(255,255,255,0.15)", color: "#fff",
              borderRadius: "10px", fontWeight: 600, fontSize: "0.9rem",
              textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.3)",
              backdropFilter: "blur(4px)",
            }}>
              <i className="fa-solid fa-list-check"></i> ติดตาม Ticket ของฉัน
            </a>
          </div>
        </div>
      </div>

      {/* My Ticket Stats */}
      {!loadingTickets && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          {[
            { n: stats.total || 0, l: "Ticket ทั้งหมด", icon: "fa-ticket", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
            { n: stats.open || 0, l: "กำลังดำเนินการ", icon: "fa-clock", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
            { n: stats.resolved || 0, l: "แก้ไขแล้ว", icon: "fa-check-circle", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
            { n: stats.closed || 0, l: "ปิดงานแล้ว", icon: "fa-circle-check", color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ border: "1px solid var(--border)" }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}><i className={`fa-solid ${s.icon}`}></i></div>
              <div>
                <div className="stat-number" style={{ color: s.color }}>{s.n}</div>
                <div className="stat-label">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workflow Steps */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-diagram-project" style={{ marginRight: "10px", color: "#6366f1" }}></i>
            ขั้นตอนการแจ้งและแก้ไขปัญหา IT
          </h2>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>IT Support Workflow</span>
        </div>
        <div className="card-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", position: "relative" }}>
            {workflowSteps.map((step, idx) => (
              <div key={step.step} style={{ position: "relative" }}>
                {/* Connector line */}
                {idx < workflowSteps.length - 1 && (
                  <div style={{
                    position: "absolute", top: "36px", left: "calc(100% + 8px)", right: "-8px",
                    height: "2px", background: `linear-gradient(90deg, ${step.color}60, ${workflowSteps[idx+1].color}60)`,
                    zIndex: 0, display: "none", // hidden on small screens
                  }}></div>
                )}
                <div style={{
                  border: "1.5px solid var(--border)",
                  borderRadius: "14px",
                  padding: "20px",
                  background: "var(--card-bg)",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {/* Step number badge */}
                  <div style={{
                    position: "absolute", top: "12px", right: "12px",
                    width: "22px", height: "22px", borderRadius: "50%",
                    background: step.bgColor, color: step.color,
                    fontSize: "0.7rem", fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{step.step}</div>

                  <div style={{
                    width: "52px", height: "52px", borderRadius: "12px",
                    background: step.bgColor, color: step.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.3rem", marginBottom: "14px",
                  }}>
                    <i className={`fa-solid ${step.icon}`}></i>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "8px" }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {step.desc}
                  </div>
                  {step.action && (
                    <a
                      href={step.action.href}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        marginTop: "14px", padding: "7px 16px",
                        background: step.color, color: "#fff",
                        borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <i className={`fa-solid ${step.action.icon}`}></i>
                      {step.action.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SLA Info */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <h2 className="card-title">
            <i className="fa-solid fa-stopwatch" style={{ marginRight: "10px", color: "#f59e0b" }}></i>
            SLA — ระยะเวลาการแก้ไขปัญหาตามระดับความเร่งด่วน
          </h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ระดับความเร่งด่วน</th>
                  <th>ตัวอย่างปัญหา</th>
                  <th style={{ textAlign: "center" }}>เวลาตอบสนอง</th>
                  <th style={{ textAlign: "center" }}>เวลาแก้ไข (เป้าหมาย)</th>
                </tr>
              </thead>
              <tbody>
                {slaInfo.map((row) => (
                  <tr key={row.priority}>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "4px 12px", borderRadius: "20px",
                        background: row.bgColor, color: row.color,
                        fontWeight: 700, fontSize: "0.82rem",
                      }}>
                        <i className={`fa-solid ${row.icon}`}></i>
                        {row.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{row.example}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: row.color, fontSize: "0.88rem" }}>{row.response}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>{row.resolve}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* My Recent Tickets */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa-solid fa-list-check" style={{ marginRight: "8px", color: "#6366f1" }}></i>
            Ticket ล่าสุดของฉัน
          </h3>
          <a href="/tickets/create" className="btn btn-primary btn-sm">
            <i className="fa-solid fa-plus"></i> แจ้งปัญหาใหม่
          </a>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loadingTickets ? (
            <div className="flex-center" style={{ height: "120px" }}>
              <div className="loader-wrap"><div className="loader-pulse"></div><p>กำลังโหลด...</p></div>
            </div>
          ) : myTickets.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Job No.</th><th>หัวข้อ</th><th>สถานะ</th><th>วันที่แจ้ง</th><th></th></tr></thead>
                <tbody>
                  {myTickets.slice(0, 5).map(t => (
                    <tr key={t.ticket_id}>
                      <td className="font-mono" style={{ fontSize: ".76rem", fontWeight: 600 }}>{t.ticket_no}</td>
                      <td style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</td>
                      <td><span className={`badge ${statusColor(t.status)}`}>{statusLabel(t.status)}</span></td>
                      <td style={{ fontSize: ".76rem" }}>{new Date(t.created_at).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                      <td><a href={`/tickets/${t.ticket_id}`} className="btn btn-outline btn-sm">ดูรายละเอียด</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
              <i className="fa-solid fa-inbox fa-3x" style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: "16px", display: "block" }}></i>
              <p style={{ color: "var(--text-muted)", marginBottom: "16px" }}>คุณยังไม่มี Ticket ในระบบ</p>
              <a href="/tickets/create" className="btn btn-primary">
                <i className="fa-solid fa-plus"></i> แจ้งปัญหาแรกของคุณ
              </a>
            </div>
          )}
          {myTickets.length > 5 && (
            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <a href="/tickets/my" className="btn btn-outline btn-sm">ดู Ticket ทั้งหมด ({myTickets.length} รายการ)</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin / IT Dashboard (unchanged) ──────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Trend chart state
  const [trendPeriod, setTrendPeriod] = useState("mtd");
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);
  const [agingTab, setAgingTab] = useState("summary");

  useEffect(() => {
    // Get current user
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) setUser(d.user); })
      .catch(() => {});

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

  const isGeneralUser = user && ["USER", "END_USER"].includes(user.role?.toUpperCase());

  // ── General users see the workflow page ──
  if (isGeneralUser) {
    return <WorkflowView user={user} />;
  }

  const stats = data?.stats || { total:0, open:0, resolved:0, closed:0, critical:0, escalated:0, new:0, newToday:0, resolvedToday:0, closedToday:0 };
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
      {/* Admin/IT Stats Row — with daily clarification */}
      <>
        {/* Today's Highlights */}
        <div style={{ marginBottom: "8px", fontSize: ".8rem", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
          <i className="fa-solid fa-calendar-day" style={{ color: "var(--primary)" }}></i>
          วันนี้ ({new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })})
          <span style={{ marginLeft: "8px", padding: "2px 8px", background: "rgba(34,197,94,.1)", color: "var(--success)", borderRadius: "10px" }}>
            เปิดใหม่: {stats.newToday} | แก้ไขแล้ว: {stats.resolvedToday} | ปิดงาน: {stats.closedToday}
          </span>
        </div>

        <div className="stats-grid">
          {[
            { n: stats.total, l: "Total Tickets (ทั้งหมด)", icon: "fa-ticket", cls: "blue", sub: "ตั้งแต่เปิดระบบ" },
            { n: stats.open, l: "Open Tickets", icon: "fa-clock", cls: "yellow", sub: "ค้างดำเนินการ" },
            { n: stats.resolved + stats.closed, l: "Resolved / Closed", icon: "fa-check-circle", cls: "green", sub: "แก้ไขแล้ว (สะสม)" },
            { n: stats.critical, l: "Critical Open", icon: "fa-triangle-exclamation", cls: "red", sub: "เร่งด่วนค้างอยู่" },
            { n: stats.escalated, l: "Escalated", icon: "fa-arrow-up-right-from-square", cls: "purple", sub: "ส่งต่อ Tier 2/3" },
            { n: stats.new, l: "รอรับเรื่อง (NEW)", icon: "fa-inbox", cls: "blue", sub: "รอ Tier 1 รับ" },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div className={`stat-icon ${s.cls}`}><i className={`fa-solid ${s.icon}`}></i></div>
              <div>
                <div className="stat-number">{s.n}</div>
                <div className="stat-label">{s.l}</div>
                <div style={{ fontSize: ".7rem", color: "var(--text-muted)", marginTop: "2px" }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </>

      {/* ── Admin/IT only: Charts and reports ── */}
      <>
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
      </> {/* end admin fragment */}
    </>
  );
}
