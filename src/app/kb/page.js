"use client";
import { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "all", label: "ทั้งหมด", icon: "fa-border-all", color: "#6b7280" },
  { id: "POS", label: "เครื่องคิดเงิน / POS", icon: "fa-cash-register", color: "#22c55e" },
  { id: "Network", label: "เครือข่าย / Internet / VPN", icon: "fa-network-wired", color: "#06b6d4" },
  { id: "Printer", label: "เครื่องพิมพ์ / Printer", icon: "fa-print", color: "#f59e0b" },
  { id: "Computer", label: "ฮาร์ดแวร์ / เครื่องช้า", icon: "fa-desktop", color: "#3b82f6" },
  { id: "Software", label: "ซอฟต์แวร์ / ระบบงาน", icon: "fa-laptop-code", color: "#8b5cf6" },
];

export default function KnowledgeBaseUserPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticle, setActiveArticle] = useState(null);

  const fetchArticles = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCat !== "all") params.append("category", selectedCat);
    if (searchQuery) params.append("search", searchQuery);

    fetch(`/api/kb?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setArticles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCat]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArticles();
  };

  const handleOpenArticle = async (id) => {
    try {
      const res = await fetch(`/api/kb/${id}`);
      const data = await res.json();
      setActiveArticle(data);
      // Update locally to increment view count
      setArticles(prev => prev.map(a => a.id === id ? { ...a, views: a.views + 1 } : a));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Help Hero Header */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
        borderRadius: "var(--radius-md)",
        padding: "40px 24px",
        color: "#fff",
        textAlign: "center",
        marginBottom: "24px",
        position: "relative",
        boxShadow: "0 4px 15px rgba(59, 130, 246, 0.15)",
        overflow: "hidden"
      }}>
        {/* Subtle background decoration */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: "radial-gradient(circle, #fff 10%, transparent 11%)", backgroundSize: "20px 20px" }}></div>
        
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "8px", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          ศูนย์รวมความรู้ & วิธีแก้ไขปัญหาเบื้องต้น (Knowledge Management)
        </h1>
        <p style={{ opacity: 0.9, fontSize: ".92rem", marginBottom: "20px" }}>
          ค้นหาคู่มือการตั้งค่า หรือวิธีเคลียร์ปัญหาเบื้องต้นได้ทันทีโดยไม่ต้องเปิดตั๋ว
        </p>

        {/* Search bar inside hero */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: "560px", margin: "0 auto", display: "flex", gap: "8px", position: "relative", zIndex: 2 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: ".95rem" }}></i>
            <input
              type="text"
              placeholder="ค้นหาคู่มือ เช่น กระดาษติด, วิธีลง Antivirus, VPN..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 42px",
                borderRadius: "24px",
                border: "none",
                background: "#fff",
                color: "var(--text)",
                boxShadow: "0 4px 6px rgba(0,0,0,0.06)",
                fontSize: ".9rem"
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ borderRadius: "24px", padding: "10px 24px", background: "var(--primary-dark)", borderColor: "var(--primary-dark)" }}>
            ค้นหา
          </button>
        </form>
      </div>

      {/* Category Pills Selector */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "20px", scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            style={{
              padding: "10px 18px",
              borderRadius: "20px",
              border: "1.5px solid",
              borderColor: selectedCat === cat.id ? cat.color : "var(--border)",
              background: selectedCat === cat.id ? `${cat.color}15` : "var(--bg-secondary)",
              color: selectedCat === cat.id ? cat.color : "var(--text-secondary)",
              fontWeight: 700,
              fontSize: ".85rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              transition: "all .2s",
              whiteSpace: "nowrap"
            }}
          >
            <i className={`fa-solid ${cat.icon}`}></i>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Articles Grid list */}
      {loading ? (
        <div className="flex-center" style={{ height: "200px" }}><div className="loader-wrap"><div className="loader-pulse"></div></div></div>
      ) : articles.length === 0 ? (
        <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
          <i className="fa-regular fa-folder-open fa-3x" style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: "16px", display: "block" }}></i>
          <p className="text-muted">ไม่พบข้อมูลคู่มือช่วยเหลือการใช้งานตามเงื่อนไข</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {articles.map(art => {
            const catObj = CATEGORIES.find(c => c.id === art.category) || CATEGORIES[0];
            return (
              <div
                key={art.id}
                onClick={() => handleOpenArticle(art.id)}
                className="card"
                style={{
                  margin: 0,
                  cursor: "pointer",
                  transition: "all .25s",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div className="card-body">
                  <span className="badge" style={{ background: `${catObj.color}15`, color: catObj.color, fontSize: ".72rem", marginBottom: "8px" }}>
                    <i className={`fa-solid ${catObj.icon}`} style={{ marginRight: "4px" }}></i>
                    {catObj.label}
                  </span>
                  <h4 style={{ fontSize: ".92rem", fontWeight: 700, margin: "6px 0", lineHeight: 1.4 }}>{art.title}</h4>
                  <p className="text-muted" style={{
                    fontSize: ".8rem",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    margin: "8px 0"
                  }}>
                    {art.content.replace(/<[^>]+>/g, '').slice(0, 120)}...
                  </p>
                </div>
                <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".72rem", color: "var(--text-muted)" }}>
                  <span><i className="fa-solid fa-eye" style={{ marginRight: "4px" }}></i> {art.views} ครั้ง</span>
                  <span style={{ color: "var(--primary-light)", fontWeight: 700 }}>อ่านต่อ <i className="fa-solid fa-arrow-right"></i></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Popup Viewer */}
      {activeArticle && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "680px", margin: 0, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)" }}>
              <div>
                <span className="badge" style={{ background: `${(CATEGORIES.find(c => c.id === activeArticle.category) || CATEGORIES[0]).color}15`, color: (CATEGORIES.find(c => c.id === activeArticle.category) || CATEGORIES[0]).color }}>
                  {activeArticle.category}
                </span>
                <h3 className="card-title" style={{ marginTop: "6px", fontSize: "1.08rem" }}>{activeArticle.title}</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveArticle(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="card-body" style={{ overflowY: "auto", flex: 1, padding: "20px", fontSize: ".88rem", lineHeight: 1.6, color: "var(--text)" }}>
              {/* Render content as pre-wrap to support line breaks and markdown styling */}
              <div style={{ whiteSpace: "pre-wrap" }}>
                {activeArticle.content}
              </div>
            </div>
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".76rem", color: "var(--text-muted)", borderTop: "1px solid var(--border-light)", padding: "12px 20px" }}>
              <span><i className="fa-solid fa-eye"></i> อ่านแล้ว {activeArticle.views} ครั้ง</span>
              <span>อัปเดตล่าสุดเมื่อ: {new Date(activeArticle.updated_at).toLocaleDateString("th-TH")}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
