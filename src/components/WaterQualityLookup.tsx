/**
 * Water Quality Lookup - Debug UI Component
 * 
 * Allows testing the analyze-water-quality edge function
 * to look up water district sanitizer type from zip code.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Droplets, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface WaterQualityResult {
  utilityName?: string;
  sanitizer: 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';
  hardnessGPG?: number | null;
  sourceUrl?: string;
  confidence: number;
  cached: boolean;
  cachedAt?: string;
  error?: string;
}

export function WaterQualityLookup() {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WaterQualityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!/^\d{5}$/.test(zipCode)) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-water-quality', {
        body: { zipCode }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (e) {
      console.error('Water quality lookup error:', e);
      setError(e instanceof Error ? e.message : 'Failed to look up water quality');
    } finally {
      setLoading(false);
    }
  };

  const getSanitizerBadge = (sanitizer: string) => {
    switch (sanitizer) {
      case 'CHLORAMINE':
        return <Badge variant="destructive" className="text-sm">Chloramine</Badge>;
      case 'CHLORINE':
        return <Badge variant="secondary" className="text-sm bg-green-100 text-green-800">Chlorine</Badge>;
      default:
        return <Badge variant="outline" className="text-sm">Unknown</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-blue-500" />
          Water Quality Lookup
        </CardTitle>
        <CardDescription>
          Check if your water utility uses chlorine or chloramine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter ZIP code"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            className="flex-1"
          />
          <Button onClick={handleLookup} disabled={loading || zipCode.length !== 5}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            {/* Utility Name */}
            {result.utilityName && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Utility</span>
                <p className="font-medium">{result.utilityName}</p>
              </div>
            )}

            {/* Sanitizer Type */}
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Disinfectant</span>
              <div className="mt-1">
                {getSanitizerBadge(result.sanitizer)}
              </div>
            </div>

            {/* Hardness */}
            {result.hardnessGPG !== null && result.hardnessGPG !== undefined && (
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Water Hardness</span>
                <p className="font-medium">{result.hardnessGPG} GPG</p>
              </div>
            )}

            {/* Confidence */}
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Confidence</span>
              <p className={`font-medium ${getConfidenceColor(result.confidence)}`}>
                {result.confidence}%
              </p>
            </div>

            {/* Cache Status */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              {result.cached ? (
                <span>Cached result from {new Date(result.cachedAt!).toLocaleDateString()}</span>
              ) : (
                <span>Fresh lookup</span>
              )}
            </div>

            {/* Source Link */}
            {result.sourceUrl && (
              <a
                href={result.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                View Source
              </a>
            )}
          </div>
        )}

        {/* Chloramine Warning */}
        {result?.sanitizer === 'CHLORAMINE' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Chloramine detected.</strong> Water softener resin degrades 2-3× faster 
              with chloramine. Consider a carbon pre-filter to extend resin life.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
