import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavbarNotifications() {
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-slate-100/50">
        <Bell className="h-16 w-16  text-slate-600" />
      </Button>
      {/* Badge */}
      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white border-2 border-white">
        5
      </span>
    </div>
  );
}