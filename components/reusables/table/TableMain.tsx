"use client"
"use no memo"
import {DropdownMenu,DropdownMenuContent,DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuCheckboxItem,DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../ui/table";
import {flexRender, getCoreRowModel,getSortedRowModel,getFilteredRowModel,
    getPaginationRowModel,useReactTable,ColumnResizeMode,
    type SortingState,
    type ColumnFiltersState, 
    type ColumnDef 
} from "@tanstack/react-table"
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { useState } from "react";
import {ArrowDownUp,ArrowDownAZ,ArrowUpZA,ChevronDown,ChevronsLeft,ChevronsRight} from "lucide-react"
import { getSelectionColumn } from "./tableSelectionCheckbox";

interface TableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;          
    placeholder?: string;
    columnVisibilityFilter?: boolean;
}
export default function TableMain<TData, TValue>({columns, data, searchKey, placeholder, columnVisibilityFilter}:TableProps<TData, TValue>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [rowSelection, setRowSelection] = useState({});
    

    const finalColumns = [getSelectionColumn<TData>(),...columns]

    const table = useReactTable({
        data,
        columns: finalColumns,
        columnResizeMode: "onChange",
        state: {
            sorting,
            columnFilters,
            globalFilter,
            columnVisibility,
            rowSelection,
        },
        enableRowSelection: true,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        globalFilterFn: "includesString"
    });
  return (
    <div className="space-y-4 p-2">
        <div className="flex items-center justify-between">
        {searchKey && (        
                <Input
                    placeholder={placeholder}
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />)
        }
        {columnVisibilityFilter &&
        (<div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                        Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table.getAllColumns().map((column) => (
                        <DropdownMenuCheckboxItem
                            key={column.id}
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                            {column.id}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>)
        }
        </div>
        {/* Table Content */}
        {/* <div className="rounded-md border border-slate-800 bg-slate-900/50 overflow-hidden"> */}
        <div className="rounded-md border">
        <div className="overflow-x-auto">
            <Table>
            {/* <TableHeader className="bg-slate-800/50"> */}
            <TableHeader className="">
                {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                    const isSelect = header.id === "select"; 
                    return (
                        <TableHead
                        key={header.id}
                        className={`relative font-semibold border-r last:border-0 ${isSelect ? "p-0" : "px-4"}`}
                        style={{ 
                            width: header.getSize(),
                            position: 'relative' // Critical for the resizer absolute positioning
                        }}
                        >
                        {/* Existing Header Content */}
                        <div className="flex items-center justify-between group">
                            {flexRender(header.column.columnDef.header, header.getContext())}

                            {/* 4. THE RESIZER HANDLE */}
                            {!isSelect && header.column.getCanResize() && (
                                <div
                                {...{
                                    onMouseDown: header.getResizeHandler(),
                                    onTouchStart: header.getResizeHandler(),
                                    className: `resizer ${
                                    header.column.getIsResizing() ? "isResizing" : ""
                                    } absolute right-0 top-0 h-full w-1 bg-blue-500 cursor-col-resize select-none touch-none opacity-0 group-hover:opacity-100 transition-opacity`,
                                }}
                                />
                            )}
                        </div>
                        </TableHead>
                    );
                    })}
                </TableRow>
                ))}
            </TableHeader>

            <TableBody>
                {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                    <TableRow
                    key={row.id}
                    // Added hover effect for better row tracking
                    className="hover:bg-blue-50  transition-colors "
                    >
                        {row.getVisibleCells().map((cell) => {
                    const isSelect = cell.column.id === "select";
                    return (
                        <TableCell 
                        key={cell.id} 
                        // REMOVED flex/justify/items from here
                        className={`py-3 border-r ${isSelect ? "p-0" : "px-4"}`}
                        >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    );
                    })}
                    </TableRow>
                ))
                ) : (
                <TableRow>
                    <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-slate-500  italic"
                    >
                    No records found.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
            </Table>
        </div>
        </div>
        {/* Table Content End */}

        {/* Pagination Controls */}
      {/* <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t border-slate-800"> */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2">
        {/* Left: Metadata */}
        <div className="flex text-sm text-muted-foreground gap-2 justify-center items-center">
            <div>
                Showing{" "}
                <span className="font-medium">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                )}
                </span>{" "}
                of{" "}
                <span className="font-medium">
                {table.getFilteredRowModel().rows.length}
                </span>{" "}
                results
            </div>
            <span className="font-medium text-blue-900 ">
                {" || "}{table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
            </span>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
            {/* Rows per page selector */}
            <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
                className="h-8 w-17.5 rounded-md border  text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                    {pageSize}
                </option>
                ))}
            </select>
            </div>

            {/* Page indicator */}
            <div className="flex w-25 items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
            <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
            >
                <span className="sr-only">Go to first page</span>
                {<ChevronsLeft size={16} />}
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                Next
            </Button>
            <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
            >
                <span className="sr-only">Go to last page</span>
                {<ChevronsRight size={16} />}
            </Button>
            </div>
        </div>
        </div>
    </div>
  )
}
