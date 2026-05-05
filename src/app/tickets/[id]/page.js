"use client";
import { useState, useEffect, use } from "react";

export default function TicketDetail({ params }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTicket = () => {
    fetch(`/api/tickets/${id}`)
      .then(r => r.json())
      .then(d => { setTicket(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const doAction = async (action, extra = {}) => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, user_id: 1, ...extra }),
    });
    if (res.ok) fetchTicket();
    else alert("Error");
  };

  if (loading) return <div className="flex-center" style={{height:"300px"}}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>;
  if (!ticket) return <div className="empty-state"><h3>Ticket not found</h3></div>;

  const priorityColor = p => ({ Critical:"badge-danger", High:"badge-warning", Medium:"badge-primary", Low:"badge-gray" }[p] || "badge-gray");
  const statusColor = s => ({ NEW:"badge-primary", IN_PROGRESS:"badge-warning", ESCALATED:"badge-danger", RESOLVED:"badge-success", CLOSED:"badge-gray", REOPENED:"badge-danger" }[s] || "badge-gray");
  const statusLabel = s => ({ NEW:"รอรับเรื่อง", IN_PROGRESS:"กำลังดำเนินการ", ESCALATED:"ส่งต่อ Tier 2", RESOLVED:"แก้ไขแล้ว", CLOSED:"ปิดงาน", REOPENED:"เปิดใหม่", CANCELLED:"ยกเลิก" }[s] || s);
  const fmt = d => d ? new Date(d).toLocaleString("th-TH") : null;

  const timestamps = [
    { label: "สร้าง Ticket", field: "created_at", icon: "fa-plus-circle", color: "#3b82f6" },
    { label: "Tier 1 รับเรื่อง", field: "tier1_accepted_at", icon: "fa-hand", color: "#8b5cf6" },
    { label: "ประเมินเบื้องต้น", field: "tier1_assessed_at", icon: "fa-clipboard-check", color: "#6366f1" },
    { label: "Escalate → Tier 2", field: "escalated_at", icon: "fa-arrow-up-right-from-square", color: "#f59e0b" },
    { label: "Tier 2 รับเรื่อง", field: "tier2_accepted_at", icon: "fa-hand", color: "#a855f7" },
    { label: "เริ่มแก้ไข", field: "repair_started_at", icon: "fa-wrench", color: "#ec4899" },
    { label: "แก้ไขเสร็จ", field: "resolved_at", icon: "fa-check", color: "#22c55e" },
    { label: "ผู้ใช้ยืนยัน", field: "user_confirmed_at", icon: "fa-thumbs-up", color: "#14b8a6" },
    { label: "ปิด Ticket", field: "closed_at", icon: "fa-lock", color: "#6b7280" },
    { label: "Reopen", field: "reopened_at", icon: "fa-rotate", color: "#ef4444" },
  ];

  return (
    <>
      <div style={{marginBottom:"16px",display:"flex",alignItems:"center",gap:"12px"}}>
        <a href="/tickets" className="btn btn-ghost btn-sm"><i className="fa-solid fa-arrow-left"></i></a>
        <div style={{flex:1}}>
          <h2 style={{fontSize:"1.15rem",fontWeight:700}}>
            <span className="font-mono" style={{color:"var(--primary-light)"}}>{ticket.ticket_no}</span>
          </h2>
          <p className="text-muted" style={{fontSize:".82rem"}}>{ticket.subject}</p>
        </div>
        <span className={`badge ${priorityColor(ticket.priority)}`} style={{fontSize:".85rem",padding:"5px 14px"}}>{ticket.priority}</span>
        <span className={`badge ${statusColor(ticket.status)}`} style={{fontSize:".85rem",padding:"5px 14px"}}>{statusLabel(ticket.status)}</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"16px"}}>
        {/* Left Column */}
        <div>
          {/* Info Card */}
          <div className="card">
            <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-info-circle" style={{marginRight:"8px",color:"var(--primary-light)"}}></i>ข้อมูล Ticket</h3></div>
            <div className="card-body">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                <div><span className="text-muted" style={{fontSize:".75rem",display:"block"}}>ผู้แจ้ง</span><strong>{ticket.reporter?.full_name}</strong><br/><span style={{fontSize:".78rem",color:"var(--text-muted)"}}>{ticket.reporter_email}</span></div>
                <div><span className="text-muted" style={{fontSize:".75rem",display:"block"}}>BU</span><span className="chip">{ticket.bu?.bu_code}</span> {ticket.bu?.bu_name}</div>
                <div><span className="text-muted" style={{fontSize:".75rem",display:"block"}}>ระบบ</span><span className="chip">{ticket.system?.system_code}</span> {ticket.system?.system_name}</div>
                <div><span className="text-muted" style={{fontSize:".75rem",display:"block"}}>จุดเกิดเหตุ</span>{ticket.location?.location_name}</div>
                <div><span className="text-muted" style={{fontSize:".75rem",display:"block"}}>ประเภท</span>{ticket.problem_type === "hardware" ? "🔧 Hardware" : "💻 Software"}</div>
                <div><span className="text-muted" style={{fontSize:".75rem",display:"block"}}>Owner</span>{ticket.owner?.full_name || "-"}</div>
              </div>
            </div>
          </div>

          {/* Symptom & Description */}
          <div className="card">
            <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-stethoscope" style={{marginRight:"8px",color:"var(--warning)"}}></i>อาการ & รายละเอียด</h3></div>
            <div className="card-body">
              <div style={{marginBottom:"12px"}}><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>อาการ (Symptom)</label><p style={{fontSize:".88rem",marginTop:"4px",lineHeight:1.6}}>{ticket.symptom}</p></div>
              <div><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>รายละเอียด</label><p style={{fontSize:".88rem",marginTop:"4px",lineHeight:1.6}}>{ticket.description}</p></div>
            </div>
          </div>

          {/* Tier 1 Assessment */}
          {ticket.initial_assessment && (
            <div className="card">
              <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-clipboard-check" style={{marginRight:"8px",color:"#8b5cf6"}}></i>Tier 1 Assessment</h3></div>
              <div className="card-body">
                {ticket.initial_assessment && <div style={{marginBottom:"8px"}}><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>ความเห็นเบื้องต้น</label><p style={{fontSize:".88rem"}}>{ticket.initial_assessment}</p></div>}
                {ticket.preliminary_cause && <div style={{marginBottom:"8px"}}><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>สันนิษฐานสาเหตุ</label><p style={{fontSize:".88rem"}}>{ticket.preliminary_cause}</p></div>}
                {ticket.escalate_reason && <div><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>เหตุผลส่งต่อ Tier 2</label><p style={{fontSize:".88rem"}}>{ticket.escalate_reason}</p></div>}
              </div>
            </div>
          )}

          {/* Tier 2 Resolution */}
          {ticket.root_cause && (
            <div className="card">
              <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-wrench" style={{marginRight:"8px",color:"#22c55e"}}></i>Tier 2 Resolution</h3></div>
              <div className="card-body">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
                  <div><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>Root Cause</label><p style={{fontSize:".88rem"}}>{ticket.root_cause}</p></div>
                  <div><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>Category</label><p><span className="badge badge-warning">{ticket.root_cause_category}</span></p></div>
                  <div><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>วิธีแก้ไข</label><p style={{fontSize:".88rem"}}>{ticket.resolution}</p></div>
                  <div><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>รายละเอียดการแก้</label><p style={{fontSize:".88rem"}}>{ticket.resolution_detail || "-"}</p></div>
                </div>
                {ticket.preventive_action && <div style={{marginTop:"12px"}}><label style={{fontSize:".75rem",fontWeight:600,color:"var(--text-secondary)"}}>แนวทางป้องกัน</label><p style={{fontSize:".88rem"}}>{ticket.preventive_action}</p></div>}
              </div>
            </div>
          )}

          {/* User Feedback */}
          {ticket.user_satisfaction && (
            <div className="card">
              <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-star" style={{marginRight:"8px",color:"#f59e0b"}}></i>Feedback</h3></div>
              <div className="card-body">
                <div>ความพึงพอใจ: {"⭐".repeat(ticket.user_satisfaction)} ({ticket.user_satisfaction}/5)</div>
                {ticket.user_comment && <p style={{marginTop:"8px",fontSize:".88rem"}}>{ticket.user_comment}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Timeline & Actions */}
        <div>
          {/* Action Buttons */}
          <div className="card" style={{marginBottom:"16px"}}>
            <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-bolt" style={{marginRight:"8px",color:"var(--warning)"}}></i>Actions</h3></div>
            <div className="card-body" style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {ticket.status === "NEW" && <button className="btn btn-primary" onClick={() => doAction("TIER1_ACCEPT")}><i className="fa-solid fa-hand"></i> Tier 1 รับเรื่อง</button>}
              {ticket.status === "IN_PROGRESS" && !ticket.is_escalated && (
                <>
                  <button className="btn btn-primary" onClick={() => doAction("TIER1_ASSESS", { initial_assessment: prompt("ความเห็นเบื้องต้น:"), preliminary_cause: prompt("สันนิษฐานสาเหตุ:") })}><i className="fa-solid fa-clipboard-check"></i> บันทึก Assessment</button>
                  <button className="btn btn-warning" onClick={() => doAction("ESCALATE", { escalate_reason: prompt("เหตุผล Escalate:") })}><i className="fa-solid fa-arrow-up"></i> Escalate → Tier 2</button>
                  <button className="btn btn-success" onClick={() => doAction("RESOLVE", { resolution: prompt("วิธีแก้ไข:"), root_cause: prompt("Root Cause:"), root_cause_category: "Other" })}><i className="fa-solid fa-check"></i> แก้ไขเสร็จ (Tier 1)</button>
                </>
              )}
              {ticket.status === "ESCALATED" && <button className="btn btn-primary" onClick={() => doAction("TIER2_ACCEPT")}><i className="fa-solid fa-hand"></i> Tier 2 รับเรื่อง</button>}
              {ticket.status === "IN_PROGRESS" && ticket.is_escalated && !ticket.repair_started_at && <button className="btn btn-primary" onClick={() => doAction("START_REPAIR")}><i className="fa-solid fa-wrench"></i> เริ่มแก้ไข</button>}
              {ticket.status === "IN_PROGRESS" && ticket.repair_started_at && (
                <button className="btn btn-success" onClick={() => doAction("RESOLVE", { root_cause: prompt("Root Cause:"), root_cause_category: prompt("Category (Hardware Failure/Software Bug/Configuration Error/Network Issue/Human Error/Other):") || "Other", resolution: prompt("วิธีแก้ไข:"), resolution_detail: prompt("รายละเอียด:"), preventive_action: prompt("แนวทางป้องกัน:") })}><i className="fa-solid fa-check"></i> แก้ไขเสร็จ</button>
              )}
              {ticket.status === "RESOLVED" && (
                <>
                  <button className="btn btn-success" onClick={() => doAction("CONFIRM", { user_satisfaction: prompt("คะแนน 1-5:"), user_comment: prompt("ความคิดเห็น:") })}><i className="fa-solid fa-thumbs-up"></i> ยืนยัน & ปิดงาน</button>
                  <button className="btn btn-danger" onClick={() => doAction("REOPEN")}><i className="fa-solid fa-rotate"></i> เปิดใหม่</button>
                </>
              )}
              {["NEW","IN_PROGRESS"].includes(ticket.status) && <button className="btn btn-ghost" style={{color:"var(--danger)"}} onClick={() => doAction("CANCEL")}><i className="fa-solid fa-xmark"></i> ยกเลิก</button>}
            </div>
          </div>

          {/* Assignment Info */}
          <div className="card" style={{marginBottom:"16px"}}>
            <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-users" style={{marginRight:"8px",color:"#6366f1"}}></i>ผู้รับผิดชอบ</h3></div>
            <div className="card-body" style={{fontSize:".85rem"}}>
              <div style={{marginBottom:"8px"}}><span className="text-muted">Tier 1:</span> <strong>{ticket.tier1?.full_name || "ยังไม่ assign"}</strong></div>
              <div style={{marginBottom:"8px"}}><span className="text-muted">Tier 2:</span> <strong>{ticket.tier2?.full_name || "ยังไม่ assign"}</strong></div>
              <div><span className="text-muted">Owner:</span> <strong>{ticket.owner?.full_name || "-"}</strong></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-timeline" style={{marginRight:"8px",color:"#14b8a6"}}></i>Timestamps</h3></div>
            <div className="card-body" style={{padding:"16px 20px"}}>
              {timestamps.map((ts, i) => {
                const val = ticket[ts.field];
                return (
                  <div key={i} style={{
                    display:"flex", alignItems:"flex-start", gap:"12px",
                    paddingBottom: i < timestamps.length - 1 ? "12px" : "0",
                    marginBottom: i < timestamps.length - 1 ? "12px" : "0",
                    borderBottom: i < timestamps.length - 1 ? "1px solid var(--border-light)" : "none",
                    opacity: val ? 1 : 0.35,
                  }}>
                    <div style={{
                      width:"28px",height:"28px",borderRadius:"50%",
                      background: val ? ts.color : "var(--border)",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:".7rem",color:"#fff",flexShrink:0
                    }}>
                      <i className={`fa-solid ${ts.icon}`}></i>
                    </div>
                    <div>
                      <div style={{fontSize:".8rem",fontWeight:600}}>{ts.label}</div>
                      <div style={{fontSize:".75rem",color:"var(--text-muted)"}}>{fmt(val) || "—"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
