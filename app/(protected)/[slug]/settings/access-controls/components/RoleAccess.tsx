// app/[slug]/access_controls/components/RoleAccess.tsx
"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAccessOnly } from "@/lib/nav-data";

interface RoleAccessProps {
  roleId: string;
}

export default function RoleAccess({ roleId }: RoleAccessProps) {
  const navData = getAccessOnly();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleModule = (keys: string[]) => {
    const allSelected = keys.every(k => permissions.includes(k));
    setPermissions(prev => 
      allSelected 
        ? prev.filter(k => !keys.includes(k)) 
        : [...new Set([...prev, ...keys])]
    );
  };

  const expandAll = () => {
    // This will be handled by Accordion's type="multiple" - user can manually expand
  };

  const selectAllModules = () => {
    const allKeys = navData.flatMap(module => 
      module.items?.map(i => i.accessKey) || [module.accessKey]
    );
    setPermissions(allKeys);
  };

  const clearAll = () => {
    setPermissions([]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log("Saving permissions for role:", roleId, permissions);
      // TODO: Call your API to save permissions
      // await updateRolePermissions(roleId, permissions);
      
      // Show success toast
      // toast.success("Access updated successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      // toast.error("Failed to update access");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Module Access</h3>
          <p className="text-sm text-gray-500 mt-1">
            Choose which modules and pages this role can access
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAllModules}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-blue-600 text-xl">📊</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            {permissions.length} access points selected
          </p>
          <p className="text-xs text-blue-700">
            Out of {navData.flatMap(m => m.items?.map(i => i.accessKey) || [m.accessKey]).length} total available
          </p>
        </div>
      </div>

      {/* Accordion with Modules */}
      <Accordion type="multiple" className="space-y-4">
        {navData.map((module) => {
          const Icon = module.icon;
          const subKeys = module.items?.map(i => i.accessKey) || [module.accessKey];
          const allSelected = subKeys.every(k => permissions.includes(k));
          const someSelected = subKeys.some(k => permissions.includes(k)) && !allSelected;
          const itemCount = module.items?.length || 0;

          return (
            <AccordionItem 
              key={module.accessKey} 
              value={module.accessKey} 
              className="border rounded-lg px-4 bg-slate-50/30"
            >
              <div className="flex items-center justify-between w-full">
                <AccordionTrigger className="hover:no-underline py-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{module.title}</span>
                        {itemCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {itemCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-normal">
                        {module.accessKey}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <div 
                  className="flex items-center gap-2 mr-4" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox 
                    checked={allSelected}
                    onCheckedChange={() => toggleModule(subKeys)}
                    className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
              </div>

              {module.items && module.items.length > 0 && (
                <AccordionContent className="grid grid-cols-2 gap-3 pb-4">
                  {module.items.map(item => {
                    const SubIcon = item.icon;
                    const isSelected = permissions.includes(item.accessKey);

                    return (
                      <div 
                        key={item.accessKey} 
                        className={`flex items-center justify-between p-3 bg-white border-2 rounded-lg transition-all cursor-pointer hover:border-primary/50 ${
                          isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                        onClick={() => toggleModule([item.accessKey])}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => toggleModule([item.accessKey])} 
                          />
                          <SubIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] ml-2">
                          {item.accessKey}
                        </Badge>
                      </div>
                    );
                  })}
                </AccordionContent>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Legend */}
      <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <Checkbox checked className="pointer-events-none" />
          <span className="text-gray-600">Has Access</span>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox className="pointer-events-none" />
          <span className="text-gray-600">No Access</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">—</span>
          <span className="text-gray-600">Not Applicable</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={clearAll}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}