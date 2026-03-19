"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function getUserActivity() {
  try {
    const { data: activity, error } = await supabaseAdmin
      .from("admin_login_history")
      .select(
        `
        *,
        admin_users (
          id,
          username,
          full_name,
          email,
          role_name
        )
      `,
      )
      .order("login_time", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return { success: true, activity };
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserActivityById(userId) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const { data: activity, error } = await supabaseAdmin
      .from("admin_login_history")
      .select("*")
      .eq("admin_user_id", userId)
      .order("login_time", { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return { success: true, activity };
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return { success: false, error: error.message };
  }
}
