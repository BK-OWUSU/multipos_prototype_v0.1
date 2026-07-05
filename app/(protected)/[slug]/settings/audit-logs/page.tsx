"use client"

import React, { useState } from "react"
import { 
  FileText, 
  Users, 
  Database, 
  ShieldAlert, 
  Package, 
  Laptop, 
  Download, 
  Filter, 
  Search, 
  Eye,
  Calendar as CalendarIcon
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- SAMPLE DATA STATIC SCHEMAS ---
const STATS_CONFIG = [
  { id: "all", title: "All Logs", count: "18,245", icon: FileText, color: "text-blue-800 bg-blue-50 border-blue-100" },
  { id: "user", title: "User Activity", count: "7,842", icon: Users, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { id: "data", title: "Data Changes", count: "6,128", icon: Database, color: "text-amber-600 bg-amber-50 border-amber-100" },
  { id: "system", title: "System Events", count: "3,421", icon: Laptop, color: "text-purple-600 bg-purple-50 border-purple-100" },
  { id: "stock", title: "Stock Logs", count: "1,254", icon: Package, color: "text-blue-600 bg-blue-50 border-blue-100" },
  { id: "session", title: "User Sessions", count: "2,135", icon: ShieldAlert, color: "text-rose-600 bg-rose-50 border-rose-100" },
]

const TABS_CONFIG = [
  "All Logs", "User Activity", "Data Changes", "Stock Logs", "User Sessions", "System Events", "Login Activity"
]

const LOGS_DATA = [
  { id: "1", dateTime: "May 20, 2026 10:45 AM", user: "Abena Owusu", role: "Admin", action: "CREATE", module: "Product", type: "Data Change", desc: 'Created new product "Wireless Headphones"', ip: "105.112.45.78", branch: "Main Branch" },
  { id: "2", dateTime: "May 20, 2026 10:32 AM", user: "Kwaku Mensah", role: "Sales Manager", action: "UPDATE", module: "Customer", type: "Data Change", desc: 'Updated customer "Kwame Asante"', ip: "105.112.45.78", branch: "Main Branch" },
  { id: "3", dateTime: "May 20, 2026 09:15 AM", user: "Ama Boateng", role: "Cashier", action: "DELETE", module: "Sale", type: "Data Change", desc: "Deleted sale #INV-000125", ip: "197.210.33.21", branch: "Main Branch" },
  { id: "4", dateTime: "May 19, 2026 06:22 PM", user: "Kofi Addo", role: "Inventory Manager", action: "UPDATE", module: "Inventory", type: "Stock Log", desc: 'Updated stock quantity for "Rice 25kg"', ip: "41.203.19.10", branch: "Warehouse" },
  { id: "5", dateTime: "May 19, 2026 03:10 PM", user: "Abena Owusu", role: "Admin", action: "LOGIN", module: "Auth", type: "User Session", desc: "User logged in Successfully", ip: "105.112.45.78", branch: "Main Branch" },
]

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState("All Logs")

  // Helper styles for structural action flags
  const getActionBadge = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "UPDATE": return "bg-blue-50 text-blue-700 border-blue-200"
      case "DELETE": return "bg-rose-50 text-rose-700 border-rose-200"
      default: return "bg-slate-50 text-slate-700 border-slate-200"
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "Data Change": return "bg-amber-50 text-amber-700 border-amber-200"
      case "Stock Log": return "bg-blue-50 text-blue-700 border-blue-200"
      case "User Session": return "bg-purple-50 text-purple-700 border-purple-200"
      default: return "bg-slate-50 text-slate-600 border-slate-200"
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 bg-slate-50/50 min-h-screen w-full">
      
      {/* ─── HEADER PANEL ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h1 className="text-2xl font-bold text-blue-950 tracking-tight">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track and monitor all user activities and system changes</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex items-center gap-2 border-slate-200 text-slate-700 h-9 bg-white">
            <Download size={15} />
            <span>Export</span>
          </Button>
          <Button size="sm" className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 active:bg-blue-950 text-white h-9 transition-colors">
            <Filter size={15} />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      {/* ─── HIGH-LEVEL METRIC GRID CARD SUMMARY ─────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 w-full">
        {STATS_CONFIG.map((stat) => {
          const IconComponent = stat.icon
          return (
            <Card key={stat.id} className="border border-slate-100 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
                <div className="flex justify-between items-start w-full">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 tracking-normal">{stat.title}</span>
                    <span className="text-xl font-bold text-slate-800 mt-1 tracking-tight">{stat.count}</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${stat.color}`}>
                    <IconComponent size={16} />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">Total registered metrics</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ─── MAIN CENTRAL WORKFLOW VIEWPORT ─────────────────────── */}
      <Card className="border border-slate-200/70 shadow-sm rounded-xl overflow-hidden bg-white w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          {/* TAB BINDING COMPONENT ROW */}
          <div className="px-4 md:px-6 border-b border-slate-100 bg-white">
            <TabsList className="bg-transparent h-auto p-0 gap-1 justify-start overflow-x-auto rounded-none w-full flex scrollbar-none">
              {TABS_CONFIG.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="data-[state=active]:text-blue-800 data-[state=active]:border-b-3 data-[state=active]:border-b-blue-800 rounded-none border-b-2 border-transparent bg-transparent py-3.5 px-3 text-xs font-bold text-slate-400 transition-all whitespace-nowrap"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="p-0 m-0">
            
            {/* ─── CONTROLS & FILTERING DOCK ───────────────────── */}
            <div className="p-4 md:p-5 flex flex-col xl:flex-row gap-3 border-b border-slate-100 bg-white w-full">
              {/* Left Column: Input Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 w-full xl:w-[82%]">
                
                {/* Datepicker Mock Interface Container */}
                <Button variant="outline" className="w-full justify-start text-left font-normal border-slate-200 text-slate-600 h-9 px-3 bg-white text-xs">
                  <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                  <span>May 1, 2026 - May 31, 2026</span>
                </Button>

                <Select defaultValue="all-users">
                  <SelectTrigger className="h-9 text-xs text-slate-600 border-slate-200 bg-white">
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-users">All Users</SelectItem>
                    <SelectItem value="admin">Abena Owusu (Admin)</SelectItem>
                    <SelectItem value="manager">Kwaku Mensah</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all-actions">
                  <SelectTrigger className="h-9 text-xs text-slate-600 border-slate-200 bg-white">
                    <SelectValue placeholder="Action Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-actions">All Actions</SelectItem>
                    <SelectItem value="create">CREATE</SelectItem>
                    <SelectItem value="update">UPDATE</SelectItem>
                    <SelectItem value="delete">DELETE</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all-branches">
                  <SelectTrigger className="h-9 text-xs text-slate-600 border-slate-200 bg-white">
                    <SelectValue placeholder="Branch Office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-branches">All Branches</SelectItem>
                    <SelectItem value="main">Main Branch</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Right Column: Comprehensive Search Input Field Bar */}
              <div className="relative w-full xl:w-[18%]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  type="search" 
                  placeholder="Search logs..." 
                  className="pl-9 h-9 text-xs border-slate-200 focus-visible:ring-blue-700 bg-white w-full"
                />
              </div>
            </div>

            {/* ─── SECURE DATA AUDIT LOG TABLE ─────────────────── */}
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-600 px-4 h-10">Date & Time</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 px-4 h-10">User</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 px-4 h-10">Action</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 px-4 h-10">Module</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 px-4 h-10">Log Type</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 px-4 h-10 min-w-[240px]">Description</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 px-4 h-10">IP Address</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 px-4 h-10">Branch</TableHead>
                    <TableHead className="text-xs font-bold text-slate-600 text-center px-4 h-10 w-16">Details</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {LOGS_DATA.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/40 border-b border-slate-100/80 transition-colors">
                      <TableCell className="text-xs font-medium text-slate-500 whitespace-nowrap px-4 py-3">{log.dateTime}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{log.user}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{log.role}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-600 px-4 py-3">{log.module}</TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getTypeBadge(log.type)}`}>
                          {log.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600 px-4 py-3 max-w-sm truncate">{log.desc}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500 px-4 py-3">{log.ip}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-600 px-4 py-3">{log.branch}</TableCell>
                      <TableCell className="text-center px-4 py-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-400 hover:text-blue-800 hover:bg-blue-50">
                          <Eye size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ─── DATA PAGINATION BAR FOOTER ──────────────────── */}
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100 bg-white w-full">
              <span className="text-xs text-slate-400 font-medium">
                Showing <strong className="text-slate-700">1 to 5</strong> of <strong className="text-slate-700">18,245</strong> logs
              </span>
              
              <div className="flex items-center gap-5">
                {/* Numeric Entry Row Blocks */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((page) => (
                    <Button 
                      key={page} 
                      size="icon"
                      variant={page === 1 ? "default" : "ghost"}
                      className={`h-7 w-7 text-xs font-bold rounded-md ${
                        page === 1 
                          ? "bg-blue-800 text-white hover:bg-blue-700" 
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                  <span className="text-slate-300 px-1 text-xs font-bold">...</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs font-bold text-slate-500 hover:bg-slate-100">
                    1825
                  </Button>
                </div>

                {/* Per Page Data Sizer */}
                <Select defaultValue="10">
                  <SelectTrigger className="h-7 w-[95px] text-xs text-slate-500 border-slate-200 bg-white">
                    <SelectValue placeholder="Per Page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}