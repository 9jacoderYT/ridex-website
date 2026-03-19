"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function getUsers() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Remove password hashes from response
    const sanitizedUsers = users.map(({ password_hash, ...user }) => user);

    return { success: true, users: sanitizedUsers };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: error.message };
  }
}
