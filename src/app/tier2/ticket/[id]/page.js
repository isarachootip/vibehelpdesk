"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Tier2TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // For resolution form
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  
  // This is a placeholder UI for now. We will fetch proper API later.
  
  useEffect(() => {
    // Mock fetch for now, since we haven't built the single ticket GET API yet
    setTimeout(() => {
      setTicket({
        ticket_id: id,
        ticket_no: `INC-202605-${id.padStart(4, '0')}`,
        subject: "ตัวอย่าง: ระบบ POS สาขาบางนา ค้างบ่อย",
        priority: "High",
        status: "ESCALATED",
        system: { system_name: "POS System" },
        location: { location_name: "สาขาบางนา" },
        reporter: { full_name: "สมชาย พนักงานขาย" },
        description: "ระบบค้างตอนปริ้นใบเสร็จ ลองรีสตาร์ทเครื่องแล้วไม่หาย",
        tier1_action: "ตรวจสอบเบื้องต้นแล้วเป็นที่ไดรเวอร์ปริ้นเตอร์ หรืออาจจะ Windows Update มีปัญหา ส่งต่อให้ Tier 2 ช่วยรีโมทไปดูหน่อย",
        created_at: new Date().toISOString()
      });
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>กำลังโหลดข้อมูล Ticket...</div>;
  if (!ticket) return <div style={{ padding: "40px", textAlign: "center", color: "red" }}>ไม่พบข้อมูล Ticket</div>;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/tier2" className="btn btn-ghost btn-sm">
            <i className="fa-solid fa-arrow-left"></i> กลับ
          </Link>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            {ticket.ticket_no}
          </h2>
          <span className="badge badge-warning">{ticket.status}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Left Column - Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card glass-panel">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-circle-info"></i> รายละเอียดปัญหา (Ticket Details)</h3>
            </div>
            <div className="card-body">
              <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "10px" }}>{ticket.subject}</h4>
              <p style={{ whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{ticket.description}</p>
            </div>
          </div>

          <div className="card glass-panel" style={{ borderLeft: "4px solid var(--warning)" }}>
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-headset"></i> บันทึกจาก Tier 1 (Initial Assessment)</h3>
            </div>
            <div className="card-body">
              <p style={{ whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{ticket.tier1_action}</p>
            </div>
          </div>

          <div className="card glass-panel" style={{ borderLeft: "4px solid var(--primary)" }}>
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-wrench"></i> บันทึกการแก้ไขปัญหา (Resolution - Tier 2)</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>สาเหตุของปัญหา (Root Cause)</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="ระบุสาเหตุที่แท้จริง..."
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                ></textarea>
              </div>
              <div className="form-group">
                <label>วิธีแก้ไข (Resolution Details)</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  placeholder="ระบุวิธีแก้ไขที่คุณได้ทำไป..."
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                ></textarea>
              </div>
              <button className="btn btn-primary">
                <i className="fa-solid fa-check"></i> บันทึกและเปลี่ยนสถานะเป็น RESOLVED
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Meta */}
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
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>ความสำคัญ (Priority)</div>
                <div style={{ fontWeight: 600, color: "var(--danger)" }}>{ticket.priority}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>วันที่แจ้ง</div>
                <div style={{ fontWeight: 600 }}>{new Date(ticket.created_at).toLocaleString('th-TH')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
