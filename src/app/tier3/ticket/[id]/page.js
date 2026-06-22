"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function Tier3TicketDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modals visibility
  const [showEstimationModal, setShowEstimationModal] = useState(false);

  // Form states
  const [rootCause, setRootCause] = useState("");
  const [rootCauseCategory, setRootCauseCategory] = useState("Other");
  const [resolution, setResolution] = useState("");
  const [resolutionDetail, setResolutionDetail] = useState("");
  const [preventiveAction, setPreventiveAction] = useState("");

  // Estimation form states
  const [estDate, setEstDate] = useState("");
  const [estTime, setEstTime] = useState("");
  const [escalateAssumption, setEscalateAssumption] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (!data.error) {
        setTicket(data);
        setRootCause(data.root_cause || "");
        setRootCauseCategory(data.root_cause_category || "Other");
        setResolution(data.resolution || "");
        setResolutionDetail(data.resolution_detail || "");
        setPreventiveAction(data.preventive_action || "");
        setEscalateAssumption(data.assumption || "");
        if (data.estimated_resolve_time) {
          const d = new Date(data.estimated_resolve_time);
          setEstDate(d.toISOString().split("T")[0]);
          setEstTime(d.toTimeString().split(" ")[0].substring(0, 5));
        }
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

  const handleAction = async (actionType, extraData = {}) => {
    const currentUserId = 1; // Simulated user (reconstructed at API from cookie)

    const payload = {
      action: actionType,
      user_id: currentUserId,
      ...extraData
    };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowEstimationModal(false);
        if (actionType === 'RESOLVE') {
          router.push('/tier3');
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

  const handleUpdateEstimationSubmit = (e) => {
    e.preventDefault();
    let estimated_resolve_time = null;
    if (estDate && estTime) {
      estimated_resolve_time = new Date(`${estDate}T${estTime}:00`);
    }

    handleAction("UPDATE_ESTIMATION", {
      estimated_resolve_time,
      assumption: escalateAssumption,
      root_cause: rootCause,
    });
  };

  const handleResolveSubmit = (e) => {
    e.preventDefault();
    if (!rootCause || !resolution) {
      alert("กรุณากรอกสาเหตุ (Root Cause) และวิธีแก้ไข (Resolution)");
      return;
    }

    handleAction("RESOLVE", {
      root_cause: rootCause,
      root_cause_category: rootCauseCategory,
      resolution,
      resolution_detail: resolutionDetail,
      preventive_action: preventiveAction,
    });
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
          <Link href="/tier3" className="btn btn-ghost btn-sm">
            <i className="fa-solid fa-arrow-left"></i> กลับ
          </Link>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            {ticket.ticket_no}
          </h2>
          <span className={`badge ${ticket.status === 'ESCALATED_TIER3' ? 'badge-error' : 'badge-primary'}`}>
            {ticket.status}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Detail Card */}
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

          {/* Tier 1 & 2 Assessments */}
          <div className="card glass-panel" style={{ borderLeft: "4px solid var(--warning)" }}>
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-clipboard-check"></i> บันทึกประเมินอาการก่อนหน้า</h3>
            </div>
            <div className="card-body">
              {ticket.initial_assessment && (
                <div>
                  <strong>Tier 1 Comment:</strong>
                  <p style={{ color: "var(--text-muted)" }}>{ticket.initial_assessment}</p>
                </div>
              )}
              {ticket.escalate_reason && (
                <div style={{ marginTop: "10px" }}>
                  <strong>เหตุผลส่งต่อ Tier 2:</strong>
                  <p style={{ color: "var(--text-muted)" }}>{ticket.escalate_reason}</p>
                </div>
              )}
              {ticket.assumption && (
                <div style={{ marginTop: "10px" }}>
                  <strong>สมมติฐาน/วิเคราะห์จาก Tier 2:</strong>
                  <p style={{ color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{ticket.assumption}</p>
                </div>
              )}
            </div>
          </div>

          {/* Target Resolve Time & Assumptions Details */}
          {(ticket.estimated_resolve_time) && (
            <div className="card glass-panel" style={{ borderLeft: "4px solid var(--primary-light)" }}>
              <div className="card-header">
                <h3 className="card-title"><i className="fa-solid fa-clock"></i> การประเมินระยะเวลาแก้ไข</h3>
              </div>
              <div className="card-body">
                <div>
                  <strong>ระยะเวลาประเมินแก้ไขเสร็จ:</strong>
                  <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", fontWeight: "bold" }}>
                    {new Date(ticket.estimated_resolve_time).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resolve Section (Visible when accepted or in-progress) */}
          {ticket.status === 'IN_PROGRESS' && (
            <div className="card glass-panel" style={{ borderLeft: "4px solid var(--success)" }}>
              <div className="card-header">
                <h3 className="card-title"><i className="fa-solid fa-wrench"></i> บันทึกการแก้ไขปัญหาและปิดงาน (Tier 3 Resolution)</h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleResolveSubmit}>
                  <div className="form-group">
                    <label>สาเหตุหลักเชิงเทคนิคที่พบ (Root Cause) *</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      required 
                      placeholder="ระบุสาเหตุเชิงระบบระดับลึกที่ตรวจพบ..."
                      value={rootCause}
                      onChange={e => setRootCause(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group" style={{ marginTop: "12px" }}>
                    <label>ประเภทของสาเหตุ (Category)</label>
                    <select 
                      className="form-control" 
                      value={rootCauseCategory} 
                      onChange={e => setRootCauseCategory(e.target.value)}
                    >
                      <option value="Hardware Failure">🔧 Hardware Failure</option>
                      <option value="Software Bug">💻 Software Bug</option>
                      <option value="Configuration Error">⚙️ Configuration Error</option>
                      <option value="Network Issue">🌐 Network Issue</option>
                      <option value="Human Error">👤 Human Error</option>
                      <option value="Other">❓ Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginTop: "12px" }}>
                    <label>วิธีแก้ปัญหา / ซ่อมแซมระบบ (Resolution/Solution) *</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      required 
                      placeholder="อธิบายขั้นตอนการกู้คืนระบบหรือแก้ไขซอฟต์แวร์..."
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group" style={{ marginTop: "12px" }}>
                    <label>รายละเอียดเพิ่มเติมย่อยๆ (Optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="จุดที่ทำการแพตช์ หรือเปลี่ยน Config..."
                      value={resolutionDetail}
                      onChange={e => setResolutionDetail(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-group" style={{ marginTop: "12px" }}>
                    <label>แนวทางป้องกันเชิงลึกในระยะยาว (Preventive Action - Optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="แนะนำการมอนิเตอร์ บำรุงรักษา หรือแก้ไขจุดโหว่เพิ่มเติม..."
                      value={preventiveAction}
                      onChange={e => setPreventiveAction(e.target.value)}
                    ></textarea>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button type="submit" className="btn btn-success" disabled={submitting}>
                      <i className="fa-solid fa-circle-check"></i> แก้ไขเสร็จสิ้น (Resolve Ticket)
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowEstimationModal(true)}>
                      <i className="fa-solid fa-clock"></i> ปรับปรุงเวลาแก้ไข/วิเคราะห์เพิ่มเติม
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* If escalated to Tier 3 but not accepted by them yet */}
          {ticket.status === 'ESCALATED_TIER3' && (
            <div className="card glass-panel" style={{ borderLeft: "4px solid var(--danger)" }}>
              <div className="card-header">
                <h3 className="card-title">รับงานวิเคราะห์แก้ปัญหา (Accept Ticket)</h3>
              </div>
              <div className="card-body">
                <p style={{ marginBottom: "15px" }}>ทิคเก็ตนี้ถูกส่งต่อมาให้ผู้เชี่ยวชาญ Tier 3 กรุณากด "รับเรื่อง" เพื่อเริ่มขั้นตอนวิเคราะห์ระบบเชิงลึก</p>
                <button className="btn btn-primary" onClick={() => handleAction('TIER3_ACCEPT')} disabled={submitting}>
                  <i className="fa-solid fa-hand-pointer"></i> รับงานแก้ (Accept)
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
            </div>
          </div>

          <div className="card glass-panel">
            <div className="card-header">
              <h3 className="card-title">ผู้รับผิดชอบ</h3>
            </div>
            <div className="card-body" style={{ fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div><span className="text-muted">Tier 1:</span> <strong>{ticket.tier1?.full_name || "ไม่มี"}</strong></div>
              <div><span className="text-muted">Tier 2:</span> <strong>{ticket.tier2?.full_name || "ไม่มี"}</strong></div>
              <div><span className="text-muted">Tier 3:</span> <strong>{ticket.tier3?.full_name || "ไม่มี"}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Estimation Modal */}
      {showEstimationModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div className="card glass-panel" style={{ width: "90%", maxWidth: "500px", padding: "20px", color: "#fff" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px" }}>
              <h3 className="card-title" style={{ margin: 0 }}><i className="fa-solid fa-clock"></i> ปรับปรุงเวลาแก้ไขและวิเคราะห์เพิ่มเติม</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEstimationModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateEstimationSubmit}>
              <div className="card-body" style={{ padding: "10px 0 0 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div className="form-group">
                    <label>ประมาณการวันที่เสร็จ</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={estDate}
                      onChange={e => setEstDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>ประมาณการเวลาเสร็จ</label>
                    <input 
                      type="time" 
                      className="form-control"
                      value={estTime}
                      onChange={e => setEstTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: "12px" }}>
                  <label>สมมติฐาน/วิเคราะห์เชิงลึก (Assumption)</label>
                  <textarea 
                    className="form-control" 
                    rows="4"
                    placeholder="ระบุข้อสมมติฐานหลัก หรือความคืบหน้าการวิเคราะห์ระบบ..."
                    value={escalateAssumption}
                    onChange={e => setEscalateAssumption(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowEstimationModal(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <i className="fa-solid fa-save"></i> บันทึกข้อมูล
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
