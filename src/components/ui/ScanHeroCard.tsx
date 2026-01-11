import { ReactNode, useRef, useState } from "react";
import { Camera, CheckCircle2, ChevronDown, Loader2, Pencil } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

interface ScanHeroCardProps {
  title: string;
  subtitle?: string;
  isScanning: boolean;
  hasScanned: boolean;
  scanSummary?: ReactNode;
  onScanImage: (file: File) => void;
  onConfirm?: () => void;
  children: ReactNode;
  confirmLabel?: string;
  scanLabel?: string;
  className?: string;
}

export function ScanHeroCard({
  title,
  subtitle,
  isScanning,
  hasScanned,
  scanSummary,
  onScanImage,
  onConfirm,
  children,
  confirmLabel = "Looks Good",
  scanLabel = "Tap to Scan",
  className,
}: ScanHeroCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onScanImage(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // Pre-scan state: Show large scan hero
  if (!hasScanned && !isEditOpen) {
    return (
      <div className={cn("space-y-4", className)}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Hero Scan Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className={cn(
            "w-full aspect-[4/3] rounded-2xl border-2 border-dashed transition-all",
            "flex flex-col items-center justify-center gap-4",
            "bg-muted/30 hover:bg-muted/50 hover:border-primary/50",
            "active:scale-[0.98]",
            isScanning && "pointer-events-none opacity-70"
          )}
        >
          {isScanning ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <span className="text-lg font-medium text-muted-foreground">
                Analyzing...
              </span>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-primary/10">
                <Camera className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{scanLabel}</p>
                {subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                )}
              </div>
            </>
          )}
        </button>

        {/* Skip Link */}
        <button
          onClick={() => setIsEditOpen(true)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Skip to manual entry
        </button>
      </div>
    );
  }

  // Post-scan state: Show summary with confirm/edit options
  if (hasScanned && !isEditOpen) {
    return (
      <div className={cn("space-y-4", className)}>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Summary Card */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-green-500/10 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">{title}</h3>
              {scanSummary}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {onConfirm && (
              <Button onClick={onConfirm} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {confirmLabel}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className={cn(!onConfirm && "flex-1")}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Edit state: Show collapsible form
  return (
    <div className={cn("space-y-4", className)}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Rescan Button (compact) */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="gap-2"
        >
          {isScanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {hasScanned ? "Rescan" : "Scan"}
        </Button>
        {hasScanned && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditOpen(false)}
            className="text-muted-foreground"
          >
            View Summary
          </Button>
        )}
      </div>

      {/* Manual Entry Form */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

interface ScanHeroSectionProps {
  title: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ScanHeroSection({
  title,
  isOpen,
  onOpenChange,
  defaultOpen = false,
  badge,
  children,
  className,
}: ScanHeroSectionProps) {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      defaultOpen={defaultOpen}
      className={cn("rounded-lg border", className)}
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {badge}
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-3 pt-0 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
