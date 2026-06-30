"use client";
import { useState, useEffect } from "react";

const PRIORITY_OPTS = ["Critical", "High", "Medium", "Low"];
const TYPE_OPTS = ["hardware", "software"];

export default function RecurringMasterPage() {
  const [items, setItems] = useState([]);
  const [bus, setBus] = useState([]);
  const [systems, setSystems] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", subject: "", description: "", priority: "Medium", problem_type: "hardware",
    bu_id: "", system_id: "", hardware_id: "", location_id: "", cron_expression: "0 8 * * 1"
  });

  const fetchData = () => {
    Promise.all([
      fetch("/api/master/recurring").then(r => r.json()),
      fetch("/api/master").then(r => r.json()),
    ]).then(([rec, m]) => {
      setItems(Array.isArray(rec) ? rec : []);
      setBus(m.bus || []);
      setSystems(m.systems || []);
      setHardware(m.hardware || []);
      setLocations(m.locations || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditItem(null);
    setForm({
      title: "", subject: "", description: "", priority: "Medium", problem_type: "hardware",
      bu_id: bus[0]?.bu_id || "", system_id: "", hardware_id: "", location_id: "", cron_expression: "0 8 * * 1"
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title,
      subject: item.subject,
      description: item.description,
      priority: item.priority,
      problem_type: item.problem_type,
      bu_id: item.bu_id,
      system_id: item.system_id || "",
      hardware_id: item.hardware_id || "",
      location_id: item.location_id || "",
      cron_expression: item.cron_expression,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const method = editItem ? "PUT" : "POST";
    const url = editItem ? `/api/master/recurring/${editItem.id}` : "/api/master/recurring";
    
    const payload = {
      ...form,
      bu_id: parseInt(form.bu_id),
      system_id: form.system_id ? parseInt(form.system_id) : null,
      hardware_id: form.hardware_id ? parseInt(form.hardware_id) : null,
      location_id: form.location_id ? parseInt(form.location_id) : null,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      fetchData();
      setShowModal(false);
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
    setSaving(false);
  };

  const handleToggleActive = async (item) => {
    await fetch(`/api/master/recurring/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, is_active: !item.is_active })
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm("ต้องการลบตารางการสร้างตั๋วอัตโนมัตินี้?")) return;
    const res = await fetch(`/api/master/recurring/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const handleTriggerManual = async () => {
    if (!confirm("ต้องการรัน Trigger ประมวลผลสร้างตั๋วที่ถึงกำหนดในรอบนี้ทันที?")) return;
    setLoading(true);
    const res = await fetch("/api/cron/trigger");
    const result = await res.json();
    setLoading(false);
    if (result.success) {
      alert(`รันเสร็จสิ้น! สร้างตั๋วเพิ่มได้ ${result.spawned?.length || 0} รายการ`);
      fetchData();
    } else {
      alert("เกิดข้อผิดพลาดในการรัน");
    }
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
            ระบบตั๋วบำรุงรักษาประจำรอบ (Recurring Tickets)
          </h2>
          <p className="text-muted" style={{ fontSize: ".82rem", marginTop: "4px" }}>
            ตั้งเวลาออกตั๋ว PM/ซ่อมบำรุง ระบบ หรือฮาร์ดแวร์ อัตโนมัติด้วยคำสั่ง Cron Expression
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-outline btn-sm" onClick={handleTriggerManual}>
            <i className="fa-solid fa-play"></i> รัน Trigger ทันที
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            <i className="fa-solid fa-plus"></i> เพิ่มตารางบำรุงรักษา
          </button>
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ height: "200px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px" }}>
              <i className="fa-solid fa-clock-rotate-left fa-3x" style={{ color: "var(--text-muted)", opacity: .2, display: "block", marginBottom: "16px" }}></i>
              <p className="text-muted">ยังไม่มีรายการตั้งเวลาบำรุงรักษา</p>
              <button className="btn btn-primary" style={{ marginTop: "12px" }} onClick={openNew}>สร้างรายการแรก</button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ชื่องานบำรุงรักษา</th>
                    <th>หัวข้อตั๋วที่จะออก</th>
                    <th>BU</th>
                    <th>ความเร่งด่วน</th>
                    <th>ตารางเวลา (Cron)</th>
                    <th>รันล่าสุดเมื่อ</th>
                    <th>สถานะการใช้งาน</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const buCode = bus.find(b => b.bu_id === item.bu_id)?.bu_code || "—";
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong style={{ fontSize: ".88rem" }}>{item.title}</strong>
                          <div style={{ fontSize: ".76rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {item.problem_type === "hardware" ? "🔧 ฮาร์ดแวร์" : "💻 ซอฟต์แวร์/ระบบ"}
                          </div>
                        </td>
                        <td style={{ fontSize: ".82rem" }}>
                          <span style={{ color: "var(--text-secondary)" }}>[PM] {item.subject}</span>
                        </td>
                        <td><span className="chip">{buCode}</span></td>
                        <td><span className={`badge ${item.priority === 'Critical' ? 'badge-danger' : item.priority === 'High' ? 'badge-warning' : item.priority === 'Medium' ? 'badge-primary' : 'badge-gray'}`}>{item.priority}</span></td>
                        <td>
                          <code className="font-mono" style={{ padding: "4px 8px", background: "var(--border-light)", borderRadius: "4px", fontSize: ".78rem" }}>
                            {item.cron_expression}
                          </code>
                        </td>
                        <td style={{ fontSize: ".76rem", color: "var(--text-muted)" }}>
                          {item.last_triggered_at ? new Date(item.last_triggered_at).toLocaleString("th-TH") : "ไม่เคยรัน"}
                        </td>
                        <td>
                          <button className={`btn btn-sm ${item.is_active ? "btn-outline" : "btn-ghost"}`} onClick={() => handleToggleActive(item)} style={{ minWidth: "90px" }}>
                            {item.is_active ? (
                              <span style={{ color: "var(--success)" }}><i className="fa-solid fa-circle-check"></i> เปิดใช้งาน</span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}><i className="fa-solid fa-circle-minus"></i> ปิดใช้งาน</span>
                            )}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(item.id)}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "580px", margin: 0, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">{editItem ? "แก้ไขตารางบำรุงรักษา" : "เพิ่มตารางบำรุงรักษาอัตโนมัติ"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>ชื่องานบำรุงรักษา (เช่น ตรวจ Backup, PM Server) <span className="req">*</span></label>
                  <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>หัวข้อของตั๋วที่จะออก (เช่น ตรวจสอบระบบ Backup Server หลัก) <span className="req">*</span></label>
                  <input className="form-control" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>รายละเอียดงานและเช็กลิสต์ (อธิบายรายละเอียดการตรวจเช็ก) <span className="req">*</span></label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label>Business Unit (BU) <span className="req">*</span></label>
                    <select className="form-control" value={form.bu_id} onChange={e => setForm({ ...form, bu_id: e.target.value })} required>
                      {bus.map(b => <option key={b.bu_id} value={b.bu_id}>{b.bu_code} — {b.bu_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ความเร่งด่วน (Priority)</label>
                    <select className="form-control" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label>ประเภทงาน</label>
                    <select className="form-control" value={form.problem_type} onChange={e => setForm({ ...form, problem_type: e.target.value })}>
                      {TYPE_OPTS.map(t => <option key={t} value={t}>{t === 'hardware' ? '🔧 ฮาร์ดแวร์' : '💻 ซอฟต์แวร์/ระบบ'}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ตารางเวลา (Cron Expression) <span className="req">*</span></label>
                    <input className="form-control font-mono" value={form.cron_expression} onChange={e => setForm({ ...form, cron_expression: e.target.value })} required />
                    <span className="text-muted" style={{ fontSize: ".7rem" }}>เช่น <code>0 8 * * 1</code> (ทุกวันจันทร์ 8.00 น.) หรือ <code>0 0 1 * *</code> (ทุกวันที่ 1 สิ้นเดือน)</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label>ระบบที่มีปัญหา (ถ้ามี)</label>
                    <select className="form-control" value={form.system_id} onChange={e => setForm({ ...form, system_id: e.target.value })}>
                      <option value="">-- ไม่ระบุ --</option>
                      {systems.map(s => <option key={s.system_id} value={s.system_id}>{s.system_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ประเภทอุปกรณ์ (ถ้ามี)</label>
                    <select className="form-control" value={form.hardware_id} onChange={e => setForm({ ...form, hardware_id: e.target.value })}>
                      <option value="">-- ไม่ระบุ --</option>
                      {hardware.map(h => <option key={h.hardware_id} value={h.hardware_id}>{h.hardware_name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>สถานที่ทำงาน (ถ้ามี)</label>
                  <select className="form-control" value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })}>
                    <option value="">-- ไม่ระบุ --</option>
                    {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.location_code} — {l.location_name}</option>)}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
