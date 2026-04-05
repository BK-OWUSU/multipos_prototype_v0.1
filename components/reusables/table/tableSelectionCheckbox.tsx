import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"

/**
 * Returns a reusable selection column for TanStack Table.
 * We use a function here so it remains type-safe with TData.
 */
export function getSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    size: 40,
    minSize: 40,
    maxSize: 40,
    header: ({ table }) => (
// Added h-full and flex-col justify-center to force vertical centering
      <div className="flex h-full w-full items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex h-full w-full items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }
}