import "./globals.css";

export const metadata = {
  title: "Helpdesk System",
  description: "ระบบรับแจ้งปัญหา IT และติดตามสถานะ",
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
              <a href="/" className="nav-item">
                <i className="fa-solid fa-home nav-icon"></i>
                <span className="nav-label">Dashboard</span>
              </a>
              <a href="#" className="nav-item">
                <i className="fa-solid fa-ticket nav-icon"></i>
                <span className="nav-label">My Tickets</span>
              </a>
              <div className="sidebar-section mt-4">Master Data</div>
              <a href="/master/bu" className="nav-item">
                <i className="fa-solid fa-building nav-icon"></i>
                <span className="nav-label">Business Units</span>
              </a>
            </nav>

            <div className="sidebar-footer">
              <div className="user-info">
                <div className="user-avatar">US</div>
                <div className="user-details">
                  <div className="user-name">User Demo</div>
                  <div className="user-role">End User</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            {/* Topbar */}
            <header className="topbar">
              <div>
                <h1 className="topbar-title">Dashboard</h1>
                <div className="topbar-breadcrumb">Helpdesk / Dashboard</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline btn-icon">
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
