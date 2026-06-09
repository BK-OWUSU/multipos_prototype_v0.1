"use client";

import React, { useState } from "react";
import { 
  Store, 
  Plus, 
  Search, 
  Users, 
  Package, 
  Coins, 
  MoreHorizontal, 
  Edit2, 
  MapPin, 
  Copy, 
  Info,
  ExternalLink
} from "lucide-react";

// shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ShopSwitcher from "@/components/shop-switcher";

const INITIAL_SHOPS = [
  {
    id: "main",
    name: "Main Branch",
    status: "Active",
    region: "Accra, Greater Accra Region",
    country: "Ghana",
    employees: 12,
    products: 1230,
    todaySales: "₵12,560.00",
    slug: "main-branch",
    phone: "+233 20 123 4567",
    email: "main@a1superstore.com",
    address: "123 Liberation Road, Accra",
    openingTime: "08:00 AM",
    closingTime: "10:00 PM",
    gps: "5.6037° N, 0.1870° W",
    cashRegister: "Open",
    cashRegisterSince: "8:00 AM",
    salesGrowth: "+18.5%"
  },
  {
    id: "east-legon",
    name: "East Legon Branch",
    status: "Active",
    region: "Accra, Greater Accra Region",
    country: "Ghana",
    employees: 4,
    products: 320,
    todaySales: "₵4,250.00",
    slug: "east-legon-branch",
    phone: "+233 20 987 6543",
    email: "eastlegon@a1superstore.com",
    address: "45 Anumansa Street, East Legon",
    openingTime: "09:00 AM",
    closingTime: "09:00 PM",
    gps: "5.6502° N, 0.1489° W",
    cashRegister: "Open",
    cashRegisterSince: "9:00 AM",
    salesGrowth: "+12.3%"
  },
  {
    id: "kumasi",
    name: "Kumasi Branch",
    status: "Inactive",
    region: "Kumasi, Ashanti Region",
    country: "Ghana",
    employees: 2,
    products: 150,
    todaySales: "₵1,120.00",
    slug: "kumasi-branch",
    phone: "+233 24 555 7890",
    email: "kumasi@a1superstore.com",
    address: "Prempeh II Avenue, Adum",
    openingTime: "08:30 AM",
    closingTime: "07:00 PM",
    gps: "6.6906° N, 1.6287° W",
    cashRegister: "Closed",
    cashRegisterSince: "N/A",
    salesGrowth: "-2.1%"
  }
];

const TABS_CONFIG = ["General", "Employees", "Inventory", "POS Settings", "Receipt Settings", "Taxes", "Cash Registers", "Audit Logs"];

export default function ManageShopsDashboard() {
  const [shops] = useState(INITIAL_SHOPS);
  const [selectedShopId, setSelectedShopId] = useState("main");
  const [activeTab, setActiveTab] = useState("General");
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedShop = shops.find(s => s.id === selectedShopId) || shops[0];

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          shop.region.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "Active") return matchesSearch && shop.status === "Active";
    if (filter === "Inactive") return matchesSearch && shop.status === "Inactive";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 text-slate-900">
      
    {/* HEADER SECTION */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shops</h1>
        <p className="text-sm text-muted-foreground">Manage all your business locations and properties.</p>
      </div>
      
      {/* Wrap actions in a responsive grid/flex container */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
        <div className="w-full sm:w-auto">
          <ShopSwitcher />
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 rounded-xl h-11 sm:h-10 font-bold text-xs sm:text-sm shadow-sm">
          <Plus className="w-4 h-4 stroke-[2.5]" /> Add Shop
        </Button>
      </div>
    </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
      {/* LEFT COLUMN: SHOP LIST CONTAINER */}
        <Card className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
          
          {/* Sticky Top Header Area inside the Left Card */}
          <div className="p-5 space-y-4 border-b border-slate-100 shrink-0">
            
            {/* Search Input Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search shops..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white rounded-xl h-10 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Filter Navigation Pills */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100/80">
              {["All", "Active", "Inactive"].map((type) => {
                const count = type === "All" ? shops.length : shops.filter(s => s.status === type).length;
                const isCurrentFilter = filter === type;
                return (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter(type)}
                    className={`text-xs rounded-lg px-3 py-1.5 font-bold flex-1 transition-all ${
                      isCurrentFilter 
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/40" 
                        : "text-slate-500 hover:bg-slate-100/60"
                    }`}
                  >
                    {type} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Scrollable Feed for Inner Shop Cards */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {filteredShops.map((shop) => {
              const isSelected = shop.id === selectedShopId;
              return (
                <Card 
                  key={shop.id}
                  onClick={() => setSelectedShopId(shop.id)}
                  className={`cursor-pointer transition-all rounded-xl border ${
                    isSelected 
                      ? "border-indigo-600 ring-1 ring-indigo-600/20 bg-indigo-50/20" 
                      : "border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50/70"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border ${
                        shop.status === "Active" 
                          ? "bg-white text-indigo-600 border-indigo-100/80" 
                          : "bg-white text-slate-400 border-slate-100"
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{shop.name}</h4>
                          <Badge variant={shop.status === "Active" ? "default" : "secondary"} className={`text-[10px] font-bold px-1.5 py-0 rounded-md tracking-wide ${
                            shop.status === "Active" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-600"
                          }`}>
                            {shop.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{shop.region}</p>
                      </div>
                    </div>

                    {/* Data Metrics Strip */}
                    <div className="grid grid-cols-3 gap-1 text-center py-2 my-3 border-t border-b border-slate-100 bg-white/60 rounded-xl">
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{shop.employees}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Employees</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{shop.products}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Products</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">{shop.todaySales}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Sales</span>
                      </div>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-0.5">
                      <span className="flex items-center gap-1 hover:text-slate-900"><Edit2 className="w-3 h-3" /> Manage</span>
                      <span className="flex items-center gap-1 hover:text-slate-900"><Coins className="w-3 h-3" /> View Sales</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* RIGHT COLUMN: DETAIL AREA */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Top Hero Layout */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900">{selectedShop.name}</h2>
                  <Badge className={selectedShop.status === "Active" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-slate-100 text-slate-600"}>
                    {selectedShop.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{selectedShop.region}, {selectedShop.country}</p>
              </div>
            </div>

            {/* Top Row Action Buttons */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200">Edit Shop</Button>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50">Deactivate</Button>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50">Delete Shop</Button>
            </div>
          </div>

          {/* Navigation Control Component (shadcn Tabs wrapper styling) */}
          <Tabs value={activeTab}  onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b border-slate-100 bg-white">
              <TabsList className="bg-transparent h-auto p-0 gap-1 justify-start overflow-x-auto rounded-none w-full flex">
                {TABS_CONFIG.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className=" data-[state=active]:text-blue-800 data-[state=active]:border-b-3 data-[state=active]:border-b-blue-800 rounded-none border-b-2 border-transparent bg-transparent py-3 px-3 text-xs font-bold text-slate-400 transition-all"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* General  Settings Workspace Canvas */}
            <div className="p-6">
              {activeTab === "General" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* General Information Data Card */}
                    <Card className="border-slate-100 rounded-2xl shadow-none">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                          <h3 className="font-bold text-slate-900 text-sm">General Information</h3>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-lg text-slate-400 border-slate-200">Edit</Button>
                        </div>

                        <div className="space-y-3 text-xs font-medium">
                          {[
                            { label: "Shop Name", value: selectedShop.name },
                            { label: "Shop Slug", value: selectedShop.slug, code: true },
                            { label: "Phone Number", value: selectedShop.phone },
                            { label: "Email", value: selectedShop.email },
                            { label: "Address", value: `${selectedShop.address}, ${selectedShop.region}` },
                            { label: "City", value: "Accra" },
                            { label: "Country", value: selectedShop.country },
                            { label: "Opening Time", value: selectedShop.openingTime },
                            { label: "Closing Time", value: selectedShop.closingTime },
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between py-0.5 items-start">
                              <span className="text-slate-400">{item.label}</span>
                              <span className={`text-slate-900 font-semibold text-right max-w-[190px] ${item.code ? "font-mono text-[11px] bg-slate-50 px-1.5 py-0.5 rounded" : ""}`}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                          <Separator className="my-2 bg-slate-50" />
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">Status</span>
                            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Active
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Created At</span>
                            <span className="text-slate-400 font-semibold">May 20, 2024</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Geolocation Map Layout Card */}
                    <Card className="border-slate-100 rounded-2xl shadow-none flex flex-col justify-between">
                      <CardContent className="p-5 space-y-4 w-full">
                        <div className="pb-2 border-b border-slate-50">
                          <h3 className="font-bold text-slate-900 text-sm">Location</h3>
                        </div>

                        {/* Map Vector Simulated Block Area */}
                        <div className="w-full h-44 bg-sky-50 rounded-xl border border-sky-100/60 relative overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 bg-[radial-gradient(#bae6fd_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
                          <div className="relative z-10 bg-white p-2 rounded-xl shadow-md border border-sky-100/50 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-indigo-600 fill-indigo-50" />
                          </div>
                          <span className="absolute bottom-1.5 left-2.5 text-[9px] text-sky-600 font-bold tracking-tight uppercase">DZORWULU, ACCRA</span>
                        </div>

                        <div className="space-y-3 pt-1 text-xs font-medium">
                          <div>
                            <span className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">Address</span>
                            <div className="flex items-center justify-between gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                              <span className="text-slate-700 font-semibold text-[11px] truncate">{selectedShop.address}, {selectedShop.region}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600"><Copy className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>

                          <div>
                            <span className="block text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1">GPS Coordinates</span>
                            <div className="flex items-center justify-between gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                              <span className="text-slate-700 font-mono text-[11px] truncate">{selectedShop.gps}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-400 hover:text-slate-600"><Copy className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Operational Bottom Metrics Panel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Metric Card Component */}
                    {[
                      { title: "Employees", icon: Users, value: selectedShop.employees, color: "indigo", link: "Manage Employees →" },
                      { title: "Products", icon: Package, value: selectedShop.products, color: "sky", link: "Manage Inventory →" },
                      { title: "Today's Sales", icon: Coins, value: selectedShop.todaySales, color: "emerald", label: `${selectedShop.salesGrowth} vs yesterday` },
                      { title: "Cash Register", icon: Store, value: selectedShop.cashRegister, color: "amber", label: `Since ${selectedShop.cashRegisterSince}` },
                    ].map((card, i) => {
                      const IconComp = card.icon;
                      return (
                        <Card key={i} className="border-slate-100 rounded-2xl bg-slate-50/40 shadow-none flex flex-col justify-between h-32">
                          <CardContent className="p-4 flex flex-col justify-between h-full w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                              <div className={`p-1.5 rounded-xl bg-white border border-slate-100 text-slate-700`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                            </div>
                            <div>
                              <span className={`block text-xl font-black tracking-tight ${card.title === "Cash Register" && card.value === "Open" ? "text-emerald-600" : "text-slate-900"}`}>
                                {card.value}
                              </span>
                              {card.link ? (
                                <button className="text-[11px] font-bold text-indigo-600 hover:underline mt-1 block text-left">
                                  {card.link}
                                </button>
                              ) : (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block ${
                                  card.title === "Today's Sales" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 font-medium"
                                }`}>
                                  {card.label}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                  <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">{activeTab} Section Content</p>
                  <p className="text-xs text-slate-400 mt-1">Data parameters related to configuration updates appear here.</p>
                </div>
              )}
            </div>
          </Tabs>

          {/* Context Footer Information Strip Banner */}
          <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-start gap-3 text-xs leading-relaxed text-slate-500">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="font-medium">
              <span className="font-bold text-slate-700">About Shops:</span> Shops represent independent localized business operational environments. You can manage roles, routing configurations, hardware terminal links, and isolated stock sets unique to each store container. 
              <a href="#" className="text-indigo-600 font-bold hover:underline ml-1 inline-flex items-center gap-0.5">Learn More <ExternalLink className="w-3 h-3" /></a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}