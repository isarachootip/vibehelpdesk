"use client";
import { useState, useEffect } from "react";

export default function MasterLocations() {
  const [items, setItems] = useState([]);
  const [buItems, setBuItems] = useState([]);
  const [filterBuId, setFilterBuId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    location_code: "",
    location_name: "",
    location_type: "store",
    floor: "",
    address: "",
    bu_id: ""
  });

  const fetchData = async () => {
    try {
      const [locRes, buRes] = await Promise.all([
        fetch("/api/master/locations"),
        fetch("/api/master/bu")
      ]);
      const locData = await locRes.json();
      const buData = await buRes.json();
      if (Array.isArray(locData)) setItems(locData);
      if (Array.isArray(buData)) setBuItems(buData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/master/locations/${editItem.location_id}` : "/api/master/locations";
    const method = editItem ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        fetchData();
        setShowForm(false);
        setEditItem(null);
        setForm({ location_code: "", location_name: "", location_type: "store", floor: "", address: "", bu_id: "" });
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      location_code: item.location_code,
      location_name: item.location_name,
      location_type: item.location_type,
      floor: item.floor || "",
      address: item.address || "",
      bu_id: item.bu_id ? String(item.bu_id) : ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("คุณต้องการปิดใช้งาน Location นี้หรือไม่?")) return;
    await fetch(`/api/master/locations/${id}`, { method: "DELETE" });
    fetchData();
  };

  const filteredItems = items.filter(item => {
    if (!filterBuId) return true;
    if (filterBuId === "null") return item.bu_id === null;
    return String(item.bu_id) === filterBuId;
  });

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
          <i className="fa-solid fa-location-dot" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>
          Locations (สถานที่)
        </h2>
        <button 
          className="btn btn-success" 
          onClick={() => { 
            setShowForm(true); 
            setEditItem(null); 
            setForm({ location_code: "", location_name: "", location_type: "store", floor: "", address: "", bu_id: "" }); 
          }}
        >
          <i className="fa-solid fa-plus"></i> เพิ่มสถานที่ใหม่
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
        <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>กรองตาม BU:</label>
        <select 
          className="form-control" 
          style={{ maxWidth: "250px" }}
          value={filterBuId} 
          onChange={(e) => setFilterBuId(e.target.value)}
        >
          <option value="">-- แสดงทั้งหมด --</option>
          <option value="null">-- ส่วนกลาง (ไม่ระบุ BU) --</option>
          {buItems.map(bu => (
            <option key={bu.bu_id} value={bu.bu_id}>{bu.bu_code} - {bu.bu_name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px"
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "700px", margin: 0, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">{editItem ? "แก้ไขสถานที่" : "เพิ่มสถานที่ใหม่"}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setEditItem(null); }} style={{ padding: "4px 8px" }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Location Code <span className="req">*</span></label>
                    <input className="form-control" value={form.location_code} onChange={e => setForm(f => ({ ...f, location_code: e.target.value }))} placeholder="เช่น STR-001" required />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Location Name <span className="req">*</span></label>
                    <input className="form-control" value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} placeholder="ชื่อสถานที่" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Type <span className="req">*</span></label>
                    <select className="form-control" value={form.location_type} onChange={e => setForm(f => ({ ...f, location_type: e.target.value }))} required>
                      <option value="store">Store (สาขา)</option>
                      <option value="hq">HQ (สำนักงานใหญ่)</option>
                      <option value="warehouse">Warehouse (คลัง)</option>
                      <option value="dc">DC (ศูนย์กระจายสินค้า)</option>
                      <option value="other">Other (อื่นๆ)</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Business Unit (BU)</label>
                    <select className="form-control" value={form.bu_id} onChange={e => setForm(f => ({ ...f, bu_id: e.target.value }))}>
                      <option value="">-- ไม่ระบุ (ส่วนกลาง) --</option>
                      {buItems.map(bu => (
                        <option key={bu.bu_id} value={bu.bu_id}>{bu.bu_code} - {bu.bu_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Floor (ชั้น)</label>
                    <input className="form-control" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="เช่น 1, B1" />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Address (ที่อยู่ / รายละเอียด)</label>
                    <input className="form-control" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="รายละเอียดเพิ่มเติม" />
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

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>กำลังโหลดข้อมูล...</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>BU</th>
                    <th>Floor</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.location_id} style={{ opacity: item.is_active ? 1 : 0.5 }}>
                      <td><span className="chip">{item.location_code}</span></td>
                      <td style={{ fontWeight: 600 }}>{item.location_name}</td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          {item.location_type}
                        </span>
                      </td>
                      <td>
                        {item.bu ? <span className="chip" style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}>{item.bu.bu_code}</span> : "-"}
                      </td>
                      <td>{item.floor || "-"}</td>
                      <td>
                        <span className={`badge ${item.is_active ? "badge-success" : "badge-gray"}`}>
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)}>
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          {item.is_active && (
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => handleDelete(item.location_id)}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>ไม่พบข้อมูล Location</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
