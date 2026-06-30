"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTS = ["IN_USE", "SPARE", "REPAIR", "RETIRED", "LOST"];

export default function AssetCreatePage() {
  const router = useRouter();
  const [types, setTypes]     = useState([]);
  const [locations, setLocations] = useState([]);
  const [bus, setBus]         = useState([]);
  const [users, setUsers]     = useState([]);
  const [saving, setSaving]   = useState(false);

  const [form, setForm] = useState({
    asset_code: "", asset_type_id: "", brand: "", model: "",
    serial_no: "", spec: "", os: "", mac_address: "", ip_address: "",
    purchase_date: "", warranty_end: "", cost: "", vendor: "", po_number: "",
    location_id: "", bu_id: "", status: "IN_USE", note: "",
    cpu: "", ram_gb: "", storage_gb: "", storage_type: "SSD",
    // Assignment
    assign_user_id: "", assign_user_name: "", assign_note: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/assets/types").then(r => r.json()),
      fetch("/api/master").then(r => r.json()),
    ]).then(([t, m]) => {
      setTypes(Array.isArray(t) ? t : []);
      setLocations(m.locations || []);
      setBus(m.bus || []);
      setUsers((m.users || []).filter(u => u.is_active));
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_code || !form.asset_type_id) {
      alert("กรุณาระบุ Asset Code และประเภท Asset");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        asset_code:     form.asset_code.trim().toUpperCase(),
        asset_type_id:  parseInt(form.asset_type_id),
        brand:          form.brand || null,
        model:          form.model || null,
        serial_no:      form.serial_no || null,
        spec:           form.spec || null,
        os:             form.os || null,
        mac_address:    form.mac_address || null,
        ip_address:     form.ip_address || null,
        purchase_date:  form.purchase_date || null,
        warranty_end:   form.warranty_end || null,
        cost:           form.cost ? parseFloat(form.cost) : null,
        vendor:         form.vendor || null,
        po_number:      form.po_number || null,
        location_id:    form.location_id ? parseInt(form.location_id) : null,
        bu_id:          form.bu_id ? parseInt(form.bu_id) : null,
        status:         form.status,
        note:           form.note || null,
        cpu:            form.cpu || null,
        ram_gb:         form.ram_gb ? parseInt(form.ram_gb) : null,
        storage_gb:     form.storage_gb ? parseInt(form.storage_gb) : null,
        storage_type:   form.storage_type || null,
        // Assignment
        assign_user_id:   form.assign_user_id ? parseInt(form.assign_user_id) : null,
        assign_user_name: form.assign_user_name || null,
        assign_note:      form.assign_note || null,
      };
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/assets/${data.asset_id}`);
      } else {
        const err = await res.json();
        alert(err.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const InputRow = ({ children }) => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>{children}</div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            <i className="fa-solid fa-plus-circle" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
            เพิ่ม Asset ใหม่
          </h2>
        </div>
        <a href="/assets" className="btn btn-ghost btn-sm"><i className="fa-solid fa-arrow-left"></i> กลับ</a>
      </div>

      {/* ── Section 1: ข้อมูลหลัก ── */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-header">
          <h3 className="card-title"><i className="fa-solid fa-box" style={{ marginRight: "8px" }}></i>ข้อมูล Asset</h3>
        </div>
        <div className="card-body">
          <InputRow>
            <div className="form-group">
              <label>Asset Code <span className="req">*</span></label>
              <input className="form-control" placeholder="เช่น PC-0001, NB-0045" value={form.asset_code}
                onChange={e => set("asset_code", e.target.value.toUpperCase())} required />
              <p className="text-muted" style={{ fontSize: ".72rem", marginTop: "4px" }}>รหัสเฉพาะของ Asset นี้</p>
            </div>
            <div className="form-group">
              <label>ประเภท Asset <span className="req">*</span></label>
              <select className="form-control" value={form.asset_type_id} onChange={e => set("asset_type_id", e.target.value)} required>
                <option value="">-- เลือกประเภท --</option>
                {types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
              </select>
            </div>
          </InputRow>
          <InputRow>
            <div className="form-group">
              <label>ยี่ห้อ (Brand)</label>
              <input className="form-control" placeholder="เช่น Dell, HP, Lenovo" value={form.brand} onChange={e => set("brand", e.target.value)} />
            </div>
            <div className="form-group">
              <label>รุ่น (Model)</label>
              <input className="form-control" placeholder="เช่น Latitude 5520, EliteBook 840" value={form.model} onChange={e => set("model", e.target.value)} />
            </div>
          </InputRow>
          <div className="form-group">
            <label>
              <i className="fa-solid fa-barcode" style={{ marginRight: "6px", color: "var(--primary)" }}></i>
              Serial Number <span className="req" style={{ color: "#f59e0b" }}>★</span>
            </label>
            <input className="form-control" placeholder="S/N จากฉลากเครื่อง (ต้องไม่ซ้ำกัน)" value={form.serial_no} onChange={e => set("serial_no", e.target.value)} />
            <p className="text-muted" style={{ fontSize: ".72rem", marginTop: "4px" }}>ใช้สแกน Barcode หรือพิมพ์จากฉลากด้านล่างเครื่อง</p>
          </div>
          <div className="form-group">
            <label>หน่วยประมวลผล (CPU)</label>
            <input className="form-control" placeholder="เช่น Intel Core i5-1135G7, Apple M2" value={form.cpu} onChange={e => set("cpu", e.target.value)} />
          </div>
          <InputRow>
            <div className="form-group">
              <label>หน่วยความจำ (RAM - GB)</label>
              <input type="number" className="form-control" placeholder="เช่น 8, 16, 32" value={form.ram_gb} onChange={e => set("ram_gb", e.target.value)} />
            </div>
            <div className="form-group">
              <label>พื้นที่เก็บข้อมูล (Storage - GB)</label>
              <input type="number" className="form-control" placeholder="เช่น 256, 512, 1024" value={form.storage_gb} onChange={e => set("storage_gb", e.target.value)} />
            </div>
          </InputRow>
          <div className="form-group">
            <label>ประเภทพื้นที่เก็บข้อมูล (Storage Type)</label>
            <select className="form-control" value={form.storage_type} onChange={e => set("storage_type", e.target.value)}>
              <option value="SSD">SSD (Solid State Drive)</option>
              <option value="HDD">HDD (Hard Disk Drive)</option>
              <option value="NVMe">M.2 NVMe SSD</option>
              <option value="eMMC">eMMC</option>
            </select>
          </div>
          <div className="form-group">
            <label>Spec อื่นๆ เพิ่มเติม (เช่น การ์ดจอ / หน้าจอ)</label>
            <textarea className="form-control" rows={2} placeholder="เช่น Intel Iris Xe Graphics, Display 15.6 FHD" value={form.spec} onChange={e => set("spec", e.target.value)} />
          </div>
          <InputRow>
            <div className="form-group">
              <label>ระบบปฏิบัติการ (OS)</label>
              <input className="form-control" placeholder="เช่น Windows 11 Pro, macOS 14" value={form.os} onChange={e => set("os", e.target.value)} />
            </div>
            <div className="form-group">
              <label>สถานะ</label>
              <select className="form-control" value={form.status} onChange={e => set("status", e.target.value)}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </InputRow>
          <InputRow>
            <div className="form-group">
              <label>MAC Address</label>
              <input className="form-control" placeholder="เช่น AA:BB:CC:DD:EE:FF" value={form.mac_address} onChange={e => set("mac_address", e.target.value)} />
            </div>
            <div className="form-group">
              <label>IP Address</label>
              <input className="form-control" placeholder="เช่น 192.168.1.100" value={form.ip_address} onChange={e => set("ip_address", e.target.value)} />
            </div>
          </InputRow>
        </div>
      </div>

      {/* ── Section 2: Location & BU ── */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-header">
          <h3 className="card-title"><i className="fa-solid fa-map-marker-alt" style={{ marginRight: "8px", color: "#f59e0b" }}></i>ตำแหน่งที่ตั้ง</h3>
        </div>
        <div className="card-body">
          <InputRow>
            <div className="form-group">
              <label>Location <span className="req">*</span></label>
              <select className="form-control" value={form.location_id} onChange={e => set("location_id", e.target.value)}>
                <option value="">-- เลือก Location --</option>
                {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.location_code} — {l.location_name}</option>)}
              </select>
              <p className="text-muted" style={{ fontSize: ".72rem", marginTop: "4px" }}>ห้อง / ชั้น / สาขาที่ Asset ตั้งอยู่</p>
            </div>
            <div className="form-group">
              <label>Business Unit (BU) <span className="req">*</span></label>
              <select className="form-control" value={form.bu_id} onChange={e => set("bu_id", e.target.value)} required>
                <option value="">-- เลือก BU --</option>
                {bus.map(b => <option key={b.bu_id} value={b.bu_id}>{b.bu_code} — {b.bu_name}</option>)}
              </select>
            </div>
          </InputRow>
        </div>
      </div>

      {/* ── Section 3: การจัดซื้อ ── */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-header">
          <h3 className="card-title"><i className="fa-solid fa-receipt" style={{ marginRight: "8px", color: "var(--success)" }}></i>ข้อมูลการจัดซื้อ & ประกัน</h3>
        </div>
        <div className="card-body">
          <InputRow>
            <div className="form-group">
              <label>วันที่ซื้อ</label>
              <input type="date" className="form-control" value={form.purchase_date} onChange={e => set("purchase_date", e.target.value)} />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-shield-halved" style={{ marginRight: "5px", color: "#f59e0b" }}></i>วันหมดประกัน ⚠️</label>
              <input type="date" className="form-control" value={form.warranty_end} onChange={e => set("warranty_end", e.target.value)} />
            </div>
          </InputRow>
          <InputRow>
            <div className="form-group">
              <label>ราคาต้นทุน (บาท)</label>
              <input type="number" className="form-control" placeholder="0.00" value={form.cost} onChange={e => set("cost", e.target.value)} />
            </div>
            <div className="form-group">
              <label>ผู้จำหน่าย (Vendor)</label>
              <input className="form-control" placeholder="เช่น Dell Thailand, IT Store" value={form.vendor} onChange={e => set("vendor", e.target.value)} />
            </div>
          </InputRow>
          <div className="form-group">
            <label>เลขที่ PO</label>
            <input className="form-control" placeholder="Purchase Order Number" value={form.po_number} onChange={e => set("po_number", e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Section 4: ผู้ถือครอง ── */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-header">
          <h3 className="card-title"><i className="fa-solid fa-user-check" style={{ marginRight: "8px", color: "var(--primary-light)" }}></i>ผู้ถือครอง (Assignment)</h3>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ fontSize: ".82rem", marginBottom: "14px" }}>ระบุว่า Asset นี้อยู่ในความดูแลของใคร (ไม่จำเป็นต้องระบุ)</p>
          <InputRow>
            <div className="form-group">
              <label>เลือกจากผู้ใช้ในระบบ</label>
              <select className="form-control" value={form.assign_user_id}
                onChange={e => {
                  const uid = e.target.value;
                  const u = users.find(u => u.user_id == uid);
                  set("assign_user_id", uid);
                  if (u) set("assign_user_name", u.full_name);
                }}>
                <option value="">-- ไม่ระบุ / เลือกจากระบบ --</option>
                {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>หรือกรอกชื่อเอง</label>
              <input className="form-control" placeholder="ชื่อผู้ถือครอง (กรณีไม่มีในระบบ)" value={form.assign_user_name} onChange={e => set("assign_user_name", e.target.value)} />
            </div>
          </InputRow>
          <div className="form-group">
            <label>หมายเหตุการมอบหมาย</label>
            <input className="form-control" placeholder="เช่น มอบให้ใช้งานประจำ, ยืมชั่วคราว..." value={form.assign_note} onChange={e => set("assign_note", e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Section 5: หมายเหตุ ── */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>หมายเหตุเพิ่มเติม</label>
            <textarea className="form-control" rows={3} placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับ Asset นี้..." value={form.note} onChange={e => set("note", e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <a href="/assets" className="btn btn-ghost">ยกเลิก</a>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...</> : <><i className="fa-solid fa-save"></i> บันทึก Asset</>}
        </button>
      </div>
    </form>
  );
}
