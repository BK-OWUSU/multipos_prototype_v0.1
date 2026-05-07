// app/[slug]/access_controls/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";
import RolesList from "./components/RolesList";
import RoleDetails from "./components/RoleDetails";
import RolePermissions from "./components/RolePermissions";
import RoleAccess from "./components/RoleAccess";
import RoleUsers from "./components/RoleUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericModal } from "@/components/reusables/GenericModal";
import CreateRoleForm from "./components/CreateRoleForm"; // ✅ Now this exists!

export default function AccessControlsPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col p-6 bg-gray-50">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage user roles, permissions and access to system modules
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Roles
            </Button>
            
            <GenericModal
              header="Create New Role"
              description="Define a new role with specific permissions and access controls"
              isOpen={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
              triggerBtn={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              }
            >
              <CreateRoleForm onSuccess={() => setIsCreateModalOpen(false)} />
            </GenericModal>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Sidebar - Roles List */}
        <div className="w-80 shrink-0">
          <RolesList 
            selectedRoleId={selectedRoleId}
            onRoleSelect={setSelectedRoleId}
          />
        </div>

        {/* Right Panel - Role Details with Tabs */}
        <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
          {selectedRoleId ? (
            <Tabs defaultValue="access" className="flex-1 flex flex-col min-h-0">
              {/* Role Header */}
              <div className="border-b px-6 py-4 shrink-0">
                <RoleHeader roleId={selectedRoleId} />
              </div>

              {/* Tabs Navigation */}
              <TabsList className="border-b px-6 bg-transparent h-auto p-0 justify-start shrink-0">
                <TabsTrigger 
                  value="details" 
                  // className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger 
                  value="permissions"
                  // className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Permissions (12)
                </TabsTrigger>
                <TabsTrigger 
                  value="access"
                  // className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Access (29)
                </TabsTrigger>
                <TabsTrigger 
                  value="users"
                  // className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Users (1)
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden relative">
                <TabsContent value="details" className="m-0 p-6 h-full overflow-y-auto">
                  <RoleDetails roleId={selectedRoleId} />
                </TabsContent>

                <TabsContent value="permissions" className="m-0 p-6 h-full overflow-y-auto">
                  <RolePermissions roleId={selectedRoleId} />
                </TabsContent>

                <TabsContent value="access" className="m-0 p-6 h-full overflow-y-auto">
                  <RoleAccess roleId={selectedRoleId} />
                </TabsContent>

                <TabsContent value="users" className="m-0 p-6 h-full overflow-y-auto">
                  <RoleUsers roleId={selectedRoleId} />
                </TabsContent>
              </div>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg font-medium">No role selected</p>
                <p className="text-sm mt-1">Select a role from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple header component to show role info
function RoleHeader({ roleId }: { roleId: string }) {
  // TODO: Fetch role data based on roleId
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
          <span className="text-2xl">🛡️</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Super Admin</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
              System Role
            </span>
          </div>
          <p className="text-sm text-gray-500">Full system access with all permissions and modules</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          Delete
        </Button>
      </div>
    </div>
  );
}