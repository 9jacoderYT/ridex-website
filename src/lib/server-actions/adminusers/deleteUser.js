"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function deleteUser(userId) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Prevent deleting the Super Admin env var account (if it exists in DB)
    const { data: user } = await supabaseAdmin
      .from("admin_users")
      .select("email")
      .eq("id", userId)
      .single();

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
    if (superAdminEmail && user?.email?.toLowerCase() === superAdminEmail) {
      return {
        success: false,
        error: "Cannot delete the Super Admin account",
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
