"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  showEventFilter?: boolean;
  showEmployeeFilter?: boolean;
  events?: { id: string; name: string }[];
  employees?: { id: string; name: string }[];
  selectedEvent?: string;
  selectedEmployee?: string;
  onEventChange?: (value: string) => void;
  onEmployeeChange?: (value: string) => void;
}

export function SearchToolbar({
  search,
  onSearchChange,
  placeholder = "搜索员工、服装或活动...",
  showEventFilter = false,
  showEmployeeFilter = false,
  events = [],
  employees = [],
  selectedEvent = "all",
  selectedEmployee = "all",
  onEventChange,
  onEmployeeChange,
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
        <Select value={selectedEvent} onValueChange={(v) => onEventChange(v || "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="筛选活动" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有活动</SelectItem>
            {events.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {showEmployeeFilter && onEmployeeChange && (
        <Select value={selectedEmployee} onValueChange={(v) => onEmployeeChange(v || "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="筛选员工" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有员工</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
