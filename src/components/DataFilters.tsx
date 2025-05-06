
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOptions, ShipmentStatus } from "@/lib/types";

interface DataFiltersProps {
  onFilter: (filters: FilterOptions) => void;
  drivers: string[];
  companies?: string[];
}

const DataFilters: React.FC<DataFiltersProps> = ({ 
  onFilter, 
  drivers = [],
  companies = [] 
}) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [status, setStatus] = useState<ShipmentStatus | "all">("all");
  const [driver, setDriver] = useState<string | "all">("all");
  const [company, setCompany] = useState<string | "all">("all");
  
  const handleApplyFilters = () => {
    onFilter({
      dateRange,
      status,
      driver,
      company
    });
  };
  
  const handleResetFilters = () => {
    setDateRange([null, null]);
    setStatus("all");
    setDriver("all");
    setCompany("all");
    
    onFilter({
      dateRange: [null, null],
      status: "all",
      driver: "all",
      company: "all"
    });
  };
  
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex-1 min-w-[200px]">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange[0] && dateRange[1]
                ? `${format(dateRange[0], "dd MMM yyyy")} - ${format(
                    dateRange[1],
                    "dd MMM yyyy"
                  )}`
                : "Filter Tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={new Date()}
              selected={{
                from: dateRange[0] ?? undefined,
                to: dateRange[1] ?? undefined,
              }}
              onSelect={(range) => {
                setDateRange([range?.from ?? null, range?.to ?? null]);
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="w-[150px]">
        <Select value={status} onValueChange={(value) => setStatus(value as ShipmentStatus | "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="terkirim">Terkirim</SelectItem>
            <SelectItem value="tertunda">Tertunda</SelectItem>
            <SelectItem value="gagal">Gagal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[200px]">
        <Select value={driver} onValueChange={setDriver}>
          <SelectTrigger>
            <SelectValue placeholder="Supir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Supir</SelectItem>
            {drivers.map((driverName) => (
              <SelectItem key={driverName} value={driverName}>
                {driverName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {companies && companies.length > 0 && (
        <div className="w-[200px]">
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger>
              <SelectValue placeholder="Perusahaan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Perusahaan</SelectItem>
              {companies.map((companyName) => (
                <SelectItem key={companyName} value={companyName}>
                  {companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex gap-2">
        <Button variant="default" onClick={handleApplyFilters}>
          Terapkan Filter
        </Button>
        <Button variant="outline" onClick={handleResetFilters}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default DataFilters;
