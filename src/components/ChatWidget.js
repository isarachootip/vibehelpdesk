"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketNo, setTicketNo] = useState("");
  const [hasTicket, setHasTicket] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [ticketId, setTicketId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const fetchMessages = async (tId) => {
    try {
      const res = await fetch(`/api/tickets/${tId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnectTicket = async (e) => {
    e.preventDefault();
    if (!ticketNo.trim()) return;

    // A real implementation would verify the ticket by No. and maybe Email/Phone
    // For PoC, we will just search the ticket list
    try {
      const res = await fetch(`/api/tickets?search=${ticketNo.trim()}`);
      if (res.ok) {
        const data = await res.json();
        const ticket = data.find(t => t.ticket_no.toLowerCase() === ticketNo.trim().toLowerCase());
        if (ticket) {
          setHasTicket(true);
          setTicketId(ticket.ticket_id);
          fetchMessages(ticket.ticket_id);
          
          // Add a welcome message if no history
          setMessages([{
            sender_type: 'BOT',
            message_text: `สวัสดีครับ! นี่คือห้องแชทสำหรับ Ticket: ${ticket.ticket_no} พิมพ์ข้อความฝากไว้ให้เจ้าหน้าที่ IT ได้เลยครับ`
          }]);
        } else {
          alert('ไม่พบหมายเลข Ticket นี้ในระบบครับ');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !ticketId) return;

    const newMsg = {
      sender_type: 'REPORTER',
      message_text: inputValue.trim(),
      source: 'WEB'
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);
    setInputValue("");

    try {
      await fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      });
      // Refresh to get actual ID and timestamp
      fetchMessages(ticketId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="fa-regular fa-comment-dots"></i>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '350px',
          height: '500px',
          background: 'var(--bg)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border)'
        }}>
          {/* Header */}
          <div style={{
            background: 'var(--primary)',
            color: '#fff',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-robot"></i>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Helpdesk Support</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Online 24/7</div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', background: 'var(--bg-secondary)' }}>
            {!hasTicket ? (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <i className="fa-solid fa-ticket text-muted" style={{ fontSize: '3rem', marginBottom: '16px' }}></i>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>ติดตามสถานะ / แชท</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '24px' }}>
                  กรุณากรอกหมายเลข Ticket ของคุณเพื่อดูประวัติและพูดคุยกับเจ้าหน้าที่ IT
                </p>
                <form onSubmit={handleConnectTicket}>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="เช่น PWB-13052026-00001" 
                    value={ticketNo}
                    onChange={(e) => setTicketNo(e.target.value)}
                    style={{ marginBottom: '12px' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>เชื่อมต่อ Ticket</button>
                </form>
                
                <div style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  หรือ <a href="/tickets/create" style={{ color: 'var(--primary)' }}>สร้าง Ticket ใหม่</a>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, idx) => {
                  const isUser = msg.sender_type === 'REPORTER';
                  return (
                    <div key={idx} style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      background: isUser ? 'var(--primary)' : '#fff',
                      color: isUser ? '#fff' : 'var(--text)',
                      padding: '10px 14px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      fontSize: '0.9rem',
                      border: isUser ? 'none' : '1px solid var(--border)'
                    }}>
                      {!isUser && msg.sender_type !== 'BOT' && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                          {msg.sender?.full_name || 'IT Support'}
                        </div>
                      )}
                      {msg.message_text}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Footer (Input) */}
          {hasTicket && (
            <div style={{ padding: '12px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="พิมพ์ข้อความ..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  style={{ borderRadius: '20px' }}
                />
                <button type="submit" style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
