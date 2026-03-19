import "./globals.css";

import { AdminProvider } from "@/components/admin/AdminContext";

export const metadata = {
  title: "RIDEX - Fast Delivery Across Nigeria",
  description:
    "Book reliable bike riders for your business deliveries. Fast, secure, and hassle-free logistics at your fingertips.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AdminProvider>{children}</AdminProvider>
      </body>
    </html>
  );
}
