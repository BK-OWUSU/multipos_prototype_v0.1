"use client";

import React, { useState } from "react";
import { 
  Package, 
  AlertTriangle, 
  PackageX, 
  Coins, 
  ArrowLeftRight,
  Download, 
  Upload, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  PlusCircle,
  Truck,
  Sliders,
  ClipboardCheck
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- MOCK DATA SCOPED TO WHOLE BUSINESS CONTEXT ---
const businessStats = {
  totalProducts: 1245,
  lowStockCount: 18,
  outOfStockCount: 4,
  totalStockValue: 28450.00,
  movementsToday: { total: 32, in: 18, out: 14 }
};

const globalInventoryItems = [
  { id: "1", name: "Coca Cola 500ml", sku: "DRK-001", category: "Beverages", stockQty: 32, unitCost: 4.00, unitPrice: 6.00, status: "In Stock", updated: "May 18, 2025 10:15 AM" },
  { id: "2", name: "FanIce 500ml", sku: "DRK-002", category: "Beverages", stockQty: 28, unitCost: 3.50, unitPrice: 5.00, status: "In Stock", updated: "May 18, 2025 09:45 AM" },
  { id: "3", name: "Voltic Water 500ml", sku: "DRK-003", category: "Beverages", stockQty: 25, unitCost: 2.00, unitPrice: 3.00, status: "In Stock", updated: "May 18, 2025 09:30 AM" },
  { id: "4", name: "Indomie Chicken", sku: "FD-015", category: "Food", stockQty: 20, unitCost: 3.20, unitPrice: 4.50, status: "In Stock", updated: "May 18, 2025 08:50 AM" },
  { id: "5", name: "Milo Sachet", sku: "FD-030", category: "Food", stockQty: 8, unitCost: 2.00, unitPrice: 2.50, status: "Low Stock", updated: "May 18, 2025 08:35 AM" },
  { id: "6", name: "Toilet Tissue (Pack)", sku: "HS-001", category: "Household", stockQty: 6, unitCost: 6.00, unitPrice: 9.00, status: "Low Stock", updated: "May 18, 2025 08:10 AM" },
  { id: "7", name: "Dettol Soap", sku: "HS-002", category: "Household", stockQty: 0, unitCost: 3.00, unitPrice: 4.50, status: "Out of Stock", updated: "May 18, 2025 07:50 AM" },
  { id: "8", name: "Peak Milk (Tin)", sku: "FD-020", category: "Food", stockQty: 15, unitCost: 7.00, unitPrice: 10.00, status: "In Stock", updated: "May 18, 2025 07:30 AM" },
];

export default function BusinessStockLevelsDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-slate-50/40 p-4 lg:p-8 text-slate-900 antialiased font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ── HEADER ACTION REGION ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-950">Inventory</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">Track, manage and monitor stock across your shop.</p>
          </div>
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
            <Button variant="outline" size="sm" className="h-9 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 shadow-sm bg-white">
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button variant="outline" size="sm" className="h-9 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl gap-1.5 shadow-sm bg-white">
              <Upload className="w-3.5 h-3.5" /> Import
            </Button>
            <Button size="sm" className="h-9 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5 shadow-sm">
              <Plus className="w-4 h-4 stroke-[2.5]" /> Add Product
            </Button>
          </div>
        </div>

        {/* ── BUSINESS-WIDE SCORECARD METRIC CARDS ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Products */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block tracking-normal">Total Products</span>
              <h3 className="text-lg font-black text-blue-950 mt-0.5">{businessStats.totalProducts.toLocaleString()}</h3>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">All products</p>
            </div>
          </Card>

          {/* Low Stock Attention Alert */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block tracking-normal">Low Stock</span>
              <h3 className="text-lg font-black text-blue-950 mt-0.5">{businessStats.lowStockCount}</h3>
              <p className="text-[9px] font-semibold text-amber-600/90 mt-0.5">Needs attention</p>
            </div>
          </Card>

          {/* Out of Stock Tracker */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <PackageX className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block tracking-normal">Out of Stock</span>
              <h3 className="text-lg font-black text-blue-950 mt-0.5">{businessStats.outOfStockCount}</h3>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">No stock available</p>
            </div>
          </Card>

          {/* Cumulative Net Stock Valuation */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Coins className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block tracking-normal">Total Stock Value</span>
              <h3 className="text-lg font-black text-blue-950 mt-0.5 font-mono">GH₵ {businessStats.totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Across all products</p>
            </div>
          </Card>

          {/* Combined Today's Performance Movement Metric */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block tracking-normal">Stock Movement (Today)</span>
              <h3 className="text-lg font-black text-blue-950 mt-0.5 font-mono">{businessStats.movementsToday.total}</h3>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">
                In: <span className="text-emerald-600 font-bold">{businessStats.movementsToday.in}</span> • Out: <span className="text-rose-500 font-bold">{businessStats.movementsToday.out}</span>
              </p>
            </div>
          </Card>
        </div>

        {/* ── CORE BATCH PRODUCT DATA TABLE CARD CONTAINER ───────── */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          
          {/* Segmented Status Tab & Filter Strip */}
          <div className="px-5 pt-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-slate-100">
            <Tabs defaultValue="all" className="w-full lg:w-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-1 flex-wrap justify-start border-b-0 rounded-none">
                <TabsTrigger value="all" className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-xs font-bold shadow-none transition-all">All Products</TabsTrigger>
                <TabsTrigger value="low" className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-xs font-bold shadow-none transition-all">Low Stock</TabsTrigger>
                <TabsTrigger value="out" className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-xs font-bold shadow-none transition-all">Out of Stock</TabsTrigger>
                <TabsTrigger value="active" className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-xs font-bold shadow-none transition-all">Active</TabsTrigger>
                <TabsTrigger value="inactive" className="data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 rounded-none border-b-2 border-transparent bg-transparent px-3 pb-3 pt-1 text-xs font-bold shadow-none transition-all">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="pb-3 lg:pb-0 w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-stretch">
              <Button variant="outline" size="sm" className="h-8 border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl gap-1.5 shadow-none bg-white">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </Button>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 stroke-[2.2]" />
                <Input
                  placeholder="Search in inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 bg-white border-slate-200 rounded-xl text-xs font-semibold focus-visible:ring-blue-100 placeholder:text-slate-400 shadow-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Master Global Stock Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-medium text-slate-700">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-100 text-[11px] font-black tracking-normal text-slate-400/90 uppercase">
                  <th className="p-4 pl-5 w-10">
                    <input type="checkbox" className="rounded border-slate-300 accent-blue-600 cursor-pointer" />
                  </th>
                  <th className="p-4 pl-2">Product</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Stock Qty</th>
                  <th className="p-4 text-right">Unit Cost</th>
                  <th className="p-4 text-right">Unit Price</th>
                  <th className="p-4 text-right">Stock Value</th>
                  <th className="p-4 pl-6">Status</th>
                  <th className="p-4">Updated At</th>
                  <th className="p-4 pr-5 text-center w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {globalInventoryItems.map((item) => {
                  const isLow = item.status === "Low Stock";
                  const isOut = item.status === "Out of Stock";
                  const computedStockValue = item.stockQty * item.unitCost;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/20 transition-colors group">
                      <td className="p-4 pl-5">
                        <input type="checkbox" className="rounded border-slate-300 accent-blue-600 cursor-pointer" />
                      </td>
                      <td className="p-4 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/40 shrink-0 flex items-center justify-center font-bold text-[9px] text-slate-400">
                            {item.name.charAt(0)}
                          </div>
                          <span className="font-black text-blue-950 truncate max-w-[150px]">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-400 text-[11px]">{item.sku}</td>
                      <td className="p-4 text-slate-500 font-bold">{item.category}</td>
                      <td className="p-4 font-black text-blue-950 font-mono text-center">{item.stockQty}</td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-600">GH₵ {item.unitCost.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-600">GH₵ {item.unitPrice.toFixed(2)}</td>
                      <td className="p-4 text-right font-mono font-black text-blue-950">GH₵ {computedStockValue.toFixed(2)}</td>
                      <td className="p-4 pl-6">
                        <Badge className={`shadow-none border-none font-black text-[10px] h-5 px-2 rounded-md ${
                          isOut ? "bg-rose-50 text-rose-600 hover:bg-rose-50" :
                          isLow ? "bg-amber-50 text-amber-600 hover:bg-amber-50" :
                          "bg-emerald-50 text-emerald-600 hover:bg-emerald-50"
                        }`}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-400 font-bold">{item.updated}</td>
                      <td className="p-4 pr-5 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-7 h-7 p-0 rounded-lg hover:bg-slate-100 text-slate-400 group-hover:text-slate-700">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl p-1.5 border-slate-200/80">
                            <DropdownMenuItem className="text-xs font-semibold rounded-lg text-slate-700">Edit product metrics</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-semibold rounded-lg text-slate-700">View shop distributions</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-semibold rounded-lg text-rose-600 focus:text-rose-600">Deactivate global variant</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination System Metadata Footer Bar */}
          <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-100 bg-white">
            <span className="text-[11px] font-bold text-slate-400">
              Showing <span className="text-slate-700">1 to 8</span> of <span className="text-slate-700">{businessStats.totalProducts.toLocaleString()}</span> products
            </span>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="outline" className="w-7 h-7 p-0 rounded-lg border-slate-200 text-slate-400 hover:bg-slate-50" disabled>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" className="w-7 h-7 p-0 rounded-lg border-blue-600 bg-blue-50/40 text-blue-700 font-black text-xs hover:bg-blue-50/40 shadow-none">1</Button>
                <Button variant="outline" className="w-7 h-7 p-0 rounded-lg border-transparent text-slate-500 font-bold text-xs hover:bg-slate-50 shadow-none">2</Button>
                <Button variant="outline" className="w-7 h-7 p-0 rounded-lg border-transparent text-slate-500 font-bold text-xs hover:bg-slate-50 shadow-none">3</Button>
                <span className="text-[11px] font-bold text-slate-300 px-0.5">...</span>
                <Button variant="outline" className="w-7 h-7 p-0 rounded-lg border-transparent text-slate-500 font-bold text-xs hover:bg-slate-50 shadow-none">156</Button>
                <Button variant="outline" className="w-7 h-7 p-0 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50">
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-7 text-xs font-bold border-slate-200 text-slate-700 rounded-lg gap-1 px-2.5 shadow-none bg-white">
                    10 / page <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="rounded-xl p-1 border-slate-200">
                  <DropdownMenuItem className="text-xs font-semibold rounded-lg">10 / page</DropdownMenuItem>
                  <DropdownMenuItem className="text-xs font-semibold rounded-lg">25 / page</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        {/* ── LOWER ROW BARS: QUICK OPERATION ACTION CARD NAVIGATION LINKS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Action 1: Receive Stock */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between items-start group">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <PlusCircle className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <h4 className="text-xs font-black text-blue-950">Receive Stock</h4>
              <p className="text-[11px] font-semibold text-slate-400 leading-normal">Add new stock arrivals into your inventory catalog tracks.</p>
            </div>
            <Button variant="ghost" className="p-0 mt-4 text-[11px] font-black text-blue-600 hover:bg-transparent group-hover:text-blue-800 gap-1 self-start">
              Receive Stock <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Card>

          {/* Action 2: Transfer Stock */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between items-start group">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Truck className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <h4 className="text-xs font-black text-blue-950">Transfer Stock</h4>
              <p className="text-[11px] font-semibold text-slate-400 leading-normal">Move stock balances securely between different store branches.</p>
            </div>
            <Button variant="ghost" className="p-0 mt-4 text-[11px] font-black text-rose-600 hover:bg-transparent group-hover:text-rose-800 gap-1 self-start">
              Transfer Stock <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Card>

          {/* Action 3: Adjust Stock */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between items-start group">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sliders className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <h4 className="text-xs font-black text-blue-950">Adjust Stock</h4>
              <p className="text-[11px] font-semibold text-slate-400 leading-normal">Manually adjust stock counts due to shrinkage or spillages.</p>
            </div>
            <Button variant="ghost" className="p-0 mt-4 text-[11px] font-black text-emerald-600 hover:bg-transparent group-hover:text-emerald-800 gap-1 self-start">
              Adjust Stock <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Card>

          {/* Action 4: Stock Count Audits */}
          <Card className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between items-start group">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ClipboardCheck className="w-4.5 h-4.5 stroke-[2.2]" />
              </div>
              <h4 className="text-xs font-black text-blue-950">Stock Count</h4>
              <p className="text-[11px] font-semibold text-slate-400 leading-normal">Perform cyclical physical store audits to verify asset records.</p>
            </div>
            <Button variant="ghost" className="p-0 mt-4 text-[11px] font-black text-amber-600 hover:bg-transparent group-hover:text-amber-800 gap-1 self-start">
              Start Stock Count <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Card>

        </div>

      </div>
    </div>
  );
}