import "./globals.css";

export const metadata = {
  title: "IT Helpdesk",
  description: "ระบบรับแจ้งปัญหา IT และติดตามสถานะ — Helpdesk Support System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>
        <div id="app">
          {/* Sidebar */}
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

              <div className="sidebar-section" style={{ marginTop: '16px' }}>Tier 1 Support</div>
              <a href="/tier1" className="nav-item" id="nav-tier1">
                <i className="fa-solid fa-inbox nav-icon"></i>
                <span className="nav-label">รับเรื่อง / ประเมิน</span>
              </a>

              <div className="sidebar-section" style={{ marginTop: '16px' }}>Tier 2 Support</div>
              <a href="/tier2" className="nav-item" id="nav-tier2">
                <i className="fa-solid fa-wrench nav-icon"></i>
                <span className="nav-label">แก้ไขปัญหา</span>
              </a>

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
            </nav>

            <div className="sidebar-footer">
              <div className="user-info">
                <div className="user-avatar">AD</div>
                <div className="user-details">
                  <div className="user-name">Admin Demo</div>
                  <div className="user-role">Administrator</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            {/* Topbar */}
            <header className="topbar">
              <div>
                <h1 className="topbar-title">IT Helpdesk</h1>
                <div className="topbar-breadcrumb">Helpdesk Support System</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline btn-icon" id="btn-notifications">
                  <i className="fa-solid fa-bell"></i>
                </button>
              </div>
            </header>

            {/* Page Body */}
            <div className="page-body">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
