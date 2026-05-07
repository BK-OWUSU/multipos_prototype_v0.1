// app/[slug]/access_controls/components/RolesList.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Search, Users,ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface RolesListProps {
  selectedRoleId: string | null;
  onRoleSelect: (roleId: string) => void;
}

// Mock data - replace with actual data
const mockRoles = [
  {
    id: "1",
    name: "Super Admin",
    description: "Full system access",
    type: "system",
    usersCount: 1,
    color: "purple",
  },
  {
    id: "2",
    name: "Admin",
    description: "Manage all operations",
    type: "system",
    usersCount: 3,
    color: "green",
  },
  {
    id: "3",
    name: "Manager",
    description: "Manage daily operations",
    type: "custom",
    usersCount: 5,
    color: "orange",
  },
  {
    id: "4",
    name: "Cashier",
    description: "Process sales and returns",
    type: "custom",
    usersCount: 8,
    color: "blue",
  }, 
  {
    id: "5",
    name: "Cashier",
    description: "Process sales and returns",
    type: "custom",
    usersCount: 8,
    color: "blue",
  },
  {
    id: "6",
    name: "Cashier",
    description: "Process sales and returns",
    type: "custom",
    usersCount: 8,
    color: "blue",
  },
  {
    id: "7",
    name: "Cashier",
    description: "Process sales and returns",
    type: "custom",
    usersCount: 8,
    color: "blue",
  },
  {
    id: "8",
    name: "Cashier",
    description: "Process sales and returns",
    type: "custom",
    usersCount: 8,
    color: "blue",
  },
  
];

export default function RolesList({ selectedRoleId, onRoleSelect }: RolesListProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm mb-3">Roles (7)</h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search roles..." 
            className="pl-9 h-9"
          />
        </div>

        {/* Filter */}
        <Select defaultValue="all">
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
            <SelectItem value="custom">Temporary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Roles List */}
      <div className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {mockRoles.map((role) => (
            <Card
              key={role.id}
              onClick={() => onRoleSelect(role.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg border-2 transition-all hover:border-primary/50 my-2",
                selectedRoleId === role.id
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:bg-gray-50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  role.color === "purple" && "bg-purple-100",
                  role.color === "green" && "bg-green-100",
                  role.color === "orange" && "bg-orange-100",
                  role.color === "blue" && "bg-blue-100"
                )}>
                  <ShieldCheck className="h-5 w-5 " />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">{role.name}</h4>
                    {role.type === "system" && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        System
                      </span>
                    )}
                    {role.type === "custom" && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{role.description}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users className="h-3 w-3" />
                    <span>{role.usersCount} user{role.usersCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t text-xs text-gray-500">
        Showing 1 to 7 of {mockRoles.length} roles
      </div>
    </div>
  );
}