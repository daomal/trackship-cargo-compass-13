
import React, { useState } from "react";
import { FilterOptions } from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";

interface DataFiltersProps {
  onFilter: (filters: FilterOptions) => void;
  drivers: string[];
}

const DataFilters: React.FC<DataFiltersProps> = ({ onFilter, drivers }) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null, null
  ]);
  const [status, setStatus] = useState<FilterOptions["status"]>("all");
  const [driver, setDriver] = useState<FilterOptions["driver"]>("all");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleFilterApply = () => {
    onFilter({
      dateRange,
      status,
      driver
    });
  };

  const handleReset = () => {
    setDateRange([null, null]);
    setStatus("all");
    setDriver("all");
    onFilter({
      dateRange: [null, null],
      status: "all",
      driver: "all"
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
      <div className="flex items-center space-x-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Filter</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !dateRange[0] && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange[0] && dateRange[1] ? (
                <>
                  {format(dateRange[0], "dd/MM/yyyy")} -{" "}
                  {format(dateRange[1], "dd/MM/yyyy")}
                </>
              ) : (
                <span>Pilih Rentang Tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateRange[0] || undefined,
                to: dateRange[1] || undefined
              }}
              onSelect={(range) => {
                setDateRange([range?.from || null, range?.to || null]);
              }}
              numberOfMonths={1}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as FilterOptions["status"])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="terkirim">Terkirim</SelectItem>
            <SelectItem value="tertunda">Tertunda</SelectItem>
            <SelectItem value="gagal">Gagal</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={driver}
          onValueChange={(value) => setDriver(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Supir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Supir</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver} value={driver}>
                {driver}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex space-x-2">
          <Button onClick={handleFilterApply} size="sm">
            Terapkan
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataFilters;
