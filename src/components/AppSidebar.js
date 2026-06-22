"use client";

import { useState, useEffect } from "react";

export default function AppSidebar() {
  const [role, setRole] = useState("ADMIN"); // Default to ADMIN for testing

  const canSeeTier1 = ["ADMIN", "TIER1"].includes(role);
  const canSeeTier2 = ["ADMIN", "TIER2", "OWNER"].includes(role);
  const canSeeMaster = ["ADMIN"].includes(role);

  const roleLabels = {
    ADMIN: "Administrator",
    TIER1: "IT Support (Tier 1)",
    TIER2: "Specialist (Tier 2)",
    USER: "General User"
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <i className="fa-solid fa-headset"></i>
        </div>
        <div className="sidebar-logo-text">
          IT Helpdesk
          <span>Support System</span>
        </div>
      </div>

      <div className="sidebar-section">Main Menu</div>
      <nav className="sidebar-nav">
        <a href="/" className="nav-item" id="nav-dashboard">
          <i className="fa-solid fa-gauge-high nav-icon"></i>
          <span className="nav-label">Dashboard</span>
        </a>
        <a href="/tickets" className="nav-item" id="nav-tickets">
          <i className="fa-solid fa-ticket nav-icon"></i>
          <span className="nav-label">All Tickets</span>
        </a>
        <a href="/tickets/create" className="nav-item" id="nav-create-ticket">
          <i className="fa-solid fa-plus-circle nav-icon"></i>
          <span className="nav-label">แจ้งปัญหาใหม่</span>
        </a>

        {canSeeTier1 && (
          <>
            <div className="sidebar-section" style={{ marginTop: '16px' }}>Tier 1 Support</div>
            <a href="/tier1" className="nav-item" id="nav-tier1">
              <i className="fa-solid fa-inbox nav-icon"></i>
              <span className="nav-label">รับเรื่อง / ประเมิน</span>
            </a>
          </>
        )}

        {canSeeTier2 && (
          <>
            <div className="sidebar-section" style={{ marginTop: '16px' }}>Tier 2 Support</div>
            <a href="/tier2" className="nav-item" id="nav-tier2">
              <i className="fa-solid fa-wrench nav-icon"></i>
              <span className="nav-label">แก้ไขปัญหา</span>
            </a>
          </>
        )}

        {canSeeMaster && (
          <>
            <div className="sidebar-section" style={{ marginTop: '16px' }}>Master Data</div>
            <a href="/master/bu" className="nav-item" id="nav-master-bu">
              <i className="fa-solid fa-building nav-icon"></i>
              <span className="nav-label">Business Units</span>
            </a>
            <a href="/master/systems" className="nav-item" id="nav-master-systems">
              <i className="fa-solid fa-server nav-icon"></i>
              <span className="nav-label">Systems / Software</span>
            </a>
            <a href="/master/hardware" className="nav-item" id="nav-master-hardware">
              <i className="fa-solid fa-microchip nav-icon"></i>
              <span className="nav-label">Hardware / Products</span>
            </a>
            <a href="/master/locations" className="nav-item" id="nav-master-locations">
              <i className="fa-solid fa-map-marker-alt nav-icon"></i>
              <span className="nav-label">Locations</span>
            </a>
            <a href="/master/users" className="nav-item" id="nav-master-users">
              <i className="fa-solid fa-users nav-icon"></i>
              <span className="nav-label">Users</span>
            </a>
            <a href="/master/settings" className="nav-item" id="nav-master-settings">
              <i className="fa-solid fa-cogs nav-icon"></i>
              <span className="nav-label">System Settings</span>
            </a>
          </>
        )}
      </nav>

      <div className="sidebar-footer" style={{ padding: "16px" }}>
        {/* Role Switcher for Testing PoC */}
        <div style={{ marginBottom: "12px", background: "rgba(255,255,255,0.05)", padding: "8px", borderRadius: "8px" }}>
          <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>Test Role Switcher:</label>
          <select 
            value={role} 
            onChange={handleRoleChange} 
            style={{ width: "100%", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "4px", fontSize: "0.8rem" }}
          >
            <option value="ADMIN">Admin</option>
            <option value="TIER1">Tier 1 Support</option>
            <option value="TIER2">Tier 2 Support</option>
            <option value="USER">User</option>
          </select>
        </div>

        <div className="user-info" style={{ padding: 0 }}>
          <div className="user-avatar">{role.substring(0, 2)}</div>
          <div className="user-details">
            <div className="user-name">Demo {role}</div>
            <div className="user-role" style={{ fontSize: "0.7rem" }}>{roleLabels[role]}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
