"use client";
import { useState, useEffect, useRef } from "react";

const STATUS_OPTS = [
  { value: "", label: "ทุกสถานะ" },
  { value: "IN_USE",   label: "IN USE — กำลังใช้งาน" },
  { value: "SPARE",    label: "SPARE — สำรอง" },
  { value: "REPAIR",   label: "REPAIR — ส่งซ่อม" },
  { value: "RETIRED",  label: "RETIRED — เลิกใช้แล้ว" },
  { value: "LOST",     label: "LOST — สูญหาย" },
];

const statusStyle = {
  IN_USE:   { label: "กำลังใช้งาน", cls: "badge-success" },
  SPARE:    { label: "สำรอง",       cls: "badge-primary" },
  REPAIR:   { label: "ส่งซ่อม",    cls: "badge-warning" },
  RETIRED:  { label: "เลิกใช้แล้ว", cls: "badge-gray" },
  LOST:     { label: "สูญหาย",     cls: "badge-danger" },
};

const warrantyStatus = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "หมดประกัน", color: "var(--danger)" };
  if (diff <= 30) return { label: `หมด ${diff} วัน`, color: "#f59e0b" };
  return null;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [types, setTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const fileRef = useRef();

  const fetchAssets = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("type_id", filterType);
    if (filterLocation) params.set("location_id", filterLocation);
    fetch(`/api/assets?${params}`)
      .then(r => r.json())
      .then(d => { setAssets(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/assets/types").then(r => r.json()),
      fetch("/api/master").then(r => r.json()),
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
    ]).then(([t, m, u]) => {
      setTypes(Array.isArray(t) ? t : []);
      setLocations(m.locations || []);
      if (u) setUser(u.user);
    });
    fetchAssets();
  }, []);

  useEffect(() => { fetchAssets(); }, [search, filterStatus, filterType, filterLocation]);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/assets/import", { method: "POST", body: fd });
    const result = await res.json();
    setImportResult(result);
    setImporting(false);
    fetchAssets();
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const header = "asset_code,asset_type_code,brand,model,serial_no,spec,os,location_code,bu_code,status,purchase_date,warranty_end,cost,vendor,po_number,note";
    const sample = "PC-0001,COMPUTER,Dell,Latitude 5520,SN123456,i5/16GB/512SSD,Windows 11,BKK-01,HQ,IN_USE,2023-01-15,2026-01-15,35000,Dell Thailand,PO-2023-001,สำนักงานใหญ่";
    const blob = new Blob([header + "\n" + sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "asset_import_template.csv"; a.click();
  };

  const handleGlpiSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/assets/import/glpi", { method: "POST" });
      const result = await res.json();
      setSyncResult(result);
      fetchAssets();
      // Fetch fresh master types if any new types were created
      fetch("/api/assets/types")
        .then(r => r.json())
        .then(t => setTypes(Array.isArray(t) ? t : []));
    } catch (err) {
      setSyncResult({ error: "เชื่อมต่อเซิร์ฟเวอร์นำเข้าข้อมูลล้มเหลว" });
    }
    setSyncing(false);
  };

  const countByStatus = (s) => assets.filter(a => a.status === s).length;

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
            <i className="fa-solid fa-boxes-stacked" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
            IT Asset Inventory
          </h2>
          <p className="text-muted" style={{ fontSize: ".82rem", marginTop: "4px" }}>
            จัดการอุปกรณ์/ทรัพย์สิน IT ทั้งหมด ({assets.length} รายการ)
          </p>
        </div>
        {user && ["ADMIN", "TIER1", "TIER2", "TIER3"].includes(user.role?.toUpperCase()) && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="btn btn-outline btn-sm" onClick={handleGlpiSync} disabled={syncing}>
              {syncing ? (
                <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "4px" }}></i> ซิงค์จาก GLPI...</>
              ) : (
                <><i className="fa-solid fa-rotate" style={{ marginRight: "4px" }}></i> ซิงค์จาก GLPI</>
              )}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowImport(v => !v)}>
              <i className="fa-solid fa-file-import"></i> Import Excel
            </button>
            <a href="/assets/create" className="btn btn-primary">
              <i className="fa-solid fa-plus"></i> เพิ่ม Asset ใหม่
            </a>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "IN USE", count: countByStatus("IN_USE"), color: "var(--success)", icon: "fa-circle-check" },
          { label: "SPARE",  count: countByStatus("SPARE"),  color: "var(--primary)", icon: "fa-box" },
          { label: "REPAIR", count: countByStatus("REPAIR"), color: "#f59e0b", icon: "fa-screwdriver-wrench" },
          { label: "RETIRED",count: countByStatus("RETIRED"),color: "var(--text-muted)", icon: "fa-ban" },
          { label: "LOST",   count: countByStatus("LOST"),   color: "var(--danger)", icon: "fa-triangle-exclamation" },
        ].map(s => (
          <div key={s.label} className="card" style={{ cursor: "pointer" }} onClick={() => setFilterStatus(filterStatus === s.label ? "" : s.label)}>
            <div className="card-body" style={{ padding: "14px", textAlign: "center" }}>
              <i className={`fa-solid ${s.icon}`} style={{ fontSize: "1.4rem", color: s.color, marginBottom: "6px", display: "block" }}></i>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="card" style={{ marginBottom: "16px", border: "1.5px dashed var(--primary)" }}>
          <div className="card-body">
            <h4 style={{ fontWeight: 700, marginBottom: "12px" }}>
              <i className="fa-solid fa-file-excel" style={{ color: "#16a34a", marginRight: "8px" }}></i>
              Import Asset จาก Excel / CSV
            </h4>
            <p className="text-muted" style={{ fontSize: ".82rem", marginBottom: "14px" }}>
              ไฟล์ต้องมีคอลัมน์ตาม template (CSV หรือ .xlsx) — asset_code จะถูก upsert อัตโนมัติ
            </p>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
                <i className="fa-solid fa-download"></i> ดาวน์โหลด Template CSV
              </button>
              <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
                {importing
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> กำลัง Import...</>
                  : <><i className="fa-solid fa-upload"></i> เลือกไฟล์ Import</>}
                <input type="file" ref={fileRef} accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleImport} disabled={importing} />
              </label>
            </div>
            {importResult && (
              <div style={{ marginTop: "14px" }}>
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: importResult.success > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${importResult.success > 0 ? "var(--success)" : "var(--danger)"}` }}>
                  <strong>นำเข้าสำเร็จ {importResult.success} รายการ</strong>
                  {importResult.errors?.length > 0 && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontWeight: 600, color: "var(--danger)", marginBottom: "4px" }}>ข้อผิดพลาด ({importResult.errors.length} แถว):</div>
                      {importResult.errors.slice(0, 5).map((e, i) => (
                        <div key={i} style={{ fontSize: ".78rem", color: "var(--danger)" }}>แถว {e.row}: {e.message}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GLPI Sync Result */}
      {syncResult && (
        <div className="card" style={{ marginBottom: "16px", border: syncResult.error ? "1px solid var(--danger)" : "1px solid var(--success)", background: syncResult.error ? "rgba(239,68,68,0.05)" : "rgba(16,185,129,0.05)" }}>
          <div className="card-body" style={{ padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontWeight: 700, color: syncResult.error ? "var(--danger)" : "var(--success)", fontSize: ".85rem", margin: 0 }}>
                  {syncResult.error ? (
                    <><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "8px" }}></i> {syncResult.error}</>
                  ) : (
                    <><i className="fa-solid fa-circle-check" style={{ marginRight: "8px" }}></i> ซิงค์ข้อมูลสำเร็จ {syncResult.success} รายการ (จากทั้งหมด {syncResult.total} รายการ ใน GLPI)</>
                  )}
                </h4>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSyncResult(null)} style={{ padding: "4px 8px", fontSize: ".8rem" }}>ปิด</button>
            </div>
            {syncResult.errors && syncResult.errors.length > 0 && (
              <div style={{ marginTop: "10px", maxHeight: "150px", overflowY: "auto", fontSize: ".78rem", borderTop: "1px solid var(--border)", paddingTop: "8px" }}>
                <div style={{ fontWeight: 600, color: "var(--danger)", marginBottom: "4px" }}>มีข้อผิดพลาดบางรายการ ({syncResult.errors.length} รายการ):</div>
                {syncResult.errors.slice(0, 20).map((e, idx) => (
                  <div key={idx} style={{ color: "var(--danger)", marginBottom: "2px" }}>
                    [{e.category}] {e.assetCode ? `Asset: ${e.assetCode}` : `Row: ${e.row}`} — {e.message}
                  </div>
                ))}
                {syncResult.errors.length > 20 && (
                  <div style={{ color: "var(--text-muted)", fontStyle: "italic", marginTop: "4px" }}>... และรายการอื่น ๆ อีก {syncResult.errors.length - 20} รายการ</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="card-body" style={{ padding: "14px 20px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: ".85rem" }}></i>
              <input type="text" className="form-control" placeholder="ค้นหา Asset Code, S/N, ยี่ห้อ, รุ่น..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: "36px" }} />
            </div>
            <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: "160px" }}>
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)} style={{ minWidth: "140px" }}>
              <option value="">ทุกประเภท</option>
              {types.map(t => <option key={t.type_id} value={t.type_id}>{t.type_name}</option>)}
            </select>
            <select className="form-control" value={filterLocation} onChange={e => setFilterLocation(e.target.value)} style={{ minWidth: "150px" }}>
              <option value="">ทุก Location</option>
              {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.location_code} — {l.location_name}</option>)}
            </select>
            {(search || filterStatus || filterType || filterLocation) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(""); setFilterStatus(""); setFilterType(""); setFilterLocation(""); }}>
                <i className="fa-solid fa-xmark"></i> ล้าง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex-center" style={{ height: "200px" }}><div className="loader-wrap"><div className="loader-pulse"></div><p>กำลังโหลด...</p></div></div>
          ) : assets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <i className="fa-solid fa-boxes-stacked fa-3x" style={{ color: "var(--text-muted)", opacity: .2, display: "block", marginBottom: "16px" }}></i>
              <p style={{ color: "var(--text-muted)" }}>ไม่พบ Asset ที่ตรงกัน</p>
              <a href="/assets/create" className="btn btn-primary" style={{ marginTop: "12px" }}>เพิ่ม Asset แรก</a>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset Code</th>
                    <th>ประเภท</th>
                    <th>ยี่ห้อ / รุ่น</th>
                    <th>Serial No.</th>
                    <th>Location</th>
                    <th>ผู้ใช้งาน</th>
                    <th>ประกัน</th>
                    <th>สถานะ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => {
                    const ws = warrantyStatus(a.warranty_end);
                    const assignee = a.assignments?.[0];
                    const ss = statusStyle[a.status] || { label: a.status, cls: "badge-gray" };
                    return (
                      <tr key={a.asset_id}>
                        <td>
                          <span className="font-mono" style={{ fontWeight: 700, color: "var(--primary)", fontSize: ".85rem" }}>{a.asset_code}</span>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: ".8rem" }}>
                            <i className={`fa-solid ${a.asset_type?.icon || "fa-box"}`} style={{ color: "var(--primary-light)" }}></i>
                            {a.asset_type?.type_name || "—"}
                          </span>
                        </td>
                        <td style={{ fontSize: ".83rem" }}>
                          <div style={{ fontWeight: 600 }}>{a.brand || "—"}</div>
                          <div style={{ color: "var(--text-muted)", fontSize: ".76rem" }}>{a.model || ""}</div>
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontSize: ".76rem", color: "var(--text-secondary)" }}>{a.serial_no || "—"}</span>
                        </td>
                        <td style={{ fontSize: ".8rem" }}>
                          {a.location ? (
                            <span className="chip">{a.location.location_code}</span>
                          ) : "—"}
                        </td>
                        <td style={{ fontSize: ".8rem" }}>
                          {assignee
                            ? <span style={{ color: "var(--text-primary)" }}>{assignee.user_name || "—"}</span>
                            : <span style={{ color: "var(--text-muted)" }}>ไม่มีผู้ใช้</span>}
                        </td>
                        <td>
                          {ws
                            ? <span style={{ fontSize: ".72rem", fontWeight: 700, color: ws.color }}><i className="fa-solid fa-shield-halved" style={{ marginRight: "4px" }}></i>{ws.label}</span>
                            : a.warranty_end
                              ? <span style={{ fontSize: ".72rem", color: "var(--text-muted)" }}>{new Date(a.warranty_end).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                              : <span style={{ color: "var(--text-muted)", fontSize: ".72rem" }}>—</span>}
                        </td>
                        <td><span className={`badge ${ss.cls}`}>{ss.label}</span></td>
                        <td>
                          <a href={`/assets/${a.asset_id}`} className="btn btn-outline btn-sm">
                            <i className="fa-solid fa-eye"></i> ดู
                          </a>
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
    </>
  );
}
