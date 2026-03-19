"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function toggleUserStatus(userId, isActive) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    // Update user status
    const { data: updatedUser, error } = await supabaseAdmin
      .from("admin_users")
      .update({ is_active: isActive })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Remove password hash from response
    const { password_hash, ...sanitizedUser } = updatedUser;

    return {
      success: true,
      user: sanitizedUser,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { success: false, error: error.message };
  }
}
