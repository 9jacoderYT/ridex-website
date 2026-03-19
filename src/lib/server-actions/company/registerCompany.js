// Path: lib/server-actions/company/registerCompany.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";

export async function registerCompany(formData) {
  try {
    const company_name = formData.get("company_name")?.trim();
    const email = formData.get("email")?.trim().toLowerCase();
    const phone = formData.get("phone")?.trim();
    const password = formData.get("password");
    const company_address = formData.get("company_address")?.trim();
    const business_registration_number = formData
      .get("business_registration_number")
      ?.trim();
    const nin_number = formData.get("nin_number")?.trim();

    // Get file objects directly
    const id_card_file = formData.get("id_card");
    const logo_file = formData.get("logo");

    // Validation
    if (!company_name || !email || !phone || !password) {
      return {
        success: false,
        error: "Please fill in all required fields",
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long",
      };
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Please enter a valid email address",
      };
    }

    if (!id_card_file) {
      return {
        success: false,
        error: "Please upload your ID card",
      };
    }

    // Check if email already exists
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("email", email)
      .single();

    if (existingCompany) {
      return {
        success: false,
        error:
          "This email is already registered. Please use a different email or login.",
      };
    }

    // Generate a temporary ID for file uploads (using timestamp + random)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let id_card_url = null;
    let logo_url = null;
    let uploadedFiles = []; // Track uploaded files for cleanup

    // STEP 1: Upload ID card FIRST (before database insert)
    try {
      const idCardBytes = await id_card_file.arrayBuffer();
      const idCardBuffer = Buffer.from(idCardBytes);
      const idCardExt = id_card_file.name.split(".").pop();
      const idCardFileName = `${tempId}/id_card.${idCardExt}`;

      const { data: idCardData, error: idCardUploadError } =
        await supabaseAdmin.storage
          .from("company-documents")
          .upload(idCardFileName, idCardBuffer, {
            contentType: id_card_file.type,
            cacheControl: "3600",
            upsert: false,
          });

      if (idCardUploadError) {
        console.error("ID card upload error:", idCardUploadError);
        return {
          success: false,
          error: "Failed to upload ID card. Please try again.",
        };
      }

      uploadedFiles.push(idCardFileName);

      // Get public URL
      const { data: idCardUrlData } = supabaseAdmin.storage
        .from("company-documents")
        .getPublicUrl(idCardFileName);

      id_card_url = idCardUrlData.publicUrl;
    } catch (uploadError) {
      console.error("ID card upload exception:", uploadError);
      return {
        success: false,
        error:
          "An error occurred while uploading your ID card. Please try again.",
      };
    }

    // STEP 2: Upload logo if provided
    if (logo_file) {
      try {
        const logoBytes = await logo_file.arrayBuffer();
        const logoBuffer = Buffer.from(logoBytes);
        const logoExt = logo_file.name.split(".").pop();
        const logoFileName = `${tempId}/logo.${logoExt}`;

        const { data: logoData, error: logoUploadError } =
          await supabaseAdmin.storage
            .from("company-documents")
            .upload(logoFileName, logoBuffer, {
              contentType: logo_file.type,
              cacheControl: "3600",
              upsert: false,
            });

        if (logoUploadError) {
          console.error("Logo upload error:", logoUploadError);
          // Don't fail registration for logo, just log it
        } else {
          uploadedFiles.push(logoFileName);

          const { data: logoUrlData } = supabaseAdmin.storage
            .from("company-documents")
            .getPublicUrl(logoFileName);

          logo_url = logoUrlData.publicUrl;
        }
      } catch (logoError) {
        console.error("Logo upload exception:", logoError);
        // Continue without logo
      }
    }

    // STEP 3: Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // STEP 4: Insert into database (files already uploaded)
    const { data: newCompany, error: insertError } = await supabaseAdmin
      .from("companies")
      .insert({
        company_name,
        email,
        phone,
        password_hash,
        company_address,
        business_registration_number,
        nin_number,
        id_card_url,
        logo_url,
        is_active: false, // Requires admin approval
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);

      // Cleanup: Delete uploaded files since database insert failed
      for (const fileName of uploadedFiles) {
        try {
          await supabaseAdmin.storage
            .from("company-documents")
            .remove([fileName]);
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }

      // Return user-friendly error
      if (insertError.code === "23505") {
        return {
          success: false,
          error:
            "This email is already registered. Please use a different email.",
        };
      }

      return {
        success: false,
        error:
          "Oops! Something went wrong during registration. Please try again.",
      };
    }

    // STEP 5: Rename files to use actual company ID
    const actualCompanyId = newCompany.id;
    let final_id_card_url = id_card_url;
    let final_logo_url = logo_url;

    try {
      // Move ID card to proper location
      const idCardExt = id_card_file.name.split(".").pop();
      const newIdCardPath = `${actualCompanyId}/id_card.${idCardExt}`;
      const oldIdCardPath = `${tempId}/id_card.${idCardExt}`;

      // Copy to new location
      const { error: copyError } = await supabaseAdmin.storage
        .from("company-documents")
        .copy(oldIdCardPath, newIdCardPath);

      if (!copyError) {
        // Delete old file
        await supabaseAdmin.storage
          .from("company-documents")
          .remove([oldIdCardPath]);

        // Get new URL
        const { data: newIdCardUrlData } = supabaseAdmin.storage
          .from("company-documents")
          .getPublicUrl(newIdCardPath);

        final_id_card_url = newIdCardUrlData.publicUrl;
      }

      // Move logo if it exists
      if (logo_url && logo_file) {
        const logoExt = logo_file.name.split(".").pop();
        const newLogoPath = `${actualCompanyId}/logo.${logoExt}`;
        const oldLogoPath = `${tempId}/logo.${logoExt}`;

        const { error: logoCopyError } = await supabaseAdmin.storage
          .from("company-documents")
          .copy(oldLogoPath, newLogoPath);

        if (!logoCopyError) {
          await supabaseAdmin.storage
            .from("company-documents")
            .remove([oldLogoPath]);

          const { data: newLogoUrlData } = supabaseAdmin.storage
            .from("company-documents")
            .getPublicUrl(newLogoPath);

          final_logo_url = newLogoUrlData.publicUrl;
        }
      }

      // Update database with final URLs
      await supabaseAdmin
        .from("companies")
        .update({
          id_card_url: final_id_card_url,
          logo_url: final_logo_url,
        })
        .eq("id", actualCompanyId);
    } catch (renameError) {
      console.error("File rename error:", renameError);
      // Don't fail registration, files are uploaded with temp ID
    }

    // Remove password hash from response
    const { password_hash: _, ...sanitizedCompany } = newCompany;

    return {
      success: true,
      company: {
        ...sanitizedCompany,
        id_card_url: final_id_card_url,
        logo_url: final_logo_url,
      },
      message: "Registration successful! Your account is pending approval.",
    };
  } catch (error) {
    console.error("Error registering company:", error);
    return {
      success: false,
      error: "Oops! An unexpected error occurred. Please try again later.",
    };
  }
}
