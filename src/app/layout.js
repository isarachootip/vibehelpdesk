import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import AppSidebar from "@/components/AppSidebar";

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
          <AppSidebar />

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
        <ChatWidget />
      </body>
    </html>
  );
}
