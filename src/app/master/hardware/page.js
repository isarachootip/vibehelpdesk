"use client";
import { useState, useEffect } from "react";

export default function MasterHardware() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ hardware_code: "", hardware_name: "", brand: "", model: "", description: "" });

  const [selectedHardware, setSelectedHardware] = useState(null); // For symptoms
  const [symptomForm, setSymptomForm] = useState({ symptom_code: "", symptom_name: "", description: "" });
  const [editSymptom, setEditSymptom] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/master/hardware");
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
      
      // Update selectedHardware if it's currently selected
      if (selectedHardware) {
        const updated = data.find(h => h.hardware_id === selectedHardware.hardware_id);
        if (updated) setSelectedHardware(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/master/hardware/${editItem.hardware_id}` : "/api/master/hardware";
    const method = editItem ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { 
      fetchData(); setShowForm(false); setEditItem(null); 
      setForm({ hardware_code: "", hardware_name: "", brand: "", model: "", description: "" }); 
    }
    else { const err = await res.json(); alert(err.error || "Error"); }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({ 
      hardware_code: item.hardware_code, 
      hardware_name: item.hardware_name, 
      brand: item.brand || "", 
      model: item.model || "", 
      description: item.description || "" 
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("ปิดใช้งาน Hardware นี้?")) return;
    await fetch(`/api/master/hardware/${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleSymptomSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHardware) return;
    
    const url = editSymptom 
      ? `/api/master/hardware/symptoms/${editSymptom.symptom_id}` 
      : `/api/master/hardware/${selectedHardware.hardware_id}/symptoms`;
    const method = editSymptom ? "PUT" : "POST";
    
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(symptomForm) });
    if (res.ok) { 
      fetchData(); 
      setEditSymptom(null); 
      setSymptomForm({ symptom_code: "", symptom_name: "", description: "" }); 
    }
    else { const err = await res.json(); alert(err.error || "Error"); }
  };

  const handleDeleteSymptom = async (id) => {
    if (!confirm("ลบอาการเสียนี้?")) return;
    await fetch(`/api/master/hardware/symptoms/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}><i className="fa-solid fa-microchip" style={{ marginRight: "8px", color: "var(--warning)" }}></i>Hardware / Products</h2>
        <button className="btn btn-success" onClick={() => { setShowForm(true); setEditItem(null); setForm({ hardware_code: "", hardware_name: "", brand: "", model: "", description: "" }); setSelectedHardware(null); }}>
          <i className="fa-solid fa-plus"></i> เพิ่ม Hardware ใหม่
        </button>
      </div>

      {showForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "600px", margin: 0, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">{editItem ? "แก้ไข Hardware" : "เพิ่ม Hardware ใหม่"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditItem(null); }} style={{ padding: "4px 8px" }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>รหัส / Code <span className="req">*</span></label>
                    <input className="form-control" value={form.hardware_code} onChange={e => setForm(f => ({ ...f, hardware_code: e.target.value }))} placeholder="เช่น PRN-001" required />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>ชื่ออุปกรณ์ / Product Name <span className="req">*</span></label>
                    <input className="form-control" value={form.hardware_name} onChange={e => setForm(f => ({ ...f, hardware_name: e.target.value }))} placeholder="เช่น เครื่องพิมพ์ใบเสร็จ" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>ยี่ห้อ / Brand</label>
                    <input className="form-control" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="เช่น Epson" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>รุ่น / Model</label>
                    <input className="form-control" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="เช่น TM-T82" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "20px" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditItem(null); }}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary"><i className="fa-solid fa-check"></i> {editItem ? "อัปเดต" : "บันทึก"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <div className="card" style={{ flex: selectedHardware ? 1 : 2, transition: "all 0.3s" }}>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Code</th><th>Product Name</th><th>Brand/Model</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.hardware_id} style={{ opacity: item.is_active ? 1 : 0.5, backgroundColor: selectedHardware?.hardware_id === item.hardware_id ? "var(--bg-lighter)" : "transparent" }}>
                      <td><span className="chip">{item.hardware_code}</span></td>
                      <td style={{ fontWeight: 600 }}>{item.hardware_name}</td>
                      <td className="text-muted" style={{ fontSize: ".82rem" }}>{item.brand} {item.model}</td>
                      <td><span className={`badge ${item.is_active ? "badge-success" : "badge-gray"}`}>{item.is_active ? "Active" : "Inactive"}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedHardware(item); setShowForm(false); }} title="จัดการอาการเสีย">
                            <i className="fa-solid fa-list-ul"></i> อาการเสีย ({item.symptoms?.length || 0})
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}><i className="fa-solid fa-pen"></i></button>
                          {item.is_active && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(item.hardware_id)}><i className="fa-solid fa-trash"></i></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>ไม่มีข้อมูล Hardware</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selectedHardware && (
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">อาการเสีย: {selectedHardware.hardware_name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedHardware(null)}><i className="fa-solid fa-times"></i></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSymptomSubmit} style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-lighter)", borderRadius: "6px" }}>
                <h4 style={{ fontSize: "0.9rem", marginBottom: "8px" }}>{editSymptom ? "แก้ไขอาการเสีย" : "เพิ่มอาการเสีย"}</h4>
                <div className="form-group">
                  <input className="form-control" value={symptomForm.symptom_code} onChange={e => setSymptomForm(f => ({ ...f, symptom_code: e.target.value }))} placeholder="รหัสอาการ (เช่น S-01)" required style={{ marginBottom: "8px" }} />
                  <input className="form-control" value={symptomForm.symptom_name} onChange={e => setSymptomForm(f => ({ ...f, symptom_name: e.target.value }))} placeholder="ชื่ออาการ (เช่น พิมพ์ไม่ออก)" required style={{ marginBottom: "8px" }} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" className="btn btn-primary btn-sm"><i className="fa-solid fa-check"></i> {editSymptom ? "อัปเดต" : "เพิ่ม"}</button>
                  {editSymptom && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditSymptom(null); setSymptomForm({ symptom_code: "", symptom_name: "", description: "" }); }}>ยกเลิก</button>}
                </div>
              </form>

              <div className="table-wrap">
                <table className="data-table" style={{ fontSize: "0.85rem" }}>
                  <thead><tr><th>รหัส</th><th>อาการ</th><th></th></tr></thead>
                  <tbody>
                    {selectedHardware.symptoms?.map(sym => (
                      <tr key={sym.symptom_id}>
                        <td>{sym.symptom_code}</td>
                        <td>{sym.symptom_name}</td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "2px 6px" }} onClick={() => { setEditSymptom(sym); setSymptomForm({ symptom_code: sym.symptom_code, symptom_name: sym.symptom_name, description: sym.description || "" }); }}>
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: "2px 6px", color: "var(--danger)" }} onClick={() => handleDeleteSymptom(sym.symptom_id)}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!selectedHardware.symptoms || selectedHardware.symptoms.length === 0) && (
                      <tr><td colSpan="3" style={{ textAlign: "center", padding: "10px" }}>ยังไม่มีข้อมูลอาการเสีย</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
