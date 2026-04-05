"use client"
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, ShoppingCart, Users, Settings, CreditCard, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LandingPageNavBar from "./landing-nav";
import { useAuthStore } from "@/store/useAuthStore";
import { footerSections } from "./footerSections";

export default function LandingPage() {
    const {currentSlug} = useAuthStore()
    const sectionFooter = footerSections(currentSlug || "");
    const features = [
    {
      icon: <ShoppingCart className="w-8 h-8 text-blue-600" />,
      title: "Point of Sale",
      description: "Fast and intuitive checkout system with multiple payment options"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: "Advanced Reports",
      description: "Real-time analytics and sales insights by category, employee, and more"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Employee Management",
      description: "Track employee performance, time cards, and total hours worked"
    },
    {
      icon: <CreditCard className="w-8 h-8 text-blue-600" />,
      title: "Payment Processing",
      description: "Secure transaction handling with multiple payment method support"
    },
    {
      icon: <Settings className="w-8 h-8 text-blue-600" />,
      title: "Inventory Control",
      description: "Manage products, categories, and discounts in real-time"
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "Fast & Reliable",
      description: "High-performance system designed for busy retail environments"
    }
  ];

  return (
    <div className="w-full">
      <LandingPageNavBar/>
      
      {/* Hero Section */}
      <section className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center px-4 py-20">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Revolutionize Your <span className="text-blue-400">Point of Sale</span>
            </h1>
            <p className="text-lg text-slate-300">
              MultiPOS is a comprehensive point-of-sale solution designed for modern retail businesses. 
              Streamline operations, increase efficiency, and boost your sales with our all-in-one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link 
                href={currentSlug ? `/${currentSlug}/dashboard` : `/login`}
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-blue-400 hover:bg-blue-400 hover:text-slate-900 rounded-lg font-semibold transition-colors"
              >
                View Dashboard
              </Link>
            </div>
          </div>
          <div className="relative h-96 lg:h-full">
            <Image
              src="/pos-1.jpg"
              alt="MultiPOS Dashboard"
              fill
              className="object-cover rounded-lg shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to run your retail business efficiently
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-2">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-96">
              <Image
                src="/pos-2.jpeg"
                alt="POS System Features"
                fill
                className="object-cover rounded-lg shadow-2xl"
              />
            </div>
            <div className="space-y-8">
              <h2 className="text-4xl font-bold text-slate-900">
                Complete Business Control
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Smart Transactions</h3>
                    <p className="text-slate-600">Process sales faster with intelligent checkout</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Real-time Analytics</h3>
                    <p className="text-slate-600">Track sales by category, employee, and payment method</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Team Management</h3>
                    <p className="text-slate-600">Manage employees, time cards, and access controls</p>
                  </div>
                </div>
              </div>
              <Link 
                href="/sale"
                className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Explore Features <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 px-4 bg-linear-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">500+</div>
              <p className="text-lg text-blue-100">Active Retailers</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">1M+</div>
              <p className="text-lg text-blue-100">Transactions Daily</p>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <p className="text-lg text-blue-100">Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Ready to Transform Your Retail Business?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Join hundreds of retailers already using MultiPOS to streamline their operations
          </p>
          <Link 
            href={currentSlug ? `/${currentSlug}/dashboard` : `/login`}
            className="inline-flex items-center px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition-colors"
          >
            Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 border-t border-slate-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-lg">MultiPOS</h4>
            <p className="text-sm leading-relaxed">
              The complete point-of-sale solution for modern retail and business management.
            </p>
          </div>

          {/* Dynamic Link Columns */}
          {sectionFooter.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-white mb-4 uppercase text-xs tracking-widest">
                {section.title}
              </h4>
              <ul className="space-y-2 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.isExternal ? (
                      <a 
                        href={link.href} 
                        className="hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link 
                        href={link.href} 
                        className="hover:text-white transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>&copy; {new Date().getFullYear()} MultiPOS. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Status</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
    </div>
  )
}
