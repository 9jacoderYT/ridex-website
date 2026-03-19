"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/components/admin/AdminContext";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function DashboardPage() {
  const { admin, loading } = useAdmin();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !admin && mounted) {
      router.push("/loginadminusers");
    }
  }, [admin, loading, router, mounted]);

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return <AdminDashboard />;
}
