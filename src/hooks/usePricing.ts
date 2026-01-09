// Hook for fetching real-time pricing data
import { useState, useEffect } from 'react';
import { generateQuote, TotalQuote, getUnitPrice, PriceResult } from '@/lib/pricingService';
import type { ForensicInputs } from '@/lib/opterraAlgorithm';

export interface UsePricingOptions {
  inputs: ForensicInputs;
  contractorId?: string;
  complexity?: 'STANDARD' | 'CODE_UPGRADE' | 'DIFFICULT_ACCESS' | 'NEW_INSTALL';
  enabled?: boolean;
}

export interface UsePricingResult {
  quote: TotalQuote | null;
  unitPrice: PriceResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEMO_CONTRACTOR_ID = '00000000-0000-0000-0000-000000000001';

export function usePricing({
  inputs,
  contractorId = DEMO_CONTRACTOR_ID,
  complexity = 'STANDARD',
  enabled = true,
}: UsePricingOptions): UsePricingResult {
  const [quote, setQuote] = useState<TotalQuote | null>(null);
  const [unitPrice, setUnitPrice] = useState<PriceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try to get full quote first
      const quoteResult = await generateQuote(inputs, contractorId, complexity);
      setQuote(quoteResult);
      setUnitPrice(quoteResult.unitPrice);
    } catch (err) {
      console.error('Quote generation failed:', err);
      
      // Fallback to just unit price
      try {
        const priceResult = await getUnitPrice(inputs);
        setUnitPrice(priceResult);
        setError('Could not load installation costs. Showing unit price only.');
      } catch (priceErr) {
        console.error('Unit price lookup failed:', priceErr);
        setError(err instanceof Error ? err.message : 'Failed to load pricing');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [
    inputs.fuelType,
    inputs.tankCapacity,
    inputs.ventType,
    inputs.warrantyYears,
    contractorId,
    complexity,
    enabled,
  ]);

  return {
    quote,
    unitPrice,
    loading,
    error,
    refetch: fetchPricing,
  };
}

// Seed the database on demand
export async function seedPriceDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-prices`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );

    const data = await response.json();
    return {
      success: data.success,
      message: data.message || data.error || 'Unknown result',
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network error',
    };
  }
}
