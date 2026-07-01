"use client";

export default function AppSidebar({ user, onLogout }) {
  const role = user?.role?.toUpperCase() || "USER";

  const isGeneralUser = ["USER", "END_USER"].includes(role);
  const canSeeTier1 = ["ADMIN", "TIER1"].includes(role);
  const canSeeTier2 = ["ADMIN", "TIER2", "OWNER"].includes(role);
  const canSeeTier3 = ["ADMIN", "TIER3"].includes(role);
  const canSeeMaster = ["ADMIN"].includes(role);

  const roleLabels = {
    ADMIN: "Administrator",
    TIER1: "IT Support (Tier 1)",
    TIER2: "Specialist (Tier 2)",
    TIER3: "Specialist (Tier 3)",
    USER: "General User",
    END_USER: "General User",
  };

  const getInitials = (name) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
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
        {/* Dashboard & All Tickets: Admin/IT only */}
        {!isGeneralUser && (
          <>
            <a href="/" className="nav-item" id="nav-dashboard">
              <i className="fa-solid fa-gauge-high nav-icon"></i>
              <span className="nav-label">Dashboard</span>
            </a>
            <a href="/tickets" className="nav-item" id="nav-tickets">
              <i className="fa-solid fa-ticket nav-icon"></i>
              <span className="nav-label">All Tickets</span>
            </a>
          </>
        )}

        {/* General Users: Workflow/Request links */}
        {isGeneralUser && (
          <>
            <a href="/" className="nav-item" id="nav-my-workflow">
              <i className="fa-solid fa-diagram-project nav-icon"></i>
              <span className="nav-label">ขั้นตอนการแจ้งปัญหา</span>
            </a>
            <a href="/tickets/my" className="nav-item" id="nav-my-tickets">
              <i className="fa-solid fa-list-check nav-icon"></i>
              <span className="nav-label">ติดตาม Ticket ของฉัน</span>
            </a>
            <a href="/my-assets" className="nav-item" id="nav-my-assets">
              <i className="fa-solid fa-laptop nav-icon"></i>
              <span className="nav-label">อุปกรณ์ของฉัน</span>
            </a>
          </>
        )}

        {role !== "TIER1" && (
          <>
            <a href="/tickets/create" className="nav-item" id="nav-create-ticket">
              <i className="fa-solid fa-plus-circle nav-icon"></i>
              <span className="nav-label">แจ้งปัญหาใหม่</span>
            </a>
            <a href="/kb" className="nav-item" id="nav-user-kb">
              <i className="fa-solid fa-book nav-icon" style={{ color: "#10b981" }}></i>
              <span className="nav-label">คลังความรู้ (KM / FAQ)</span>
            </a>
          </>
        )}

        {canSeeTier1 && (
          <>
            <div className="sidebar-section" style={{ marginTop: "16px" }}>Tier 1 Support</div>
            <a href="/tier1" className="nav-item" id="nav-tier1">
              <i className="fa-solid fa-inbox nav-icon"></i>
              <span className="nav-label">รับเรื่อง / ประเมิน</span>
            </a>
          </>
        )}

        {canSeeTier2 && (
          <>
            <div className="sidebar-section" style={{ marginTop: "16px" }}>Tier 2 Support</div>
            <a href="/tier2" className="nav-item" id="nav-tier2">
              <i className="fa-solid fa-wrench nav-icon"></i>
              <span className="nav-label">แก้ไขปัญหา</span>
            </a>
          </>
        )}

        {canSeeTier3 && (
          <>
            <div className="sidebar-section" style={{ marginTop: "16px" }}>Tier 3 Support</div>
            <a href="/tier3" className="nav-item" id="nav-tier3">
              <i className="fa-solid fa-screwdriver-wrench nav-icon"></i>
              <span className="nav-label">แก้ไขเคสเชิงลึก (Tier 3)</span>
            </a>
          </>
        )}

        {canSeeMaster && (
          <>
            <div className="sidebar-section" style={{ marginTop: "16px" }}>Asset Inventory</div>
            <a href="/assets" className="nav-item" id="nav-assets">
              <i className="fa-solid fa-boxes-stacked nav-icon" style={{ color: "#8b5cf6" }}></i>
              <span className="nav-label">IT Assets</span>
            </a>
            <a href="/master/asset-types" className="nav-item" id="nav-asset-types">
              <i className="fa-solid fa-tags nav-icon" style={{ color: "#8b5cf6" }}></i>
              <span className="nav-label">ประเภท Asset</span>
            </a>
            <div className="sidebar-section" style={{ marginTop: "16px" }}>Master Data</div>
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
            <a href="/master/recurring" className="nav-item" id="nav-master-recurring">
              <i className="fa-solid fa-clock-rotate-left nav-icon" style={{ color: "#3b82f6" }}></i>
              <span className="nav-label">ตั๋วประจำรอบ (Recurring)</span>
            </a>
            <a href="/master/kb" className="nav-item" id="nav-master-kb">
              <i className="fa-solid fa-book-open nav-icon" style={{ color: "#10b981" }}></i>
              <span className="nav-label">จัดการคลังความรู้ (KM)</span>
            </a>
            <a href="/master/settings" className="nav-item" id="nav-master-announcements"
              style={{ position: "relative" }}
            >
              <i className="fa-solid fa-bullhorn nav-icon" style={{ color: "#f59e0b" }}></i>
              <span className="nav-label">ประกาศแจ้งเตือน</span>
            </a>
            <a href="/master/settings" className="nav-item" id="nav-master-settings">
              <i className="fa-solid fa-cogs nav-icon"></i>
              <span className="nav-label">System Settings</span>
            </a>
          </>
        )}
      </nav>

      {/* Sidebar Footer with Logout */}
      <div className="sidebar-footer" style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {user && (
          <>
            <div className="user-info" style={{ padding: 0, marginBottom: "12px" }}>
              <div className="user-avatar" style={{ background: "var(--primary)" }}>
                {getInitials(user.full_name)}
              </div>
              <div className="user-details">
                <div className="user-name" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff" }}>
                  {user.full_name}
                </div>
                <div className="user-role" style={{ fontSize: "0.7rem", color: "var(--sidebar-text)" }}>
                  {roleLabels[role] || role}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              }}
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              ออกจากระบบ (Logout)
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
