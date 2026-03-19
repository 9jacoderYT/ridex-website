// src/app/(site)/layout.js
"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import SupportModal from "@/components/landing/SupportModal";

export default function SiteLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <SupportModal />
    </>
  );
}
