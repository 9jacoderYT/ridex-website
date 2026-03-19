// Path: lib/server-actions/company/updateCompanyIdCard.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function updateCompanyIdCard(companyId, fileUrl, isLogo = false) {
  try {
    if (!companyId || !fileUrl) {
      return { success: false, error: "Company ID and file URL are required" };
    }

    // Determine which field to update
    const updateField = isLogo ? "logo_url" : "id_card_url";

    // Update company with file URL
    const { data: updatedCompany, error } = await supabaseAdmin
      .from("companies")
      .update({ [updateField]: fileUrl })
      .eq("id", companyId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      company: updatedCompany,
      message: `${isLogo ? "Logo" : "ID card"} URL updated successfully`,
    };
  } catch (error) {
    console.error("Error updating company file URL:", error);
    return { success: false, error: error.message };
  }
}
