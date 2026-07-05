import React from "react";
import { 
  ShieldCheck, 
  LayoutGrid, 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function RoleDetails({ roleId }: { roleId: string }) {
  // In a real app, you'd fetch this data based on roleId
  const roleData = {
    name: "Super Admin",
    type: "System",
    description: "Full system access with all permissions and modules. This role has complete control over the entire system.",
    business: "Abena Stores Ltd.",
    createdAt: "May 10, 2024 09:15 AM",
    updatedAt: "May 18, 2024 02:30 PM",
    createdBy: "Abena Owusu",
    status: "Active",
    isSystemRole: true,
    isTemporary: false,
    expiresAt: null,
    stats: {
      permissions: 120,
      modules: 29,
      users: 1,
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Role Information Card */}
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Role Information</h3>
            <div className="space-y-0 divide-y divide-slate-100 border-t border-slate-100">
              <InfoRow label="Role Name" value={roleData.name} />
              <InfoRow label="Role Type" value={roleData.type} />
              <InfoRow label="Description" value={roleData.description} isDescription />
              <InfoRow label="Business" value={roleData.business} />
              <InfoRow label="Created At" value={roleData.createdAt} />
              <InfoRow label="Updated At" value={roleData.updatedAt} />
              <InfoRow label="Created By" value={roleData.createdBy} />
              <InfoRow 
                label="Status" 
                value={
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                    {roleData.status}
                  </Badge>
                } 
              />
              <InfoRow 
                label="System Role" 
                value={roleData.isSystemRole ? <StatusBadge active label="Yes" /> : <StatusBadge active={false} label="No" />} 
              />
              <InfoRow 
                label="Temporary Role" 
                value={roleData.isTemporary ? <StatusBadge active label="Yes" /> : <StatusBadge active={false} label="No" />} 
              />
              <InfoRow label="Expires At" value={roleData.expiresAt || "—"} />
            </div>
          </div>

          {/* Role Statistics Grid */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-4">Role Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard 
                icon={<ShieldCheck className="text-indigo-600" size={18} />} 
                bg="bg-indigo-50"
                label="Total Permissions" 
                value={roleData.stats.permissions} 
                subtext="All system permissions"
              />
              <StatCard 
                icon={<LayoutGrid className="text-blue-600" size={18} />} 
                bg="bg-blue-50"
                label="Module Access" 
                value={roleData.stats.modules} 
                subtext="Accessible modules"
              />
              <StatCard 
                icon={<Users className="text-purple-600" size={18} />} 
                bg="bg-purple-50"
                label="Users Assigned" 
                value={roleData.stats.users} 
                subtext="Users with this role"
              />
              <StatCard 
                icon={<Calendar className="text-sky-600" size={18} />} 
                bg="bg-sky-50"
                label="Last Updated" 
                value={roleData.updatedAt.split(' ')[0] + ' ' + roleData.updatedAt.split(' ')[1] + ' ' + roleData.updatedAt.split(' ')[2]} 
                subtext={roleData.updatedAt.split(' ').slice(3).join(' ')}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Helper Components ---

function InfoRow({ label, value, isDescription = false }: { label: string; value: React.ReactNode; isDescription?: boolean }) {
  return (
    <div className="grid grid-cols-3 py-4 items-start">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <div className={cn(
        "col-span-2 text-sm text-slate-900 font-semibold leading-relaxed",
        isDescription && "font-medium text-slate-600 pr-4"
      )}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {active ? (
        <CheckCircle2 className="text-emerald-500" size={14} />
      ) : (
        <XCircle className="text-slate-300" size={14} />
      )}
      <span className={active ? "text-slate-900" : "text-slate-500"}>{label}</span>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, bg }: { icon: React.ReactNode; label: string; value: string | number; subtext: string; bg: string }) {
  return (
    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", bg)}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-none mb-1">{label}</span>
          <span className="text-lg font-bold text-slate-900">{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-medium">{subtext}</span>
    </div>
  );
}