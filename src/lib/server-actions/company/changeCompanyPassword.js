// Path: lib/server-actions/company/changeCompanyPassword.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function changeCompanyPassword({ currentPassword, newPassword }) {
  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get("company_session")?.value;

    if (!companyId) {
      return { success: false, error: "Not authenticated" };
    }

    if (!currentPassword || !newPassword) {
      return { success: false, error: "Both current and new password are required" };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters" };
    }

    // Fetch current hash
    const { data: company, error: fetchError } = await supabaseAdmin
      .from("companies")
      .select("password_hash")
      .eq("id", companyId)
      .single();

    if (fetchError || !company) {
      return { success: false, error: "Company not found" };
    }

    const valid = await bcrypt.compare(currentPassword, company.password_hash);
    if (!valid) {
      return { success: false, error: "Current password is incorrect" };
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({ password_hash: newHash })
      .eq("id", companyId);

    if (updateError) {
      console.error("Password update error:", updateError);
      return { success: false, error: "Failed to update password" };
    }

    return { success: true };
  } catch (error) {
    console.error("changeCompanyPassword error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
