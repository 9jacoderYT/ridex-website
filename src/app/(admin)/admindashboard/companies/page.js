// Path: app/admindashboard/companies/page.js

import { Suspense } from "react";
import AllCompanies from "@/components/admin/AllCompanies";

export default function AllCompaniesPage() {
  return (
    <Suspense>
      <AllCompanies />
    </Suspense>
  );
}
