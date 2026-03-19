import { Suspense } from "react";
import AppUsers from "@/components/admin/AppUsers";

export const metadata = {
  title: "App Users — RideX Admin",
};

export default function AppUsersPage() {
  return (
    <Suspense>
      <AppUsers />
    </Suspense>
  );
}
