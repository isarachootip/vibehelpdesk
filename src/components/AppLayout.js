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

  // Fetch system announcements from settings
  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/settings")
      .then(r => r.ok ? r.json() : [])
      .then(configs => {
        if (!Array.isArray(configs)) return;
        // Look for announcement_* keys that are enabled
        const annItems = configs
          .filter(c => c.config_key?.startsWith("announcement_") && c.config_value && c.config_value !== "" && c.config_value !== "disabled")
          .map(c => ({
            id: c.config_key,
            message: c.config_value,
            type: c.description || "warning", // warning | danger | info | success
          }));
        setAnnouncements(annItems);
      })
      .catch(() => {});
  }, [isLoginPage]);

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

        {/* System Announcements — Scrolling Marquee */}
        {announcements.filter(a => !dismissedIds.includes(a.id)).map(ann => {
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
            },
          };
          const s = typeStyles[ann.type] || typeStyles.warning;

          // Repeat message for seamless scroll
          const repeatedMsg = `${ann.message}　　　　　　　　${ann.message}　　　　　　　　${ann.message}`;

          return (
            <div
              key={ann.id}
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
              }}
            >
              {/* Left badge label */}
              <div style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "13px 20px",
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
              </div>

              {/* Scrolling text */}
              <div style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                height: "52px",
              }}>
                <div style={{
                  display: "flex",
                  gap: "48px",
                  whiteSpace: "nowrap",
                  animation: "marqueeScroll 20s linear infinite",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}>
                  {/* Repeat text 4x for seamless loop */}
                  {[0, 1, 2, 3].map(i => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ color: s.iconColor, fontSize: "1.3rem" }}>{s.badge}</span>
                      {ann.message}
                      <span style={{ color: s.iconColor, fontSize: "1.3rem" }}>{s.badge}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setDismissedIds(prev => [...prev, ann.id])}
                style={{
                  flexShrink: 0,
                  background: "rgba(0,0,0,0.25)",
                  border: "none",
                  cursor: "pointer",
                  color: s.text,
                  padding: "10px 14px",
                  fontSize: "0.9rem",
                  lineHeight: 1,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseOver={e => e.currentTarget.style.background = "rgba(0,0,0,0.4)"}
                onMouseOut={e => e.currentTarget.style.background = "rgba(0,0,0,0.25)"}
                aria-label="ปิดประกาศ"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          );
        })}
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
