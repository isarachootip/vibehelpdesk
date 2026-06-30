"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTS = ["IN_USE", "SPARE", "REPAIR", "RETIRED", "LOST"];

const statusStyle = {
  IN_USE:   { label: "กำลังใช้งาน", cls: "badge-success" },
  SPARE:    { label: "สำรอง",       cls: "badge-primary" },
  REPAIR:   { label: "ส่งซ่อม",    cls: "badge-warning" },
  RETIRED:  { label: "เลิกใช้แล้ว", cls: "badge-gray" },
  LOST:     { label: "สูญหาย",     cls: "badge-danger" },
};

export default function AssetDetailPage({ params }) {
  const router = useRouter();
  const [assetId, setAssetId] = useState(null);
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [bus, setBus] = useState([]);

  // Assignment Modal/Form
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({
    user_id: "", user_name: "", location_id: "", note: ""
  });
  const [assigning, setAssigning] = useState(false);

  // Edit Mode
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(p => {
      setAssetId(parseInt(p.id));
    });
  }, [params]);

  const fetchAsset = () => {
    if (!assetId) return;
    fetch(`/api/assets/${assetId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          alert("ไม่พบข้อมูลทรัพย์สิน");
          router.push("/assets");
          return;
        }
        setAsset(d);
        setEditForm(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!assetId) return;
    fetchAsset();
    fetch("/api/master")
      .then(r => r.json())
      .then(m => {
        setUsers((m.users || []).filter(u => u.is_active));
        setLocations(m.locations || []);
        setBus(m.bus || []);
      });
    fetch("/api/assets/types")
      .then(r => r.json())
      .then(t => setTypes(t || []));
  }, [assetId]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/assets/${assetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        asset_type_id: parseInt(editForm.asset_type_id),
        location_id:   editForm.location_id ? parseInt(editForm.location_id) : null,
        bu_id:         editForm.bu_id ? parseInt(editForm.bu_id) : null,
        cost:          editForm.cost ? parseFloat(editForm.cost) : null,
        cpu:           editForm.cpu || null,
        ram_gb:        editForm.ram_gb ? parseInt(editForm.ram_gb) : null,
        storage_gb:    editForm.storage_gb ? parseInt(editForm.storage_gb) : null,
        storage_type:  editForm.storage_type || null,
      })
    });
    if (res.ok) {
      setIsEdit(false);
      fetchAsset();
    } else {
      const err = await res.json();
      alert(err.error || "เกิดข้อผิดพลาด");
    }
    setSaving(false);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssigning(true);
    const res = await fetch(`/api/assets/${assetId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignForm)
    });
    if (res.ok) {
      setShowAssign(false);
      setAssignForm({ user_id: "", user_name: "", location_id: "", note: "" });
      fetchAsset();
    } else {
      alert("เกิดข้อผิดพลาดในการจ่ายอุปกรณ์");
    }
    setAssigning(false);
  };

  const handleReturn = async () => {
    if (!confirm("ต้องการรับคืนอุปกรณ์นี้กลับเข้าคลังสำรอง (SPARE)?")) return;
    const res = await fetch(`/api/assets/${assetId}/assign`, { method: "DELETE" });
    if (res.ok) {
      // Automatically set asset status to SPARE
      await fetch(`/api/assets/${assetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SPARE" })
      });
      fetchAsset();
    } else {
      alert("เกิดข้อผิดพลาดในการคืนอุปกรณ์");
    }
  };

  const handleDelete = async () => {
    if (!confirm("ต้องการลบอุปกรณ์นี้ออกจากระบบถาวร?")) return;
    const res = await fetch(`/api/assets/${assetId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/assets");
    } else {
      alert("เกิดข้อผิดพลาด");
    }
  };

  if (loading || !asset) return <div className="flex-center" style={{ height: "300px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>;

  const currentAssignment = asset.assignments?.find(a => !a.returned_at);
  const ss = statusStyle[asset.status] || { label: asset.status, cls: "badge-gray" };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <a href="/assets" className="btn btn-ghost btn-sm"><i className="fa-solid fa-arrow-left"></i></a>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              <span style={{ color: "var(--primary)", fontFamily: "monospace" }}>{asset.asset_code}</span>
            </h2>
            <p className="text-muted" style={{ fontSize: ".82rem", marginTop: "4px" }}>
              {asset.brand} {asset.model} — {asset.asset_type?.type_name}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-outline btn-sm" onClick={() => setIsEdit(!isEdit)}>
            <i className="fa-solid fa-pen"></i> แก้ไขข้อมูล
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={handleDelete}>
            <i className="fa-solid fa-trash"></i> ลบอุปกรณ์
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", alignItems: "start" }}>

        {/* Left Side: Detail & Assign History */}
        <div>
          {isEdit ? (
            <form onSubmit={handleEditSubmit} className="card" style={{ marginBottom: "20px" }}>
              <div className="card-header"><h3 className="card-title">แก้ไขรายละเอียด Asset</h3></div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="form-group">
                    <label>Asset Code</label>
                    <input className="form-control" value={editForm.asset_code || ""} onChange={e => setEditForm({ ...editForm, asset_code: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>ประเภท</label>
                    <select className="form-control" value={editForm.asset_type_id || ""} onChange={e => setEditForm({ ...editForm, asset_type_id: e.target.value })} required>
                      {types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>ยี่ห้อ</label>
                    <input className="form-control" value={editForm.brand || ""} onChange={e => setEditForm({ ...editForm, brand: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>รุ่น</label>
                    <input className="form-control" value={editForm.model || ""} onChange={e => setEditForm({ ...editForm, model: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>หน่วยประมวลผล (CPU)</label>
                    <input className="form-control" value={editForm.cpu || ""} onChange={e => setEditForm({ ...editForm, cpu: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>หน่วยความจำ (RAM - GB)</label>
                    <input type="number" className="form-control" value={editForm.ram_gb || ""} onChange={e => setEditForm({ ...editForm, ram_gb: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>พื้นที่เก็บข้อมูล (Storage - GB)</label>
                    <input type="number" className="form-control" value={editForm.storage_gb || ""} onChange={e => setEditForm({ ...editForm, storage_gb: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>ประเภทพื้นที่เก็บข้อมูล</label>
                    <select className="form-control" value={editForm.storage_type || "SSD"} onChange={e => setEditForm({ ...editForm, storage_type: e.target.value })}>
                      <option value="SSD">SSD</option>
                      <option value="HDD">HDD</option>
                      <option value="NVMe">M.2 NVMe SSD</option>
                      <option value="eMMC">eMMC</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Spec อื่นๆ เพิ่มเติม</label>
                    <textarea className="form-control" rows={2} value={editForm.spec || ""} onChange={e => setEditForm({ ...editForm, spec: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>ระบบปฏิบัติการ</label>
                    <input className="form-control" value={editForm.os || ""} onChange={e => setEditForm({ ...editForm, os: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>สถานะ</label>
                    <select className="form-control" value={editForm.status || "IN_USE"} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>IP Address</label>
                    <input className="form-control" value={editForm.ip_address || ""} onChange={e => setEditForm({ ...editForm, ip_address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>MAC Address</label>
                    <input className="form-control" value={editForm.mac_address || ""} onChange={e => setEditForm({ ...editForm, mac_address: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <select className="form-control" value={editForm.location_id || ""} onChange={e => setEditForm({ ...editForm, location_id: e.target.value })}>
                      <option value="">-- ไม่ระบุ --</option>
                      {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.location_code} — {l.location_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Business Unit (BU) <span className="req">*</span></label>
                    <select className="form-control" value={editForm.bu_id || ""} onChange={e => setEditForm({ ...editForm, bu_id: e.target.value })} required>
                      <option value="">-- เลือก BU --</option>
                      {bus.map(b => <option key={b.bu_id} value={b.bu_id}>{b.bu_code} — {b.bu_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>วันที่ซื้อ</label>
                    <input type="date" className="form-control" value={editForm.purchase_date ? editForm.purchase_date.slice(0,10) : ""} onChange={e => setEditForm({ ...editForm, purchase_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>วันหมดประกัน</label>
                    <input type="date" className="form-control" value={editForm.warranty_end ? editForm.warranty_end.slice(0,10) : ""} onChange={e => setEditForm({ ...editForm, warranty_end: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>ราคาทุน</label>
                    <input type="number" className="form-control" value={editForm.cost || ""} onChange={e => setEditForm({ ...editForm, cost: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>ผู้จัดจำหน่าย (Vendor)</label>
                    <input className="form-control" value={editForm.vendor || ""} onChange={e => setEditForm({ ...editForm, vendor: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>หมายเหตุ</label>
                    <textarea className="form-control" rows={2} value={editForm.note || ""} onChange={e => setEditForm({ ...editForm, note: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsEdit(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="card" style={{ marginBottom: "20px" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="card-title"><i className="fa-solid fa-circle-info" style={{ marginRight: "8px" }}></i>รายละเอียดทรัพย์สิน</h3>
                <span className={`badge ${ss.cls}`}>{ss.label}</span>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>ยี่ห้อ / รุ่น</div>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{asset.brand || "—"} {asset.model}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Serial Number (S/N)</div>
                    <div style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "1.05rem", color: "var(--primary)" }}>{asset.serial_no || "—"}</div>
                  </div>
                  {/* Hardware Specs Display */}
                  <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", background: "var(--border-light)", padding: "14px", borderRadius: "10px", marginTop: "8px" }}>
                    <div>
                      <div style={{ fontSize: ".7rem", color: "var(--text-muted)", marginBottom: "2px" }}>CPU</div>
                      <div style={{ fontWeight: 700, fontSize: ".85rem" }}>{asset.cpu || "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: ".7rem", color: "var(--text-muted)", marginBottom: "2px" }}>RAM (Memory)</div>
                      <div style={{ fontWeight: 700, fontSize: ".85rem" }}>{asset.ram_gb ? `${asset.ram_gb} GB` : "—"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: ".7rem", color: "var(--text-muted)", marginBottom: "2px" }}>Storage (Disk)</div>
                      <div style={{ fontWeight: 700, fontSize: ".85rem" }}>{asset.storage_gb ? `${asset.storage_gb} GB (${asset.storage_type || 'SSD'})` : "—"}</div>
                    </div>
                  </div>

                  {asset.spec && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>รายละเอียดคุณสมบัติเพิ่มเติม (Other Spec)</div>
                      <div style={{ background: "var(--border-light)", padding: "12px", borderRadius: "8px", fontSize: ".82rem", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                        {asset.spec}
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>ระบบปฏิบัติการ (OS)</div>
                    <div style={{ fontWeight: 600 }}>{asset.os || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>สถานที่ตั้งหลัก</div>
                    <div style={{ fontWeight: 600 }}>
                      <i className="fa-solid fa-location-dot" style={{ color: "var(--danger)", marginRight: "6px" }}></i>
                      {asset.location ? `${asset.location.location_code} — ${asset.location.location_name}` : "ไม่ระบุตำแหน่ง"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>IP Address</div>
                    <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{asset.ip_address || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>MAC Address</div>
                    <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{asset.mac_address || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Business Unit (BU)</div>
                    <div style={{ fontWeight: 600 }}>{asset.bu ? `[${asset.bu.bu_code}] ${asset.bu.bu_name}` : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>ราคาทุนจัดซื้อ</div>
                    <div style={{ fontWeight: 600 }}>{asset.cost ? `${parseFloat(asset.cost).toLocaleString()} บาท` : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>วันที่ซื้อคลัง</div>
                    <div style={{ fontWeight: 600 }}>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString("th-TH") : "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>สิ้นสุดระยะประกัน</div>
                    <div style={{ fontWeight: 600 }}>{asset.warranty_end ? new Date(asset.warranty_end).toLocaleDateString("th-TH") : "—"}</div>
                  </div>
                  {asset.note && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: "4px" }}>หมายเหตุ</div>
                      <div style={{ fontSize: ".82rem", color: "var(--text-secondary)" }}>{asset.note}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Assignment History */}
          <div className="card">
            <div className="card-header"><h3 className="card-title"><i className="fa-solid fa-history" style={{ marginRight: "8px" }}></i>ประวัติการถือครองและการใช้งาน</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {!asset.assignments || asset.assignments.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)" }}>ยังไม่มีประวัติการส่งมอบหรือใช้งาน</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ผู้ใช้งาน</th>
                      <th>วันที่เริ่ม</th>
                      <th>วันที่คืน</th>
                      <th>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asset.assignments.map(h => (
                      <tr key={h.assignment_id}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{h.user_name || "—"}</span>
                        </td>
                        <td style={{ fontSize: ".78rem" }}>{new Date(h.assigned_at).toLocaleString("th-TH")}</td>
                        <td style={{ fontSize: ".78rem" }}>
                          {h.returned_at ? (
                            <span style={{ color: "var(--text-muted)" }}>{new Date(h.returned_at).toLocaleString("th-TH")}</span>
                          ) : (
                            <span style={{ color: "var(--success)", fontWeight: 700 }}>กำลังใช้งานอยู่</span>
                          )}
                        </td>
                        <td style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>{h.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Current Assignment & Assign Controls */}
        <div>
          <div className="card" style={{ marginBottom: "20px" }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-user-tag" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>
                ผู้ถือครองปัจจุบัน
              </h3>
            </div>
            <div className="card-body">
              {currentAssignment ? (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <i className="fa-solid fa-user" style={{ fontSize: "1.8rem", color: "var(--primary)" }}></i>
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "6px" }}>{currentAssignment.user_name}</h4>
                  <p className="text-muted" style={{ fontSize: ".72rem", marginBottom: "14px" }}>
                    จ่ายออกเมื่อ: {new Date(currentAssignment.assigned_at).toLocaleDateString("th-TH")}
                  </p>
                  {currentAssignment.note && (
                    <p style={{ fontSize: ".78rem", background: "var(--border-light)", padding: "8px", borderRadius: "6px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                      "{currentAssignment.note}"
                    </p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button className="btn btn-outline btn-sm" onClick={handleReturn} style={{ color: "var(--warning)", borderColor: "var(--warning)" }}>
                      <i className="fa-solid fa-arrow-rotate-left"></i> รับคืนอุปกรณ์
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAssign(true)}>
                      <i className="fa-solid fa-exchange-alt"></i> โอนย้าย / เปลี่ยนมือ
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <i className="fa-solid fa-warehouse fa-2x" style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: "12px" }}></i>
                  <p className="text-muted" style={{ fontSize: ".82rem", marginBottom: "16px" }}>อุปกรณ์นี้ยังคงเป็น "SPARE" ว่างอยู่</p>
                  <button className="btn btn-primary btn-sm" style={{ width: "100%" }} onClick={() => setShowAssign(true)}>
                    <i className="fa-solid fa-user-plus"></i> จ่ายงาน (Assign)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "480px", margin: 0 }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="card-title">จ่ายงาน / มอบหมายสิทธิ์ดูแลอุปกรณ์</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAssign(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleAssign}>
                <div className="form-group">
                  <label>เลือกพนักงานจากระบบ</label>
                  <select className="form-control" value={assignForm.user_id} onChange={e => {
                    const uid = e.target.value;
                    const u = users.find(x => x.user_id == uid);
                    setAssignForm({
                      ...assignForm,
                      user_id: uid,
                      user_name: u ? u.full_name : ""
                    });
                  }}>
                    <option value="">-- ไม่ระบุ / หรือกรอกชื่อด้านล่าง --</option>
                    {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>หรือพิมพ์ชื่อผู้ถือครองเอง</label>
                  <input className="form-control" placeholder="ชื่อพนักงาน" value={assignForm.user_name} onChange={e => setAssignForm({ ...assignForm, user_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>ย้ายตำแหน่งที่ตั้งไปที่</label>
                  <select className="form-control" value={assignForm.location_id} onChange={e => setAssignForm({ ...assignForm, location_id: e.target.value })}>
                    <option value="">-- คงตำแหน่งเดิม --</option>
                    {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.location_code} — {l.location_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>บันทึกการส่งมอบ</label>
                  <input className="form-control" placeholder="เช่น มอบโน้ตบุ๊กประจำตัว, ยืมใช้จัดกิจกรรม..." value={assignForm.note} onChange={e => setAssignForm({ ...assignForm, note: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAssign(false)}>ยกเลิก</button>
                  <button type="submit" className="btn btn-primary" disabled={assigning}>
                    {assigning ? "กำลังจ่าย..." : "ยืนยันการจ่าย"}
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
