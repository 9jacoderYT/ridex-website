// Path: lib/server-actions/company/uploadIdCard.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function uploadIdCard(formData) {
  try {
    const file = formData.get("file");
    const companyId = formData.get("company_id");
    const fileType = formData.get("file_type") || "id_card"; // "id_card" or "logo"

    if (!file || !companyId) {
      return { success: false, error: "File and company ID are required" };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename based on file type
    const fileExt = file.name.split(".").pop();
    const fileName = `${companyId}/${fileType}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from("company-documents")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return {
        success: false,
        error: `Failed to upload ${fileType}: ${uploadError.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("company-documents")
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
      message: `${fileType === "logo" ? "Logo" : "ID card"} uploaded successfully`,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { success: false, error: error.message };
  }
}
