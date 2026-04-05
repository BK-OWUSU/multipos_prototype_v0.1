import { ColumnDef } from "@tanstack/react-table";

export type User = {
    id: number;
    name: string;
    email: string;
    phone: string
}

import{Users, Mail,Phone, ListOrdered} from "lucide-react"


export const testColumn: ColumnDef<User> [] = [
    {
        accessorKey:"id" , 
        header: ()=> (<span className='flex items-center'><ListOrdered className="mr-2" size = {16}/>Id</span>),
    },
    {
        accessorKey:"name" ,
        header: ()=> (<span className='flex items-center'><Users className="mr-2" size = {16}/>Name</span>),
    },
    {
        accessorKey:"email" ,
        header: ()=> (<span className='flex items-center'><Mail className="mr-2" size = {16}/>Mail</span>)
    },
    {
        accessorKey:"phone" ,
        header: ()=> (<span className='flex items-center'><Phone className="mr-2" size = {16}/>Phone</span>)
    },
]

