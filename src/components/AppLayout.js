"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppSidebar from "./AppSidebar";

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div id="app">
      {/* Sidebar with active user */}
      <AppSidebar user={user} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <h1 className="topbar-title">IT Helpdesk</h1>
            <div className="topbar-breadcrumb">ระบบรับแจ้งปัญหาและบริการไอที</div>
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

        {/* Page Body */}
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
