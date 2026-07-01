"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Problem category definitions – maps to problem_type and sub-options
const PROBLEM_CATEGORIES = [
  {
    id: "computer",
    label: "คอมพิวเตอร์ / Hardware",
    icon: "fa-desktop",
    color: "#3b82f6",
    problem_type: "hardware",
    useHardware: true, // will use HardwareSymptom from DB
  },
  {
    id: "software",
    label: "ซอฟต์แวร์ / ระบบ",
    icon: "fa-laptop-code",
    color: "#8b5cf6",
    problem_type: "software",
    useSystem: true,
  },
  {
    id: "network",
    label: "เครือข่าย / IP / Internet",
    icon: "fa-network-wired",
    color: "#06b6d4",
    problem_type: "software",
    subOptions: [
      "เชื่อมต่อ Internet ไม่ได้",
      "ความเร็ว Internet ช้า",
      "IP หาย / IP ซ้ำ",
      "VPN เชื่อมต่อไม่ได้",
      "Printer ออก Network ไม่ได้",
      "Wi-Fi ไม่ขึ้น / สัญญาณอ่อน",
      "อื่น ๆ (Network)",
    ],
  },
  {
    id: "printer",
    label: "เครื่องพิมพ์ / Scanner",
    icon: "fa-print",
    color: "#f59e0b",
    problem_type: "hardware",
    subOptions: [
      "พิมพ์ไม่ออก",
      "พิมพ์งานค้าง / Queue ค้าง",
      "หมึกหมด / ตลับหมึกเสีย",
      "กระดาษติด",
      "Scanner ใช้งานไม่ได้",
      "ไม่เห็น Printer ในระบบ",
      "อื่น ๆ (Printer/Scanner)",
    ],
  },
  {
    id: "pos",
    label: "POS / เครื่องคิดเงิน",
    icon: "fa-cash-register",
    color: "#22c55e",
    problem_type: "hardware",
    subOptions: [
      "POS เปิดไม่ติด",
      "POS ค้าง / Hang",
      "ข้อมูล POS ไม่ Sync",
      "ลิ้นชักเก็บเงินไม่เปิด",
      "Barcode Scanner ไม่อ่าน",
      "สแกนไม่ขึ้น / Error",
      "อื่น ๆ (POS)",
    ],
  },
  {
    id: "other",
    label: "อื่น ๆ",
    icon: "fa-ellipsis",
    color: "#6b7280",
    problem_type: "software",
    freeText: true,
  },
];

// BU icon color palette (cycles through if more BUs)
const BU_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#6366f1", "#f97316", "#0ea5e9"];

export default function CreateTicket() {
  return (
    <Suspense fallback={<div className="flex-center" style={{ height: "300px" }}><div className="loader-wrap"><div className="loader-pulse"></div><p>Loading...</p></div></div>}>
      <CreateTicketForm />
    </Suspense>
  );
}

function CreateTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAssetId = searchParams.get("asset_id");
  const [masterData, setMasterData] = useState({ bus: [], systems: [], locations: [], users: [], hardware: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    subject: "",
    problem_type: "software",
    system_id: "",
    hardware_id: "",
    asset_id: "",
    hardware_symptom: "",
    sub_option: "",
    location_text: "",
    reporter_name: "",
    reporter_email: "",
    reporter_phone: "",
    reporter_line_id: "",
    bu_id: "",
    description: "",
    symptom: "",
  });

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [assets, setAssets] = useState([]);
  const [kbArticles, setKbArticles] = useState([]);
  const [activeKb, setActiveKb] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/master").then((res) => res.json()),
      fetch("/api/assets").then((res) => res.ok ? res.json() : []).catch(() => []),
      fetch("/api/kb").then((res) => res.ok ? res.json() : []).catch(() => []),
    ])
      .then(([d, ass, kb]) => {
        if (d && !d.error) {
          setMasterData({
            bus: d.bus || [],
            systems: d.systems || [],
            locations: d.locations || [],
            users: d.users || [],
            hardware: d.hardware || [],
          });
        }
        setAssets(Array.isArray(ass) ? ass : []);
        setKbArticles(Array.isArray(kb) ? kb : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (urlAssetId && assets.length > 0) {
      const assetObj = assets.find(a => a.asset_id === parseInt(urlAssetId));
      if (assetObj) {
        setForm(prev => ({
          ...prev,
          asset_id: urlAssetId,
          bu_id: assetObj.bu_id ? assetObj.bu_id.toString() : prev.bu_id,
          location_text: assetObj.location
            ? `${assetObj.location.location_code} — ${assetObj.location.location_name}${assetObj.location.floor ? ` ชั้น ${assetObj.location.floor}` : ''}`
            : prev.location_text
        }));
        setSelectedCategory(PROBLEM_CATEGORIES.find(c => c.id === "computer"));
        setStep(3);
      }
    }
  }, [urlAssetId, assets]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "reporter_phone") {
      // กรอกได้เฉพาะตัวเลข ไม่เกิน 10 หลัก
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: digits }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
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
        reader.onload = (ev) => setPreviews(prev => [...prev, { name: f.name, url: ev.target.result, type: 'image' }]);
        reader.readAsDataURL(f);
      } else if (f.type.startsWith('video/')) {
        const url = URL.createObjectURL(f);
        setPreviews(prev => [...prev, { name: f.name, url, type: 'video' }]);
      } else {
        setPreviews(prev => [...prev, { name: f.name, url: null, type: 'file' }]);
      }
    });
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSelectBU = (bu) => {
    setForm(prev => ({ ...prev, bu_id: bu.bu_id.toString() }));
    setStep(2);
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setForm(prev => ({
      ...prev,
      problem_type: cat.problem_type,
      hardware_id: "",
      system_id: "",
      hardware_symptom: "",
      sub_option: "",
    }));
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Build symptom from sub_option or free text
    const symptomText = form.sub_option
      ? `[${selectedCategory?.label || ""}] ${form.sub_option}${form.symptom ? "\n" + form.symptom : ""}`
      : form.symptom;

    const payload = {
      ...form,
      symptom: symptomText || form.symptom,
      priority: "Medium", // IT sets priority — always default Medium
    };

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const ticket = await res.json();
        if (files.length > 0) {
          const fd = new FormData();
          files.forEach(f => fd.append('files', f));
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
          if (uploadRes.ok) {
            const { files: uploaded } = await uploadRes.json();
            for (const uf of uploaded) {
              await fetch(`/api/tickets/${ticket.ticket_id}/attachments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...uf, uploaded_by: parseInt(form.reporter_id) || 1 }),
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

  const selectedBU = masterData.bus.find(b => b.bu_id.toString() === form.bu_id);
  const selectedHardware = masterData.hardware.find(h => h.hardware_id === parseInt(form.hardware_id));
  const symptoms = selectedHardware?.symptoms || [];

  // Step indicator
  const steps = [
    { n: 1, label: "เลือก BU" },
    { n: 2, label: "ประเภทปัญหา" },
    { n: 3, label: "รายละเอียด" },
    { n: 4, label: "ผู้ติดต่อ" },
  ];

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
          <p className="text-muted" style={{ fontSize: ".82rem" }}>กรอกรายละเอียดปัญหาที่พบตามขั้นตอน</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", alignItems: "center" }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              onClick={() => step > s.n && setStep(s.n)}
              style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: step >= s.n ? "var(--primary)" : "var(--border)",
                color: step >= s.n ? "#fff" : "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: ".75rem", fontWeight: 700,
                cursor: step > s.n ? "pointer" : "default",
                transition: "all .2s",
              }}
            >
              {step > s.n ? <i className="fa-solid fa-check" style={{ fontSize: ".6rem" }}></i> : s.n}
            </div>
            <span style={{ fontSize: ".78rem", color: step >= s.n ? "var(--text)" : "var(--text-muted)", fontWeight: step === s.n ? 700 : 400 }}>
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div style={{ width: "30px", height: "2px", background: step > s.n ? "var(--primary)" : "var(--border)", margin: "0 4px" }}></div>
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: Select BU */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-building" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>
              เลือก Business Unit (BU) ของคุณ
            </h3>
          </div>
          <div className="card-body">
            {masterData.bus.length === 0 ? (
              <p className="text-muted">ไม่พบข้อมูล BU — กรุณาติดต่อ Admin</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
                {masterData.bus.map((bu, idx) => {
                  const color = BU_COLORS[idx % BU_COLORS.length];
                  return (
                    <div
                      key={bu.bu_id}
                      onClick={() => handleSelectBU(bu)}
                      style={{
                        border: "2px solid",
                        borderColor: form.bu_id === bu.bu_id.toString() ? color : "var(--border)",
                        borderRadius: "12px",
                        padding: "20px 16px",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all .2s",
                        background: form.bu_id === bu.bu_id.toString() ? `${color}18` : "var(--bg-secondary)",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}12`; }}
                      onMouseLeave={e => {
                        if (form.bu_id !== bu.bu_id.toString()) {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.background = "var(--bg-secondary)";
                        }
                      }}
                    >
                      {bu.logo_url ? (
                        <img src={bu.logo_url} alt={bu.bu_code}
                          style={{ width: "64px", height: "64px", objectFit: "contain", marginBottom: "10px", borderRadius: "8px" }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: "64px", height: "64px", borderRadius: "12px",
                          background: color, color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.5rem", fontWeight: 800, margin: "0 auto 10px",
                          letterSpacing: "-1px",
                        }}>
                          {bu.bu_code.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text)" }}>{bu.bu_code}</div>
                      <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: "4px" }}>{bu.bu_name}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Select problem category */}
      {step === 2 && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <h3 className="card-title">
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "8px", color: "var(--warning)" }}></i>
                เลือกประเภทปัญหา — BU: <span style={{ color: "var(--primary)" }}>{selectedBU?.bu_code}</span>
              </h3>
            </div>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
              {PROBLEM_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  style={{
                    border: "2px solid",
                    borderColor: selectedCategory?.id === cat.id ? cat.color : "var(--border)",
                    borderRadius: "12px",
                    padding: "20px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all .2s",
                    background: selectedCategory?.id === cat.id ? `${cat.color}18` : "var(--bg-secondary)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.background = `${cat.color}12`; }}
                  onMouseLeave={e => {
                    if (selectedCategory?.id !== cat.id) {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--bg-secondary)";
                    }
                  }}
                >
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "12px",
                    background: `${cat.color}22`, display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 12px", fontSize: "1.5rem", color: cat.color,
                  }}>
                    <i className={`fa-solid ${cat.icon}`}></i>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{cat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Problem details */}
      {step === 3 && (
        <form onSubmit={e => { e.preventDefault(); setStep(4); }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <h3 className="card-title">
                  <i className={`fa-solid ${selectedCategory?.icon}`} style={{ marginRight: "8px", color: selectedCategory?.color }}></i>
                  {selectedCategory?.label}
                </h3>
              </div>
            </div>
            
            {/* Split layout: Form on Left, FAQs on Right */}
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: "20px", padding: "20px" }}>
              <div>
                {/* Hardware: select device then symptom */}
                {/* 1. IT Asset Selection (Shown for all categories; required for computer/hardware, optional for others) */}
                <div className="form-group">
                  <label>
                    เลือกจากทะเบียนทรัพย์สิน (IT Asset) {selectedCategory?.useHardware && <span className="req">*</span>}
                  </label>
                  <select name="asset_id" className="form-control" value={form.asset_id} onChange={e => {
                    const val = e.target.value;
                    setForm(prev => {
                      const next = { ...prev, asset_id: val };
                      if (val && val !== "other") {
                        const assetObj = assets.find(a => a.asset_id === parseInt(val));
                        if (assetObj) {
                          next.location_text = assetObj.location
                            ? `${assetObj.location.location_code} — ${assetObj.location.location_name}${assetObj.location.floor ? ` ชั้น ${assetObj.location.floor}` : ''}`
                            : "";
                        }
                      }
                      return next;
                    });
                  }} required={selectedCategory?.useHardware}>
                    <option value="">
                      {selectedCategory?.useHardware 
                        ? "-- เลือกทรัพย์สิน/อุปกรณ์ที่มีปัญหา --" 
                        : "-- เลือกอุปกรณ์ที่เกี่ยวข้อง (ถ้ามี/ไม่บังคับ) --"
                      }
                    </option>
                    {assets.filter(ast => ast.bu_id.toString() === form.bu_id).map(ast => (
                      <option key={ast.asset_id} value={ast.asset_id}>
                        [{ast.asset_code}] {ast.brand} {ast.model} {ast.serial_no ? `(S/N: ${ast.serial_no})` : ''} — {ast.location ? ast.location.location_code : 'ไม่ระบุสถานที่'}
                      </option>
                    ))}
                    {selectedCategory?.useHardware && (
                      <option value="other">⚠️ ไม่มีในทะเบียนทรัพย์สิน / อุปกรณ์ส่วนตัว</option>
                    )}
                  </select>
                </div>

                {/* 2. Hardware Category Details */}
                {selectedCategory?.useHardware && (
                  <>
                    {/* Fallback to general hardware selection */}
                    {(form.asset_id === "other" || !form.asset_id) && (
                      <div className="form-group" style={{ borderLeft: "3px solid var(--border)", paddingLeft: "12px" }}>
                        <label>ระบุประเภทอุปกรณ์หลัก <span className="req">*</span></label>
                        <select name="hardware_id" className="form-control" value={form.hardware_id} onChange={e => {
                          handleChange(e);
                          setForm(prev => ({ ...prev, hardware_symptom: "" }));
                        }} required={form.asset_id === "other"}>
                          <option value="">-- เลือกประเภทอุปกรณ์ --</option>
                          {masterData.hardware.map(hw => (
                            <option key={hw.hardware_id} value={hw.hardware_id}>
                              {hw.hardware_code} — {hw.hardware_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(form.asset_id === "other" || !form.asset_id) && symptoms.length > 0 && (
                      <div className="form-group" style={{ borderLeft: "3px solid var(--border)", paddingLeft: "12px" }}>
                        <label>อาการที่พบเบื้องต้น <span className="req">*</span></label>
                        <select name="hardware_symptom" className="form-control" value={form.hardware_symptom} onChange={handleChange} required={form.asset_id === "other"}>
                          <option value="">-- เลือกอาการ --</option>
                          {symptoms.map(s => (
                            <option key={s.symptom_id} value={s.symptom_name}>{s.symptom_name}</option>
                          ))}
                          <option value="อื่น ๆ">อื่น ๆ (ระบุด้านล่าง)</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

              {/* Software: select system */}
              {selectedCategory?.useSystem && (
                <div className="form-group">
                  <label>ระบบที่มีปัญหา <span className="req">*</span></label>
                  <select name="system_id" className="form-control" value={form.system_id} onChange={handleChange} required>
                    <option value="">-- เลือกระบบ --</option>
                    {masterData.systems.map(sys => (
                      <option key={sys.system_id} value={sys.system_id}>
                        {sys.system_code} — {sys.system_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Network/Printer/POS: sub-options */}
              {selectedCategory?.subOptions && (
                <div className="form-group">
                  <label>ลักษณะปัญหา <span className="req">*</span></label>
                  <select name="sub_option" className="form-control" value={form.sub_option} onChange={handleChange} required>
                    <option value="">-- เลือกปัญหา --</option>
                    {selectedCategory.subOptions.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>หัวข้อ (Subject) <span className="req">*</span></label>
                <input type="text" name="subject" className="form-control" value={form.subject} onChange={handleChange}
                  placeholder="เช่น POS ไม่เปิด, จอคอมดับ, Internet ใช้ไม่ได้" required />
              </div>

              <div className="form-group">
                <label>อาการที่พบ / รายละเอียดเพิ่มเติม <span className="req">*</span></label>
                <textarea name="symptom" className="form-control" rows="3" value={form.symptom} onChange={handleChange}
                  placeholder="อธิบายอาการที่พบเพิ่มเติม..." required></textarea>
              </div>

              <div className="form-group">
                <label>รายละเอียดเพิ่มเติม / ขั้นตอนก่อนเกิดปัญหา <span className="req">*</span></label>
                <textarea name="description" className="form-control" rows="3" value={form.description} onChange={handleChange}
                  placeholder="อธิบายสิ่งที่ทำก่อนเกิดปัญหา..." required></textarea>
              </div>

              <div className="form-group">
                <label>จุดเกิดเหตุ (Location) <span className="req">*</span></label>
                <input type="text" name="location_text" className="form-control" value={form.location_text} onChange={handleChange}
                  placeholder="เช่น สาขา, ชั้น, แผนก, โต๊ะที่" required />
              </div>

              {/* File Upload */}
              <div style={{ marginTop: "16px" }}>
                <label style={{ fontSize: ".88rem", fontWeight: 600, marginBottom: "8px", display: "block" }}>
                  <i className="fa-solid fa-paperclip" style={{ marginRight: "6px", color: "var(--primary-light)" }}></i>
                  แนบรูปภาพ / วิดีโอ / ไฟล์ (ถ้ามี)
                </label>
                <div
                  style={{
                    border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)",
                    padding: "20px", textAlign: "center", cursor: "pointer",
                    background: "rgba(59,130,246,.04)", transition: "all .2s",
                  }}
                  onClick={() => document.getElementById('file-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--primary-light)"; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border)"; handleFiles({ target: { files: e.dataTransfer.files } }); }}
                >
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "1.8rem", color: "var(--primary-light)", marginBottom: "6px", display: "block" }}></i>
                  <p style={{ fontSize: ".85rem", fontWeight: 600 }}>คลิกหรือลากไฟล์มาวาง</p>
                  <p className="text-muted" style={{ fontSize: ".75rem" }}>รองรับ: รูปภาพ (JPG, PNG), วิดีโอ (MP4, MOV), PDF, Word, Excel</p>
                  <input id="file-input" type="file" multiple
                    accept="image/*,video/*,.mp4,.mov,.avi,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFiles} style={{ display: "none" }} />
                </div>
                {previews.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
                    {previews.map((p, i) => (
                      <div key={i} style={{
                        position: "relative", border: "1px solid var(--border)", borderRadius: "8px",
                        overflow: "hidden", background: "var(--bg-secondary)",
                      }}>
                        {p.type === 'image' ? (
                          <img src={p.url} alt={p.name} style={{ width: "90px", height: "90px", objectFit: "cover" }} />
                        ) : p.type === 'video' ? (
                          <div style={{ width: "130px", padding: "8px 10px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <i className="fa-solid fa-video" style={{ color: "var(--primary-light)", fontSize: "1.2rem" }}></i>
                            <span style={{ fontSize: ".72rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                          </div>
                        ) : (
                          <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", fontSize: ".8rem" }}>
                            <i className="fa-solid fa-file" style={{ color: "var(--primary-light)" }}></i>
                            <span style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                          </div>
                        )}
                        <button type="button" onClick={() => removeFile(i)} style={{
                          position: "absolute", top: "2px", right: "2px", background: "rgba(239,68,68,.9)",
                          color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px",
                          fontSize: ".6rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

              {/* Right Column: Suggested FAQs */}
              <div style={{ borderLeft: "1px solid var(--border-light)", paddingLeft: "20px" }}>
                <div style={{
                  background: "rgba(59, 130, 246, 0.05)",
                  border: "1.5px solid rgba(59, 130, 246, 0.15)",
                  borderRadius: "10px",
                  padding: "16px"
                }}>
                  <h4 style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--primary-light)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                    <i className="fa-solid fa-lightbulb fa-bounce"></i>
                    บทความช่วยเหลือแนะนำ
                  </h4>
                  
                  {(() => {
                    const catMap = {
                      computer: "Computer",
                      software: "Software",
                      network: "Network",
                      printer: "Printer",
                      pos: "POS"
                    };
                    const targetCategory = catMap[selectedCategory?.id];
                    const matched = kbArticles.filter(a => a.category === targetCategory);

                    if (matched.length === 0) {
                      return (
                        <p style={{ fontSize: ".76rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                          ยังไม่มีบทความในหมวดหมู่นี้ ลองกรอกรายละเอียดและส่งข้อมูลได้เลยครับ
                        </p>
                      );
                    }

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <p style={{ fontSize: ".72rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          แนะนำให้ลองทำตามคู่มือเบื้องต้นนี้ก่อนได้ครับ:
                        </p>
                        {matched.map(art => (
                          <div
                            key={art.id}
                            onClick={() => {
                              fetch(`/api/kb/${art.id}`) // Increment views
                                .then(res => res.json())
                                .then(data => setActiveKb(data));
                            }}
                            style={{
                              padding: "10px 12px",
                              background: "var(--bg-secondary)",
                              borderRadius: "6px",
                              border: "1px solid var(--border-light)",
                              cursor: "pointer",
                              fontSize: ".78rem",
                              fontWeight: 600,
                              color: "var(--text-secondary)",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-light)"; e.currentTarget.style.background = "#fff"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--bg-secondary)"; }}
                          >
                            <i className="fa-regular fa-file-lines" style={{ marginRight: "6px", color: "var(--primary-light)" }}></i>
                            {art.title}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
            <a href="/tickets" className="btn btn-ghost">ยกเลิก</a>
            <button type="submit" className="btn btn-primary">
              ถัดไป — กรอกข้อมูลผู้ติดต่อ <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Contact info + Submit */}
      {step === 4 && (
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(3)}>
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <h3 className="card-title">
                  <i className="fa-solid fa-user" style={{ marginRight: "8px", color: "var(--success)" }}></i>
                  ข้อมูลผู้ติดต่อ
                </h3>
              </div>
            </div>
            <div className="card-body">
              {/* Summary */}
              <div style={{
                background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)",
                borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: ".85rem"
              }}>
                <strong>สรุป:</strong>{" "}
                <span className="chip">{selectedBU?.bu_code}</span>{" "}
                <span className="chip">{selectedCategory?.label}</span>{" "}
                {form.sub_option && <span className="chip">{form.sub_option}</span>}{" "}
                <span style={{ color: "var(--text-muted)" }}>{form.subject}</span>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ position: "relative" }}>
                  <label>ชื่อผู้แจ้ง <span className="req">*</span></label>
                  <input
                    type="text" name="reporter_name" className="form-control"
                    value={form.reporter_name}
                    onChange={(e) => { handleChange(e); setShowUserDropdown(true); setForm(prev => ({ ...prev, reporter_id: "" })); }}
                    onFocus={() => setShowUserDropdown(true)}
                    onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                    placeholder="ระบุชื่อผู้แจ้งปัญหา" required autoComplete="off"
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
                          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                          onMouseLeave={e => e.currentTarget.style.background = "var(--bg)"}
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
                  <input type="email" name="reporter_email" className="form-control" value={form.reporter_email} onChange={handleChange} placeholder="อีเมลสำหรับรับการแจ้งเตือน" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>เบอร์โทรติดต่อ <span className="req">*</span></label>
                  <div style={{ position: "relative" }}>
                    <i className="fa-solid fa-phone" style={{
                      position: "absolute", left: "12px", top: "50%",
                      transform: "translateY(-50%)",
                      color: form.reporter_phone.length >= 9 ? "var(--success)" : form.reporter_phone.length > 0 ? "var(--warning)" : "var(--text-muted)",
                      fontSize: ".85rem", transition: "color 0.2s"
                    }}></i>
                    <input
                      type="tel"
                      name="reporter_phone"
                      className="form-control"
                      value={form.reporter_phone}
                      onChange={handleChange}
                      placeholder="เช่น 0812345678"
                      maxLength={10}
                      pattern="[0-9]{9,10}"
                      inputMode="numeric"
                      required
                      style={{
                        paddingLeft: "36px",
                        borderColor: form.reporter_phone.length > 0 && form.reporter_phone.length < 9
                          ? "var(--warning)" : undefined
                      }}
                    />
                    {/* Character counter */}
                    <span style={{
                      position: "absolute", right: "12px", top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: ".72rem", fontWeight: 600,
                      color: form.reporter_phone.length >= 9 ? "var(--success)" : form.reporter_phone.length > 0 ? "var(--warning)" : "var(--text-muted)"
                    }}>
                      {form.reporter_phone.length}/10
                    </span>
                  </div>
                  {form.reporter_phone.length > 0 && form.reporter_phone.length < 9 && (
                    <p style={{ fontSize: ".75rem", color: "var(--warning)", marginTop: "4px" }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "4px" }}></i>
                      เบอร์โทรต้องมีอย่างน้อย 9 หลัก (กรอกแล้ว {form.reporter_phone.length} หลัก)
                    </p>
                  )}
                  {form.reporter_phone.length === 10 && (
                    <p style={{ fontSize: ".75rem", color: "var(--success)", marginTop: "4px" }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: "4px" }}></i>
                      เบอร์โทรครบถ้วน
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>Line ID (ถ้ามี)</label>
                  <input type="text" name="reporter_line_id" className="form-control" value={form.reporter_line_id} onChange={handleChange} placeholder="Line ID หรือเบอร์ที่ผูกไลน์" />
                </div>
              </div>

              {/* Priority notice */}
              <div style={{
                background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.15)",
                borderRadius: "6px", padding: "10px 14px", fontSize: ".82rem", color: "var(--primary-light)"
              }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: "6px" }}></i>
                Priority จะถูกกำหนดโดย IT หลังรับเรื่อง (Default: Medium)
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
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
      )}

      {/* KB Article Modal Popup */}
      {activeKb && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "600px", margin: 0, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <span className="badge" style={{ background: "rgba(99,102,241,0.1)", color: "var(--primary-light)", fontSize: ".7rem" }}>
                  {activeKb.category}
                </span>
                <h3 className="card-title" style={{ marginTop: "4px", fontSize: ".95rem" }}>{activeKb.title}</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveKb(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="card-body" style={{ overflowY: "auto", flex: 1, padding: "16px", fontSize: ".82rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {activeKb.content}
            </div>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".7rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-light)", padding: "10px 16px" }}>
              <span><i className="fa-solid fa-eye"></i> ยอดผู้ชม {activeKb.views} ครั้ง</span>
              <button className="btn btn-primary btn-sm" onClick={() => setActiveKb(null)}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
