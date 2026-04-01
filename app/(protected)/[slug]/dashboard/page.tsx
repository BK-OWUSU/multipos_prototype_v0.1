"use client";

import React from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useParams } from "next/navigation";
import { LayoutDashboard, Users, ShoppingCart, CreditCard } from "lucide-react";

type CardColor = "blue" | "green" | "purple" | "orange";

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: CardColor;
};

// Reusable Stat Card Component (Outside Dashboard)
function StatCard({ 
  title, 
  value, 
  icon, 
  color = "blue" 
}: StatCardProps) {

  const colors: Record<CardColor, string> = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { slug } = useParams();
  const { user, currentSlug } = useAuthStore();
  console.log("Dashboard slug: ", slug);
  console.log("User: ", user);
  console.log("Current Slug: ", currentSlug);


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-500">
            Managing <span className="font-semibold text-blue-900">{user?.business.name}</span>
          </p>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
            {user?.role.name}
          </span>
          <div className="h-10 w-10 rounded-full bg-blue-950 flex items-center justify-center text-white font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Sales" 
          value="GHS 0.00" 
          icon={<CreditCard size={20} />} 
          color="blue" 
        />
        <StatCard 
          title="Orders" 
          value="0" 
          icon={<ShoppingCart size={20} />} 
          color="green" 
        />
        <StatCard 
          title="Customers" 
          value="0" 
          icon={<Users size={20} />} 
          color="purple" 
        />
        <StatCard 
          title="Inventory" 
          value="Low Stock: 0" 
          icon={<LayoutDashboard size={20} />} 
          color="orange" 
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center">
          <p className="text-gray-400 italic">Sales Chart Placeholder</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="text-sm text-gray-500">No recent transactions.</div>
        </div>
      </div>
    </div>
  );
}