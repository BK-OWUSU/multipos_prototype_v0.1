"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, Scan, Plus, RotateCcw, Bell, User, 
  X, HelpCircle, Flame, CreditCard, Smartphone, DollarSign, Split 
} from "lucide-react";
import Image from "next/image";
import { useProductStore } from "@/store/productsStore";

type Product = {
    id: string;
    name: string;
    sku: string;
    price: number;
    fromPrice: number;
    stock: number;
    color: string;
    img: string;
}

// Mock Data for layout modeling
const CATEGORIES = ["All", "T-Shirts", "Shirts", "Shoes", "Accessories", "Bags", "Hoodies"];

const PRODUCTS: Product[] = [
  { id: "1", name: "Basic T-Shirt - Blue", sku: "TEE-BLU", price: 50.00, fromPrice: 50.00, stock: 12, color: "green", img: "/t-shirt.webp" },
  { id: "2", name: "Basic T-Shirt - Black", sku: "TEE-BLK", price: 50.00, fromPrice: 50.00, stock: 8, color: "green", img: "/t-shirt-1.webp" },
  { id: "3", name: "Basic T-Shirt - White", sku: "TEE-WHT", price: 50.00, fromPrice: 50.00, stock: 15, color: "green", img: "/t-shirt-2.webp" },
  { id: "4", name: "Polo Shirt - Navy", sku: "POL-NVY", price: 80.00, fromPrice: 80.00, stock: 6, color: "green", img: "/t-shirt-3.webp" },
  { id: "5", name: "Sneakers - White", sku: "SNK-WHT", price: 250.00, fromPrice: 250.00, stock: 10, color: "green", img: "/t-shirt-4.webp" },
  { id: "6", name: "Sneakers - Black", sku: "SNK-BLK", price: 250.00, fromPrice: 250.00, stock: 3, color: "orange", img: "/t-shirt-5.webp" },
  { id: "7", name: "Cap - Black", sku: "CAP-BLK", price: 30.00, fromPrice: 30.00, stock: 20, color: "green", img: "/t-shirt-6.webp" },
  { id: "8", name: "Backpack", sku: "BAG-BLK", price: 120.00, fromPrice: 120.00, stock: 7, color: "green", img: "/t-shirt-7.webp" },
];

export default function SaleTerminal() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0])
  const {fetchProductsVariant} = useProductStore()
    useEffect(() => {
      fetchProductsVariant();
    }, [fetchProductsVariant]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 antialiased overflow-hidden">
      
      {/* ── TOP UTILITY CONTEXT BAR ──────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Shop Selector Dropdown */}
          <div className="relative">
            <select className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-8 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>🏪 Main Shop</option>
              <option>🏪 Warehouse Branch</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Core Command Search Engine */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products by name, SKU or barcode..." 
              className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <kbd className="absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border rounded shadow-sm">Ctrl + K</kbd>
          </div>

          {/* Barcode Device Simulation Button */}
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            <Scan className="h-4 w-4 text-slate-600" />
            <span className="text-slate-700">Scan Barcode</span>
          </button>

          {/* Quick Action Add */}
          <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Cashier Identity Status Blocks */}
        <div className="flex items-center gap-4 ml-4">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <RotateCcw className="h-5 w-5" />
          </button>
          <div className="relative">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </div>
          <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">John Doe</p>
              <p className="text-xs text-slate-400 font-medium">Cashier</p>
            </div>
            <div className="h-9 w-9 bg-amber-100 rounded-full border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 overflow-hidden">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* ── CORE WORKSPACE PANELS CONTAINER ──────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT CATALOG GRID DISPLAY */}
        <main className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
          
          {/* Filter & Sort Headers */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 max-w-2xl no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat 
                      ? "bg-blue-600 text-white shadow-sm" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select className="bg-white border border-slate-200 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none">
                <option>🔢 Sort: Name (A-Z)</option>
                <option>Sort: Price (Low to High)</option>
              </select>
              <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-xs font-medium rounded-lg px-3 py-2 hover:bg-slate-50">
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Grid Products Stream View */}
          <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
            {PRODUCTS.map((prod) => (
              <div 
                key={prod.id}
                onClick={()=> setSelectedProduct(prod)}
                className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer relative group"
              >
                {/* Stock Indicator Bubble */}
                <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  prod.color === "orange" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                }`}>
                  {prod.stock}
                </span>

                <div className="bg-slate-50 rounded-lg aspect-square w-full mb-3 flex items-center justify-center overflow-hidden border border-slate-100 relative">
                <Image
                    src={prod.img}
                    alt={prod.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{prod.name}</h4>
                  <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">SKU: {prod.sku}</p>
                  <div className="pt-1 flex flex-col">
                    <span className="text-sm font-bold text-slate-900">¢{prod.price.toFixed(2)}</span>
                    <span className="text-[11px] text-green-600 font-medium">From ¢{prod.fromPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── BOTTOM DRAWER: DYNAMIC VARIANT PARAMETERS SELECTION BAR ────── */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex gap-5 p-2 justify-between">

            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border shrink-0 shadow-sm bg-slate-50">
                        <Image
                        src={selectedProduct?.img || "/placeholder-product.png"}
                        alt={selectedProduct?.name || "Product Image"}
                        fill
                        className="object-contain p-1"
                        />
                    </div>

                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                        {selectedProduct?.name}
                        </h3>

                        <p className="text-xs font-mono text-slate-400">
                        SKU: {selectedProduct?.sku}
                        </p>

                        <div className="flex gap-6 mt-2 text-xs">
                        <p className="text-slate-500">
                            Price:
                            <span className="font-bold text-slate-900">
                            ¢{selectedProduct?.price}
                            </span>
                        </p>

                        <p className="text-slate-500">
                            Stock:
                            <span className="font-bold text-slate-900">
                            {selectedProduct?.stock}
                            </span>
                        </p>
                        </div>
                    </div>
                    </div>
                <button className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Config Options Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div  className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Color</p>
                <div className="flex gap-2">
                  <button className="w-7 h-7 bg-blue-600 rounded-md ring-2 ring-offset-2 ring-blue-600 flex items-center justify-center text-white text-xs">✓</button>
                  <button className="w-7 h-7 bg-black rounded-md border border-slate-200"></button>
                  <button className="w-7 h-7 bg-white rounded-md border border-slate-300"></button>
                  <button className="w-7 h-7 bg-red-600 rounded-md border border-slate-200"></button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Size</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["S", "M", "L", "XL", "XXL"].map((sz) => (
                    <button 
                      key={sz}
                      className={`h-7 px-3 text-xs font-bold border rounded-md transition-all ${
                        sz === "L" 
                          ? "bg-blue-50 border-blue-600 text-blue-600 ring-1 ring-blue-50" 
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>

              </div>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-10 overflow-hidden">
                <button className="px-3 hover:bg-slate-100 font-semibold text-slate-600 border-r text-lg transition-colors">-</button>
                <span className="px-4 text-sm font-bold text-slate-900 w-12 text-center">1</span>
                <button className="px-3 hover:bg-slate-100 font-semibold text-slate-600 border-l text-lg transition-colors">+</button>
              </div>
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-10 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                <span>Add to Cart</span>
                <span className="bg-blue-700 text-xs px-1.5 py-0.5 rounded-md font-medium">¢(1)</span>
              </button>
            </div>
            {/* Lower Drawer Executables Row */}
            </div>

            </div>
          </section>

        </main>

        {/* RIGHT SIDEBAR CHECKOUT CART INTERFACE */}
        <aside className="w-105 bg-white border-l border-slate-200 flex flex-col overflow-hidden shadow-2xl">
          
          {/* Cart Header Panel */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <span>Cart</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">3</span>
            </h2>
            <button className="text-xs text-rose-600 font-bold hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <X className="h-3 w-3" /> Clear Cart
            </button>
          </div>

          {/* Scrollable Chosen Items List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 bg-slate-50/40">
            <CartItem name="Basic T-Shirt - Blue" sku="TEE-BLU-L-BLU" details="Size: L  Color: Blue" price={50.00} qty={1} />
            <CartItem name="Denim Jeans - Blue" sku="JNS-BLU-32" details="Size: 32" price={150.00} qty={1} />
            <CartItem name="Sneakers - White" sku="SNK-WHT-42" details="Size: 42" price={250.00} qty={1} />
          </div>

          {/* Pricing Ledger calculations area */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">¢450.00</span>
              </div>
              <div className="flex justify-between items-center text-rose-600 font-medium">
                <span>Discount</span>
                <span className="font-bold">- ¢22.50</span>
              </div>
            </div>

            {/* Active Coupon Injection Fields */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select className="w-full appearance-none bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-lg focus:outline-none">
                  <option>🏷️ 10% OFF</option>
                  <option>🏷️ Free Shipping Promo</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <X className="h-3 w-3 cursor-pointer hover:text-slate-600 pointer-events-auto" />
                </div>
              </div>
              <button className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 transition-colors">
                <Plus className="h-3 w-3" /> Add Discount
              </button>
            </div>

            {/* Total Balance Sheet Header */}
            <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-slate-200">
              <span className="text-sm font-bold text-slate-800">Total</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">¢427.50</span>
            </div>

            {/* Middle Holding State Triggers Row */}
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-100/70 transition-all">
                <HelpCircle className="h-3.5 w-3.5" /> Hold Sale
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-lg hover:bg-indigo-100/70 transition-all">
                <Flame className="h-3.5 w-3.5" /> Park Sale
              </button>
            </div>

            {/* Processing Execution Button */}
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-between group">
              <span className="text-sm tracking-wide">Checkout</span>
              <div className="flex items-center gap-1 text-sm bg-emerald-700 px-2.5 py-1 rounded-lg">
                <span>¢427.50</span>
                <span className="transform group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </button>

            {/* Active Customer Assignment Node */}
            <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Customer</p>
                  <p className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">Walk-in Customer</p>
                </div>
              </div>
              <button className="p-1 border border-slate-200 hover:bg-white rounded-lg bg-slate-50 transition-colors">
                <Plus className="h-3.5 w-3.5 text-slate-500" />
              </button>
            </div>

            {/* Payment Modes Grid Modules */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</p>
              <div className="grid grid-cols-4 gap-2">
                <PaymentButton icon={<DollarSign className="h-4 w-4" />} label="Cash" active />
                <PaymentButton icon={<Smartphone className="h-4 w-4" />} label="Mobile Money" />
                <PaymentButton icon={<CreditCard className="h-4 w-4" />} label="Card" />
                <PaymentButton icon={<Split className="h-4 w-4" />} label="Split" />
              </div>
            </div>

            {/* Live Ledger Calculation Balance Return */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-1 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Amount Paid</span>
                <span className="font-bold text-slate-800">¢427.50</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 font-bold border-t border-slate-200/60 pt-1.5 mt-1">
                <span>Change</span>
                <span className="text-sm font-black">¢0.00</span>
              </div>
            </div>

          </div>
        </aside>

      </div>

      {/* ── FOOTER REAL-TIME RUNTIME METADATA ────────────────────────────────── */}
      <footer className="px-6 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-6">
          <span>Business: <strong className="text-slate-700">Acme Stores</strong></span>
          <span>Shop: <strong className="text-slate-700">Main Shop</strong></span>
          <span>Date: <strong className="text-slate-700">May 20, 2026</strong></span>
          <span>Time: <strong className="text-slate-700">10:30 AM</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>Terminal: <strong className="text-slate-700">POS-01</strong></span>
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Online
          </span>
        </div>
      </footer>

    </div>
  );
}


// Sub-component layout for active checkout items listing
function CartItem({ name, sku, details, price, qty }: { name: string; sku: string; details: string; price: number; qty: number }) {
  return (
    <div className="bg-white border border-slate-150 rounded-xl p-3 shadow-sm flex items-start justify-between relative group hover:border-slate-300 transition-all">
      <div className="space-y-1 pr-4">
        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{name}</h4>
        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wide">SKU: {sku}</p>
        <p className="text-[10px] text-slate-500 font-medium">{details}</p>
        <div className="pt-1 flex items-baseline gap-2">
          <span className="text-xs font-bold text-slate-900">¢{price.toFixed(2)}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 border rounded px-1.5 py-0.5">
            <span>𝗑</span>
            <span className="font-bold text-slate-700">{qty}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between h-full min-h-15">
        <button className="text-slate-300 hover:text-rose-500 rounded-md p-0.5 transition-colors opacity-0 group-hover:opacity-100 absolute top-2 right-2">
          <X className="h-3 w-3" />
        </button>
        <span className="text-xs font-extrabold text-slate-900 mt-auto">¢{(price * qty).toFixed(2)}</span>
      </div>
    </div>
  );
}

// Sub-component formatting for the payment grids
function PaymentButton({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center justify-center gap-1 p-2 border rounded-xl transition-all font-medium text-center ${
      active 
        ? "bg-green-50 border-green-500 text-green-700 shadow-sm font-bold scale-[1.02]" 
        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
    }`}>
      <div className={`p-1.5 rounded-lg ${active ? "bg-green-100/60" : "bg-slate-50"}`}>
        {icon}
      </div>
      <span className="text-[9px] tracking-tight leading-tight">{label}</span>
    </button>
  );
}