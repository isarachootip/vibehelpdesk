"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function Tier1TicketDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [initialAssessment, setInitialAssessment] = useState("");
  const [preliminaryCause, setPreliminaryCause] = useState("");
  const [tier1Action, setTier1Action] = useState("");
  const [escalateReason, setEscalateReason] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (!data.error) {
        setTicket(data);
        setInitialAssessment(data.initial_assessment || "");
        setPreliminaryCause(data.preliminary_cause || "");
        setTier1Action(data.tier1_action || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleAction = async (actionType) => {
    // Basic auth mock: we pretend we are user_id: 1 (Helpdesk)
    const currentUserId = 1; 

    const payload = {
      action: actionType,
      user_id: currentUserId,
      initial_assessment: initialAssessment,
      preliminary_cause: preliminaryCause,
      tier1_action: tier1Action,
      escalate_reason: escalateReason,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (actionType === 'ESCALATE' || actionType === 'TIER1_ASSESS') {
          router.push('/tier1');
        } else {
          fetchData();
        }
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "เกิดข้อผิดพลาด"));
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
      <i className="fa-solid fa-circle-notch fa-spin fa-2x"></i>
      <p style={{ marginTop: "10px" }}>กำลังโหลดข้อมูล Ticket...</p>
    </div>
  );

  if (!ticket) return <div style={{ padding: "40px", textAlign: "center", color: "red" }}>ไม่พบข้อมูล Ticket</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/tier1" className="btn btn-ghost btn-sm">
            <i className="fa-solid fa-arrow-left"></i> กลับ
          </Link>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            {ticket.ticket_no}
          </h2>
          <span className={`badge ${ticket.status === 'NEW' ? 'badge-error' : 'badge-primary'}`}>
            {ticket.status}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Ticket Info */}
          <div className="card glass-panel">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-circle-info"></i> รายละเอียดปัญหาที่ได้รับแจ้ง</h3>
            </div>
            <div className="card-body">
              <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "10px" }}>{ticket.subject}</h4>
              <p style={{ whiteSpace: "pre-wrap", color: "var(--text-muted)", marginBottom: "10px" }}>{ticket.symptom}</p>
              <div style={{ background: "rgba(0,0,0,0.05)", padding: "10px", borderRadius: "8px", fontSize: "0.9rem" }}>
                <strong>รายละเอียดเพิ่มเติม:</strong><br/>
                <span style={{ whiteSpace: "pre-wrap", color: "var(--text)" }}>{ticket.description}</span>
              </div>
            </div>
          </div>

          {/* Actions depending on status */}
          {ticket.status === 'NEW' && (
            <div className="card glass-panel" style={{ borderLeft: "4px solid var(--danger)" }}>
              <div className="card-header">
                <h3 className="card-title">รับเรื่อง (Accept Ticket)</h3>
              </div>
              <div className="card-body">
                <p style={{ marginBottom: "15px" }}>ทิคเก็ตนี้เพิ่งถูกแจ้งเข้ามา กรุณากด "รับเรื่อง" เพื่อระบุว่าคุณกำลังประเมินปัญหา</p>
                <button className="btn btn-primary" onClick={() => handleAction('TIER1_ACCEPT')} disabled={submitting}>
                  <i className="fa-solid fa-hand-pointer"></i> รับเรื่อง (Accept)
                </button>
              </div>
            </div>
          )}

          {ticket.status === 'IN_PROGRESS' && ticket.is_escalated === false && (
            <div className="card glass-panel" style={{ borderLeft: "4px solid var(--primary)" }}>
              <div className="card-header">
                <h3 className="card-title"><i className="fa-solid fa-magnifying-glass"></i> ประเมินและการแก้ไขเบื้องต้น (Tier 1 Assessment)</h3>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label>ผลการประเมินเบื้องต้น (Initial Assessment)</label>
                  <textarea className="form-control" rows="2" value={initialAssessment} onChange={e => setInitialAssessment(e.target.value)}></textarea>
                </div>
                <div className="form-group">
                  <label>สาเหตุที่คาดว่าจะเป็น (Preliminary Cause)</label>
                  <textarea className="form-control" rows="2" value={preliminaryCause} onChange={e => setPreliminaryCause(e.target.value)}></textarea>
                </div>
                <div className="form-group">
                  <label>สิ่งที่ได้ดำเนินการไปแล้ว (Action Taken)</label>
                  <textarea className="form-control" rows="3" value={tier1Action} onChange={e => setTier1Action(e.target.value)}></textarea>
                </div>
                
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                  <button className="btn btn-outline" onClick={() => handleAction('TIER1_ASSESS')} disabled={submitting}>
                    <i className="fa-solid fa-save"></i> บันทึกผลการประเมิน
                  </button>
                </div>

                <hr style={{ margin: "20px 0", borderTop: "1px solid var(--border)" }} />
                
                <h4 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "10px", color: "var(--warning)" }}>ส่งต่อให้ Tier 2 (Escalate)</h4>
                <div className="form-group">
                  <label>เหตุผลที่ต้องส่งต่อ</label>
                  <input type="text" className="form-control" placeholder="เช่น จำเป็นต้องเปลี่ยนอะไหล่ หรือแก้ไข Database" value={escalateReason} onChange={e => setEscalateReason(e.target.value)} />
                </div>
                <button className="btn btn-warning" onClick={() => handleAction('ESCALATE')} disabled={submitting || !escalateReason}>
                  <i className="fa-solid fa-arrow-up-right-dots"></i> โอนงานให้ Tier 2
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card glass-panel">
            <div className="card-header">
              <h3 className="card-title">ข้อมูลอ้างอิง</h3>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ผู้แจ้ง (Reporter)</div>
                <div style={{ fontWeight: 600 }}>{ticket.reporter?.full_name || ticket.reporter_name || "-"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{ticket.reporter_email || "-"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <i className="fa-solid fa-phone" style={{marginRight:"4px"}}></i>{ticket.reporter_phone || "-"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <i className="fa-brands fa-line" style={{marginRight:"4px",color:"#06c755"}}></i>{ticket.reporter_line_id || "-"}
                </div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ระบบ (System)</div>
                <div style={{ fontWeight: 600 }}>{ticket.system?.system_name}</div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>สถานที่ (Location)</div>
                <div style={{ fontWeight: 600 }}>{ticket.location?.location_name || ticket.location_text || "-"}</div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ความสำคัญ (Priority)</div>
                <div style={{ fontWeight: 600, color: "var(--danger)" }}>{ticket.priority}</div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ประเภทปัญหา</div>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{ticket.problem_type}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
