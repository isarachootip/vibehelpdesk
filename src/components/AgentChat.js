"use client";

import { useState, useEffect, useRef } from "react";

export default function AgentChat({ ticketId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
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
    // Optional: Setup polling every 10s for new messages
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg = {
      sender_type: 'AGENT',
      sender_id: 1, // Assume Admin Demo for now
      sender_name: 'Admin Demo',
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
            const isAgent = msg.sender_type === 'AGENT';
            return (
              <div key={idx} style={{
                alignSelf: isAgent ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: isAgent ? 'var(--primary)' : '#fff',
                color: isAgent ? '#fff' : 'var(--text)',
                padding: '10px 14px',
                borderRadius: isAgent ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                fontSize: '0.9rem',
                border: isAgent ? 'none' : '1px solid var(--border)'
              }}>
                {!isAgent && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                    {msg.sender_name || 'Reporter'} {msg.source === 'LINE' ? '(via LINE)' : ''}
                  </div>
                )}
                {isAgent && (
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', fontWeight: 600, textAlign: 'right' }}>
                    {msg.sender_name || 'IT Support'}
                  </div>
                )}
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
