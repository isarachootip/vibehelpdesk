import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import AppLayout from "@/components/AppLayout";

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
        <AppLayout>{children}</AppLayout>
        <ChatWidget />
      </body>
    </html>
  );
}
