"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Employee } from "@/types/auth"
import { Badge } from "@/components/ui/badge"
import { 
  Users, Mail, Phone, ShieldCheck, 
  Store, MoreHorizontal, UserRoundX,
  UserX, UserCheck, Trash2, CheckCircle2, XCircle, 
  KeyRound, Lock, Unlock, ShieldAlert, Shield
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useEmployeeStore } from "@/store/employeeStore"
import { toast } from "sonner"
import AlertWithDialogue from "../reusables/AlertWithDialogue"
import Image from "next/image"
import { grantEmployeeAccess, revokeEmployeeAccess } from "@/lib/actions/business/employeesActions"
import { useRouter } from "next/navigation"

const ActionCell = ({ employee }: { employee: Employee }) => {
  // Ensure these functions are exported from your store!
  const { toggleEmployeeStatus, deleteEmployee, fetchEmployees } = useEmployeeStore()
  const router = useRouter();
  
  return (
    <DropdownMenu >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => {
            navigator.clipboard.writeText(employee.email)
            toast.success("Email copied to clipboard")
        }}>
          Copy Email
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        {/* Dynamic Access Toggle based on hasSystemAccess boolean */}
        {!employee.hasSystemAccess ? (
          <DropdownMenuItem onClick={() => {
            // grantAccess(employee.id)
              toast.promise(grantEmployeeAccess(employee.id),{
                loading: "Granting access...",
                success: (res)=> {
                  if(res.success) {
                    fetchEmployees();
                    return res.message || "Access granted successfully."
                  }else {
                    throw new Error(res.error);
                  }
                },
                error: "An error occurred while granting access."
              })
            }}>
            <span className="flex items-center text-blue-600">
              <Shield className="mr-2 h-4 w-4" /> Grant Access
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => {
            // revokeAccess(employee.id)
            toast.promise(revokeEmployeeAccess(employee.id),{
              loading: "Revoking access...",
              success: (res)=> {
                if(res.success) {
                  fetchEmployees();
                  return res.message || "Access revoked successfully."
                }else {
                  throw new Error(res.error);
                }
              },
              error: "An error occurred while revoking access."
            })
          }}>
            <span className="flex items-center text-orange-600">
              <ShieldAlert className="mr-2 h-4 w-4" /> Revoke Access
            </span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => toggleEmployeeStatus(employee.id, employee.isActive)}>
          {employee.isActive ? (
            <span className="flex items-center text-yellow-600">
              <UserX className="mr-2 h-4 w-4" /> Deactivate
            </span>
          ) : (
            <span className="flex items-center text-green-600">
              <UserCheck className="mr-2 h-4 w-4" /> Activate
            </span>
          )}
        </DropdownMenuItem>

        <AlertWithDialogue
          button={
            <DropdownMenuItem
              className="text-destructive"
              onSelect={(e) => e.preventDefault()}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          }
          buttonText="Delete"
          customVariant="primary"
          btnClassName="p-4"
          confirmText="Yes, Delete"
          cancelText="Cancel"
          title="Delete Staff Record"
          message={`Are you sure? This will remove ${employee.firstName}'s profile and all system access. This cannot be undone.`}
          confirmFunction={() => deleteEmployee(employee.id)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const employeeColumns: ColumnDef<Employee>[] = [
  {
    accessorKey: "firstName", // Covers: firstName, lastName, imageUrl, designation
    header: () => (<span className='flex items-center'><Users className="mr-2" size={16}/>Employee</span>),
    cell: ({ row }) => {
      const { firstName, lastName, imageUrl, designation, isActive } = row.original;
      return (
        <div className={`flex items-center gap-3 ${!isActive ? 'opacity-50' : ''}`}>
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-background shadow-sm">
            {imageUrl ? (
              <Image src={imageUrl} alt={firstName} width={36} height={36} className="object-cover h-full w-full" />
            ) : (
              <Users size={16} className="text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-none mb-1">{`${firstName} ${lastName}`}</span>
            <span className="text-sm text-muted-foreground font-medium">
              {designation || "No Designation"}
            </span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "email",
    header: () => (<span className='flex items-center'><Mail className="mr-2" size={16}/>Email</span>),
    cell: ({row}) => <span className="text-sm">{row.original.email}</span>
  },
  {
    accessorKey: "phone",
    header: () => (<span className='flex items-center'><Phone className="mr-2" size={16}/>Contact</span>),
    cell: ({ row }) => <span className="text-sm">{row.original.phone || "—"}</span>
  },
  {
    accessorKey: "role.name",
    header: () => (<span className='flex items-center'><ShieldCheck className="mr-2" size={16}/>Role</span>),
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
        {row.original.role?.name}
      </Badge>
    )
  },
  {
    accessorKey: "shop.name",
    header: () => (<span className='flex items-center'><Store className="mr-2" size={16}/>Assigned Shop</span>),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-xs font-medium">{row.original.shop?.name || "Floating"}</span>
      </div>
    )
  },
  {
    accessorKey: "hasSystemAccess", // Primary Boolean Field
    header: "Access",
     filterFn: "equals",
    meta: {
      filterVariant: "select", 
      trueLabel: "Software User",   
      falseLabel: "On-Site Only" 
    },
    cell: ({ row }) => (
      <Badge variant={row.original.hasSystemAccess ? "default" : "secondary"} className="text-[10px] uppercase">
        {row.original.hasSystemAccess ? "Software User" : "On-Site Only"}
      </Badge>
    )
  },
  {
    accessorKey: "user.isVerified", 
    header: () => <div className="text-center">Verified</div>,
    filterFn: "equals",
    meta: {
      filterVariant: "select", 
      trueLabel: "Verified",   
      falseLabel: "Unverified" 
    },
    cell: ({ row }) => (
      <div className="flex justify-center">
        {!row.original.hasSystemAccess ? (
          <UserRoundX className="text-red-500 h-4 w-4" />
        ) : row.original.user?.isVerified ? (
          <CheckCircle2 className="text-green-500 h-4 w-4" />
        ) : (
          <XCircle className="text-orange-400 h-4 w-4" />
        )}
      </div>
    )
  },
  {
    accessorKey: "isActive",
    header: "Status",
     filterFn: "equals",
    meta: {
      filterVariant: "select", 
      trueLabel: "Active",   
      falseLabel: "Inactive" 
    },
    cell: ({ row }) => {
      const active = row.original.isActive
      return (
        <div className="flex items-center gap-2">
           <div className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
           <span className={`text-xs font-medium ${active ? 'text-green-700' : 'text-red-700'}`}>
             {active ? "Active" : "Inactive"}
           </span>
        </div>
      )
    }
  },
  {
    accessorKey: "user.needsPasswordChange",
    header: () => (<span className='flex items-center'><KeyRound className="mr-2" size={16}/>Security</span>),
    filterFn: "equals",
    meta: {
        filterVariant: "select",
        trueLabel: "Temp Pass",
        falseLabel: "Secure"
    },
    cell: ({ row }) => {
      const user = row.original.user;
      if (!row.original.hasSystemAccess || !user) return (
        <div className="flex items-center">
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-sm gap-1">
            <ShieldAlert size={10} /> No Access
          </Badge>
        </div>
      );

      return (
        <div className="flex items-center">
          {user.needsPasswordChange ? (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-sm gap-1">
              <Lock size={10} /> Reset Required
            </Badge>
          ) : (
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-sm gap-1">
              <Unlock size={10} /> Secure
            </Badge>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(new Date(row.original.createdAt))}</span>
  },
 {
    accessorKey: "Actions",
    id: "actions",
    cell: ({ row }) => <ActionCell employee={row.original} />,
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  }
]