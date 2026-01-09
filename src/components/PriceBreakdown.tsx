// Price Breakdown Component
// Displays real pricing with ranges, source badges and confidence indicators

import { TotalQuote, PriceResult, PriceRange } from '@/lib/pricingService';
import { Loader2, CheckCircle, AlertCircle, Database, Sparkles, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PriceBreakdownProps {
  quote: TotalQuote | null;
  unitPrice: PriceResult | null;
  loading: boolean;
  error: string | null;
  compact?: boolean;
}

// Format price range as "$1,200 - $1,500"
function formatRange(range: PriceRange): string {
  return `$${range.low.toLocaleString()} - $${range.high.toLocaleString()}`;
}

export function PriceBreakdown({ quote, unitPrice, loading, error, compact = false }: PriceBreakdownProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading real-time pricing...</span>
        </div>
        {!compact && (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </>
        )}
      </div>
    );
  }

  if (error && !unitPrice) {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  if (!quote && !unitPrice) {
    return null;
  }

  const price = unitPrice || quote?.unitPrice;
  const confidenceLevel = price?.confidence && price.confidence >= 0.8 
    ? 'high' 
    : price?.confidence && price.confidence >= 0.5 
      ? 'medium' 
      : 'low';

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {price?.manufacturer} {price?.model || `${price?.capacityGallons}G ${price?.fuelType}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">
            {quote?.grandTotalRange 
              ? formatRange(quote.grandTotalRange)
              : price?.priceRange 
                ? formatRange(price.priceRange)
                : `$${price?.retailPrice?.toLocaleString()}`
            }
          </span>
          <PriceSourceBadge source={price?.source || 'unknown'} confidence={price?.confidence || 0} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Unit Price Range */}
      <div className="flex justify-between items-start">
        <div>
          <span className="text-sm font-medium text-foreground">Water Heater Unit</span>
          <p className="text-xs text-muted-foreground">
            {price?.manufacturer} {price?.model || `${price?.capacityGallons}G ${price?.tier}`}
          </p>
        </div>
        <div className="text-right">
          <span className="font-bold text-foreground">
            {price?.priceRange 
              ? formatRange(price.priceRange)
              : `$${price?.retailPrice?.toLocaleString()}`
            }
          </span>
        </div>
      </div>

      {/* Installation Breakdown */}
      {quote && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Labor ({quote.installCost.ventType?.replace('_', ' ')})</span>
            <span className="text-foreground">${quote.breakdown.labor.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Materials</span>
            <span className="text-foreground">${quote.breakdown.materials.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Permit</span>
            <span className="text-foreground">${quote.breakdown.permit.toLocaleString()}</span>
          </div>

          {/* Total Range */}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="font-bold text-foreground">Total Installed</span>
            <div className="text-right">
              <span className="font-bold text-lg text-primary">
                {formatRange(quote.grandTotalRange)}
              </span>
              <p className="text-xs text-muted-foreground">
                typical: ${quote.grandTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Price Source Badge */}
      <div className="flex items-center justify-between pt-2">
        <PriceSourceBadge source={price?.source || 'unknown'} confidence={price?.confidence || 0} />
        <div className="flex items-center gap-2">
          {price?.cached && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Database className="w-3 h-3" />
              Cached
            </span>
          )}
        </div>
      </div>

      {/* Variance Reason */}
      {price?.varianceReason && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border">
          <TrendingUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Price range: {price.varianceReason}
          </p>
        </div>
      )}

      {/* Warning for low confidence */}
      {confidenceLevel === 'low' && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80">
            This is an estimated range. Actual costs may vary based on local availability and labor rates.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
        Final price varies by location, access, and equipment selection
      </p>
    </div>
  );
}

function PriceSourceBadge({ source, confidence }: { source: string; confidence: number }) {
  const isAI = source.includes('AI') || source === 'AI_LOOKUP';
  const isDatabase = source === 'DATABASE' || source === 'CACHED';

  const confidenceColor = confidence >= 0.8 
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : confidence >= 0.5 
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      : 'bg-orange-500/20 text-orange-400 border-orange-500/30';

  return (
    <div className="flex items-center gap-2">
      {isAI && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          AI Verified
        </span>
      )}
      {isDatabase && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Verified
        </span>
      )}
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${confidenceColor}`}>
        {Math.round(confidence * 100)}% conf
      </span>
    </div>
  );
}
