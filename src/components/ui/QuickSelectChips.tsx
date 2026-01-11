import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface ChipOption<T extends string | number> {
  value: T;
  label: string;
  sublabel?: string;
  variant?: "default" | "warning" | "danger" | "success";
}

interface QuickSelectChipsProps<T extends string | number> {
  label?: string;
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: ChipOption<T>[];
  allowCustom?: boolean;
  customLabel?: string;
  customPlaceholder?: string;
  customType?: "number" | "text";
  className?: string;
}

export function QuickSelectChips<T extends string | number>({
  label,
  value,
  onChange,
  options,
  allowCustom = false,
  customLabel = "Custom",
  customPlaceholder = "Enter value",
  customType = "number",
  className,
}: QuickSelectChipsProps<T>) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const isOptionSelected = (optionValue: T) => value === optionValue;
  const isCustomSelected = value !== undefined && value !== null && !options.some(o => o.value === value);

  const handleChipClick = (optionValue: T) => {
    setShowCustom(false);
    onChange(optionValue);
  };

  const handleCustomClick = () => {
    setShowCustom(true);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    if (customType === "number") {
      const num = parseFloat(newValue);
      if (!isNaN(num)) {
        onChange(num as T);
      }
    } else {
      onChange(newValue as T);
    }
  };

  const getVariantClasses = (variant?: string, isSelected?: boolean) => {
    if (!isSelected) return "";
    
    switch (variant) {
      case "warning":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400";
      case "danger":
        return "bg-red-500/20 border-red-500 text-red-700 dark:text-red-400";
      case "success":
        return "bg-green-500/20 border-green-500 text-green-700 dark:text-green-400";
      default:
        return "bg-primary text-primary-foreground border-primary";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = isOptionSelected(option.value);
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => handleChipClick(option.value)}
              className={cn(
                "px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium",
                "hover:border-primary/50 active:scale-95",
                isSelected
                  ? getVariantClasses(option.variant, true)
                  : "border-muted bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <span>{option.label}</span>
              {option.sublabel && (
                <span className={cn(
                  "block text-xs mt-0.5",
                  isSelected ? "opacity-80" : "text-muted-foreground"
                )}>
                  {option.sublabel}
                </span>
              )}
            </button>
          );
        })}
        
        {allowCustom && (
          <button
            type="button"
            onClick={handleCustomClick}
            className={cn(
              "px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium",
              "hover:border-primary/50 active:scale-95",
              isCustomSelected || showCustom
                ? "bg-primary text-primary-foreground border-primary"
                : "border-muted bg-muted/30 text-muted-foreground hover:bg-muted/50"
            )}
          >
            {customLabel}
          </button>
        )}
      </div>

      {(showCustom || isCustomSelected) && allowCustom && (
        <Input
          type={customType}
          placeholder={customPlaceholder}
          value={isCustomSelected ? String(value) : customValue}
          onChange={handleCustomChange}
          className="max-w-[120px]"
          autoFocus
        />
      )}
    </div>
  );
}

// Preset chips for common patterns
export const PSI_CHIPS = [
  { value: 45, label: "Low", sublabel: "<45 PSI", variant: "warning" as const },
  { value: 60, label: "Normal", sublabel: "45-80 PSI", variant: "success" as const },
  { value: 90, label: "High", sublabel: "80+ PSI", variant: "danger" as const },
];

export const CAPACITY_CHIPS = [
  { value: 40, label: "40 gal", sublabel: "Small" },
  { value: 50, label: "50 gal", sublabel: "Standard" },
  { value: 75, label: "75 gal", sublabel: "Large" },
];

export const WARRANTY_CHIPS = [
  { value: 6, label: "6 Year", sublabel: "Standard" },
  { value: 9, label: "9 Year", sublabel: "Better" },
  { value: 12, label: "12 Year", sublabel: "Best" },
];

export const FLOW_RATE_CHIPS = [
  { value: 5.0, label: "5.0 GPM", sublabel: "Low" },
  { value: 8.0, label: "8.0 GPM", sublabel: "Standard" },
  { value: 10.0, label: "10+ GPM", sublabel: "High" },
];

export const HARDNESS_CHIPS = [
  { value: 3, label: "Soft", sublabel: "0-3 GPG", variant: "success" as const },
  { value: 7, label: "Moderate", sublabel: "4-7 GPG", variant: "default" as const },
  { value: 15, label: "Hard", sublabel: "8-15 GPG", variant: "warning" as const },
  { value: 25, label: "Very Hard", sublabel: "15+ GPG", variant: "danger" as const },
];
