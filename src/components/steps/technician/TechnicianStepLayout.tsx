import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TechnicianStepLayout - Unified layout for all technician flow steps
 * 
 * Provides consistent:
 * - Header with icon, title, and subtitle
 * - Content area with proper spacing
 * - Continue button with disabled state
 * - Optional back button
 */

interface TechnicianStepLayoutProps {
  /** Icon displayed in the header circle */
  icon: React.ReactNode;
  /** Main title of the step */
  title: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Main content of the step */
  children: React.ReactNode;
  /** Continue button text (default: "Continue") */
  continueText?: string;
  /** Called when continue button is clicked */
  onContinue?: () => void;
  /** Whether continue button should be disabled */
  continueDisabled?: boolean;
  /** Called when back button is clicked */
  onBack?: () => void;
  /** Additional content to render after the continue button */
  footer?: React.ReactNode;
  /** Hide the continue button (for custom footers) */
  hideContinue?: boolean;
  /** Additional class for content wrapper */
  contentClassName?: string;
}

export function TechnicianStepLayout({
  icon,
  title,
  subtitle,
  children,
  continueText = 'Continue',
  onContinue,
  continueDisabled = false,
  onBack,
  footer,
  hideContinue = false,
  contentClassName,
}: TechnicianStepLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center relative">
        {/* Back button - positioned absolutely in top-left */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute left-0 top-0 gap-1 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
        )}
        
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </div>

      {/* Content */}
      <div className={cn("space-y-4", contentClassName)}>
        {children}
      </div>

      {/* Continue Button */}
      {!hideContinue && (
        <Button
          onClick={onContinue}
          disabled={continueDisabled}
          className="w-full h-12 text-base font-semibold"
        >
          {continueText}
        </Button>
      )}

      {/* Optional Footer */}
      {footer}
    </div>
  );
}

/**
 * Shared card wrapper for form sections within steps
 */
interface StepCardProps {
  children: React.ReactNode;
  className?: string;
}

export function StepCard({ children, className }: StepCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-card p-4 space-y-4",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Selection button for options (e.g., unit type, building type)
 */
interface SelectionButtonProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  variant?: 'default' | 'warning' | 'danger';
  size?: 'default' | 'compact';
}

export function SelectionButton({
  icon,
  label,
  description,
  selected,
  onClick,
  variant = 'default',
  size = 'default',
}: SelectionButtonProps) {
  const getSelectedStyles = () => {
    if (!selected) return 'border-muted bg-card hover:border-primary/40';
    switch (variant) {
      case 'warning':
        return 'border-amber-500 bg-amber-500/10';
      case 'danger':
        return 'border-destructive bg-destructive/10';
      default:
        return 'border-primary bg-primary/10';
    }
  };

  const getIconStyles = () => {
    if (!selected) return 'bg-muted text-muted-foreground';
    switch (variant) {
      case 'warning':
        return 'bg-amber-500/20 text-amber-600';
      case 'danger':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full text-left rounded-xl border-2 transition-all",
        size === 'compact' ? 'p-3' : 'p-4',
        getSelectedStyles()
      )}
    >
      <div className={cn(
        "flex items-center justify-center shrink-0 rounded-xl transition-colors",
        size === 'compact' ? 'w-10 h-10' : 'w-12 h-12',
        getIconStyles()
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-semibold text-foreground",
          size === 'compact' && 'text-sm'
        )}>
          {label}
        </p>
        {description && (
          <p className={cn(
            "text-muted-foreground",
            size === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

/**
 * Chip-style option for compact selections
 */
interface ChipOptionProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function ChipOption({
  label,
  sublabel,
  selected,
  onClick,
  variant = 'default',
}: ChipOptionProps) {
  const getStyles = () => {
    if (!selected) return 'border-muted bg-card hover:border-primary/40 text-foreground';
    switch (variant) {
      case 'success':
        return 'border-green-500 bg-green-500/10 text-green-700';
      case 'warning':
        return 'border-amber-500 bg-amber-500/10 text-amber-700';
      case 'danger':
        return 'border-destructive bg-destructive/10 text-destructive';
      default:
        return 'border-primary bg-primary text-primary-foreground';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 py-3 px-4 rounded-xl border-2 text-center transition-all",
        getStyles()
      )}
    >
      <div className="font-semibold text-sm">{label}</div>
      {sublabel && (
        <div className={cn(
          "text-xs mt-0.5",
          selected && variant === 'default' ? 'opacity-80' : 'text-muted-foreground'
        )}>
          {sublabel}
        </div>
      )}
    </button>
  );
}

/**
 * Binary yes/no toggle
 */
interface BinaryToggleProps {
  label: string;
  description?: string;
  value: boolean | undefined;
  onChange: (val: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  yesVariant?: 'success' | 'warning' | 'danger';
  noVariant?: 'success' | 'warning' | 'danger';
}

export function BinaryToggle({
  label,
  description,
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
  yesVariant = 'danger',
  noVariant = 'success',
}: BinaryToggleProps) {
  const getVariantStyles = (isSelected: boolean, variant: 'success' | 'warning' | 'danger') => {
    if (!isSelected) return 'border-muted bg-card hover:border-muted-foreground/30 text-muted-foreground';
    switch (variant) {
      case 'success':
        return 'border-green-500 bg-green-500/10 text-green-700';
      case 'warning':
        return 'border-amber-500 bg-amber-500/10 text-amber-700';
      case 'danger':
        return 'border-destructive bg-destructive/10 text-destructive';
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all min-w-[56px]",
            getVariantStyles(value === false, noVariant)
          )}
        >
          {noLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all min-w-[56px]",
            getVariantStyles(value === true, yesVariant)
          )}
        >
          {yesLabel}
        </button>
      </div>
    </div>
  );
}

/**
 * Section header with optional completion indicator
 */
interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  isComplete?: boolean;
  isRequired?: boolean;
}

export function SectionHeader({ icon, title, isComplete, isRequired }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
      {isRequired && <span className="text-destructive text-xs">*</span>}
      {isComplete !== undefined && (
        <div className={cn(
          "ml-auto w-2 h-2 rounded-full",
          isComplete ? "bg-green-500" : "bg-muted"
        )} />
      )}
    </div>
  );
}
