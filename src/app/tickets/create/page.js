"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateTicket() {
  const router = useRouter();
  const [masterData, setMasterData] = useState({ bus: [], systems: [], locations: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm] = useState({
    subject: "",
    problem_type: "software",
    system_id: "",
    location_text: "",
    reporter_name: "",
    reporter_email: "",
    reporter_phone: "",
    reporter_line_id: "",
    bu_id: "",
    priority: "Medium",
    description: "",
    symptom: "",
  });

  useEffect(() => {
    fetch("/api/master")
      .then((res) => res.json())
      .then((d) => {
        if (d && !d.error) {
          setMasterData({
            bus: d.bus || [],
            systems: d.systems || [],
            locations: d.locations || [],
            users: d.users || [],
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // If BU changes, do we need to reset? Maybe not for free text.
      // But we can leave it as is or remove it.
      if (name === "bu_id") {
        // We don't necessarily need to clear the free text when BU changes anymore,
        // but it's okay to do so if you want strict enforcement.
      }

      return updated;
    });
  };

  const filteredUsers = masterData.users.filter(u => 
    (u.full_name?.toLowerCase().includes(form.reporter_name.toLowerCase()) ||
    u.email?.toLowerCase().includes(form.reporter_name.toLowerCase())) &&
    (!form.bu_id || u.bu_id === parseInt(form.bu_id) || !u.bu_id)
  );

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    selected.forEach(f => {
      if (f.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreviews(prev => [...prev, { name: f.name, url: ev.target.result }]);
        reader.readAsDataURL(f);
      } else {
        setPreviews(prev => [...prev, { name: f.name, url: null }]);
      }
    });
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const ticket = await res.json();

        // Upload files if any
        if (files.length > 0) {
          const fd = new FormData();
          files.forEach(f => fd.append('files', f));
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
          if (uploadRes.ok) {
            const { files: uploaded } = await uploadRes.json();
            // Save attachments to ticket
            for (const uf of uploaded) {
              await fetch(`/api/tickets/${ticket.ticket_id}/attachments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...uf, uploaded_by: parseInt(form.reporter_id) }),
              });
            }
          }
        }

        router.push(`/tickets/${ticket.ticket_id}`);
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Failed to create ticket"));
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: "300px" }}>
        <div className="loader-wrap">
          <div className="loader-pulse"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const selectedSystem = masterData.systems.find((s) => s.system_id === parseInt(form.system_id));

  return (
    <>
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
        <a href="/tickets" className="btn btn-ghost btn-sm">
          <i className="fa-solid fa-arrow-left"></i>
        </a>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            <i className="fa-solid fa-plus-circle" style={{ marginRight: "8px", color: "var(--success)" }}></i>
            แจ้งปัญหาใหม่ (Create Ticket)
          </h2>
          <p className="text-muted" style={{ fontSize: ".82rem" }}>กรอกรายละเอียดปัญหาที่พบ</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">ข้อมูลผู้แจ้ง</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label>Business Unit (BU) <span className="req">*</span></label>
                <select name="bu_id" className="form-control" value={form.bu_id} onChange={handleChange} required>
                  <option value="">-- เลือก BU --</option>
                  {masterData.bus.map((bu) => (
                    <option key={bu.bu_id} value={bu.bu_id}>{bu.bu_code} — {bu.bu_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>จุดเกิดเหตุ (Location) <span className="req">*</span></label>
                <input type="text" name="location_text" className="form-control" value={form.location_text} onChange={handleChange} placeholder="เช่น สาขา, ชั้น, แผนก" required disabled={!form.bu_id} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ position: "relative" }}>
                <label>ชื่อผู้แจ้ง (Reporter Name) <span className="req">*</span></label>
                <input 
                  type="text" 
                  name="reporter_name" 
                  className="form-control" 
                  value={form.reporter_name} 
                  onChange={(e) => {
                    handleChange(e);
                    setShowUserDropdown(true);
                    setForm(prev => ({ ...prev, reporter_id: "" }));
                  }} 
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                  placeholder="ระบุชื่อผู้แจ้งปัญหา" 
                  required 
                  disabled={!form.bu_id} 
                  autoComplete="off"
                />
                {showUserDropdown && form.reporter_name && filteredUsers.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                    background: "var(--bg)", border: "1px solid var(--border)", 
                    borderRadius: "var(--radius-sm)", maxHeight: "200px", overflowY: "auto",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}>
                    {filteredUsers.map(u => (
                      <div key={u.user_id} 
                        style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                        onMouseDown={() => {
                          setForm(prev => ({
                            ...prev,
                            reporter_id: u.user_id,
                            reporter_name: u.full_name,
                            reporter_email: u.email || "",
                            reporter_phone: u.phone || prev.reporter_phone,
                          }));
                          setShowUserDropdown(false);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg)"}
                      >
                        <div style={{ fontWeight: 600, fontSize: ".9rem" }}>{u.full_name}</div>
                        <div style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>{u.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Email (ถ้ามี)</label>
                <input type="email" name="reporter_email" className="form-control" value={form.reporter_email} onChange={handleChange} placeholder="อีเมลสำหรับติดต่อกลับ" disabled={!form.bu_id} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>เบอร์โทรติดต่อ (Phone) <span className="req">*</span></label>
                <input type="text" name="reporter_phone" className="form-control" value={form.reporter_phone} onChange={handleChange} placeholder="เช่น 081-xxx-xxxx" required disabled={!form.bu_id} />
              </div>
              <div className="form-group">
                <label>Line ID (ถ้ามี)</label>
                <input type="text" name="reporter_line_id" className="form-control" value={form.reporter_line_id} onChange={handleChange} placeholder="Line ID หรือเบอร์ที่ผูกไลน์" disabled={!form.bu_id} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">รายละเอียดปัญหา</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label>หัวข้อ (Subject) <span className="req">*</span></label>
                <input type="text" name="subject" className="form-control" value={form.subject} onChange={handleChange} placeholder="เช่น POS ไม่เปิด, ระบบค้าง" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ maxWidth: "200px" }}>
                <label>ประเภท <span className="req">*</span></label>
                <select name="problem_type" className="form-control" value={form.problem_type} onChange={handleChange} required>
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                </select>
              </div>
              <div className="form-group">
                <label>ระบบที่มีปัญหา (System) <span className="req">*</span></label>
                <select name="system_id" className="form-control" value={form.system_id} onChange={handleChange} required>
                  <option value="">-- เลือกระบบ --</option>
                  {masterData.systems.map((sys) => (
                    <option key={sys.system_id} value={sys.system_id}>
                      {sys.system_code} — {sys.system_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ maxWidth: "200px" }}>
                <label>ความเร่งด่วน <span className="req">*</span></label>
                <select name="priority" className="form-control" value={form.priority} onChange={handleChange} required>
                  <option value="Critical">🔴 Critical</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🔵 Medium</option>
                  <option value="Low">⚪ Low</option>
                </select>
              </div>
            </div>

            {selectedSystem?.owner_user && (
              <div style={{
                background: "rgba(48,209,88,.08)", border: "1px solid rgba(48,209,88,.2)",
                borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: "16px",
                fontSize: ".82rem", color: "var(--success)"
              }}>
                <i className="fa-solid fa-user-shield" style={{ marginRight: "6px" }}></i>
                Owner (Tier 2): <strong>{selectedSystem.owner_user.full_name}</strong> ({selectedSystem.owner_user.email})
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>อาการที่พบ (Symptom) <span className="req">*</span></label>
                <textarea name="symptom" className="form-control" rows="3" value={form.symptom} onChange={handleChange} placeholder="อธิบายอาการที่พบ เช่น หน้าจอขึ้น Error, เครื่องไม่เปิด" required></textarea>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>รายละเอียดเพิ่มเติม (Description) <span className="req">*</span></label>
                <textarea name="description" className="form-control" rows="4" value={form.description} onChange={handleChange} placeholder="อธิบายรายละเอียดเพิ่มเติม ขั้นตอนที่ทำก่อนเกิดปัญหา" required></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-paperclip" style={{marginRight:"8px",color:"var(--primary-light)"}}></i>แนบไฟล์ / รูปภาพ</h3>
          </div>
          <div className="card-body">
            <div style={{
              border:"2px dashed var(--border)", borderRadius:"var(--radius-sm)",
              padding:"24px", textAlign:"center", cursor:"pointer",
              background:"rgba(59,130,246,.04)", transition:"all .2s",
            }}
              onClick={() => document.getElementById('file-input').click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary-light)"; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border)"; handleFiles({ target: { files: e.dataTransfer.files } }); }}
            >
              <i className="fa-solid fa-cloud-arrow-up" style={{fontSize:"2rem",color:"var(--primary-light)",marginBottom:"8px",display:"block"}}></i>
              <p style={{fontSize:".88rem",fontWeight:600}}>คลิกหรือลากไฟล์มาวาง</p>
              <p className="text-muted" style={{fontSize:".78rem"}}>รองรับ: รูปภาพ (JPG, PNG), PDF, Word, Excel (สูงสุด 10MB)</p>
              <input id="file-input" type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFiles} style={{display:"none"}} />
            </div>

            {/* Preview */}
            {previews.length > 0 && (
              <div style={{display:"flex",flexWrap:"wrap",gap:"12px",marginTop:"16px"}}>
                {previews.map((p, i) => (
                  <div key={i} style={{
                    position:"relative", border:"1px solid var(--border)", borderRadius:"8px",
                    overflow:"hidden", width: p.url ? "100px" : "auto", background:"var(--bg-secondary)",
                  }}>
                    {p.url ? (
                      <img src={p.url} alt={p.name} style={{width:"100px",height:"100px",objectFit:"cover"}} />
                    ) : (
                      <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:"8px",fontSize:".82rem"}}>
                        <i className="fa-solid fa-file" style={{color:"var(--primary-light)"}}></i>
                        <span style={{maxWidth:"120px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                      </div>
                    )}
                    <button type="button" onClick={() => removeFile(i)} style={{
                      position:"absolute", top:"2px", right:"2px", background:"rgba(239,68,68,.9)",
                      color:"#fff", border:"none", borderRadius:"50%", width:"20px", height:"20px",
                      fontSize:".65rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                    }}><i className="fa-solid fa-xmark"></i></button>
                  </div>
                ))}
              </div>
            )}
            {files.length > 0 && <p className="text-muted" style={{fontSize:".78rem",marginTop:"8px"}}>{files.length} ไฟล์ เลือกแล้ว</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <a href="/tickets" className="btn btn-ghost">ยกเลิก</a>
          <button type="submit" className="btn btn-success" disabled={submitting}>
            {submitting ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> กำลังส่ง...</>
            ) : (
              <><i className="fa-solid fa-paper-plane"></i> ส่งแจ้งปัญหา</>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
