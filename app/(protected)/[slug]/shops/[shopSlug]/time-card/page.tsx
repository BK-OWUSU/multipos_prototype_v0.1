"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  LogIn,
  LogOut,
  Coffee,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock Data based closely on image_2d5f99.jpg and your schema structure
const initialTimeCards = [
  { id: "tc-1", date: "Sun, May 18", day: "Sun", clockIn: "08:00 AM", clockOut: "04:30 PM", break: "0.50", totalHours: "8.00", status: "Completed", notes: "-" },
  { id: "tc-2", date: "Sat, May 17", day: "Sat", clockIn: "08:15 AM", clockOut: "04:40 PM", break: "0.50", totalHours: "8.00", status: "Completed", notes: "Busy day" },
  { id: "tc-3", date: "Fri, May 16", day: "Fri", clockIn: "08:05 AM", clockOut: "05:10 PM", break: "0.50", totalHours: "8.50", status: "Completed", notes: "-" },
  { id: "tc-4", date: "Thu, May 15", day: "Thu", clockIn: "08:00 AM", clockOut: "04:30 PM", break: "0.50", totalHours: "8.00", status: "Completed", notes: "-" },
  { id: "tc-5", date: "Wed, May 14", day: "Wed", clockIn: "08:10 AM", clockOut: "04:20 PM", break: "0.50", totalHours: "7.50", status: "Completed", notes: "Left early" },
  { id: "tc-6", date: "Tue, May 13", day: "Tue", clockIn: "08:00 AM", clockOut: "05:30 PM", break: "0.50", totalHours: "9.00", status: "Overtime", notes: "Promo event" },
  { id: "tc-7", date: "Mon, May 12", day: "Mon", clockIn: "-", clockOut: "-", break: "-", totalHours: "-", status: "Absent", notes: "Public holiday" },
];

export default function EmployeeTimeCardPage() {
  const [timeCards] = useState(initialTimeCards);
  const [isClockedIn, setIsClockedIn] = useState(true);
  const [liveDuration, setLiveDuration] = useState("03:42:18");

  // Live timer effect simulating active shift tracking
  useEffect(() => {
    if (!isClockedIn) return;
    const interval = setInterval(() => {
      const parts = liveDuration.split(":").map(Number);
      let secs = parts[2] + 1;
      let mins = parts[1];
      let hrs = parts[0];

      if (secs >= 60) { secs = 0; mins += 1; }
      if (mins >= 60) { mins = 0; hrs += 1; }

      const pad = (num: number) => String(num).padStart(2, "0");
      setLiveDuration(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [liveDuration, isClockedIn]);

  const handleClockAction = () => {
    setIsClockedIn(!isClockedIn);
  };

  return (
    <div className="space-y-6 p-6 max-w-400 mx-auto bg-slate-50/50 min-h-screen text-slate-900">
      
      {/* ── HEADER NAVIGATION ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Time Card</h1>
          <p className="text-sm text-slate-500">Track your daily work hours and attendance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select defaultValue="current-week">
            <SelectTrigger className="w-55 bg-white h-10 border-slate-200 shadow-sm font-medium">
              <CalendarIcon className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-week">May 12 – May 18, 2025</SelectItem>
              <SelectItem value="last-week">May 05 – May 11, 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-white h-10 border-slate-200 shadow-sm font-semibold text-slate-700">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* ── TOP METRICS BLOCK ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Days</p>
              <h3 className="text-2xl font-bold tracking-tight mt-0.5">6</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">This Week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Hours</p>
              <h3 className="text-2xl font-bold tracking-tight mt-0.5">38.50 <span className="text-sm font-normal text-slate-500">hrs</span></h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">This Week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Hours/Day</p>
              <h3 className="text-2xl font-bold tracking-tight mt-0.5">6.42 <span className="text-sm font-normal text-slate-500">hrs</span></h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">This Week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overtime Hours</p>
              <h3 className="text-2xl font-bold tracking-tight mt-0.5">2.50 <span className="text-sm font-normal text-slate-500">hrs</span></h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">This Week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN WORKSPACE CONTAINER ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COMPONENT: TIME CARD ENTRIES TABLE */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/30">
              <h2 className="font-bold text-slate-800 tracking-tight text-base">Time Card Entries</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Clock In</th>
                    <th className="py-3 px-4">Clock Out</th>
                    <th className="py-3 px-4 text-center">Break (hrs)</th>
                    <th className="py-3 px-4 text-center">Total Hours</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-5 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {timeCards.map((card) => (
                    <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-800">{card.date}</td>
                      <td className="py-3.5 px-4 text-slate-400">{card.day}</td>
                      <td className="py-3.5 px-4 font-medium">{card.clockIn}</td>
                      <td className="py-3.5 px-4 font-medium">{card.clockOut}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">{card.break}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">{card.totalHours}</td>
                      <td className="py-3.5 px-4 text-center">
                        {card.status === "Completed" && (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 rounded-md px-2.5 py-0.5 text-xs font-medium">Completed</Badge>
                        )}
                        {card.status === "Overtime" && (
                          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-100 rounded-md px-2.5 py-0.5 text-xs font-medium">Overtime</Badge>
                        )}
                        {card.status === "Absent" && (
                          <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-100 rounded-md px-2.5 py-0.5 text-xs font-medium">Absent</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-37.5 truncate">{card.notes}</td>
                      <td className="py-3.5 px-5 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="text-xs cursor-pointer">View Audit Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs cursor-pointer">Request Correction</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABLE PAGINATION PANEL */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50/20">
              <span>Showing 1 to 7 of 7 entries</span>
              <div className="flex items-center gap-1.5">
                <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white font-bold">
                  1
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200" disabled>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COMPONENT: ACTION SHIFT PANE & MONTHLY OVERVIEW */}
        <div className="space-y-6">
          
          {/* ACTION CONTAINER: CLOCK IN/OUT PANELS */}
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/20">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Status</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center">
                {isClockedIn ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5 px-3 py-1 font-semibold text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Currently Clocked In
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 gap-1.5 px-3 py-1 font-semibold text-xs">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Currently Clocked Out
                  </Badge>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-xs text-slate-400 font-medium block">Clocked In At</span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">08:02 AM</h2>
                <span className="text-xs font-medium text-slate-400">May 18, 2025</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium block">Working Duration</span>
                <div className="text-3xl font-mono font-bold tracking-tight text-emerald-600 flex items-baseline gap-1">
                  {isClockedIn ? liveDuration : "00:00:00"}
                  <span className="text-xs font-sans font-medium text-slate-400">hrs</span>
                </div>
              </div>

              {isClockedIn ? (
                <Button 
                  onClick={handleClockAction}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold h-11 tracking-wide shadow-sm gap-2 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Clock Out
                </Button>
              ) : (
                <Button 
                  onClick={handleClockAction}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 tracking-wide shadow-sm gap-2 transition-colors"
                >
                  <LogIn className="h-4 w-4" /> Clock In
                </Button>
              )}
            </CardContent>
          </Card>

          {/* BLOCK: HISTORICAL MONTHLY SUMMARY */}
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Summary</CardTitle>
              <Select defaultValue="may-25">
                <SelectTrigger className="w-27.5 h-7 text-xs bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="may-25">May 2025</SelectItem>
                  <SelectItem value="apr-25">Apr 2025</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm font-medium">
              <div className="flex justify-between items-center text-slate-500">
                <span>Total Days Worked</span>
                <span className="font-bold text-slate-800">16</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Total Hours</span>
                <span className="font-bold text-slate-800">104.25 <span className="text-xs font-normal text-slate-400">hrs</span></span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Average Hours/Day</span>
                <span className="font-bold text-slate-800">6.52 <span className="text-xs font-normal text-slate-400">hrs</span></span>
              </div>
              <div className="flex justify-between items-center text-slate-500 pb-2">
                <span>Overtime Hours</span>
                <span className="font-bold text-slate-800">7.50 <span className="text-xs font-normal text-slate-400">hrs</span></span>
              </div>
              <Separator className="bg-slate-100" />
              <Button variant="ghost" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 font-bold text-xs gap-1.5 mt-1">
                <Clock className="h-3.5 w-3.5" /> View Full Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── BOTOM COMPLIANCE FOOTER NOTE ────────────────────────────────── */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-blue-900">Note</h4>
          <p className="text-xs text-blue-700/90 leading-relaxed">
            Please ensure you clock in and out accurately. Contact your manager if you need any corrections.
          </p>
        </div>
      </div>
    </div>
  );
}