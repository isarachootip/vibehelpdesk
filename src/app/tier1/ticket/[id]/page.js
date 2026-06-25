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
  const [actionMode, setActionMode] = useState(null); // 'assess' | 'escalate' | 'resolve'

  // Form states
  const [initialAssessment, setInitialAssessment] = useState("");
  const [preliminaryCause, setPreliminaryCause] = useState("");
  const [tier1Action, setTier1Action] = useState("");
  const [escalateReason, setEscalateReason] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");

  // Priority setter
  const [editPriority, setEditPriority] = useState(false);
  const [newPriority, setNewPriority] = useState("Medium");

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (!data.error) {
        setTicket(data);
        setInitialAssessment(data.initial_assessment || "");
        setPreliminaryCause(data.preliminary_cause || "");
        setTier1Action(data.tier1_action || "");
        setRootCause(data.root_cause || "");
        setResolution(data.resolution || "");
        setNewPriority(data.priority || "Medium");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [users, setUsers] = useState([]);
  const [selectedTier2Id, setSelectedTier2Id] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/master/users");
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter(u =>
          ["TIER2", "ADMIN"].includes(u.role?.toUpperCase())
        );
        setUsers(filtered);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [id]);

  const handleAction = async (actionType, extraData = {}) => {
    const currentUserId = 1;

    const payload = {
      action: actionType,
      user_id: currentUserId,
      initial_assessment: initialAssessment,
      preliminary_cause: preliminaryCause,
      tier1_action: tier1Action,
      escalate_reason: escalateReason,
      tier2_id: selectedTier2Id ? parseInt(selectedTier2Id) : null,
      root_cause: rootCause,
      resolution: resolution,
      ...extraData,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (actionType === 'ESCALATE' || actionType === 'RESOLVE') {
          router.push('/tier1');
        } else {
          await fetchData();
          setActionMode(null);
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

  const handleSetPriority = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_PRIORITY", priority: newPriority, user_id: 1 }),
      });
      if (res.ok) {
        await fetchData();
        setEditPriority(false);
      } else {
        alert("ไม่สามารถอัปเดต Priority ได้");
      }
    } catch (e) {
      alert("Error: " + e.message);
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

  const priorityColor = { Critical: "#ef4444", High: "#f59e0b", Medium: "#3b82f6", Low: "#6b7280" };
  const statusLabel = {
    NEW: "รอรับเรื่อง", IN_PROGRESS: "กำลังดำเนินการ", ESCALATED: "ส่งต่อ Tier 2",
    ESCALATED_TIER3: "ส่งต่อ Tier 3", RESOLVED: "แก้ไขแล้ว", CLOSED: "ปิดงาน", REOPENED: "เปิดใหม่"
  };

  const attachments = ticket.attachments || [];
  const imageAttachments = attachments.filter(a => a.file_type?.startsWith('image/'));
  const videoAttachments = attachments.filter(a => a.file_type?.startsWith('video/'));
  const otherAttachments = attachments.filter(a => !a.file_type?.startsWith('image/') && !a.file_type?.startsWith('video/'));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/tier1" className="btn btn-ghost btn-sm">
            <i className="fa-solid fa-arrow-left"></i> กลับ
          </Link>
          {/* Priority badge LEFT of ticket number */}
          <span style={{
            background: priorityColor[ticket.priority] || "#6b7280",
            color: "#fff", fontSize: ".7rem", fontWeight: 700, padding: "3px 8px",
            borderRadius: "4px", textTransform: "uppercase"
          }}>
            {ticket.priority}
          </span>
          <span className={`badge ${ticket.status === 'NEW' ? 'badge-error' : ticket.status === 'IN_PROGRESS' ? 'badge-primary' : ticket.status === 'ESCALATED' ? 'badge-warning' : ticket.status === 'RESOLVED' ? 'badge-success' : 'badge-gray'}`}>
            {statusLabel[ticket.status] || ticket.status}
          </span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            {ticket.ticket_no}
          </h2>
        </div>

        {/* Priority editor for IT/Tier1 */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {editPriority ? (
            <>
              <select
                className="form-control"
                style={{ width: "140px", fontSize: ".85rem" }}
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
              >
                <option value="Critical">🔴 Critical</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🔵 Medium</option>
                <option value="Low">⚪ Low</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleSetPriority} disabled={submitting}>
                <i className="fa-solid fa-check"></i> บันทึก
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditPriority(false)}>
                ยกเลิก
              </button>
            </>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => setEditPriority(true)}>
              <i className="fa-solid fa-flag"></i> กำหนด Priority
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Ticket Info + Attachments */}
          <div className="card glass-panel">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-circle-info"></i> อาการ & รายละเอียด</h3>
            </div>
            <div className="card-body">
              <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "10px" }}>{ticket.subject}</h4>
              <p style={{ whiteSpace: "pre-wrap", color: "var(--text-muted)", marginBottom: "10px" }}>{ticket.symptom}</p>
              <div style={{ background: "rgba(0,0,0,0.05)", padding: "10px", borderRadius: "8px", fontSize: "0.9rem", marginBottom: "16px" }}>
                <strong>รายละเอียดเพิ่มเติม:</strong><br/>
                <span style={{ whiteSpace: "pre-wrap", color: "var(--text)" }}>{ticket.description}</span>
              </div>

              {/* Image Attachments */}
              {imageAttachments.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                    <i className="fa-solid fa-image" style={{ marginRight: "6px" }}></i>
                    รูปภาพที่แนบมา ({imageAttachments.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {imageAttachments.map((att, i) => (
                      <a key={i} href={att.file_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={att.file_url}
                          alt={att.file_name}
                          style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "2px solid var(--border)", cursor: "pointer" }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Attachments */}
              {videoAttachments.length > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                    <i className="fa-solid fa-video" style={{ marginRight: "6px" }}></i>
                    วิดีโอที่แนบมา ({videoAttachments.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {videoAttachments.map((att, i) => (
                      <div key={i} style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                        <video controls style={{ width: "100%", maxHeight: "280px" }}>
                          <source src={att.file_url} type={att.file_type} />
                          <a href={att.file_url} target="_blank" rel="noopener noreferrer">{att.file_name}</a>
                        </video>
                        <div style={{ padding: "4px 8px", fontSize: ".75rem", color: "var(--text-muted)" }}>{att.file_name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other attachments */}
              {otherAttachments.length > 0 && (
                <div>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "8px" }}>
                    <i className="fa-solid fa-paperclip" style={{ marginRight: "6px" }}></i>
                    ไฟล์แนบอื่น ๆ ({otherAttachments.length})
                  </div>
                  {otherAttachments.map((att, i) => (
                    <a key={i} href={att.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", background: "var(--bg-secondary)", borderRadius: "6px", marginBottom: "6px", fontSize: ".85rem", textDecoration: "none", color: "var(--text)" }}>
                      <i className="fa-solid fa-file" style={{ color: "var(--primary-light)" }}></i>
                      {att.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons – always shown and always editable */}
          {ticket.status === 'NEW' && (
            <div className="card glass-panel" style={{ borderLeft: "4px solid var(--danger)" }}>
              <div className="card-header">
                <h3 className="card-title">รับเรื่อง (Accept Ticket)</h3>
              </div>
              <div className="card-body">
                <p style={{ marginBottom: "15px" }}>ทิคเก็ตนี้เพิ่งถูกแจ้งเข้ามา กรุณากด "รับเรื่อง" เพื่อเริ่มประเมินปัญหา</p>
                <button className="btn btn-primary" onClick={() => handleAction('TIER1_ACCEPT')} disabled={submitting}>
                  <i className="fa-solid fa-hand-pointer"></i> รับเรื่อง (Accept)
                </button>
              </div>
            </div>
          )}

          {['IN_PROGRESS'].includes(ticket.status) && (
            <div className="card glass-panel" style={{ borderLeft: "4px solid var(--primary)" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="card-title"><i className="fa-solid fa-magnifying-glass"></i> ประเมินและการแก้ไขเบื้องต้น</h3>
                {/* Toggle to switch action mode */}
                <div style={{ display: "flex", gap: "6px" }}>
                  {['assess', 'escalate', 'resolve'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setActionMode(actionMode === mode ? null : mode)}
                      style={{
                        padding: "4px 10px", fontSize: ".75rem", fontWeight: 600, borderRadius: "6px",
                        border: "1px solid",
                        borderColor: actionMode === mode
                          ? mode === 'escalate' ? "var(--warning)" : mode === 'resolve' ? "var(--success)" : "var(--primary)"
                          : "var(--border)",
                        background: actionMode === mode
                          ? mode === 'escalate' ? "var(--warning)" : mode === 'resolve' ? "var(--success)" : "var(--primary)"
                          : "transparent",
                        color: actionMode === mode ? "#fff" : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {mode === 'assess' ? '📝 ประเมิน' : mode === 'escalate' ? '🚀 ส่งต่อ T2' : '✅ ปิดงาน'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card-body">
                {/* Assess Panel – always editable */}
                {(actionMode === 'assess' || actionMode === null) && (
                  <div>
                    <div className="form-group">
                      <label>ผลการประเมินเบื้องต้น (Initial Assessment)</label>
                      <textarea className="form-control" rows="2" value={initialAssessment} onChange={e => setInitialAssessment(e.target.value)}></textarea>
                    </div>
                    <div className="form-group">
                      <label>สาเหตุที่คาดว่าจะเป็น (Preliminary Cause)</label>
                      <textarea className="form-control" rows="2" value={preliminaryCause} onChange={e => setPreliminaryCause(e.target.value)}></textarea>
                    </div>
                    <div className="form-group">
                      <label>สิ่งที่ได้ดำเนินการ (Action Taken)</label>
                      <textarea className="form-control" rows="3" value={tier1Action} onChange={e => setTier1Action(e.target.value)}></textarea>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => handleAction('TIER1_ASSESS')} disabled={submitting}>
                      <i className="fa-solid fa-save"></i> บันทึกผลการประเมิน
                    </button>
                  </div>
                )}

                {/* Escalate Panel */}
                {actionMode === 'escalate' && (
                  <div>
                    <h4 style={{ color: "var(--warning)", marginBottom: "12px" }}>ส่งต่อให้ Tier 2</h4>
                    <div className="form-group">
                      <label>เลือกผู้เชี่ยวชาญ Tier 2 <span className="req">*</span></label>
                      <select
                        className="form-control"
                        value={selectedTier2Id}
                        onChange={e => setSelectedTier2Id(e.target.value)}
                        style={{ marginBottom: "12px" }}
                      >
                        <option value="">-- เลือกผู้รับผิดชอบ Tier 2 --</option>
                        {users.map(u => (
                          <option key={u.user_id} value={u.user_id}>
                            {u.full_name}{u.specialization ? ` — ${u.specialization}` : ``} ({u.role})
                          </option>
                        ))}
                      </select>
                      {/* Show selected user's specialization */}
                      {selectedTier2Id && (() => {
                        const sel = users.find(u => u.user_id === parseInt(selectedTier2Id));
                        return sel?.specialization ? (
                          <div style={{
                            background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)",
                            borderRadius: "6px", padding: "8px 12px", fontSize: ".82rem", color: "var(--warning)", marginBottom: "10px"
                          }}>
                            <i className="fa-solid fa-user-gear" style={{ marginRight: "6px" }}></i>
                            ความรับผิดชอบ: <strong>{sel.specialization}</strong>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="form-group">
                      <label>เหตุผลที่ต้องส่งต่อ <span className="req">*</span></label>
                      <input type="text" className="form-control" placeholder="เช่น จำเป็นต้องเปลี่ยนอะไหล่ หรือแก้ไข Database" value={escalateReason} onChange={e => setEscalateReason(e.target.value)} />
                    </div>
                    <button className="btn btn-warning" onClick={() => handleAction('ESCALATE')} disabled={submitting || !escalateReason || !selectedTier2Id}>
                      <i className="fa-solid fa-arrow-up-right-dots"></i> โอนงานให้ Tier 2
                    </button>
                  </div>
                )}

                {/* Resolve Panel */}
                {actionMode === 'resolve' && (
                  <div>
                    <h4 style={{ color: "var(--success)", marginBottom: "12px" }}>ปิดงานด้วย Tier 1</h4>
                    <div className="form-group">
                      <label>สาเหตุที่แท้จริง (Root Cause) <span className="req">*</span></label>
                      <textarea className="form-control" rows="2" placeholder="ระบุสาเหตุที่ตรวจพบ..." value={rootCause} onChange={e => setRootCause(e.target.value)}></textarea>
                    </div>
                    <div className="form-group">
                      <label>วิธีแก้ไขปัญหา (Resolution) <span className="req">*</span></label>
                      <textarea className="form-control" rows="2" placeholder="ระบุวิธีการแก้ไขปัญหา..." value={resolution} onChange={e => setResolution(e.target.value)}></textarea>
                    </div>
                    <button className="btn btn-success" onClick={() => handleAction('RESOLVE')} disabled={submitting || !rootCause || !resolution}>
                      <i className="fa-solid fa-circle-check"></i> แก้ไขเสร็จสิ้นและปิดงาน
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* If ESCALATED – show read-only Tier 1 assessment */}
          {ticket.status === 'ESCALATED' && ticket.initial_assessment && (
            <div className="card glass-panel" style={{ borderLeft: "4px solid var(--warning)" }}>
              <div className="card-header">
                <h3 className="card-title"><i className="fa-solid fa-clipboard-check"></i> บันทึกการประเมินของ Tier 1</h3>
              </div>
              <div className="card-body">
                <div><strong>ผลการประเมิน:</strong><p style={{ color: "var(--text-muted)" }}>{ticket.initial_assessment}</p></div>
                {ticket.preliminary_cause && <div style={{ marginTop: "10px" }}><strong>สาเหตุที่คาดว่าจะเป็น:</strong><p style={{ color: "var(--text-muted)" }}>{ticket.preliminary_cause}</p></div>}
                {ticket.escalate_reason && <div style={{ marginTop: "10px" }}><strong>เหตุผลส่งต่อ:</strong><p style={{ color: "var(--text-muted)" }}>{ticket.escalate_reason}</p></div>}
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
                  <i className="fa-solid fa-phone" style={{ marginRight: "4px" }}></i>{ticket.reporter_phone || "-"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <i className="fa-brands fa-line" style={{ marginRight: "4px", color: "#06c755" }}></i>{ticket.reporter_line_id || "-"}
                </div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ระบบ / Hardware</div>
                <div style={{ fontWeight: 600 }}>{ticket.system?.system_name || ticket.hardware?.hardware_name || "-"}</div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>สถานที่ (Location)</div>
                <div style={{ fontWeight: 600 }}>{ticket.location?.location_name || ticket.location_text || "-"}</div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ความเร่งด่วน (Priority)</div>
                <div style={{ fontWeight: 700, color: priorityColor[ticket.priority] || "var(--text)" }}>
                  {ticket.priority}
                  <span style={{ fontSize: ".72rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "6px" }}>
                    (กำหนดโดย IT)
                  </span>
                </div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ประเภทปัญหา</div>
                <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{ticket.problem_type}</div>
              </div>
              <hr style={{ margin: "5px 0", borderTop: "1px solid var(--border)" }} />
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>ผู้รับผิดชอบ</div>
                <div style={{ fontSize: "0.85rem" }}>
                  <span className="text-muted">Tier 1:</span> <strong>{ticket.tier1?.full_name || "ยังไม่รับ"}</strong>
                </div>
                {ticket.tier2 && (
                  <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                    <span className="text-muted">Tier 2:</span> <strong>{ticket.tier2.full_name}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
