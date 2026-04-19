"use client"
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useEffect, useMemo } from "react";
import TableMain from "@/components/reusables/table/TableMain";
import { useParams, useRouter } from "next/navigation";
import hasAccess from "@/lib/accessPermissionSecurity";
import { GenericModal } from "@/components/reusables/GenericModal";
import AddEmployeeForm from "./AddEmployeeForm";
import { Plus, Users2, PersonStanding, UserCheck, ShieldAlert } from "lucide-react"
import { Card, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import CustomButton from "@/components/reusables/CustomButton";
import { useRoleStore } from "@/store/rolesStore";
import { useEmployeeStore } from "@/store/employeeStore";
import { employeeColumns } from "@/components/tablesColumnDef/employeeColumns";
import { AppResponse } from "@/types/auth";

export default function EmployeeList() {
  const router = useRouter();
  const { slug } = useParams();
  const {roles, fetchRoles} = useRoleStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  //Stores
  const { currentSlug, user } = useAuthStore()
  const {employees, loading, fetchEmployees} = useEmployeeStore();
  //Fetching Roles
  useEffect(() => {
    // Check if data needs to be fetched
    if (roles.length === 0) fetchRoles();
    fetchEmployees();
  }, [fetchRoles, roles.length, fetchEmployees]);

// 2. Stats calculated from REAL database data
const stats = useMemo(() => {
  const empList = employees || []; // Fallback to empty array
  const active = empList.filter(e => e.isActive).length;
  const admins = empList.filter(e => e.role?.name.toLowerCase().includes("admin")).length;

  return [
    { label: "Total Staff", value: empList.length, icon: Users2, color: "text-blue-800" },
    { label: "Active", value: active, icon: UserCheck, color: "text-green-600" },
    { label: "On Leave", value: 0, icon: PersonStanding, color: "text-orange-600" },
    { label: "Admins", value: admins, icon: ShieldAlert, color: "text-purple-600" },
  ];
}, [employees]);

  useEffect(() => {
    if (!hasAccess(user, "dashboard")) {
      router.push(`/${user?.business.slug}/dashboard`);
    }
  }, [user, router]);

  if (slug !== currentSlug) {
    router.push(`/${user?.business.slug}/dashboard`);
  }

  const handleMultipleDelete = async(ids: string[]): Promise<AppResponse> => {
    console.log("Passed IDS: ")
    console.log(ids)
    return {
      success: true,
      message: `Delete ${ids.length} records`
    }as AppResponse;
  }
  
  if (!user || !hasAccess(user, "dashboard")) return <div className="p-10 text-center">Unauthorized</div>;

  return (
    <div className="h-fit min-h-screen bg-gray-5 rounded-2xl flex flex-col gap-4 p-4">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-base text-blue-950 md:text-2xl font-semibold flex items-center gap-2 uppercase tracking-tight">
          Staff <PersonStanding className="h-7 w-7 border-2 border-blue-950 p-1 rounded-full" />
        </h1>
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h1 className="text-gray-500 text-sm md:text-base">Manage your staff members</h1>
          
          <div className="flex flex-wrap gap-2 md:gap-4 items-center">
            <GenericModal
              header="Add New Staff" // Changed from header to title based on standard GenericModal props
              description="Fill in the details to invite a new employee to your business."
              isOpen={isModalOpen}
              onOpenChange={setIsModalOpen}
              triggerBtn={ // Changed from triggerBtn to trigger
                <CustomButton
                  className="border-blue-900 text-blue-900 font-bold"
                  text="Add Employee"
                  variant="outline"
                  customVariant="secondary"
                  icon={<Plus className="mr-2 h-4 w-4" />} 
                />
              }
            >
              <AddEmployeeForm
                onSuccess={() => {
                  setIsModalOpen(false);
                  fetchEmployees(); // Refresh list immediately
                }}
                roles={roles}  //<-- Pass your roles from server/props here
                // shops={shops}  <-- Pass your shops from server/props here
              />
            </GenericModal>
          </div>
        </header>
      </div>

      {/* Stats Grid - Now Looped */}
      <article className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="w-full h-28 shadow-lg border-none p-2">
            <CardHeader className="p-2 pb-2">
              <CardDescription className="flex gap-2 items-center text-gray-600">
                <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                <span className="text-xs md:text-sm font-medium uppercase truncate">{stat.label}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <p className="text-xl md:text-3xl font-bold text-blue-950">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </article>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <TableMain 
          columns={employeeColumns} 
          data={employees? employees : []} 
          searchKey="firstName"
          columnVisibilityFilter={true}
          placeholder="Search by name..." 
          loading= {loading}
          onActionSuccess={()=> fetchEmployees()}
          handleMultipleDelete={handleMultipleDelete}
        />
      </div>
    </div>
  );
}