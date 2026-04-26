"use client"
"use no memo"
import React from "react";
import {DropdownMenu,DropdownMenuContent,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuCheckboxItem,DropdownMenuTrigger,DropdownMenuItem} from "@/components/ui/dropdown-menu"
import {Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../ui/table";
import {flexRender, getCoreRowModel,getSortedRowModel,getFilteredRowModel,getPaginationRowModel,useReactTable,type SortingState,type ColumnFiltersState, type ColumnDef} from "@tanstack/react-table"
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { useState } from "react";
import {Trash2,Ellipsis,ArrowDownUp,ArrowDownAZ,ArrowUpZA,ChevronDown,ChevronsLeft,ChevronsRight,ListFilter,RefreshCw} from "lucide-react"
import {getSelectionColumn} from "./tableSelectionCheckbox";
//Export feature "imports"
import * as XLSX from "xlsx";
import jsPDF from 'jspdf';
import autoTable, {RowInput} from "jspdf-autotable";
import { toast } from "sonner";
import { formatDateTime, humanize } from "@/lib/utils";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select"
import AlertWithDialogue from "../AlertWithDialogue";
import { AppResponse } from "@/types/auth";


declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    filterVariant?: "select" | "text" | "date";
    trueLabel?: string;
    falseLabel?: string;
  }
}
interface TableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;          
    placeholder?: string;
    columnVisibilityFilter?: boolean;
    loading?: boolean;
    handleMultipleDelete?: (ids: string[])=> Promise<AppResponse>;
    handleMultipleToggleStatus?: (ids: string[]) => Promise<AppResponse>;
    onActionSuccess?: () => void;
}
export default function TableMain<TData, TValue>({columns, data, searchKey, placeholder, columnVisibilityFilter, loading,handleMultipleDelete,handleMultipleToggleStatus, onActionSuccess}:TableProps<TData, TValue>) {
    const [globalFilter, setGlobalFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState({});
    const [rowSelection, setRowSelection] = useState({});  
    const finalColumns = [getSelectionColumn<TData>(),...columns];
    const [showColumnFilters, setShowColumnFilters] = useState(false);

    //React table from tanstack table
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

    //Export function
    const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // 1. Get only visible columns, excluding tech columns like 'select' and 'actions'
    const visibleColumns = table.getVisibleLeafColumns()
        .filter(col => col.id !== "select" && col.id !== "actions");

  // 2. Map the SELECTED rows to the VISIBLE columns
    type ExportableValue = string | number | boolean;
    type ExportRow = Record<string, ExportableValue>;
    const exportData = table.getFilteredSelectedRowModel().rows.map(row => {
    const rowData: ExportRow = {};
    
    visibleColumns.forEach(col => {
      // Use the Header string or the ID as the key for the file
      const headerTitle = typeof col.columnDef.header === 'string' 
        ? col.columnDef.header 
        : humanize(col.id);
      // Get the value TanStack has already calculated for this cell
      const value = row.getValue(col.id);

    if (col.id === "firstName") {
        // Handle the Full Name concatenation for Employees
        const employee = row.original as { firstName?: string; lastName?: string };
        rowData["First Name"] = employee.firstName ?? "";
        rowData["Last Name"] = employee.lastName ?? "";

      } else if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('T')) {
        const dateValue = value ? new Date(value as unknown as string) : new Date();
        rowData[headerTitle] = formatDateTime(dateValue);

      } else if (typeof value === 'boolean') {
        rowData[headerTitle] = value ? "Yes" : "No";
      } else if (typeof value === 'object' && value !== null) {
        // If it's a nested object (like role.name), try to find a 'name' or 'label' property
        const namedValue = value as { name?: string; label?: string };
        rowData[headerTitle] = namedValue.name || namedValue.label || JSON.stringify(value);
      } else {
        rowData[headerTitle] = value?.toString() ?? "";
      }
    });
    return rowData;
  });

  if (exportData.length === 0) {
    // alert("No rows selected for export.");
    toast.error("No rows selected for export.")
    return;
  }

  const fileName = `Export_${new Date().getTime()}`;

  // 3. File Generation Logic
  if (format === 'excel' || format === 'csv') {
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${fileName}.${format === 'excel' ? 'xlsx' : 'csv'}`);
  } 
  
  else if (format === 'pdf') {
    const doc = new jsPDF('landscape');
    const headers = [Object.keys(exportData[0])];
    const body: RowInput[] = exportData.map((row) => Object.values(row) as RowInput);

    autoTable(doc, {
        head: headers,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [23, 37, 84] }, // Matches your bg-blue-950
        styles: { fontSize: 8 }
        });
        doc.save(`${fileName}.pdf`);
    }
};



    return (
    <div className="space-y-4 p-4">
        <div className="flex items-center  justify-between">
        {searchKey && (        
                <Input
                    placeholder={placeholder}
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                />)
        }
          <div className="flex items-center gap-2">
            {/* Lets say a column Filter button Toggle Button (funnel filter icon) here */}
            <Button 
                variant={showColumnFilters ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowColumnFilters(!showColumnFilters)}
                className="flex items-center p-4 gap-2"
            >
            <ListFilter className="h-4 w-4" />
            {showColumnFilters ? "Hide Filters" : "Filters"}
            </Button>
            {/* EXPORT DROPDOWN */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                        Export <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('excel')}>Excel (.xlsx)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>CSV (.csv)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF (.pdf)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {columnVisibilityFilter &&
            (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-fit">
                        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table.getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                // 1. Get the raw header or ID
                                const header = column.columnDef.header;
                                const rawId = column.id;
                                const cleanLabel = typeof header === "string" 
                                ? header 
                                : humanize(rawId)
                                return (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize "
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {cleanLabel}
                                </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>)
            }
            {/* Selection Action all Button */}
            <div className="relative">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button 
                    disabled={table.getFilteredSelectedRowModel().rows.length === 0} 
                    variant="outline" 
                    className="ml-auto relative">
                    <Ellipsis className="h-4 w-4" />
                    {/* Red Circle Badge */}
                    {table.getFilteredSelectedRowModel().rows.length > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[12px] font-bold text-white shadow-sm animate-in zoom-in">
                        {table.getFilteredSelectedRowModel().rows.length}
                    </span>
                    )}
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={async () => {
                        const ids = table.getSelectedRowModel().rows.map((row) => (row.original as { id: string }).id);                        
                        if (handleMultipleToggleStatus) {
                        toast.promise(handleMultipleToggleStatus(ids), {
                            loading: "Updating status...",
                            success: (res) => {
                            if (res.success) {
                                table.resetRowSelection();
                                if (onActionSuccess) onActionSuccess();
                                return res.message;
                            }
                            throw new Error(res.error);
                            },
                            error: (err) => err.message,
                        });
                        }
                    }}
                >
                <RefreshCw className="mr-2 h-4 w-4" /> Toggle Status
                </DropdownMenuItem>
                <AlertWithDialogue
                                  button = {
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                       <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                  }
                                  buttonText="Logout"
                                  customVariant="primary"
                                  btnClassName="p-4"
                                  confirmText="Yes"
                                  cancelText="Cancel"
                                  title="Delete Records"
                                  message={`Are you sure you want to delete selected ${table.getFilteredSelectedRowModel().rows.length} records?`}
                                  confirmFunction={ async()=> {
                                    const selectedRows = table.getSelectedRowModel().rows;
                                    const ids  = selectedRows.map((row)=> (row.original as {id: string}).id);
                                    if (handleMultipleDelete && ids.length > 0) {
                                        // 1. Wrap the action in toast.promise for instant feedback
                                        toast.promise(handleMultipleDelete(ids), {
                                        loading: `Deleting ${ids.length} selected records...`,
                                        success: (response) => {
                                            if (response.success) {
                                            // 2. Refresh UI and clear selection
                                            table.resetRowSelection();
                                            if (onActionSuccess) onActionSuccess();
                                            return response.message || "Records deleted successfully";
                                            } else {
                                            // If the server returned success: false (e.g. businessId mismatch)
                                            throw new Error(response.error || "Failed to delete");
                                            }
                                        },
                                        error: (err) => err.message || "An unexpected error occurred",
                                        });
                                    }
                                  }}
                                />
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
            {/* Selection Action all Button */}
            </div>
        </div>
         {/* Table Content */}
            <div className="overflow-auto max-h-85 relative">
             <Table className="w-full">
                <TableHeader className="sticky top-0 z-1">
                    {table.getHeaderGroups().map((headerGroup) => (
                    <React.Fragment key={headerGroup.id}>    
                    <TableRow key={headerGroup.id} className="bg-blue-950 hover:bg-blue-900">
                        {headerGroup.headers.map((header) => {
                        const isSelect = header.id === "select";
                        return (
                            <TableHead
                            key={header.id}
                            className={`border relative text-white first:rounded-tl-md font-semibold last:rounded-tr-md group ${isSelect ? "p-2" : "px-4"}`}
                            style={{ width: header.getSize()}}
                            >
                            {header.isPlaceholder ? null : (
                                <div className="flex items-center justify-between h-full">
                                {/* 1. SORTING & CONTENT WRAPPER */}
                                <div
                                    className={header.column.getCanSort() 
                                    ? "flex items-center gap-2 cursor-pointer select-none hover:text-blue-300 flex-1" 
                                    : "flex items-center gap-2 flex-1"}
                                    onClick={header.column.getToggleSortingHandler()}>
                                    {/* Draws either the centered checkbox OR the column name */}
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                    
                                    {/* Sort Icons (Hidden for selection column) */}
                                    {!isSelect && header.column.getCanSort() && (
                                    <span className="text-white hover:text-blue-300">
                                        {{
                                        asc: <ArrowDownAZ size={16}/>,
                                        desc: <ArrowUpZA size={16}/>,
                                        }[header.column.getIsSorted() as string] ?? <ArrowDownUp size={16} />}
                                    </span>
                                    )}
                                </div>

                                {/* 2. THE RESIZER HANDLE */}
                                {!isSelect && header.column.getCanResize() && (
                                    <div
                                    {...{
                                        onMouseDown: header.getResizeHandler(),
                                        onTouchStart: header.getResizeHandler(),
                                        className: `absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-500 transition-colors ${
                                        header.column.getIsResizing() ? "bg-blue-600 w-1" : "bg-transparent"
                                        }`,
                                    }}
                                    />
                                )}
                                </div>
                            )}
                            </TableHead>
                        );
                        })}
                    </TableRow>

                   {/* DYNAMIC FILTER ROW */}
                    {showColumnFilters && (
                    <TableRow className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header) => {
                        const isSelect = header.id === "select";
                        const isActions = header.id === "actions";
                        const column = header.column;
                        
                        // Cast to any to allow for boolean, string, or date comparisons
                        type FilterValue = string | boolean | undefined;
                        const filterValue = column.getFilterValue() as FilterValue;

                        const isSelectVariant = column.columnDef.meta?.filterVariant === "select";

                        const firstValue = table.getCoreRowModel().flatRows[0]?.getValue(column.id);
                        const isDate =
                            firstValue instanceof Date ||
                            (typeof firstValue === "string" &&
                            !isNaN(Date.parse(firstValue)) &&
                            firstValue.includes("T"));

                        return (
                            <TableHead key={`filter-${header.id}`} className="p-2 border">
                            {!isSelect && !isActions && column.getCanFilter() ? (
                                isSelectVariant ? (
                                <Select
                                    value={
                                    filterValue === true ? "true" : 
                                    filterValue === false ? "false" : 
                                    "all"
                                    }
                                    onValueChange={(val) => {
                                    let newValue: boolean | undefined;
                                    if (val === "true") newValue = true;
                                    else if (val === "false") newValue = false;
                                    else newValue = undefined;
                                    column.setFilterValue(newValue);
                                    }}>
                                    <SelectTrigger className="h-8 w-full border text-xs focus:ring-1 focus:ring-blue-900">
                                    <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="true">{column.columnDef.meta?.trueLabel || "Yes"}</SelectItem>
                                    <SelectItem value="false">{column.columnDef.meta?.falseLabel || "No"}</SelectItem>
                                    </SelectContent>
                                </Select>
                                ) : isDate ? (
                                <Input
                                    type="date"
                                    value={(filterValue as string) ?? ""}
                                    onChange={(e) => column.setFilterValue(e.target.value)}
                                    className="h-8 text-[10px] bg-white/10 border p-1"
                                />
                                ) : (
                                <Input
                                    placeholder="Search..."
                                    value={(filterValue as string) ?? ""}
                                    onChange={(e) => column.setFilterValue(e.target.value)}
                                    className="h-8 text-xs border bg-white/10  placeholder:text-gray-400 focus-visible:ring-blue-400"
                                />
                                )
                            ) : null}
                            </TableHead>
                        );
                        })}
                    </TableRow>
                    )}
                </React.Fragment>
                    ))}
                </TableHeader>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                        {finalColumns.map((_, j) => (
                            <TableCell key={j} className="py-4">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            </TableCell>
                        ))}
                        </TableRow>
                    ))
                  ): table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow
                        key={row.id}
                        // Added hover effect for better row tracking
                        className="hover:bg-blue-50 border  transition-colors "
                        >
                        {row.getVisibleCells().map((cell) => {
                        const isSelect = cell.column.id === "select";
                        return (
                            <TableCell 
                            key={cell.id} 
                            // REMOVED flex/justify/items from here
                            className={`py-3 border ${isSelect ? "p-1" : "px-4"}`}
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
            {/* Table Content End */}

            {/* Pagination Controls */}
           
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
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