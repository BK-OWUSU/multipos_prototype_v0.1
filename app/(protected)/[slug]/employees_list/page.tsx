"use client"
import { useAuthStore } from "@/store/useAuthStore";
import data from "@/store/data.json"
import { useState,useEffect } from "react";
import { User } from "@/components/tablesColumnDef/testColumn";
import TableMain from "@/components/reusables/table/TableMain";
import { testColumn } from "@/components/tablesColumnDef/testColumn";
import { useParams,useRouter } from "next/navigation";
import hasAccess from "@/lib/accessPermissionSecurity";

export default function EmployeeList() {
  const router = useRouter();
  const { slug } = useParams();
  const {currentSlug, user} = useAuthStore()
  const [testData] = useState<User[]>(()=> [...data])

     useEffect(() => {
      if (!hasAccess(user, "dashboard")) {
        router.push(`/${user?.business.slug}/dashboard`);
      }
    }, [user,router]);

  if (slug !== currentSlug) {
     router.push(`/${user?.business.slug}/dashboard`);
  }
  
  if (!user || !hasAccess(user, "dashboard")) return <div>Unauthorized</div>;

  return (
    <div>
      {/* <h1>Employee List</h1>
      <p>Employee List page content goes here.</p> */}
      <div className=' bg-white shadow-2xl rounded-lg'>
        <TableMain 
        columns={testColumn} 
        data={testData} 
        searchKey="name"
        columnVisibilityFilter={true}
        placeholder="Search by name..." />
      </div>
    </div>
  );
}
