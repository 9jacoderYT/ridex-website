"use server";

import { supabaseAdmin } from "../supabase-server";
import { createSession } from "../utils/session";
import bcrypt from "bcryptjs";

export async function loginAdmin(formData) {
  try {
    const email = formData.get("email")?.toString().trim().toLowerCase();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    // ── Super Admin via env vars (bypasses DB) ──────────────────────────
    const superEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
    const superPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (superEmail && superPassword && email === superEmail && password === superPassword) {
      await createSession({
        id: "super-admin-env",
        username: "superadmin",
        role_name: "Super Admin",
        email: superEmail,
        full_name: "Super Admin",
      });

      return {
        success: true,
        user: {
          id: "super-admin-env",
          username: "superadmin",
          role: "Super Admin",
          roleDescription: "Full access to all system modules and settings",
          email: superEmail,
          fullName: "Super Admin",
        },
      };
    }

    // ── DB-based admin login ────────────────────────────────────────────
    const { data: adminUser, error: dbError } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .single();

    if (dbError || !adminUser) {
      return { success: false, error: "Invalid email or password" };
    }

    // Account checks
    if (adminUser.is_suspended) {
      return { success: false, error: "Your account has been suspended. Contact the Super Admin." };
    }

    if (!adminUser.password_set) {
      return { success: false, error: "Account setup not completed. Please check your email for the setup link." };
    }

    if (!adminUser.is_active) {
      return { success: false, error: "Your account is inactive. Contact the Super Admin." };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);

    if (!isPasswordValid) {
      await supabaseAdmin.from("admin_login_history").insert({
        admin_user_id: adminUser.id,
        success: false,
        failure_reason: "Wrong password",
        ip_address: null,
        user_agent: null,
      });

      return { success: false, error: "Invalid email or password" };
    }

    // Update last login time
    await supabaseAdmin
      .from("admin_users")
      .update({ last_login_time: new Date().toISOString() })
      .eq("id", adminUser.id);

    // Log successful login
    await supabaseAdmin.from("admin_login_history").insert({
      admin_user_id: adminUser.id,
      success: true,
      ip_address: null,
      user_agent: null,
    });

    // Create session
    await createSession(adminUser);

    return {
      success: true,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role_name,
        roleDescription: adminUser.role_description,
        email: adminUser.email,
        fullName: adminUser.full_name,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An error occurred during login. Please try again." };
  }
}
