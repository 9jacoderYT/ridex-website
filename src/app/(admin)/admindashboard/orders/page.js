import { Suspense } from "react";
import AllOrders from "@/components/admin/AllOrders";

export const metadata = {
  title: "All Orders — RideX Admin",
};

export default function OrdersPage() {
  return (
    <Suspense>
      <AllOrders />
    </Suspense>
  );
}
