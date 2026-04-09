"use client"

import { ColumnDef } from "@tanstack/react-table"
import { 
  Users, Mail, Phone, ListOrdered, 
  MoreHorizontal, Edit, Trash 
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export type User = {
  id: number
  name: string
  email: string
  phone: string
}

// --- Sub-component for Test Actions ---
const UserActions = ({ user }: { user: User }) => {

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(user.email)
            toast.success("Email copied to clipboard")
          }}
        >
          Copy Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" /> Edit User
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => confirm(`Delete ${user.name}?`)}
        >
          <Trash className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// --- Recreated Column Definition ---
export const testColumn: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: () => (
      <span className='flex items-center'>
        <ListOrdered className="mr-2" size={16}/>Id
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: () => (
      <span className='flex items-center'>
        <Users className="mr-2" size={16}/>Name
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: () => (
      <span className='flex items-center'>
        <Mail className="mr-2" size={16}/>Mail
      </span>
    ),
  },
  {
    accessorKey: "phone",
    header: () => (
      <span className='flex items-center'>
        <Phone className="mr-2" size={16}/>Phone
      </span>
    ),
  },
  {
    accessorKey: "Actions",
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} />,
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  },
]