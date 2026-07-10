"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppSidebar from "./AppSidebar";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // Fetch user session
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
        // Middleware will also protect, but redirect here as a backup
        router.push("/login");
      });
  }, [pathname, isLoginPage, router]);

  // Fetch system announcements — refresh every 60s to auto-hide expired ones
  useEffect(() => {
    if (isLoginPage) return;

    const parseAnn = (c) => {
      if (!c.config_value || c.config_value === "disabled") return null;
      let data;
      try {
        data = JSON.parse(c.config_value);
        if (!data?.message) return null;
      } catch (_) {
        // Legacy plain string
        data = { message: c.config_value, type: c.description || "warning", start_at: null, end_at: null };
      }
      // Time filter
      const now = new Date();
      if (data.start_at && new Date(data.start_at) > now) return null; // not yet
      if (data.end_at && new Date(data.end_at) < now) return null;     // expired
      return { id: c.config_key, message: data.message, type: data.type || "warning" };
    };

    const load = () => {
      fetch("/api/settings")
        .then(r => r.ok ? r.json() : [])
        .then(configs => {
          if (!Array.isArray(configs)) return;
          const annItems = configs
            .filter(c => c.config_key?.startsWith("announcement_"))
            .map(parseAnn)
            .filter(Boolean);
          setAnnouncements(annItems);
        })
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, 60_000); // re-check every 60s
    return () => clearInterval(interval);
  }, [isLoginPage]);

  // Handle mobile responsive default state & window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Collapse sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        router.push("/login");
        router.refresh();
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f8fa",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(79, 70, 229, 0.1)",
            borderTopColor: "#4f46e5",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        ></div>
        <p style={{ color: "#5e6278", fontSize: "0.9rem", fontWeight: 500 }}>
          กำลังตรวจสอบสิทธิ์...
        </p>
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // If it's login page, render clean layout without sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // User avatar abbreviation
  const getInitials = (name) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const roleLabels = {
    admin: "Administrator",
    tier1: "IT Support (Tier 1)",
    tier2: "Specialist (Tier 2)",
    end_user: "General User",
  };

  return (
    <div id="app" className={`${isCollapsed ? "collapsed" : ""} ${!isCollapsed ? "sidebar-open" : ""}`}>
      {/* Sidebar with active user */}
      <AppSidebar user={user} onLogout={handleLogout} />

      {/* Sidebar overlay for mobile click-to-close */}
      <div className="sidebar-overlay" onClick={() => setIsCollapsed(true)} />

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={toggleSidebar} 
              style={{ fontSize: "1.2rem", padding: "6px 10px", borderRadius: "8px" }}
              aria-label="Toggle Sidebar"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div>
              <h1 className="topbar-title" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)" }}>IT Helpdesk</h1>
              <div className="topbar-breadcrumb" style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>ระบบรับแจ้งปัญหาและบริการไอที</div>
            </div>
          </div>
          
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button className="btn btn-outline btn-icon" id="btn-notifications" style={{ position: "relative" }}>
                <i className="fa-solid fa-bell"></i>
              </button>
              
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  background: "var(--border-light)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                  }}
                >
                  {getInitials(user.full_name)}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    {user.full_name}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    {roleLabels[user.role] || user.role}
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* System Announcements — Single Combined Scrolling Ticker */}
        {(() => {
          const visible = announcements.filter(a => !dismissedIds.includes(a.id));
          if (visible.length === 0) return null;

          const typeStyles = {
            danger:  {
              bg: "linear-gradient(90deg, #7f1d1d, #991b1b, #7f1d1d)",
              border: "#ef4444",
              text: "#fef2f2",
              iconColor: "#fca5a5",
              icon: "fa-circle-exclamation",
              badge: "🚨",
              badgeBg: "#dc2626",
              pulse: true,
              priority: 4,
            },
            warning: {
              bg: "linear-gradient(90deg, #78350f, #92400e, #78350f)",
              border: "#f59e0b",
              text: "#fffbeb",
              iconColor: "#fcd34d",
              icon: "fa-triangle-exclamation",
              badge: "⚠️",
              badgeBg: "#d97706",
              pulse: false,
              priority: 3,
            },
            info: {
              bg: "linear-gradient(90deg, #1e3a5f, #1e40af, #1e3a5f)",
              border: "#3b82f6",
              text: "#eff6ff",
              iconColor: "#93c5fd",
              icon: "fa-circle-info",
              badge: "ℹ️",
              badgeBg: "#2563eb",
              pulse: false,
              priority: 2,
            },
            success: {
              bg: "linear-gradient(90deg, #064e3b, #065f46, #064e3b)",
              border: "#10b981",
              text: "#ecfdf5",
              iconColor: "#6ee7b7",
              icon: "fa-circle-check",
              badge: "✅",
              badgeBg: "#059669",
              pulse: false,
              priority: 1,
            },
          };

          // Pick highest severity type
          const highestType = visible.reduce((best, ann) => {
            const cur = typeStyles[ann.type] || typeStyles.warning;
            const prev = typeStyles[best] || typeStyles.warning;
            return cur.priority > prev.priority ? ann.type : best;
          }, visible[0].type);

          const s = typeStyles[highestType] || typeStyles.warning;

          // duplicate for seamless loop
          const tickerItems = [...visible, ...visible];

          // dismiss ALL visible announcements
          const handleDismissAll = () => {
            setDismissedIds(prev => [...prev, ...visible.map(a => a.id)]);
          };

          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                background: s.bg,
                borderBottom: `2px solid ${s.border}`,
                color: s.text,
                fontSize: "1.05rem",
                fontWeight: 700,
                overflow: "hidden",
                position: "relative",
                animation: "slideDown 0.3s ease",
                boxShadow: s.pulse ? `0 0 16px ${s.border}60` : "none",
                height: "52px",
              }}
            >
              {/* Left badge — shows count if multiple */}
              <div style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0 20px",
                height: "100%",
                background: s.badgeBg,
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.92rem",
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
                borderRight: `2px solid ${s.border}`,
                animation: s.pulse ? "urgentPulse 1s ease-in-out infinite" : "none",
              }}>
                <i className={`fa-solid ${s.icon}`} style={{
                  animation: "flashIcon 0.8s ease-in-out infinite",
                  fontSize: "1.1rem",
                }}></i>
                <span>ประกาศด่วน</span>
                {visible.length > 1 && (
                  <span style={{
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: "20px",
                    padding: "1px 8px",
                    fontSize: "0.78rem",
                    fontWeight: 900,
                    marginLeft: "2px",
                  }}>
                    {visible.length}
                  </span>
                )}
              </div>

              {/* Scrolling ticker — all announcements in one stream */}
              <div style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                height: "100%",
              }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  animation: `marqueeScroll ${Math.max(18, visible.length * 14)}s linear infinite`,
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}>
                  {tickerItems.map((ann, i) => {
                    const st = typeStyles[ann.type] || typeStyles.warning;
                    return (
                      <span key={`${ann.id}-${i}`} style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "0 40px",
                        borderRight: i < tickerItems.length - 1
                          ? "1px solid rgba(255,255,255,0.2)" : "none",
                      }}>
                        <span style={{ fontSize: "1.2rem" }}>{st.badge}</span>
                        <span>{ann.message}</span>
                        <span style={{ fontSize: "1.2rem" }}>{st.badge}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Single dismiss-all button */}
              <button
                onClick={handleDismissAll}
                title="ปิดประกาศทั้งหมด"
                style={{
                  flexShrink: 0,
                  background: "rgba(0,0,0,0.25)",
                  border: "none",
                  cursor: "pointer",
                  color: s.text,
                  padding: "0 16px",
                  fontSize: "0.9rem",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background 0.15s",
                  borderLeft: "1px solid rgba(255,255,255,0.15)",
                }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(0,0,0,0.4)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(0,0,0,0.25)"}
                aria-label="ปิดประกาศทั้งหมด"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          );
        })()}
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
