"use client";

import { useState, useEffect, useRef } from "react";

export default function AgentChat({ ticketId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Setup polling every 10s for new messages
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    // Fetch current user session
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(err => console.error("Failed to fetch user in chat:", err));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Check if the current user has a role that is general user or end_user
    const isReporter = currentUser && ["USER", "END_USER"].includes(currentUser.role?.toUpperCase());

    const newMsg = {
      sender_type: isReporter ? 'REPORTER' : 'AGENT',
      sender_id: currentUser ? currentUser.user_id : null,
      sender_name: currentUser ? currentUser.full_name : 'IT Support',
      message_text: inputValue.trim(),
      source: 'WEB'
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue("");

    try {
      await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
      fetchMessages();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="card" style={{ marginTop: "16px", display: "flex", flexDirection: "column", height: "400px" }}>
      <div className="card-header">
        <h3 className="card-title">
          <i className="fa-regular fa-comments" style={{ marginRight: "8px", color: "var(--primary)" }}></i>
          Chat / Discussion
        </h3>
      </div>
      <div className="card-body" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", background: "var(--bg-secondary)" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "20px" }}>ยังไม่มีข้อความ</div>
        ) : (
          messages.map((msg, idx) => {
            // Display on the right if it was sent by the current logged-in user
            const isMe = currentUser && msg.sender_id === currentUser.user_id;
            const isRightAligned = isMe || (!currentUser && msg.sender_type === 'AGENT');
            const bubbleColor = isRightAligned ? 'var(--primary)' : '#fff';
            const textColor = isRightAligned ? '#fff' : 'var(--text-primary)';

            return (
              <div key={idx} style={{
                alignSelf: isRightAligned ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: bubbleColor,
                color: textColor,
                padding: '10px 14px',
                borderRadius: isRightAligned ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                fontSize: '0.9rem',
                border: isRightAligned ? 'none' : '1px solid var(--border)'
              }}>
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: isRightAligned ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', 
                  marginBottom: '4px', 
                  fontWeight: 600, 
                  textAlign: isRightAligned ? 'right' : 'left' 
                }}>
                  {msg.sender_name || (msg.sender_type === 'AGENT' ? 'IT Support' : 'Reporter')} 
                  {msg.source === 'LINE' ? ' (via LINE)' : ''}
                </div>
                {msg.message_text}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "12px", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px" }}>
          <input 
            type="text" 
            className="form-control" 
            placeholder="พิมพ์ข้อความตอบกลับ..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: "0 20px" }}>
            ส่ง <i className="fa-solid fa-paper-plane" style={{ marginLeft: "4px" }}></i>
          </button>
        </form>
      </div>
    </div>
  );
}
