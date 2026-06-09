"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  Search, Scan, Plus, User, ShoppingCart,Wifi,WifiOff,MoveRight,Trash2,
  X, HelpCircle, Flame, CreditCard, Smartphone, DollarSign, Split 
} from "lucide-react";
import Image from "next/image";
import { useProductStore } from "@/store/productsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ProductsVariants } from "@/types/schema/inventory";
import { useCategoryStore } from "@/store/categoryStore";

export default function SaleTerminalPage() {
// 1. ZUSTAND GLOBAL STORES
const { user } = useAuthStore();
const { fetchProductsVariant, productsVariants } = useProductStore();
const { categories, fetchCategories } = useCategoryStore();


const PRODUCTS: ProductsVariants[] | null = productsVariants;

// 2. LOCAL STATES
const [selectedCategory, setSelectedCategory] = useState("All");
const [currentDate, setCurrentDate] = useState("");
const [currentTime, setCurrentTime] = useState("");
const [activeProduct, setActiveProduct] = useState<ProductsVariants | null>(null);
const [searchQuery, setSearchQuery] = useState(""); // Search and Ctrl + K feature
const [sortBy, setSortBy] = useState("name-az"); // Default sorting option

const selectedProduct = activeProduct || (PRODUCTS && PRODUCTS.length > 0 ? PRODUCTS[0] : null);
//Refs
const searchInputRef = useRef<HTMLInputElement>(null);

//TRIGGER FETCHING ON MOUNT
 useEffect(() => {
      fetchProductsVariant();
      fetchCategories();
}, [fetchProductsVariant,fetchCategories]);

// A. Dynamically filter list by Category AND Search Query (Name, SKU, or Barcode)
  const filteredProducts = (PRODUCTS || []).filter((prod) => {
    // Category match check
    const matchesCategory = selectedCategory === "All" || prod.category?.name === selectedCategory; 
    // Search query match check
    const lowerQuery = searchQuery.toLowerCase().trim();
    if (!lowerQuery) return matchesCategory;
    const matchesName = prod.displayName?.toLowerCase().includes(lowerQuery);
    const matchesSku = prod.sku?.toLowerCase().includes(lowerQuery);
    const matchesBarcode = prod.barcode?.toLowerCase().includes(lowerQuery);

    return matchesCategory && (matchesName || matchesSku || matchesBarcode);
  });

// B. Sorted List (Derived State)
const sortedProducts = useMemo(() => {
  // Create a shallow copy array to avoid directly mutating the store data stream
  const baseProducts = [...filteredProducts];

  if (sortBy === "name-az") {
    return baseProducts.sort((a, b) => 
      (a.displayName || "").localeCompare(b.displayName || "")
    );
  }

  if (sortBy === "price-lh") {
    return baseProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
  }

  return baseProducts;
}, [filteredProducts, sortBy]);  


const dynamicCategories = useMemo(() => {
    if (!categories || categories.length === 0) return ["All"];
    
    // Extract name strings from your database categories array
    const dbCategoryNames = categories.map((cat: { name: string }) => cat.name);
    
    // Spread them cleanly behind "All"
    return ["All", ...dbCategoryNames];
  }, [categories]);

// Listen for global keyboard shortcut Command/Ctrl + K
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Check for K/k and ensure either Ctrl or Meta (Command on Mac) is pressed
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault(); // Stop browser search or default actions

      if (searchInputRef.current) {
        searchInputRef.current.focus();
        // setTimeout ensures the focus ring and DOM state resolve before selecting text
        setTimeout(() => {
          searchInputRef.current?.select();
        }, 0);
      }
    }
  };

  //CRITICAL: Using { capture: true } forces the app to intercept the key combination early
  window.addEventListener("keydown", handleKeyDown, { capture: true });
  return () => {
    window.removeEventListener("keydown", handleKeyDown, { capture: true });
  };
}, []);



//EFFECTS for Time & Dates
useEffect(() => {
  const updateClock = () => {
    const now = new Date();
    // Format Date: e.g., "May 27, 2026"
    setCurrentDate(
      now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );
    // Format Time: e.g., "10:30 AM"
    setCurrentTime(
      now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
    };
    // Run immediately on mount
    updateClock();
    // Update every second to keep time ticking smoothly
    const timer = setInterval(updateClock, 1000);

    return () => clearInterval(timer);
    }, []);

  

  return (
   <div className="flex gap-2 rounded-md sticky top-2 flex-col h-screen w-full text-slate-800 antialiased overflow-hidden">
    
    {/* ── CORE WORKSPACE PANELS CONTAINER ──────────────────────────────── */}
    <div className="flex flex-1 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden gap-4 p-2 lg:p-0">
        
    {/* LEFT CATALOG GRID DISPLAY */}
     <main className="flex-1 flex flex-col lg:overflow-hidden p-4 sm:p-5 space-y-4 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm">

            {/* ── TOP UTILITY CONTEXT BAR ──────────────────────────────────────── */}
          <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-md border border-slate-100">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 w-full">
              {/* Core Command Search Engine */}
              <div className="relative flex-1 min-w-50">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef} // <-- Attached focus hook anchor here
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  type="text" 
                  placeholder="Search products by name, SKU or barcode..." 
                  className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <kbd className="hidden sm:inline-block absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border rounded shadow-sm">Ctrl + K</kbd>
              </div>

              {/* Barcode Device Simulation Button */}
              <button className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex-1 sm:flex-none">
                <Scan className="h-4 w-4 text-slate-600" />
                <span className="text-slate-700 whitespace-nowrap">Scan Barcode</span>
              </button>

              {/* Quick Action Add */}
              <button className="p-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-sm transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </header>
          
          {/* Filter & Sort Headers */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat 
                      ? "bg-blue-900 hover:bg-blue-800 text-white shadow-sm" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

  <         div className="flex items-center gap-2 justify-between sm:justify-end">
              <select 
                className="bg-white border border-slate-200 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none flex-1 sm:flex-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                >
                <option value="name-az">🔢 Sort: Name (A-Z)</option>
                <option value="price-lh">🔢 Sort: Price (Low to High)</option>
              </select>
              <button className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-xs font-medium rounded-lg px-3 py-2 hover:bg-slate-50">
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                <span>Filter</span>
              </button>
            </div>
          </div>

        {/* Grid Products Stream View */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 p-4 min-h-87.5">
        {sortedProducts && sortedProducts.length > 0 ? (
            sortedProducts.map((prod) => (
            <div 
                key={prod.id}
                onClick={() => setActiveProduct(prod)}
                className={`bg-white border max-h-64 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative group ${
                selectedProduct?.id === prod.id ? "ring-2 ring-blue-950 border-transparent" : "border-slate-200"
                }`}
               >
                {/* Stock Indicator Bubble */}
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 ${
                prod.stock <= prod.lowStockAlert ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                }`}>
                {prod.stock}
                </span>

                <div className="bg-slate-50 rounded-lg aspect-square w-full mb-3 flex items-center justify-center overflow-hidden border border-slate-100 relative">
                <Image
                    src={prod.imageUrl || "/imgs/no-image-pic-trans.png"}
                    alt={prod.displayName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                </div>

                <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{prod.displayName}</h4>
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">SKU: {prod.sku}</p>
                <div className="pt-1 flex flex-col">
                    <span className="text-sm font-bold text-slate-900"><CurrencyCell amount={prod.price} /></span>
                    <span className="text-[11px] text-green-600 font-medium">From <CurrencyCell amount={prod.price} /></span>
                </div>
                </div>
            </div>
            ))
           ) : (
            /* CLEAN, CENTERED EMPTY STATE TRUNK */
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
            <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 border border-slate-200/60 shadow-inner">
                <ShoppingCart className="h-7 w-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No Products Available</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1 px-4">
                {searchQuery 
                ? "We couldn't find anything matching your search terms. Try refining your keywords or filters." 
                // : "This account has no catalog inventory yet. Click the '+' action button above to load items."}
                : "This account has no catalog inventory yet. Go to the 'Products Page' and Create/Import new products."}
            </p>
            
            {searchQuery && (
                <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 px-3 py-1.5 bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                Clear Search Filter
                </button>
            )}
            </div>
         )}
        </div>
          
          {/* ── BOTTOM DRAWER: DYNAMIC VARIANT PARAMETERS SELECTION BAR ────── */}
        <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full">
        {!selectedProduct ? (
            /* CLEAN EMPTY STATE MESSAGE WHEN ACCOUNT HAS NO INVENTORY LOADING */
            <div className="flex items-center justify-center py-4 text-sm font-medium text-slate-400 gap-2">
            <ShoppingCart className="h-4 w-4 animate-bounce" />
            <span>Add products to your inventory catalog to begin selling.</span>
            </div>
        ) : (
            /* ACTIVE METADATA INTERFACE (Renders only when a valid item exists) */
            <div className="flex flex-col xl:flex-row items-center justify-between gap-4 xl:gap-6 animate-in fade-in duration-200">
                
            {/* LEFT MODULE: PRODUCT METADATA BLOCK */}
            <div className="flex items-center gap-4 shrink-0 w-full xl:w-auto justify-between xl:justify-start">
                <div className="flex gap-4 items-center">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border shrink-0 shadow-sm bg-slate-50">
                    <Image
                    src={selectedProduct.imageUrl || "/imgs/no-image-pic-trans.png"}
                    alt={selectedProduct.displayName}
                    fill
                    className="object-contain p-1"
                    />
                </div>

                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight line-clamp-1">
                    {selectedProduct.displayName}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                    SKU: {selectedProduct.sku || "N/A"}
                    </p>

                    <div className="flex gap-4 mt-1 text-xs">
                    <p className="text-slate-500">
                        Price: <span className="font-bold text-slate-900 ml-0.5"><CurrencyCell amount={selectedProduct.price || 0} /></span>
                    </p>
                    <p className="text-slate-500">
                        Stock: <span className="font-bold text-slate-900 ml-0.5">{selectedProduct.stock ?? 0}</span>
                    </p>
                    </div>
                </div>
                </div>
                
                <button 
                onClick={() => setActiveProduct(null)} 
                className="xl:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50"
                >
                <X className="h-4 w-4" />
                </button>
            </div>

            {/* MIDDLE MODULE: ATTRIBUTE VARIANT SELECTION HUBS */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 xl:gap-6 flex-1 w-full xl:w-auto">
                <div>
                <p className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Color</p>
                <div className="flex gap-2">
                    <button className="w-7 h-7 bg-blue-600 rounded-md ring-2 ring-offset-2 ring-blue-600 flex items-center justify-center text-white text-xs font-bold">✓</button>
                    <button className="w-7 h-7 bg-black rounded-md border border-slate-200 transition-transform hover:scale-105"></button>
                    <button className="w-7 h-7 bg-white rounded-md border border-slate-300 transition-transform hover:scale-105"></button>
                    <button className="w-7 h-7 bg-red-600 rounded-md border border-slate-200 transition-transform hover:scale-105"></button>
                </div>
                </div>

                <div className="w-full sm:w-auto">
                <p className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Size</p>
                <div className="flex gap-1.5 flex-wrap">
                    {["S", "M", "L", "XL", "XXL"].map((sz) => (
                    <button 
                        key={sz}
                        className={`h-7 px-3 text-xs font-bold border rounded-md transition-all ${
                        sz === "L" 
                            ? "bg-blue-50 border-blue-900 text-blue-600 ring-1 ring-blue-50" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        {sz}
                    </button>
                    ))}
                </div>
                </div>
            </div>

            {/* RIGHT MODULE: COUNTER CONTROLS & CALL TO ACTION TRAYS */}
            <div className="flex items-center gap-3 w-full xl:w-auto justify-between sm:justify-end shrink-0">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-9 overflow-hidden shadow-sm">
                <button className="px-2.5 h-full hover:bg-slate-100 font-bold text-slate-500 border-r text-base transition-colors">-</button>
                <span className="px-3 text-xs font-bold text-slate-800 w-10 text-center">1</span>
                <button className="px-2.5 h-full hover:bg-slate-100 font-bold text-slate-500 border-l text-base transition-colors">+</button>
                </div>

                <button className="flex-1 xl:flex-none bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs h-9 px-5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
                </button>

                <button 
                onClick={() => setActiveProduct(null)} 
                className="hidden xl:block text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 ml-1"
                >
                <X className="h-4 w-4" />
                </button>
            </div>

            </div>
        )}
        </section>


        </main>

        {/* RIGHT SIDEBAR CHECKOUT CART INTERFACE */}
        <aside className="w-full lg:w-100 bg-white flex flex-col overflow-hidden shrink-0 rounded-xl border border-slate-200/60 shadow-sm">
          
          {/* Cart Header Panel */}
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <span>Cart</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">3</span>
            </h2>
            <button className="text-xs text-rose-600 font-bold hover:bg-rose-50 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1">
              <Trash2  className="h-3 w-3" /> Clear Cart
            </button>
          </div>

          {/* Scrollable Chosen Items List */}
          <div className="flex-1 min-h-62.5 lg:min-h-0 overflow-y-auto px-4 py-2 space-y-3 bg-slate-50/40">
            <CartItem name="Basic T-Shirt - Blue" sku="TEE-BLU-L-BLU" details="Size: L  Color: Blue" price={50.00} qty={1} />
            <CartItem name="Denim Jeans - Blue" sku="JNS-BLU-32" details="Size: 32" price={150.00} qty={1} />
            <CartItem name="Sneakers - White" sku="SNK-WHT-42" details="Size: 42" price={250.00} qty={1} />
          </div>

          {/* Pricing Ledger calculations area */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800"><CurrencyCell amount={450} /></span>
              </div>
              <div className="flex justify-between items-center text-rose-600 font-medium">
                <span>Discount</span>
                <span className="font-bold"><CurrencyCell amount={-22.50} /></span>
              </div>
            </div>

           {/* Active Coupon Injection Fields */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select className="w-full appearance-none bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-lg focus:outline-none">
                  <option>🏷️ 10% OFF</option>
                  <option>🏷️ Free Shipping Promo</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <X className="h-3 w-3 cursor-pointer hover:text-slate-600 pointer-events-auto" />
                </div>
              </div>
              <button className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors">
                <Plus className="h-3 w-3" /> Add Discount
              </button>
            </div>

           {/* Total Balance Sheet Header */}
            <div className="flex justify-between items-baseline border-t border-dashed border-slate-200 pt-2">
              <span className="text-sm font-bold text-slate-800">Total</span>
              <span className="text-lg font-black text-slate-900 tracking-tight"><CurrencyCell amount={427.50} /></span>
            </div>

            {/* Middle Holding State Triggers Row */}
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1.5 py-2 bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs rounded-lg hover:bg-blue-100/70 transition-all">
                <HelpCircle className="h-3.5 w-3.5" /> Hold Sale
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 bg-indigo-50 border border-blue-200 text-blue-900 font-bold text-xs rounded-lg hover:bg-blue-100/70 transition-all">
                <Flame className="h-3.5 w-3.5" /> Park Sale
              </button>
            </div>

            {/* Processing Execution Button */}
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition-all flex items-center justify-between group">
              <span className="text-sm tracking-wide">Checkout</span>
              <div className="flex items-center gap-1 text-sm bg-emerald-700 px-2.5 py-1 rounded-lg">
                <span><CurrencyCell amount={200} /></span>
                <span className="transform group-hover:translate-x-0.5 transition-transform"><MoveRight className="h-4 w-4" /></span>
              </div>
            </button>

           {/* Active Customer Assignment Node */}
            <div className="flex items-center justify-between border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Customer</p>
                  <p className="text-xs font-bold text-blue-900 hover:underline cursor-pointer">Walk-in Customer</p>
                </div>
              </div>
              <button className="p-1 border border-slate-200 hover:bg-blue-900 rounded-lg bg-slate-50 transition-colors">
                <Plus className="h-3.5 w-3.5 text-slate-500 hover:text-white" />
              </button>
            </div>

           {/* Payment Modes Grid Modules */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                <PaymentButton icon={<DollarSign className="h-4 w-4" />} label="Cash" active />
                <PaymentButton icon={<Smartphone className="h-4 w-4" />} label="MoMo" />
                <PaymentButton icon={<CreditCard className="h-4 w-4" />} label="Card" />
                <PaymentButton icon={<Split className="h-4 w-4" />} label="Split" />
              </div>
            </div>

            {/* Live Ledger Calculation Balance Return */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Amount Paid</span>
                <span className="font-bold text-slate-800"><CurrencyCell amount={427.50} /></span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 font-bold border-t border-slate-200/60 pt-1.5 mt-1">
                <span>Change</span>
                <span className="text-sm font-black"><CurrencyCell amount={0.00} /></span>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* ── FOOTER REAL-TIME RUNTIME METADATA ────────────────────────────────── */}
    <footer className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex flex-col md:flex-row gap-2 items-center justify-between text-[11px] text-slate-500 font-medium">
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-1">
        <span>Business: <strong className="text-slate-700">{user?.business.name}</strong></span>
        <span>Shop: <strong className="text-slate-700">Main Shop</strong></span>
        <span>Date: <strong className="text-slate-700">{currentDate || "Loading..."}</strong></span>
        <span>Time: <strong className="text-slate-700">{currentTime || "Loading..."}</strong></span>
      </div>
      <div className="flex items-center gap-4">
        <span>Terminal: <strong className="text-slate-700">POS-01</strong></span>
        <span className="flex items-center gap-1 text-emerald-600 font-bold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Online
          <Wifi className="h-4 w-4" />
        </span>
      </div>
    </footer>

    </div>
  );
}


// Sub-component layout for active checkout items listing
function CartItem({ name, sku, details, price, qty }: { name: string; sku: string; details: string; price: number; qty: number }) {
  return (
    <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm flex items-stretch justify-between gap-3 relative group hover:border-slate-300 transition-all">
      
      {/* LEFT CONTENT AREA */}
      <div className="space-y-1 flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 pr-2">{name}</h4>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">SKU: {sku}</p>
        <p className="text-[10px] text-slate-500 font-medium truncate">{details}</p>
        
        <div className="pt-1 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900"><CurrencyCell amount={price}/></span>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 border rounded px-1.5 py-0.5 w-fit">
            <span className="text-[9px] font-bold">x</span>
            <span className="font-bold text-slate-700">{qty}</span>
          </div>
        </div>
      </div>

      {/* RIGHT ACTIONS & TOTAL AREA */}
      <div className="flex flex-col items-end justify-between shrink-0 min-w-17.5">
        {/* Responsive delete button: Always interactive on mobile, sleek on desktop */}
        <button className="text-slate-400 hover:text-rose-500 rounded-md p-1 transition-colors lg:opacity-0 lg:group-hover:opacity-100 -mt-1 -mr-1">
          <X className="h-3.5 w-3.5" />
        </button>
        
        {/* Calculated Line Item Cost */}
        <span className="text-xs font-extrabold text-slate-900 tracking-tight">
          <CurrencyCell amount={price * qty} />
        </span>
      </div>

    </div>
  );
}

// Sub-component formatting for the payment grids
function PaymentButton({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-between gap-1 p-2 border rounded-xl transition-all font-medium text-center w-full min-h-[64px] h-full ${
      active 
        ? "bg-green-50 border-green-500 text-green-700 shadow-sm font-bold scale-[1.02]" 
        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
    }`}>
      <div className={`p-1.5 rounded-lg shrink-0 ${active ? "bg-green-100/60 text-green-700" : "bg-slate-50 text-slate-500"}`}>
        {icon}
      </div>
      <span className="text-[10px] tracking-tight leading-tight font-semibold block w-full truncate px-0.5">
        {label}
      </span>
    </button>
  );
}
// Cell sub-component to show currency code in the title cleanly inline
const CurrencyCell = ({ amount }: { amount: number }) => {
  const user = useAuthStore((state) => state.user);
  const currencySymbol = user?.business?.currencySymbol || "";
  
  // Format the absolute value cleanly so negative signs can be placed before the currency symbol if needed
  const absoluteAmount = Math.abs(amount).toFixed(2);
  const isNegative = amount < 0;

  return (
    <span className="inline-flex items-baseline font-semibold">
      {isNegative && <span className="mr-0.5">-</span>}
      {currencySymbol && <span className="mr-0.5">{currencySymbol}</span>}
      <span>{absoluteAmount}</span>
    </span>
  );
};