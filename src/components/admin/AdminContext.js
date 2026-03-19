"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAdmin } from "@/lib/server-actions/logout";

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load admin data from localStorage
    // This is synced with server session by AdminLogin
    const adminData = localStorage.getItem("adminUser");
    if (adminData) {
      try {
        setAdmin(JSON.parse(adminData));
      } catch (error) {
        console.error("Failed to parse admin data:", error);
        localStorage.removeItem("adminUser");
      }
    }
    setLoading(false);
  }, []);

  const logout = async () => {
    // Clear localStorage
    localStorage.removeItem("adminUser");
    setAdmin(null);

    // Call server action to clear session cookie
    try {
      await logoutAdmin();
    } catch (error) {
      // If server logout fails, still redirect
      console.error("Logout error:", error);
      router.push("/loginadminusers");
    }
  };

  const updateAdminData = (data) => {
    const updatedAdmin = { ...admin, ...data };
    setAdmin(updatedAdmin);
    localStorage.setItem("adminUser", JSON.stringify(updatedAdmin));
  };

  return (
    <AdminContext.Provider value={{ admin, loading, logout, updateAdminData }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
