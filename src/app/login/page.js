"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      }

      // Success, redirect to dashboard
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1e1e2d 0%, #111119 100%)",
        fontFamily: "'Noto Sans Thai', 'Inter', sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(30, 30, 45, 0.7)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
          padding: "40px 32px",
          color: "#ffffff",
        }}
      >
        {/* Header/Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
            }}
          >
            <i className="fa-solid fa-headset" style={{ fontSize: "24px", color: "#ffffff" }}></i>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0 0 6px" }}>IT Helpdesk</h2>
          <p style={{ color: "#a1a5b7", fontSize: "0.86rem", margin: 0 }}>
            ลงชื่อเข้าใช้งานระบบเพื่อจัดการ Ticket
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "0.86rem",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "#e2e8f0",
                marginBottom: "6px",
              }}
            >
              อีเมลพนักงาน
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="fa-solid fa-envelope"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: "0.94rem",
                }}
              ></i>
              <input
                id="email"
                type="email"
                required
                placeholder="email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(15, 15, 25, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "12px 12px 12px 38px",
                  fontSize: "0.94rem",
                  color: "#ffffff",
                  outline: "none",
                  transition: "border-color 0.28s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "#e2e8f0",
                marginBottom: "6px",
              }}
            >
              รหัสผ่าน
            </label>
            <div style={{ position: "relative" }}>
              <i
                className="fa-solid fa-lock"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: "0.94rem",
                }}
              ></i>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(15, 15, 25, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "12px 12px 12px 38px",
                  fontSize: "0.94rem",
                  color: "#ffffff",
                  outline: "none",
                  transition: "border-color 0.28s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "0.96rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.1s, opacity 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "12px",
              opacity: loading ? 0.8 : 1,
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.transform = "translateY(0)";
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                ></span>
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบ</span>
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
              </>
            )}
          </button>
        </form>

        {/* LINE Official Account QR & Link */}
        <div
          style={{
            marginTop: "28px",
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "12px",
            padding: "20px 16px",
            border: "1px solid rgba(255,255,255,0.05)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "0.84rem",
              fontWeight: 600,
              color: "#06c755", // LINE Green
            }}
          >
            <i className="fa-brands fa-line" style={{ marginRight: "6px", fontSize: "1rem" }}></i>
            แจ้งปัญหาด่วนผ่าน LINE Official
          </span>
          
          <a 
            href="https://lin.ee/8KGPahF" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: "block",
              transition: "transform 0.2s" 
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <img 
              src="/line-qr.png" 
              alt="LINE QR Code" 
              style={{ 
                width: "120px", 
                height: "120px", 
                borderRadius: "8px",
                border: "2px solid rgba(6, 199, 85, 0.25)",
                background: "#ffffff",
                padding: "4px"
              }}
            />
          </a>

          <a
            href="https://lin.ee/8KGPahF"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#06c755",
              color: "#ffffff",
              border: "none",
              borderRadius: "20px",
              padding: "6px 20px",
              fontSize: "0.8rem",
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "opacity 0.2s, transform 0.1s",
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
            onMouseOut={(e) => e.currentTarget.style.opacity = 1}
          >
            <i className="fa-brands fa-line"></i>
            คลิกเพื่อแอดไลน์
          </a>
        </div>
      </div>

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
