import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OfflineSyncIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  lastError: string | null;
  onManualSync?: () => void;
  className?: string;
}

export function OfflineSyncIndicator({
  isOnline,
  isSyncing,
  pendingCount,
  lastSyncAt,
  lastError,
  onManualSync,
  className,
}: OfflineSyncIndicatorProps) {
  const getStatusColor = () => {
    if (!isOnline) return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    if (lastError) return 'bg-destructive/20 text-destructive border-destructive/30';
    if (isSyncing) return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    if (pendingCount > 0) return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30';
  };

  const getIcon = () => {
    if (!isOnline) return <WifiOff className="h-3.5 w-3.5" />;
    if (isSyncing) return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    if (lastError) return <AlertCircle className="h-3.5 w-3.5" />;
    if (pendingCount > 0) return <Cloud className="h-3.5 w-3.5" />;
    return <Check className="h-3.5 w-3.5" />;
  };

  const getLabel = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (lastError) return 'Sync failed';
    if (pendingCount > 0) return `${pendingCount} pending`;
    return 'Synced';
  };

  const getTooltipContent = () => {
    if (!isOnline) {
      return (
        <div className="space-y-1">
          <p className="font-medium">You're offline</p>
          <p className="text-xs text-muted-foreground">
            Data is being saved locally and will sync when you're back online.
          </p>
          {pendingCount > 0 && (
            <p className="text-xs">{pendingCount} item(s) waiting to sync</p>
          )}
        </div>
      );
    }

    if (lastError) {
      return (
        <div className="space-y-2">
          <p className="font-medium text-destructive">Sync failed</p>
          <p className="text-xs">{lastError}</p>
          {onManualSync && (
            <Button size="sm" variant="outline" onClick={onManualSync} className="w-full">
              Retry sync
            </Button>
          )}
        </div>
      );
    }

    if (isSyncing) {
      return (
        <div className="space-y-1">
          <p className="font-medium">Syncing data...</p>
          <p className="text-xs text-muted-foreground">
            Uploading inspection data and photos
          </p>
        </div>
      );
    }

    if (pendingCount > 0) {
      return (
        <div className="space-y-2">
          <p className="font-medium">{pendingCount} pending</p>
          <p className="text-xs text-muted-foreground">
            Items waiting to be synced
          </p>
          {onManualSync && (
            <Button size="sm" variant="outline" onClick={onManualSync} className="w-full">
              Sync now
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <p className="font-medium">All synced</p>
        {lastSyncAt && (
          <p className="text-xs text-muted-foreground">
            Last sync: {new Date(lastSyncAt).toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={pendingCount > 0 && isOnline && !isSyncing ? onManualSync : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors",
              getStatusColor(),
              pendingCount > 0 && isOnline && !isSyncing && "cursor-pointer hover:opacity-80",
              className
            )}
          >
            {getIcon()}
            <span>{getLabel()}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
