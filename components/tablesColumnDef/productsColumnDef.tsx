"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@/types/inventory"
import { Badge } from "@/components/ui/badge"
import {
  Package, DollarSign, Hash, Archive,
  Tag, Building, Percent, Calendar,
  MoreHorizontal, Eye, Edit, Trash2,
  AlertTriangle, Image as ImageIcon
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useProductStore } from "@/store/productsStore"
import { toast } from "sonner"
import AlertWithDialogue from "@/components/reusables/AlertWithDialogue"

// --- Sub-component for Actions ---
const ActionCell = ({ product }: { product: Product }) => {
  const { toggleProductStatus, deleteProduct } = useProductStore()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => toast.info("View product details - feature coming soon")}>
          <Eye className="mr-2 h-4 w-4" /> View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info("Edit product - feature coming soon")}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => toggleProductStatus(product.id, product.isActive)}>
          {product.isActive ? (
            <span className="flex items-center text-yellow-600"><Archive className="mr-2 h-4 w-4" /> Deactivate</span>
          ) : (
            <span className="flex items-center text-green-600"><Package className="mr-2 h-4 w-4" /> Activate</span>
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
          confirmText="Yes"
          cancelText="Cancel"
          title="Delete Product"
          message={`Are you sure you want to delete ${product.name}?`}
          confirmFunction={() => deleteProduct(product.id)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const productsColumnDef: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: () => (<span className='flex items-center'><Package className="mr-2" size={16} />Product Name</span>),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
  },
  {
    accessorKey: "imageUrl",
    header: () => (<span className='flex items-center'><ImageIcon className="mr-2" size={16} />Image</span>),
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
      console.log("Url Image: ",imageUrl)
      return imageUrl ? (
        <Image
          src={imageUrl}
          alt={row.original.name}
          width={4}
          height={4}
          className="w-10 h-10 object-cover rounded"
        />
      ) : (
        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-gray-400" />
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false
  },
  {
    accessorKey: "sku",
    header: () => (<span className='flex items-center'><Hash className="mr-2" size={16} />SKU</span>),
    cell: ({ row }) => row.original.sku || "N/A"
  },
  {
    accessorKey: "price",
    header: () => (<span className='flex items-center'><DollarSign className="mr-2" size={16} />Price</span>),
    cell: ({ row }) => `$${Number(row.original.price).toFixed(2)}`
  },
  {
    accessorKey: "costPrice",
    header: () => (<span className='flex items-center'><DollarSign className="mr-2" size={16} />Cost</span>),
    cell: ({ row }) => `$${Number(row.original.costPrice).toFixed(2)}`
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stock;
      const lowAlert = row.original.lowStockAlert;
      const isLow = stock <= lowAlert;
      return (
        <div className="flex items-center gap-2">
          <span className={isLow ? "text-red-600 font-semibold" : ""}>{stock}</span>
          {isLow && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
      );
    }
  },
  {
    accessorKey: "category",
    header: () => (<span className='flex items-center'><Tag className="mr-2" size={16} />Category</span>),
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.category?.name || "No Category"}
      </Badge>
    )
  },
  {
    accessorKey: "brand",
    header: () => (<span className='flex items-center'><Building className="mr-2" size={16} />Brand</span>),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.brand?.name || "No Brand"}
      </span>
    )
  },
  {
    accessorKey: "discount",
    header: () => (<span className='flex items-center'><Percent className="mr-2" size={16} />Discount</span>),
    cell: ({ row }) => {
      const discount = row.original.discount;
      if (!discount) return "No Discount";
      return (
        <Badge variant="secondary">
          {discount.name} ({discount.type === "PERCENTAGE" ? `${Number(discount.value)}%` : `$${Number(discount.value)}`})
        </Badge>
      );
    }
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
      const active = row.original.isActive;
      return (
        <Badge className={active ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      );
    }
  },
  {
    accessorKey: "createdAt",
    header: () => (<span className='flex items-center'><Calendar className="mr-2" size={16} />Created</span>),
    cell: ({ row }) => formatDate(new Date(row.original.createdAt))
  },
  {
    accessorKey: "Actions",
    id: "actions",
    cell: ({ row }) => <ActionCell product={row.original} />,
    enableSorting: false,
    enableResizing: false,
    enableColumnFilter: false
  }
]