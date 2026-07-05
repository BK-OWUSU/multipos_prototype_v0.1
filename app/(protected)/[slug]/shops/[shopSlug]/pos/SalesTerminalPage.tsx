"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  Search, Scan, Plus, User, ShoppingCart, Wifi, Trash2,
  X, Smartphone, DollarSign, Check, PlusCircle, MinusCircle
} from "lucide-react";
import Image from "next/image";
import { useProductStore } from "@/store/productsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ProductsVariants } from "@/types/schema/inventory";
import { useCategoryStore } from "@/store/categoryStore";
import { useCustomerStore } from "@/store/customerStore"; 
import { POSCheckoutInput } from "@/types/schema/pos";
import CheckoutButton from "@/components/pos/CheckoutButton";

// Definition for our frontend cart line items
interface CartItemState {
  product: ProductsVariants;
  quantity: number;
}

export default function SaleTerminalPage() {
  // 1. GLOBAL STORE CONNECTORS
  const { user } = useAuthStore();
  const { fetchProductsVariant, productsVariants } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { customers, fetchCustomers } = useCustomerStore();

  const PRODUCTS: ProductsVariants[] | null = productsVariants;

  // LOCAL UI STATES
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [activeProduct, setActiveProduct] = useState<ProductsVariants | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); 
  const [sortBy, setSortBy] = useState("name-az"); 

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOMO" | "SPLIT">("CASH");
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [momoPaid, setMomoPaid] = useState<number>(0);
  
  // CUSTOMER STATES
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // ── LIVE DB DRIVEN LOCAL CART STATE ──
  const [cart, setCart] = useState<CartItemState[]>([]);

  // Automatically fall back to the first product in the list if none is clicked
  const selectedProduct = activeProduct || (PRODUCTS && PRODUCTS.length > 0 ? PRODUCTS[0] : null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // LIFECYCLE DISPATCHERS
  useEffect(() => {
    fetchProductsVariant();
    fetchCategories();
    if (typeof fetchCustomers === "function") {
      fetchCustomers();
    }
  }, [fetchProductsVariant, fetchCategories, fetchCustomers]);

  // Click outside listener for custom customer dropdown portal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter customers matching query rules
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    const lower = customerSearchQuery.toLowerCase().trim();
    if (!lower) return customers;
    return customers.filter((c: any) => 
      c.name?.toLowerCase().includes(lower) || 
      c.phone?.includes(lower) || 
      c.email?.toLowerCase().includes(lower)
    );
  }, [customers, customerSearchQuery]);

  // Filter products by dynamic Category Tray selection & top bar search query
  const filteredProducts = (PRODUCTS || []).filter((prod) => {
    const matchesCategory = selectedCategory === "All" || prod.category?.name === selectedCategory; 
    const lowerQuery = searchQuery.toLowerCase().trim();
    if (!lowerQuery) return matchesCategory;
    const matchesName = prod.displayName?.toLowerCase().includes(lowerQuery);
    const matchesSku = prod.sku?.toLowerCase().includes(lowerQuery);
    const matchesBarcode = prod.barcode?.toLowerCase().includes(lowerQuery);

    return matchesCategory && (matchesName || matchesSku || matchesBarcode);
  });

  // Sort base array outputs
  const sortedProducts = useMemo(() => {
    const baseProducts = [...filteredProducts];
    if (sortBy === "name-az") {
      return baseProducts.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
    }
    if (sortBy === "price-lh") {
      return baseProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    }
    return baseProducts;
  }, [filteredProducts, sortBy]); 

  const dynamicCategories = useMemo(() => {
    if (!categories || categories.length === 0) return ["All"];
    const dbCategoryNames = categories.map((cat: { name: string }) => cat.name);
    return ["All", ...dbCategoryNames];
  }, [categories]);

  // ── INTERACTIVE CART STATE ENGINE ACTIONS ──
  const handleAddToCart = (product: ProductsVariants | null) => {
    if (!product) return;
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingIndex].quantity += 1;
        return updatedCart;
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, increment: boolean) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = increment ? item.quantity + 1 : item.quantity - 1;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0) // Automatically drop rows hitting zero lines
    );
  };

  const handleClearCart = () => setCart([]);

  // ── MATHEMATICAL LIVE TOTAL CALCULATIONS ──
  const cartTotals = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        const itemPrice = Number(item.product.price) || 0;
        return {
          total: acc.total + itemPrice * item.quantity,
          count: acc.count + item.quantity,
        };
      },
      { total: 0, count: 0 }
    );
  }, [cart]);

  // Global Keyboard listener hook (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setTimeout(() => { searchInputRef.current?.select(); }, 0);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  // System Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── REAL TIME TRANSACTION PAYLOAD COMPILER ──
  const currentCheckoutPayload = useMemo<POSCheckoutInput>(() => {
    return {
      businessId: user?.business.id || "clm1234567890abcdef01",
      shopId: user?.shop?.id || "clm9876543210fedcba02", // Plugs your system settings context values
      employeeId: user?.id || "clm5555555550aaaaaa03",
      cashSessionId: user?.activeCashSessionId || "clm7777777770bbbbbb04", 
      
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customerEmail: selectedCustomer ? selectedCustomer.email : "",
      
      paymentMethod: paymentMethod,
      totalAmount: cartTotals.total,
      discountAmount: 0, 
      cashPaid: paymentMethod === "CASH" ? cartTotals.total : paymentMethod === "SPLIT" ? cashPaid : 0,
      momoPaid: paymentMethod === "MOMO" ? cartTotals.total : paymentMethod === "SPLIT" ? momoPaid : 0,
      
      // Map live schema attributes directly to clear the Prisma DB constraint checks
      cartItems: cart.map((item) => ({
        productVariantId: item.product.id, // Live parent mapping
        quantity: item.quantity,
        unitPrice: Number(item.product.price) || 0,
        costPrice: Number(item.product.costPrice) || Number(item.product.price) * 0.7 // Intelligent fallback constraint math
      }))
    };
  }, [selectedCustomer, paymentMethod, cashPaid, momoPaid, user, cart, cartTotals.total]);

  const handleSaleSuccess = (saleId: string) => {
    alert(`Transaction processing complete! Sale ID: ${saleId}`);
    handleClearCart();
    setCashPaid(0); 
    setMomoPaid(0);
    setSelectedCustomer(null);
  };

  return (
    <div className="flex gap-2 rounded-md sticky top-2 flex-col h-screen w-full text-slate-800 antialiased overflow-hidden">
      
      <div className="flex flex-1 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden gap-4 p-2 lg:p-0">
          
        <main className="flex-1 flex flex-col lg:overflow-hidden p-4 sm:p-5 space-y-4 bg-slate-50 rounded-xl border border-slate-200/60 shadow-sm">
          {/* Top Bar Utilities */}
          <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-md border border-slate-100">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 w-full">
              <div className="relative flex-1 min-w-50">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  type="text" 
                  placeholder="Search products by name, SKU or barcode..." 
                  className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                />
                <kbd className="hidden sm:inline-block absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border rounded shadow-sm">Ctrl + K</kbd>
              </div>

              <button className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex-1 sm:flex-none">
                <Scan className="h-4 w-4 text-slate-600" />
                <span className="text-slate-700 whitespace-nowrap">Scan Barcode</span>
              </button>

              <button className="p-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg shadow-sm transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </header>
          
          {/* Categories Horizontal Tray Container */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {dynamicCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat ? "bg-blue-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <select 
                className="bg-white border border-slate-200 text-xs font-medium rounded-lg px-3 py-2 focus:outline-none flex-1 sm:flex-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name-az">🔢 Sort: Name (A-Z)</option>
                <option value="price-lh">🔢 Sort: Price (Low to High)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Grid Mapping DB Products */}
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
                  <span className={`absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 ${
                    prod.stock <= (prod.lowStockAlert || 0) ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                  }`}>
                    {prod.stock}
                  </span>
                  <div className="bg-slate-50 rounded-lg aspect-square w-full mb-3 flex items-center justify-center overflow-hidden border border-slate-100 relative">
                    <Image
                      src={prod.imageUrl || "/imgs/no-product-image.png"}
                      alt={prod.displayName || "Product Graphic UI"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{prod.displayName}</h4>
                    <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">SKU: {prod.sku}</p>
                    <div className="pt-1 flex flex-col">
                      <span className="text-sm font-bold text-slate-900">GH₵ {(Number(prod.price) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <ShoppingCart className="h-7 w-7 text-slate-400 mb-4" />
                <h3 className="text-sm font-bold text-slate-700">No Inventory Items Matches Found</h3>
              </div>
            )}
          </div>
          
          {/* Attributes Selection Bottom Sticky Tray */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full">
            {!selectedProduct ? (
              <div className="flex items-center justify-center py-4 text-sm font-medium text-slate-400 gap-2">
                <span>Select a product option variant to stage cart lines.</span>
              </div>
            ) : (
              <div className="flex flex-col xl:flex-row items-center justify-between gap-4 xl:gap-6">
                <div className="flex items-center gap-4 shrink-0 w-full xl:w-auto justify-between xl:justify-start">
                  <div className="flex gap-4 items-center">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border shrink-0 bg-slate-50">
                      <Image src={selectedProduct.imageUrl || "/imgs/no-product-image.png"} alt={selectedProduct.displayName || ""} fill className="object-contain p-1" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{selectedProduct.displayName}</h3>
                      <p className="text-xs font-mono text-slate-400">SKU: {selectedProduct.sku || "N/A"}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs h-9 px-5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Add to Cart</span>
                </button>
              </div>
            )}
          </section>
        </main>

        {/* RIGHT SIDEBAR ACTION CONTROL BASKET */}
        <aside className="w-full lg:w-100 bg-white flex flex-col overflow-hidden shrink-0 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-base">
              <span>Cart Tray</span>
              <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">{cartTotals.count}</span>
            </h2>
            <button onClick={handleClearCart} className="text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline">
              <Trash2 className="h-3 w-3" /> Clear Cart
            </button>
          </div>

          {/* Active Cart Line Mapping Loops */}
          <div className="flex-1 min-h-62.5 lg:min-h-0 overflow-y-auto px-4 py-2 space-y-3 bg-slate-50/40">
            {cart.length > 0 ? (
              cart.map((item) => (
                <CartItem 
                  key={item.product.id}
                  name={item.product.displayName || "Item"} 
                  sku={item.product.sku || ""} 
                  price={Number(item.product.price) || 0} 
                  qty={item.quantity} 
                  onIncrement={() => updateCartQuantity(item.product.id, true)}
                  onDecrement={() => updateCartQuantity(item.product.id, false)}
                />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center p-4">
                No active products staged in checkout lane. Click products or "Add to Cart&quot; to pass valid data items.
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
            <div className="flex justify-between items-baseline border-t border-dashed border-slate-200 pt-2">
              <span className="text-sm font-bold text-slate-800">Total Due</span>
              <span className="text-lg font-black text-slate-900 tracking-tight">GH₵ {cartTotals.total.toFixed(2)}</span>
            </div>

            {/* PIPED INLINE ACTION INVOCATION COMPONENT */}
            <CheckoutButton
              checkoutPayload={currentCheckoutPayload}
              onSuccess={handleSaleSuccess}
              disabled={cart.length === 0}
            />

            {/* INTERACTIVE CLIENT METADATA DROPDOWN LINKED PORTAL */}
            <div ref={customerDropdownRef} className="relative flex flex-col border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center ${selectedCustomer ? 'bg-green-100 text-green-900' : 'bg-blue-100 text-blue-900'}`}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className="max-w-[180px]">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Customer</p>
                    <p 
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className="text-xs font-bold text-blue-900 hover:underline cursor-pointer truncate"
                    >
                      {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
                    </p>
                    {selectedCustomer && (
                      <p className="text-[10px] text-slate-400 truncate">{selectedCustomer.email}</p>
                    )}
                  </div>
                </div>
                
                {selectedCustomer ? (
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 border border-slate-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors bg-white"
                    title="Remove Customer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className={`p-1 border rounded-lg transition-colors bg-white ${isCustomerDropdownOpen ? 'bg-blue-900 text-white border-blue-900' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* FLOATING DROPDOWN PORTAL POPUP ENGINE */}
              {isCustomerDropdownOpen && (
                <div className="absolute left-0 right-0 bottom-12 mb-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 flex flex-col max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-slate-100 bg-slate-50">
                    <input 
                      type="text"
                      placeholder="Search customers database..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      autoFocus
                    />
                  </div>
                  
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                    <div 
                      onClick={() => {
                        setSelectedCustomer(null);
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="p-2.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer flex justify-between items-center font-medium"
                    >
                      <span>🚶 Default (Walk-in Customer)</span>
                      {!selectedCustomer && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </div>

                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust: any) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setIsCustomerDropdownOpen(false);
                            setCustomerSearchQuery("");
                          }}
                          className="p-2.5 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-xs font-semibold text-slate-800 truncate">{cust.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">{cust.phone || "No phone"} • {cust.email || "No email"}</p>
                          </div>
                          {selectedCustomer?.id === cust.id && (
                            <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[11px] text-slate-400">
                        No clients match search criteria
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Option Elements Layout */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Option</p>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setPaymentMethod("CASH")}
                  className={`flex py-2 text-xs items-center justify-center gap-1 border rounded-lg font-bold transition-all ${paymentMethod === "CASH" ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 text-slate-600"}`}
                >
                  <DollarSign className="h-4 w-4" /> Cash
                </button>
                <button 
                  onClick={() => setPaymentMethod("MOMO")}
                  className={`flex py-2 text-xs items-center justify-center gap-1 border rounded-lg font-bold transition-all ${paymentMethod === "MOMO" ? "bg-blue-900 border-blue-900 text-white" : "bg-white border-slate-200 text-slate-600"}`}
                >
                  <Smartphone className="h-4 w-4" /> Mobile Money
                </button>
              </div>
            </div>

          </div>
        </aside>
      </div>

      {/* Footer Metrics Panel */}
      <footer className="px-4 py-3 bg-slate-100 border-t border-slate-200 flex flex-col md:flex-row gap-2 items-center justify-between text-[11px] text-slate-500 font-medium">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-1">
          <span>Business Name: <strong className="text-slate-700">{user?.business?.name || "My SaaS MultiPOS"}</strong></span>
          <span>Date: <strong className="text-slate-700">{currentDate || "Running..."}</strong></span>
          <span>Time: <strong className="text-slate-700">{currentTime || "Running..."}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Terminal Online <Wifi className="h-4 w-4" />
          </span>
        </div>
      </footer>
    </div>
  );
}

// ── FLEXIBLE COMPONENT CART LINE ITEM RENDER ENTRY CARD ──
function CartItem({ 
  name, sku, price, qty, onIncrement, onDecrement 
}: { 
  name: string; sku: string; price: number; qty: number; onIncrement: () => void; onDecrement: () => void 
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-3 relative group">
      <div className="space-y-1 flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-800 truncate">{name}</h4>
        <p className="text-[10px] font-mono text-slate-400 uppercase">SKU: {sku}</p>
        <div className="pt-1 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">GH₵ {price.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">x{qty}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onDecrement} className="p-1 text-slate-400 hover:text-rose-600 transition-colors hover:bg-rose-50 rounded-md">
          <MinusCircle className="h-4 w-4" />
        </button>
        <button onClick={onIncrement} className="p-1 text-slate-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded-md">
          <PlusCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}