"use server";

import { supabaseAdmin } from "../supabase-server";
import { getSession } from "../utils/session";

export async function getCurrentUser() {
  try {
    const session = await getSession();

    if (!session) {
      return {
        success: false,
        user: null,
      };
    }

    // Fetch fresh user data from database
    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select(
        "id, username, email, full_name, role_name, role_description, is_active, last_login_time",
      )
      .eq("id", session.id)
      .eq("is_active", true)
      .single();

    if (error || !adminUser) {
      return {
        success: false,
        user: null,
      };
    }

    return {
      success: true,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        fullName: adminUser.full_name,
        role: adminUser.role_name,
        roleDescription: adminUser.role_description,
        lastLoginTime: adminUser.last_login_time,
      },
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return {
      success: false,
      user: null,
    };
  }
}
