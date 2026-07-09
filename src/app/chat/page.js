"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ChatDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // 1. Fetch current user session & verify role (IT/Admin only)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          const role = data.user.role?.toUpperCase();
          if (["USER", "END_USER"].includes(role) && data.user.email !== "isarachootip@gmail.com") {
            // Redirect normal users to their own ticket page
            router.push("/tickets/my");
            return;
          }
          setCurrentUser(data.user);
        }
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  // 2. Fetch all tickets
  const fetchTickets = () => {
    fetch("/api/tickets")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          // Sort tickets: put ones with recent activity or LINE integration first
          setTickets(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 15000); // refresh list every 15s
    return () => clearInterval(interval);
  }, []);

  // 3. Fetch messages for the selected ticket
  const fetchMessages = async (ticketId) => {
    if (!ticketId) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    }
  };

  // Poll messages every 5 seconds when a ticket is selected
  useEffect(() => {
    if (!selectedTicket) return;
    fetchMessages(selectedTicket.ticket_id);
    const interval = setInterval(() => fetchMessages(selectedTicket.ticket_id), 5000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send Message Handler
  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || sending) return;

    setSending(true);
    const textToSend = replyText.trim();
    setReplyText("");

    const newMsgPayload = {
      sender_type: "AGENT",
      sender_id: currentUser ? currentUser.user_id : null,
      sender_name: currentUser ? currentUser.full_name : "IT Support",
      message_text: textToSend,
      source: "WEB",
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, { ...newMsgPayload, created_at: new Date().toISOString() }]);

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.ticket_id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsgPayload),
      });
      if (res.ok) {
        fetchMessages(selectedTicket.ticket_id);
        fetchTickets(); // Refresh ticket list to update last message
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Filter tickets based on search query
  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.ticket_no.toLowerCase().includes(q) ||
      (t.reporter_name && t.reporter_name.toLowerCase().includes(q)) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  const priorityColor = (p) => {
    switch (p) {
      case "Critical": return "#ef4444";
      case "High": return "#f59e0b";
      case "Medium": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const statusLabel = (s) => {
    switch (s) {
      case "NEW": return "รอรับเรื่อง";
      case "IN_PROGRESS": return "กำลังดำเนินการ";
      case "ESCALATED": return "ส่งต่อ Tier 2";
      case "ESCALATED_TIER3": return "ส่งต่อ Tier 3";
      case "RESOLVED": return "แก้ไขแล้ว";
      case "CLOSED": return "ปิดงาน";
      default: return s;
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="flex-center" style={{ height: "300px" }}>
        <div className="loader-wrap">
          <div className="loader-pulse"></div>
          <p>กำลังโหลดข้อมูลการแชต...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 120px)", background: "#fff", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
      
      {/* Left Column: Tickets list */}
      <div style={{ width: "340px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--bg-secondary)" }}>
        
        {/* Search Header */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "#fff" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-comments" style={{ color: "#ec4899" }}></i>
            ห้องแชตและข้อความเข้า
          </h2>
          <div style={{ position: "relative" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: ".85rem" }}></i>
            <input
              type="text"
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาตามเลขตั๋ว หรือชื่อลูกค้า..."
              style={{ paddingLeft: "32px", fontSize: ".82rem" }}
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {filteredTickets.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "24px", fontSize: ".82rem" }}>ไม่พบห้องแชต</div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = selectedTicket?.ticket_id === t.ticket_id;
              const hasLine = t.reporter_line_id && t.reporter_line_id.startsWith("U");

              return (
                <div
                  key={t.ticket_id}
                  onClick={() => {
                    setSelectedTicket(t);
                    setMessages([]);
                    fetchMessages(t.ticket_id);
                  }}
                  style={{
                    background: isSelected ? "#fff" : "transparent",
                    border: isSelected ? "1.5px solid var(--primary)" : "1px solid transparent",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    transition: "all .15s",
                    boxShadow: isSelected ? "0 4px 6px -1px rgba(0,0,0,0.05)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <span style={{ fontSize: ".76rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      {t.ticket_no}
                    </span>
                    <span style={{ fontSize: ".7rem", color: "#fff", background: priorityColor(t.priority), padding: "2px 6px", borderRadius: "10px", fontWeight: 600 }}>
                      {t.priority}
                    </span>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: ".85rem", color: "var(--text)", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.subject}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: ".8rem", color: "var(--text-secondary)" }}>
                      {hasLine ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#06c755", fontWeight: 600 }}>
                          <i className="fa-brands fa-line" style={{ fontSize: "1rem" }}></i>
                          LINE User
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "var(--primary-light)" }}>
                          <i className="fa-solid fa-globe"></i>
                          {t.reporter_name || "Web User"}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: ".7rem", background: "var(--border-light)", color: "var(--text-muted)", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                      {statusLabel(t.status)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat Box */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8f9fa" }}>
        {selectedTicket ? (
          <>
            {/* Header info */}
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: ".95rem", fontWeight: 800, margin: 0 }}>
                    {selectedTicket.ticket_no} — {selectedTicket.subject}
                  </h3>
                  {selectedTicket.reporter_line_id ? (
                    <span style={{ background: "#e8fcf0", color: "#06c755", padding: "2px 8px", borderRadius: "12px", fontSize: ".72rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <i className="fa-brands fa-line"></i> LINE Chat
                    </span>
                  ) : (
                    <span style={{ background: "rgba(59,130,246,.08)", color: "var(--primary)", padding: "2px 8px", borderRadius: "12px", fontSize: ".72rem", fontWeight: 700 }}>
                      Portal Web Chat
                    </span>
                  )}
                </div>
                <div style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  <strong>ผู้แจ้ง:</strong> {selectedTicket.reporter_name || "LINE User"} | <strong>สาขา:</strong> {selectedTicket.location_text || "คลังสินค้า/สาขา"}
                </div>
              </div>
              <div>
                <a href={`/tickets/${selectedTicket.ticket_id}`} className="btn btn-outline btn-sm">
                  <i className="fa-solid fa-arrow-up-right-from-square"></i> ดูรายละเอียดตั๋ว
                </a>
              </div>
            </div>

            {/* Messages body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.length === 0 ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-muted)", flexDirection: "column", gap: "10px" }}>
                  <i className="fa-regular fa-comments" style={{ fontSize: "2rem" }}></i>
                  <p style={{ fontSize: ".82rem" }}>ยังไม่มีประวัติการแชตในตั๋วใบนี้ ส่งข้อความแรกเพื่อเริ่มสนทนา</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isAgent = msg.sender_type === "AGENT";
                  const dateStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div
                      key={index}
                      style={{
                        alignSelf: isAgent ? "flex-end" : "flex-start",
                        maxWidth: "70%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isAgent ? "flex-end" : "flex-start"
                      }}
                    >
                      <div
                        style={{
                          background: isAgent ? "var(--primary)" : "#fff",
                          color: isAgent ? "#fff" : "var(--text-primary)",
                          borderRadius: isAgent ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          padding: "10px 14px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                          fontSize: ".88rem",
                          lineHeight: 1.4,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.message_text}
                      </div>
                      
                      <div style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>{msg.sender_name || (isAgent ? "IT Support" : "LINE User")}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        {msg.source === "LINE" && (
                          <span style={{ color: "#06c755", fontWeight: 700 }}><i className="fa-brands fa-line"></i> LINE</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSend} style={{ padding: "16px", background: "#fff", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                className="form-control"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={selectedTicket.reporter_line_id ? "พิมพ์ข้อความตอบกลับลูกค้า (จะส่งตรงเข้า LINE ของลูกค้า)..." : "พิมพ์ข้อความตอบกลับลูกค้า..."}
                style={{ flex: 1, padding: "10px 14px", fontSize: ".88rem", borderRadius: "20px" }}
                disabled={sending}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: "50%", width: "40px", height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                disabled={!replyText.trim() || sending}
              >
                {sending ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane" style={{ marginLeft: "2px" }}></i>}
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "12px", color: "var(--text-muted)" }}>
            <i className="fa-regular fa-comments" style={{ fontSize: "3.5rem", opacity: 0.4 }}></i>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>ยินดีต้อนรับสู่ระบบแชต IT Helpdesk</h3>
            <p style={{ fontSize: ".82rem", margin: 0 }}>กรุณาเลือกรายการตั๋วจากแถบด้านซ้าย เพื่อพูดคุยติดต่อกับลูกค้า</p>
          </div>
        )}
      </div>
    </div>
  );
}
