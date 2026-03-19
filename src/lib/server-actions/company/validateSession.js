// Path: lib/server-actions/company/validateSession.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function validateCompanySession() {
  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get("company_session")?.value;

    if (!companyId) {
      return { success: false, error: "No session found" };
    }

    // Fetch company from database to check if still active
    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (error || !company) {
      return { success: false, error: "Company not found" };
    }

    // Check if account is still active
    if (!company.is_active) {
      // Clear the session cookie since account is no longer active
      cookieStore.delete("company_session");
      return {
        success: false,
        error: "Your account has been deactivated. Please contact support.",
      };
    }

    // Remove password hash from response
    const { password_hash, ...sanitizedCompany } = company;

    return {
      success: true,
      company: sanitizedCompany,
    };
  } catch (error) {
    console.error("Error validating company session:", error);
    return { success: false, error: "An error occurred during validation" };
  }
}
