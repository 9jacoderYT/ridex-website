"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function deleteUser(userId) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Check if user is trying to delete the default admin
    const { data: user } = await supabaseAdmin
      .from("admin_users")
      .select("username")
      .eq("id", userId)
      .single();

    if (user?.username === "admin") {
      return {
        success: false,
        error: "Cannot delete default admin user",
      };
    }

    // Delete user
    const { error } = await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}
