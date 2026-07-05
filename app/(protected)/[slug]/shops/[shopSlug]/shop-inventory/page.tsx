"use client";

import React, { useState } from "react";
import { 
  Package, 
  AlertTriangle, 
  PackageX, 
  Coins, 
  Download, 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  PlusCircle,
  FileText
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- MOCK DATA MATCHING DATA SHOWN IN THE IMAGE LAYOUT ---
const statsData = {
  totalProducts: 1245,
  lowStockCount: 18,
  outOfStockCount: 4,
  inventoryValue: 28450.00,
};

const stockAlerts = [
  { id: "1", name: "Milo (400g)", sku: "FD-030", remaining: 8, reorderLevel: 15, severity: "low" },
  { id: "2", name: "Toilet Tissue (Pack)", sku: "HS-001", remaining: 6, reorderLevel: 10, severity: "low" },
  { id: "3", name: "Dettol Soap (70g)", sku: "HS-002", remaining: 0, reorderLevel: 10, severity: "out" },
];

const recentActivity = [
  { id: "1", message: "Sold 4 × Coca Cola 500ml", by: "by Ama Asante", time: "Today, 10:15 AM", type: "sale" },
  { id: "2", message: "Sold 2 × Milo (400g)", by: "by Ama Asante", time: "Today, 09:40 AM", type: "sale" },
  { id: "3", message: "Received 20 × Peak Milk (Tin)", by: "by Kwame Mensah", time: "Today, 08:30 AM", type: "restock" },
  { id: "4", message: "Adjusted Dettol Soap (70g)", subMessage: "-1", by: "by Kwame Mensah", time: "Yesterday, 04:20 PM", type: "adjustment" },
  { id: "5", message: "Sold 3 × Fanta 500ml", by: "by Ama Asante", time: "Yesterday, 03:10 PM", type: "sale" },
];

const inventoryProducts = [
  { id: "1", name: "Coca Cola 500ml", sku: "DRK-001", category: "Beverages", stock: 32, reorderLevel: 10, status: "In Stock", updated: "May 18, 2025 10:15 AM" },
  { id: "2", name: "Fanta 500ml", sku: "DRK-002", category: "Beverages", stock: 28, reorderLevel: 10, status: "In Stock", updated: "May 18, 2025 09:45 AM" },
  { id: "3", name: "Milo (400g)", sku: "FD-030", category: "Food", stock: 8, reorderLevel: 15, status: "Low Stock", updated: "May 18, 2025 08:50 AM" },
  { id: "4", name: "Dettol Soap (70g)", sku: "HS-002", category: "Household", stock: 0, reorderLevel: 10, status: "Out of Stock", updated: "May 18, 2025 07:50 AM" },
  { id: "5", name: "Toilet Tissue (Pack)", sku: "HS-001", category: "Household", stock: 6, reorderLevel: 10, status: "Low Stock", updated: "May 18, 2025 08:10 AM" },
  { id: "6", name: "Peak Milk (Tin)", sku: "FD-020", category: "Food", stock: 15, reorderLevel: 10, status: "In Stock", updated: "May 18, 2025 07:30 AM" },
];

export default function ShopInventoryDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 lg:p-8 text-slate-900 antialiased font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ── TOP SECTION HEADER BLOCK ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-950">Inventory</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">View and monitor stock available in this shop.</p>
          </div>
          <Button variant="outline" className="h-9 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 shadow-sm self-stretch sm:self-auto justify-center">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </div>

        {/* ── FOUR CARD METRIC OVERVIEW GRID ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Products */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block tracking-normal">Total Products</span>
              <h3 className="text-xl font-black text-blue-950 mt-0.5">{statsData.totalProducts.toLocaleString()}</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">All products in this shop</p>
            </div>
          </Card>

          {/* Low Stock Warning */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block tracking-normal">Low Stock</span>
              <h3 className="text-xl font-black text-blue-950 mt-0.5">{statsData.lowStockCount}</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Products running low</p>
            </div>
          </Card>

          {/* Out of Stock Emergency */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <PackageX className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block tracking-normal">Out of Stock</span>
              <h3 className="text-xl font-black text-blue-950 mt-0.5">{statsData.outOfStockCount}</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">No stock available</p>
            </div>
          </Card>

          {/* Local Valuation */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block tracking-normal">Inventory Value</span>
              <h3 className="text-xl font-black text-blue-950 mt-0.5 font-mono">GH₵ {statsData.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Current stock value</p>
            </div>
          </Card>

        </div>

        {/* ── MIDDLE GRID ROW: STOCK ALERTS & RECENT MOVEMENTS ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Widget Block Left: Core Live Action Alerts */}
          <Card className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-slate-50 shrink-0">
              <CardTitle className="text-sm font-black text-blue-950 tracking-tight">Stock Alerts</CardTitle>
              <Button variant="ghost" className="text-[11px] font-black text-blue-600 hover:bg-blue-50/60 h-7 px-2.5 rounded-lg transition-colors">
                View all alerts
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3 flex-1">
              {stockAlerts.map((alert) => {
                const isOut = alert.severity === "out";
                return (
                  <div key={alert.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all gap-4 ${
                    isOut ? "bg-rose-50/30 border-rose-100/70" : "bg-amber-50/30 border-amber-100/70"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        isOut ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-600 border-amber-200"
                      }`}>
                        <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <div className="text-xs font-semibold">
                        <h4 className="text-blue-950 font-black leading-tight">{alert.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">SKU: {alert.sku}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                      <div className="text-left sm:text-right text-xs font-semibold">
                        <span className={`font-black ${isOut ? "text-rose-600" : "text-amber-600"}`}>
                          {alert.remaining} remaining
                        </span>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Reorder level: {alert.reorderLevel}</p>
                      </div>
                      <Button variant="outline" className="h-8 text-[11px] font-black border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg shadow-sm px-4">
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Widget Block Right: Context Event Stream Feed */}
          <Card className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-slate-50 shrink-0">
              <CardTitle className="text-sm font-black text-blue-950 tracking-tight">Recent Inventory Activity</CardTitle>
              <Button variant="ghost" className="text-[11px] font-black text-blue-600 hover:bg-blue-50/60 h-7 px-2.5 rounded-lg transition-colors">
                View all
              </Button>
            </CardHeader>
            <CardContent className="p-5 flex-1 space-y-4">
              {recentActivity.map((activity) => {
                const isSale = activity.type === "sale";
                const isRestock = activity.type === "restock";
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 text-xs font-semibold text-slate-700 relative group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 shadow-none ${
                      isSale ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      isRestock ? "bg-blue-50 text-blue-600 border-blue-100" :
                      "bg-amber-50 text-amber-600 border-amber-100"
                    }`}>
                      {isSale ? <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" /> :
                       isRestock ? <PlusCircle className="w-3.5 h-3.5 stroke-[2.2]" /> :
                       <FileText className="w-3.5 h-3.5 stroke-[2.2]" />}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="leading-tight text-slate-600">
                        {activity.message.split(" × ")[0]} 
                        {activity.message.includes(" × ") && (
                          <> <span className="text-slate-400 font-normal">×</span> <span className="font-black text-blue-950">{activity.message.split(" × ")[1]}</span></>
                        )}
                      </p>
                      {activity.subMessage && (
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1 py-0.2 rounded mt-1 inline-block font-mono">
                          {activity.subMessage}
                        </span>
                      )}
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{activity.by}</p>
                    </div>

                    <div className="text-right shrink-0 pt-0.5 text-[10px] font-bold text-slate-400">
                      {activity.time}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

        </div>

        {/* ── CORE COMPREHENSIVE BATCH INTERACTIVE DATA TABLE GRID ── */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          
          {/* Table Management Actions Strip Controls Layout */}
          <div className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between border-b border-slate-100 bg-slate-50/20">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400 stroke-[2.2]" />
              <Input
                placeholder="Search product by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-white border-slate-200 rounded-xl text-xs font-semibold focus-visible:ring-blue-100 placeholder:text-slate-400 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-3 self-end md:self-auto">
              <Button variant="outline" className="h-9 border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl gap-2 shadow-sm">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </Button>
              <Button variant="outline" className="h-9 border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl gap-2 shadow-sm">
                All Categories <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* Actual Scalable Table Element Layout Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-medium text-slate-700">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-100 text-[11px] font-black tracking-normal text-slate-400">
                  <th className="p-4 pl-5">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Reorder Level</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 pr-5 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {inventoryProducts.map((product) => {
                  const isLow = product.status === "Low Stock";
                  const isOut = product.status === "Out of Stock";

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/20 transition-colors group">
                      <td className="p-4 pl-5">
                        <div className="flex items-center gap-3">
                          {/* Mini visual image representation block placeholder wrapper */}
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/40 shrink-0 flex items-center justify-center font-bold text-[9px] text-slate-400">
                            {product.name.charAt(0)}
                          </div>
                          <span className="font-black text-blue-950">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-500 text-[11px]">{product.sku}</td>
                      <td className="p-4 text-slate-500 font-bold">{product.category}</td>
                      <td className="p-4 font-black text-blue-950 font-mono pl-6 sm:pl-4">{product.stock}</td>
                      <td className="p-4 font-bold text-slate-400 font-mono pl-6 sm:pl-4">{product.reorderLevel}</td>
                      <td className="p-4">
                        <Badge className={`shadow-none border-none font-black text-[10px] h-5 px-2 rounded-md ${
                          isOut ? "bg-rose-50 text-rose-600 hover:bg-rose-50" :
                          isLow ? "bg-amber-50 text-amber-600 hover:bg-amber-50" :
                          "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                        }`}>
                          {product.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-400 font-bold">{product.updated}</td>
                      <td className="p-4 pr-5 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-7 h-7 p-0 rounded-lg hover:bg-slate-100 text-slate-400 group-hover:text-slate-700">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl p-1.5 border-slate-200/80">
                            <DropdownMenuItem className="text-xs font-semibold rounded-lg text-slate-700">View details</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-semibold rounded-lg text-slate-700">Adjust stock</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-semibold rounded-lg text-rose-600 focus:text-rose-600">Flag discrepancy</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── CORE PAGINATION SYSTEM METADATA CONTROL BAR ────────── */}
          <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-100 bg-white">
            <span className="text-[11px] font-bold text-slate-400">
              Showing <span className="text-slate-700">1 to 6</span> of <span className="text-slate-700">{statsData.totalProducts.toLocaleString()}</span> products
            </span>
            
            <div className="flex items-center gap-5">
              {/* Pagination controls wrapper stack buttons */}
              <div className="flex items-center gap-1">
                <Button variant="outline" className="w-8 h-8 p-0 rounded-lg border-slate-200 text-slate-400 hover:bg-slate-50" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-8 h-8 p-0 rounded-lg border-blue-600 bg-blue-50/40 text-blue-700 font-black text-xs hover:bg-blue-50/40 shadow-none">
                  1
                </Button>
                <Button variant="outline" className="w-8 h-8 p-0 rounded-lg border-transparent text-slate-500 font-bold text-xs hover:bg-slate-50 shadow-none">
                  2
                </Button>
                <Button variant="outline" className="w-8 h-8 p-0 rounded-lg border-transparent text-slate-500 font-bold text-xs hover:bg-slate-50 shadow-none">
                  3
                </Button>
                <span className="text-[11px] font-bold text-slate-300 px-1">...</span>
                <Button variant="outline" className="w-8 h-8 p-0 rounded-lg border-transparent text-slate-500 font-bold text-xs hover:bg-slate-50 shadow-none">
                  208
                </Button>
                <Button variant="outline" className="w-8 h-8 p-0 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Rows entry select element setup size toggle */}
              <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-slate-400">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-8 text-xs font-bold border-slate-200 text-slate-700 rounded-lg gap-1 px-2.5 shadow-none">
                      10 / page <ChevronDown className="w-3 h-3 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl p-1 border-slate-200">
                    <DropdownMenuItem className="text-xs font-semibold rounded-lg">10 / page</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs font-semibold rounded-lg">25 / page</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs font-semibold rounded-lg">50 / page</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

          </div>

        </Card>

      </div>
    </div>
  );
}