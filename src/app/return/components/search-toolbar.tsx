"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface SearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  showEventFilter?: boolean;
  showEmployeeFilter?: boolean;
  selectedEvent?: string;
  selectedEmployee?: string;
  onEventChange?: (value: string) => void;
  onEmployeeChange?: (value: string) => void;
  extraButtons?: React.ReactNode;
}

export function SearchToolbar({
  search,
  onSearchChange,
  placeholder = "搜索员工、服装或活动...",
  showEventFilter = false,
  showEmployeeFilter = false,
  selectedEvent = "all",
  selectedEmployee = "all",
  onEventChange,
  onEmployeeChange,
  extraButtons,
}: SearchToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      {showEventFilter && onEventChange && (
        <SearchableSelect
          value={selectedEvent}
          onValueChange={(v) => onEventChange(v === "all" ? v : v || "all")}
          endpoint="/api/loan"
          endpointParams={{ status: "active" }}
          pageSize={20}
          prependItems={[{ value: "all", label: "所有活动" }]}
          placeholder="筛选活动"
          triggerClassName="w-full sm:w-[180px]"
        >
          {(item: any, isSelected: boolean) => item.label ?? item.name}
        </SearchableSelect>
      )}
      {showEmployeeFilter && onEmployeeChange && (
        <SearchableSelect
          value={selectedEmployee}
          onValueChange={(v) => onEmployeeChange(v === "all" ? v : v || "all")}
          endpoint="/api/employee"
          pageSize={20}
          prependItems={[{ value: "all", label: "所有员工" }]}
          placeholder="筛选员工"
          triggerClassName="w-full sm:w-[180px]"
        >
          {(item: any, isSelected: boolean) =>
            item.value === "all"
              ? item.label
              : `${item.name}${item.department ? ` (${item.department})` : ""}`
          }
        </SearchableSelect>
      )}
      {extraButtons && <div className="flex items-center gap-2 shrink-0">{extraButtons}</div>}
    </div>
  );
}
