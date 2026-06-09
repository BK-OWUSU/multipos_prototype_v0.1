"use client";

import React, { useState } from "react";
import { 
  Store, 
  ChevronDown, 
  Check, 
  Plus, 
  MapPin, 
  Users2, 
  Building2 
} from "lucide-react";

// Shadcn UI Primitives
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Adjust this path based on your shadcn setup
import { cn } from "@/lib/utils";

// Mock Data structure mirroring your branch instances
const shopsList = [
  {
    id: "shop-1",
    name: "Main Branch",
    location: "Accra, Ghana",
    icon: Store,
    bgClass: "bg-indigo-50 text-indigo-600 border-indigo-100",
    activeColor: "bg-indigo-600"
  },
  {
    id: "shop-2",
    name: "East Legon Branch",
    location: "Accra, Ghana",
    icon: Users2,
    bgClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    activeColor: "bg-emerald-600"
  },
  {
    id: "shop-3",
    name: "Kumasi Branch",
    location: "Kumasi, Ghana",
    icon: Building2,
    bgClass: "bg-orange-50 text-orange-600 border-orange-100",
    activeColor: "bg-orange-600"
  },
];

interface ShopSwitcherProps {
  onCreateShopClick?: () => void;
}

export default function ShopSwitcher({ onCreateShopClick }: ShopSwitcherProps) {
  // Managing active state locally for presentation (Link to global state/context in production)
  const [activeShop, setActiveShop] = useState(shopsList[0]);

  return (
    <DropdownMenu>
      {/* ── DROPDOWN TRIGGER BUTTON ────────────────────────────── */}
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-10 px-4 bg-indigo-50/40 hover:bg-indigo-50/80 border-indigo-100/80 text-indigo-900 rounded-xl font-bold text-sm shadow-sm gap-2 transition-all duration-200 shrink-0 focus-visible:ring-indigo-200"
        >
          <Store className="w-4 h-4 text-indigo-600 stroke-[2.5]" />
          <span>
            Current Shop: <span className="font-black text-slate-900">{activeShop.name}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-indigo-400 ml-1 stroke-[2.5]" />
        </Button>
      </DropdownMenuTrigger>

      {/* ── DROPDOWN MENU PANEL CONTENT ────────────────────────── */}
      <DropdownMenuContent 
        align="start" 
        className="w-70 bg-white rounded-2xl border border-slate-100 shadow-xl p-1.5 mt-1 animate-in fade-in-50 zoom-in-95 duration-100"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-black tracking-wide text-slate-800 uppercase">
          Switch Shop
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-slate-50 my-1" />

        <DropdownMenuGroup className="space-y-0.5">
          {shopsList.map((shop) => {
            const isSelected = shop.id === activeShop.id;
            const IconComponent = shop.icon;

            return (
              <DropdownMenuItem
                key={shop.id}
                onClick={() => setActiveShop(shop)}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer font-sans transition-colors duration-150 focus:bg-slate-50",
                  isSelected && "bg-indigo-50/30 focus:bg-indigo-50/50"
                )}
              >
                {/* Visual Custom Icon Badge */}
                <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shrink-0", shop.bgClass)}>
                  <IconComponent className="w-4 h-4 stroke-[2.5]" />
                </div>

                {/* Meta Descriptive Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-slate-900 truncate tracking-tight">
                    {shop.name}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-400 flex items-center gap-0.5 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                    <span className="truncate">{shop.location}</span>
                  </p>
                </div>

                {/* Dynamic Selection Indicator Checkmark */}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm animate-in scale-in-75 duration-100">
                    <Check className="w-3 h-3 stroke-3" />
                  </div>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-slate-50 my-1.5" />

        {/* ── BOTTOM UTILITY OPTION: CREATE BRAND NEW SHOP ──────── */}
        <DropdownMenuItem
          onClick={onCreateShopClick}
          className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer text-xs font-black text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 transition-colors duration-150"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-3" />
          </div>
          <span>Create New Shop</span>
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}