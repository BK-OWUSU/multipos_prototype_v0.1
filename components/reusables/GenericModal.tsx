"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactNode } from "react";

interface GenericModalProps {
  triggerBtn: ReactNode;      
  header: string;         
  description?: string;    
  children: ReactNode;    
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GenericModal({
  triggerBtn,
  header,
  description,
  children,
  isOpen,
  onOpenChange,
}: GenericModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {triggerBtn}
      </DialogTrigger>
      
      {/* sm:max-w-[600px] is a good middle-ground for most POS forms */}
      <DialogContent className="sm:max-w-137.5 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center font-bold my-1">{header}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* This is where your AddEmployeeForm or any other component goes */}
        <div className="py-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}