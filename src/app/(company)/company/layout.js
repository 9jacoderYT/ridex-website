// Path: app/company/layout.js (Enhanced Version with Navbar)

"use client";

import { CompanyProvider } from "@/components/company/CompanyContext";

export default function CompanyLayout({ children }) {
  return (
    <CompanyProvider>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </CompanyProvider>
  );
}
