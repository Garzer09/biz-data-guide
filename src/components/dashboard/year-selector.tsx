import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface YearSelectorProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  availableYears?: string[];
}

export function YearSelector({ selectedYear, onYearChange, availableYears }: YearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const defaultYears = availableYears || [
    (currentYear - 2).toString(),
    (currentYear - 1).toString(),
    currentYear.toString(),
    (currentYear + 1).toString()
  ];

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent>
          {defaultYears.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}