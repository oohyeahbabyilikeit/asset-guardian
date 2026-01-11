import { cn } from "@/lib/utils";
import { Check, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { ReactNode } from "react";

type StatusValue = "good" | "fair" | "poor" | "unknown";

interface StatusOption {
  value: StatusValue;
  label: string;
  color: "green" | "yellow" | "red" | "gray";
  icon: ReactNode;
}

const DEFAULT_OPTIONS: StatusOption[] = [
  { value: "good", label: "Good", color: "green", icon: <Check className="h-3.5 w-3.5" /> },
  { value: "fair", label: "Fair", color: "yellow", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { value: "poor", label: "Poor", color: "red", icon: <XCircle className="h-3.5 w-3.5" /> },
];

const FILTER_OPTIONS: StatusOption[] = [
  { value: "good", label: "Clean", color: "green", icon: <Check className="h-3.5 w-3.5" /> },
  { value: "fair", label: "Dirty", color: "yellow", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  { value: "poor", label: "Clogged", color: "red", icon: <XCircle className="h-3.5 w-3.5" /> },
];

interface StatusToggleRowProps {
  label: string;
  value: StatusValue | string | null | undefined;
  onChange: (value: StatusValue) => void;
  options?: StatusOption[];
  variant?: "default" | "filter";
  showUnknown?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function StatusToggleRow({
  label,
  value,
  onChange,
  options,
  variant = "default",
  showUnknown = false,
  className,
  icon,
}: StatusToggleRowProps) {
  const statusOptions = options || (variant === "filter" ? FILTER_OPTIONS : DEFAULT_OPTIONS);
  
  const allOptions = showUnknown 
    ? [...statusOptions, { value: "unknown" as StatusValue, label: "?", color: "gray" as const, icon: <HelpCircle className="h-3.5 w-3.5" /> }]
    : statusOptions;

  const normalizedValue = normalizeValue(value);
  const selectedOption = allOptions.find(o => o.value === normalizedValue);

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return "bg-muted/50 text-muted-foreground hover:bg-muted";
    }
    
    switch (color) {
      case "green":
        return "bg-green-500 text-white shadow-sm";
      case "yellow":
        return "bg-yellow-500 text-white shadow-sm";
      case "red":
        return "bg-red-500 text-white shadow-sm";
      case "gray":
        return "bg-gray-400 text-white shadow-sm";
      default:
        return "bg-primary text-primary-foreground shadow-sm";
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border bg-card",
      className
    )}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="font-medium">{label}</span>
        {selectedOption && (
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded",
            selectedOption.color === "green" && "bg-green-500/20 text-green-700 dark:text-green-400",
            selectedOption.color === "yellow" && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
            selectedOption.color === "red" && "bg-red-500/20 text-red-700 dark:text-red-400",
            selectedOption.color === "gray" && "bg-gray-500/20 text-gray-600 dark:text-gray-400",
          )}>
            {selectedOption.label}
          </span>
        )}
      </div>

      <div className="flex gap-1">
        {allOptions.map((option) => {
          const isSelected = normalizedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "p-2 rounded-md transition-all",
                "active:scale-90",
                getColorClasses(option.color, isSelected)
              )}
              title={option.label}
            >
              {option.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper to normalize various string values to StatusValue
function normalizeValue(value: string | null | undefined): StatusValue | null {
  if (!value) return null;
  
  const v = value.toLowerCase();
  
  // Map common variations
  if (v === "clean" || v === "good" || v === "clear" || v === "ok") return "good";
  if (v === "dirty" || v === "fair" || v === "moderate" || v === "partial") return "fair";
  if (v === "clogged" || v === "poor" || v === "bad" || v === "blocked") return "poor";
  if (v === "unknown" || v === "n/a") return "unknown";
  
  return v as StatusValue;
}

// Compact multi-row status grid
interface StatusGridProps {
  items: {
    label: string;
    value: StatusValue | string | null | undefined;
    onChange: (value: StatusValue) => void;
    variant?: "default" | "filter";
    icon?: ReactNode;
  }[];
  className?: string;
}

export function StatusGrid({ items, className }: StatusGridProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <StatusToggleRow
          key={index}
          label={item.label}
          value={item.value}
          onChange={item.onChange}
          variant={item.variant}
          icon={item.icon}
        />
      ))}
    </div>
  );
}

// Traffic light compact display
interface TrafficLightProps {
  value: StatusValue | string | null | undefined;
  onChange?: (value: StatusValue) => void;
  size?: "sm" | "md";
  className?: string;
}

export function TrafficLight({ value, onChange, size = "md", className }: TrafficLightProps) {
  const normalizedValue = normalizeValue(value);
  const sizeClasses = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  
  const lights: { value: StatusValue; color: string; activeColor: string }[] = [
    { value: "good", color: "bg-green-200", activeColor: "bg-green-500" },
    { value: "fair", color: "bg-yellow-200", activeColor: "bg-yellow-500" },
    { value: "poor", color: "bg-red-200", activeColor: "bg-red-500" },
  ];

  return (
    <div className={cn("flex gap-1", className)}>
      {lights.map((light) => {
        const isActive = normalizedValue === light.value;
        return (
          <button
            key={light.value}
            type="button"
            onClick={() => onChange?.(light.value)}
            disabled={!onChange}
            className={cn(
              "rounded-full transition-all",
              sizeClasses,
              isActive ? light.activeColor : light.color,
              onChange && "hover:scale-110 active:scale-95 cursor-pointer",
              !onChange && "cursor-default"
            )}
          />
        );
      })}
    </div>
  );
}
