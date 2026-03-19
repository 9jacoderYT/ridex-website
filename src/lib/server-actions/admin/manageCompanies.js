// Path: lib/server-actions/admin/manageCompanies.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
);

// Verify admin session and return admin data
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-session")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    console.log("JWT Payload:", payload); // Debug log to see what fields are available

    // Return payload with fallback for userId
    return {
      ...payload,
      userId: payload.userId || payload.id || payload.sub, // Try common field names
    };
  } catch (error) {
    throw new Error("Unauthorized");
  }
}

export async function fetchCompanies(filterType = "pending") {
  try {
    await verifyAdminSession();

    let query = supabaseAdmin.from("companies").select("*");

    // Filter based on type
    if (filterType === "pending") {
      // Pending: not approved yet (is_approved = false or null)
      query = query.or("is_approved.is.null,is_approved.eq.false");
    } else if (filterType === "inactive") {
      // Inactive: approved but not active (is_approved = true AND is_active = false)
      query = query.eq("is_approved", true).eq("is_active", false);
    } else if (filterType === "active") {
      // Active: approved and active (is_approved = true AND is_active = true)
      query = query.eq("is_approved", true).eq("is_active", true);
    } else if (filterType === "approved") {
      // Approved: all approved companies (both active and inactive)
      query = query.eq("is_approved", true);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching companies:", error);
      return { success: false, error: "Failed to fetch companies" };
    }

    return { success: true, companies: data };
  } catch (error) {
    console.error("Error in fetchCompanies:", error);
    return { success: false, error: error.message };
  }
}

export async function approveCompany(companyId) {
  try {
    const adminData = await verifyAdminSession();

    console.log("Admin Data for approval:", adminData); // Debug log
    console.log("Admin userId:", adminData.userId); // Debug log

    // Check if company already has a company_id
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("company_id")
      .eq("id", companyId)
      .single();

    let generatedCompanyId = existingCompany?.company_id;

    // If no company_id exists, generate one
    if (!generatedCompanyId) {
      // Get the highest existing company_id number
      const { data: companies } = await supabaseAdmin
        .from("companies")
        .select("company_id")
        .not("company_id", "is", null)
        .order("company_id", { ascending: false })
        .limit(1);

      let nextNumber = 1;

      if (companies && companies.length > 0 && companies[0].company_id) {
        // Extract the number from the last company_id (format: RXCOM-XXXXXX)
        const lastNumber = parseInt(
          companies[0].company_id.replace("RXCOM-", ""),
          10,
        );
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }

      // Format with leading zeros (6 digits)
      generatedCompanyId = `RXCOM-${nextNumber.toString().padStart(6, "0")}`;
    }

    const updateData = {
      company_id: generatedCompanyId,
      is_active: true,
      is_approved: true,
      approved_by: adminData.userId, // Admin ID from JWT
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Update data:", updateData); // Debug log

    // Update company with all approval fields
    const { data, error } = await supabaseAdmin
      .from("companies")
      .update(updateData)
      .eq("id", companyId)
      .select()
      .single();

    if (error) {
      console.error("Error approving company:", error);
      return { success: false, error: "Failed to approve company" };
    }

    console.log("Approved company data:", data); // Debug log

    return {
      success: true,
      company: data,
      message: "Company approved successfully",
    };
  } catch (error) {
    console.error("Error in approveCompany:", error);
    return { success: false, error: error.message };
  }
}

export async function deactivateCompany(companyId) {
  try {
    await verifyAdminSession();

    const { data, error } = await supabaseAdmin
      .from("companies")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", companyId)
      .select()
      .single();

    if (error) {
      console.error("Error deactivating company:", error);
      return { success: false, error: "Failed to deactivate company" };
    }

    return {
      success: true,
      company: data,
      message: "Company deactivated successfully",
    };
  } catch (error) {
    console.error("Error in deactivateCompany:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCompany(companyId) {
  try {
    await verifyAdminSession();

    // First, get the company details to find file URLs
    const { data: company, error: fetchError } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (fetchError) {
      console.error("Error fetching company:", fetchError);
      return { success: false, error: "Failed to fetch company details" };
    }

    // Delete files from storage
    const filesToDelete = [];

    if (company.id_card_url) {
      // Extract path from URL
      const idCardPath = company.id_card_url.split("/company-documents/").pop();
      if (idCardPath) filesToDelete.push(idCardPath);
    }

    if (company.logo_url) {
      // Extract path from URL
      const logoPath = company.logo_url.split("/company-documents/").pop();
      if (logoPath) filesToDelete.push(logoPath);
    }

    // Delete files from storage if any exist
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("company-documents")
        .remove(filesToDelete);

      if (storageError) {
        console.error("Error deleting files:", storageError);
        // Continue with company deletion even if file deletion fails
      }
    }

    // Delete company from database
    const { error: deleteError } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (deleteError) {
      console.error("Error deleting company:", deleteError);
      return { success: false, error: "Failed to delete company" };
    }

    return { success: true, message: "Company deleted successfully" };
  } catch (error) {
    console.error("Error in deleteCompany:", error);
    return { success: false, error: error.message };
  }
}

// New function to generate company ID
export async function generateCompanyId() {
  try {
    await verifyAdminSession();

    // Get the latest company to determine the next number
    const { data: lastCompany, error } = await supabaseAdmin
      .from("companies")
      .select("company_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;

    if (!error && lastCompany?.company_id) {
      // Extract the number from the last company_id (format: RXCOM-XXXXXX)
      const lastNumber = parseInt(
        lastCompany.company_id.replace("RXCOM-", ""),
        10,
      );
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format with leading zeros (6 digits)
    const companyId = `RXCOM-${nextNumber.toString().padStart(6, "0")}`;

    return { success: true, companyId };
  } catch (error) {
    console.error("Error generating company ID:", error);
    return { success: false, error: error.message };
  }
}
