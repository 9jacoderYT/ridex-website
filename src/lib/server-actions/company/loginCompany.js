// Path: lib/server-actions/company/loginCompany.js

"use server";

import { supabaseAdmin } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function loginCompany(formData) {
  try {
    const email = formData.get("email")?.trim().toLowerCase();
    const password = formData.get("password");
    const rememberMe = formData.get("rememberMe") === "true";

    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    // Find company by email
    const { data: company, error } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !company) {
      return { success: false, error: "Invalid email or password" };
    }

    // Check if account is active
    if (!company.is_active) {
      return {
        success: false,
        error:
          "Your account is pending approval. Please wait for admin activation.",
      };
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, company.password_hash);

    if (!passwordMatch) {
      // Log failed attempt
      await supabaseAdmin.from("company_login_history").insert({
        company_id: company.id,
        success: false,
        failure_reason: "Invalid password",
      });

      return { success: false, error: "Invalid email or password" };
    }

    // Log successful login
    await supabaseAdmin.from("company_login_history").insert({
      company_id: company.id,
      success: true,
    });

    // Remove password hash from response
    const { password_hash, ...sanitizedCompany } = company;

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("company_session", company.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe
        ? 60 * 60 * 24 * 30 // 30 days if Remember Me checked
        : 60 * 60 * 8,      // 8 hours otherwise
    });

    return {
      success: true,
      company: sanitizedCompany,
      message: "Login successful",
    };
  } catch (error) {
    console.error("Error during company login:", error);
    return { success: false, error: "An error occurred during login" };
  }
}
