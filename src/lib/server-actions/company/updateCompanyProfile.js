// Path: lib/server-actions/company/updateCompanyProfile.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function updateCompanyProfile(formData) {
  try {
    const cookieStore = await cookies();
    const companyId = cookieStore.get("company_session")?.value;

    if (!companyId) {
      return { success: false, error: "Not authenticated" };
    }

    const company_name = formData.get("company_name")?.trim();
    const phone = formData.get("phone")?.trim();
    const company_address = formData.get("company_address")?.trim();
    const logo_file = formData.get("logo");

    if (!company_name || !phone) {
      return { success: false, error: "Company name and phone are required" };
    }

    const updates = { company_name, phone, company_address: company_address || null };

    // Upload new logo if provided
    if (logo_file && logo_file.size > 0) {
      try {
        const logoBytes = await logo_file.arrayBuffer();
        const logoBuffer = Buffer.from(logoBytes);
        const logoExt = logo_file.name.split(".").pop();
        const logoPath = `${companyId}/logo.${logoExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("company-documents")
          .upload(logoPath, logoBuffer, {
            contentType: logo_file.type,
            cacheControl: "3600",
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from("company-documents")
            .getPublicUrl(logoPath);
          // Bust cache by appending timestamp
          updates.logo_url = `${urlData.publicUrl}?t=${Date.now()}`;
        }
      } catch (logoError) {
        console.error("Logo upload error:", logoError);
        // Continue without updating logo
      }
    }

    const { data: updated, error } = await supabaseAdmin
      .from("companies")
      .update(updates)
      .eq("id", companyId)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return { success: false, error: "Failed to update profile" };
    }

    const { password_hash, ...sanitized } = updated;
    return { success: true, company: sanitized };
  } catch (error) {
    console.error("updateCompanyProfile error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
