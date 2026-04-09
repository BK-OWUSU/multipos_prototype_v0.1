"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Employee } from "@/types/auth"
import { Badge } from "@/components/ui/badge"
import { 
  Users, Mail, Phone, ShieldCheck, 
  Store, Calendar, MoreHorizontal, 
  UserX, UserCheck, Trash2, CheckCircle2, XCircle, 
  KeyRound, Lock, Unlock
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

// --- Sub-component stays the same ---
const ActionCell = ({ employee }: { employee: Employee }) => {
  const { toggleEmployeeStatus, deleteEmployee } = useEmployeeStore()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={
          () => {
            navigator.clipboard.writeText(employee.email)
            toast.success("Email copied to clipboard")
            }
          }>
          Copy Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toggleEmployeeStatus(employee.id, employee.isActive)}>
          {employee.isActive ? (
            <span className="flex items-center text-yellow-600"><UserX className="mr-2 h-4 w-4" /> Deactivate</span>
          ) : (
            <span className="flex items-center text-green-600"><UserCheck className="mr-2 h-4 w-4" /> Activate</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => confirm(`Delete ${employee.firstName}?`) && deleteEmployee(employee.id)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const employeeColumns: ColumnDef<Employee>[] = [
  {
    accessorKey: "firstName", // Combined name column
    header: () => (<span className='flex items-center'><Users className="mr-2" size={16}/>Full Name</span>),
    cell: ({ row }) => <span className="font-medium">{`${row.original.firstName} ${row.original.lastName}`}</span>
  },
  {
    accessorKey: "email",
    header: () => (<span className='flex items-center'><Mail className="mr-2" size={16}/>Email</span>)
  },
  {
    accessorKey: "phone", // ADDED PHONE
    header: () => (<span className='flex items-center'><Phone className="mr-2" size={16}/>Phone</span>),
    cell: ({ row }) => row.original.phone || "N/A"
  },
  {
    accessorKey: "role.name",
    header: () => (<span className='flex items-center'><ShieldCheck className="mr-2" size={16}/>Role</span>),
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-bold">
        {row.original.role?.name || "No Role"}
      </Badge>
    )
  },
  {
    accessorKey: "shop.name",
    header: () => (<span className='flex items-center'><Store className="mr-2" size={16}/>Shop</span>),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.shop?.name || "Floating / All"}
      </span>
    )
  },
  {
    accessorKey: "isVerified", // ADDED VERIFICATION STATUS
    header: "Verified",
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.isVerified ? (
          <CheckCircle2 className="text-green-500 h-5 w-5" />
        ) : (
          <XCircle className="text-gray-300 h-5 w-5" />
        )}
      </div>
    )
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const active = row.original.isActive
      return (
        <Badge className={active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: () => (<span className='flex items-center'><Calendar className="mr-2" size={16}/>Joined</span>),
    cell: ({ row }) => formatDate(new Date(row.original.createdAt))
  },
  {
  accessorKey: "needsPasswordChange",
  header: () => (
    <span className='flex items-center'>
      <KeyRound className="mr-2" size={16}/> Security
    </span>
  ),
  cell: ({ row }) => {
    const needsChange = row.original.needsPasswordChange;
    return (
      <div className="flex items-center gap-2">
        {needsChange ? (
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 flex gap-1 items-center">
            <Lock size={12} /> Temp Pass
          </Badge>
        ) : (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 flex gap-1 items-center">
            <Unlock size={12} /> Secure
          </Badge>
        )}
      </div>
    );
  }
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