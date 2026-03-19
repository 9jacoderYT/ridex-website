"use server";

import { supabaseAdmin } from "../supabase-server";
import { createSession } from "../utils/session";
import bcrypt from "bcryptjs";

export async function loginAdmin(formData) {
  try {
    const username = formData.get("username")?.toString().trim();
    const password = formData.get("password")?.toString();

    // Validation
    if (!username || !password) {
      return {
        success: false,
        error: "Username and password are required",
      };
    }

    // Query admin user from database
    const { data: adminUser, error: dbError } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (dbError || !adminUser) {
      return {
        success: false,
        error: "Invalid username or password",
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      adminUser.password_hash,
    );

    if (!isPasswordValid) {
      // Log failed login attempt
      await supabaseAdmin.from("admin_login_history").insert({
        admin_user_id: adminUser.id,
        success: false,
        ip_address: null, // You can get this from headers
        user_agent: null,
      });

      return {
        success: false,
        error: "Invalid username or password",
      };
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
    return {
      success: false,
      error: "An error occurred during login. Please try again.",
    };
  }
}
