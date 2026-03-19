// Path: src/components/company/CompanyContext.js

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutCompany } from "@/lib/server-actions/company/logout";
import { validateCompanySession } from "@/lib/server-actions/company/validateSession";

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Validate session on mount
    validateSession();
  }, []);

  const validateSession = async () => {
    setLoading(true);
    try {
      const result = await validateCompanySession();

      if (result.success) {
        // Update company data from database (includes company_id)
        setCompany(result.company);
        // Also update localStorage with complete data
        localStorage.setItem("companyUser", JSON.stringify(result.company));
      } else {
        // Session invalid, clear everything
        localStorage.removeItem("companyUser");
        setCompany(null);
      }
    } catch (error) {
      console.error("Error validating session:", error);
      localStorage.removeItem("companyUser");
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // Clear localStorage
    localStorage.removeItem("companyUser");
    setCompany(null);

    // Call server action to clear session cookie
    try {
      await logoutCompany();
      router.push("/company/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/company/login");
    }
  };

  const updateCompanyData = (data) => {
    const updatedCompany = { ...company, ...data };
    setCompany(updatedCompany);
    localStorage.setItem("companyUser", JSON.stringify(updatedCompany));
  };

  return (
    <CompanyContext.Provider
      value={{ company, loading, logout, updateCompanyData, validateSession }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}
