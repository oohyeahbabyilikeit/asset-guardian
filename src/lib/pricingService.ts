// ============================================
// Pricing Service v1.0
// AI-powered unit pricing + contractor install presets
// ============================================

import { supabase } from "@/integrations/supabase/client";
import type { ForensicInputs, QualityTier, VentType } from "./opterraAlgorithm";

// ======================
// Types
// ======================

// Variance factors for price range calculations
const VARIANCE_FACTORS = {
  // Installation variance
  LABOR_VARIANCE: 0.15,      // ±15%
  MATERIALS_VARIANCE: 0.10,  // ±10%
  PERMIT_VARIANCE: 0.20,     // ±20%
};

export interface PriceRange {
  low: number;
  high: number;
  median: number;
}

export interface PriceResult {
  retailPrice: number;
  wholesalePrice?: number;
  manufacturer: string;
  model?: string;
  tier: QualityTier;
  warrantyYears: number;
  fuelType: string;
  ventType: string;
  capacityGallons: number;
  confidence: number;
  source: string;
  cached: boolean;
  priceRange: PriceRange;
  varianceReason?: string;
}

export interface InstallPreset {
  id?: string;
  ventType: VentType;
  complexity: 'STANDARD' | 'CODE_UPGRADE' | 'DIFFICULT_ACCESS' | 'NEW_INSTALL';
  laborCost: number;
  materialsCost: number;
  permitCost: number;
  totalCost?: number;
  description?: string;
  estimatedHours?: number;
  // Range modifiers
  laborVariance?: number;     // ±% for labor (default 15%)
  materialsVariance?: number; // ±% for materials (default 10%)
  permitVariance?: number;    // ±% for permits (default 20%)
}

export interface TotalQuote {
  unitPrice: PriceResult;
  installCost: InstallPreset;
  grandTotal: number;
  grandTotalRange: PriceRange;
  breakdown: {
    unit: number;
    labor: number;
    materials: number;
    permit: number;
  };
}

// ======================
// Price Lookup
// ======================

/**
 * Look up unit price by model number using AI
 */
export async function lookupPriceByModel(
  modelNumber: string,
  manufacturer?: string
): Promise<PriceResult> {
  const { data, error } = await supabase.functions.invoke('lookup-price', {
    body: {
      type: 'MODEL',
      modelNumber,
      manufacturer,
    },
  });

  if (error) {
    console.error('Price lookup error:', error);
    throw new Error(error.message || 'Failed to look up price');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as PriceResult;
}

/**
 * Look up unit price by specifications (fallback)
 */
export async function lookupPriceBySpecs(
  specs: {
    fuelType: string;
    capacityGallons: number;
    ventType: string;
    warrantyYears: number;
    qualityTier: string;
  }
): Promise<PriceResult> {
  const { data, error } = await supabase.functions.invoke('lookup-price', {
    body: {
      type: 'SPECS',
      specs,
    },
  });

  if (error) {
    console.error('Price lookup error:', error);
    throw new Error(error.message || 'Failed to look up price');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as PriceResult;
}

/**
 * Get price for a unit based on ForensicInputs
 * Uses model number if available, falls back to specs
 */
export async function getUnitPrice(inputs: ForensicInputs): Promise<PriceResult> {
  // Try specs-based lookup (model number would come from OCR/manual input)
  const specs = {
    fuelType: inputs.fuelType.toUpperCase(),
    capacityGallons: inputs.tankCapacity,
    ventType: inputs.ventType?.toUpperCase() || 'ATMOSPHERIC',
    warrantyYears: inputs.warrantyYears,
    qualityTier: inputs.warrantyYears >= 10 ? 'PREMIUM' 
      : inputs.warrantyYears >= 8 ? 'PROFESSIONAL'
      : inputs.warrantyYears >= 6 ? 'STANDARD' 
      : 'BUILDER',
  };

  const result = await lookupPriceBySpecs(specs);
  
  // Ensure priceRange exists (backwards compat for cached data without ranges)
  if (!result.priceRange) {
    const retailPrice = result.retailPrice;
    const rangeSpread = 0.12; // ±12% for missing range data
    result.priceRange = {
      low: Math.round(retailPrice * (1 - rangeSpread)),
      high: Math.round(retailPrice * (1 + rangeSpread)),
      median: retailPrice,
    };
  }
  
  return result;
}

// ======================
// Install Presets
// ======================

/**
 * Get all installation presets for a contractor
 */
export async function getInstallPresets(contractorId: string): Promise<InstallPreset[]> {
  const { data, error } = await supabase.functions.invoke('install-presets', {
    body: {},
    method: 'GET',
  });

  // Manual fetch since invoke doesn't support query params well for GET
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/install-presets?contractorId=${contractorId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch presets');
  }

  const result = await response.json();
  return result.presets as InstallPreset[];
}

/**
 * Save installation presets for a contractor
 */
export async function saveInstallPresets(
  contractorId: string,
  presets: InstallPreset[]
): Promise<{ success: boolean; count: number }> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/install-presets?contractorId=${contractorId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ presets }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to save presets');
  }

  return response.json();
}

/**
 * Get the installation cost for a specific vent type and complexity
 */
export async function getInstallCost(
  contractorId: string,
  ventType: VentType,
  complexity: InstallPreset['complexity']
): Promise<InstallPreset | null> {
  const presets = await getInstallPresets(contractorId);
  return presets.find(
    p => p.ventType === ventType && p.complexity === complexity
  ) || null;
}

// ======================
// Total Quote Calculator
// ======================

/**
 * Generate a complete quote with unit price + installation
 */
export async function generateQuote(
  inputs: ForensicInputs,
  contractorId: string,
  complexity: InstallPreset['complexity'] = 'STANDARD'
): Promise<TotalQuote> {
  // Get unit price
  const unitPrice = await getUnitPrice(inputs);
  
  // Get install cost
  const ventType = (inputs.ventType || 'ATMOSPHERIC') as VentType;
  const installCost = await getInstallCost(contractorId, ventType, complexity);
  
  // Calculate installation cost range with variance
  const calculateInstallRange = (preset: InstallPreset) => {
    const laborVariance = preset.laborVariance || VARIANCE_FACTORS.LABOR_VARIANCE;
    const materialsVariance = preset.materialsVariance || VARIANCE_FACTORS.MATERIALS_VARIANCE;
    const permitVariance = preset.permitVariance || VARIANCE_FACTORS.PERMIT_VARIANCE;
    
    const installLow = 
      preset.laborCost * (1 - laborVariance) +
      preset.materialsCost * (1 - materialsVariance) +
      preset.permitCost * (1 - permitVariance);
      
    const installHigh = 
      preset.laborCost * (1 + laborVariance) +
      preset.materialsCost * (1 + materialsVariance) +
      preset.permitCost * (1 + permitVariance);
      
    const installMedian = preset.laborCost + preset.materialsCost + preset.permitCost;
    
    return { low: Math.round(installLow), high: Math.round(installHigh), median: installMedian };
  };
  
  if (!installCost) {
    // Use default estimates if no preset found
    const defaultInstall: InstallPreset = {
      ventType,
      complexity,
      laborCost: ventType === 'ATMOSPHERIC' ? 400 : ventType === 'POWER_VENT' ? 600 : 550,
      materialsCost: 150,
      permitCost: 100,
      totalCost: 0,
    };
    defaultInstall.totalCost = defaultInstall.laborCost + defaultInstall.materialsCost + defaultInstall.permitCost;
    
    const installRange = calculateInstallRange(defaultInstall);
    const grandTotal = unitPrice.priceRange.median + defaultInstall.totalCost;
    
    // Combine unit and install ranges
    const grandTotalRange: PriceRange = {
      low: Math.round(unitPrice.priceRange.low + installRange.low),
      high: Math.round(unitPrice.priceRange.high + installRange.high),
      median: grandTotal,
    };
    
    return {
      unitPrice,
      installCost: defaultInstall,
      grandTotal,
      grandTotalRange,
      breakdown: {
        unit: unitPrice.priceRange.median,
        labor: defaultInstall.laborCost,
        materials: defaultInstall.materialsCost,
        permit: defaultInstall.permitCost,
      },
    };
  }
  
  const installRange = calculateInstallRange(installCost);
  const grandTotal = unitPrice.priceRange.median + (installCost.totalCost || installRange.median);
  
  // Combine unit and install ranges
  const grandTotalRange: PriceRange = {
    low: Math.round(unitPrice.priceRange.low + installRange.low),
    high: Math.round(unitPrice.priceRange.high + installRange.high),
    median: grandTotal,
  };
  
  return {
    unitPrice,
    installCost,
    grandTotal,
    grandTotalRange,
    breakdown: {
      unit: unitPrice.priceRange.median,
      labor: installCost.laborCost,
      materials: installCost.materialsCost,
      permit: installCost.permitCost,
    },
  };
}

// ======================
// Default Presets Generator
// ======================

/**
 * Generate default installation presets for a new contractor
 */
export function getDefaultPresets(): InstallPreset[] {
  const ventTypes: VentType[] = ['ATMOSPHERIC', 'POWER_VENT', 'DIRECT_VENT'];
  const complexities: InstallPreset['complexity'][] = ['STANDARD', 'CODE_UPGRADE', 'DIFFICULT_ACCESS', 'NEW_INSTALL'];
  
  const baseCosts: Record<VentType, number> = {
    'ATMOSPHERIC': 350,
    'POWER_VENT': 550,
    'DIRECT_VENT': 500,
  };
  
  const complexityMultipliers: Record<InstallPreset['complexity'], number> = {
    'STANDARD': 1.0,
    'CODE_UPGRADE': 1.4,
    'DIFFICULT_ACCESS': 1.6,
    'NEW_INSTALL': 2.0,
  };
  
  const presets: InstallPreset[] = [];
  
  for (const ventType of ventTypes) {
    for (const complexity of complexities) {
      const baseLaborCost = baseCosts[ventType] * complexityMultipliers[complexity];
      
      presets.push({
        ventType,
        complexity,
        laborCost: Math.round(baseLaborCost),
        materialsCost: complexity === 'CODE_UPGRADE' ? 200 : complexity === 'NEW_INSTALL' ? 300 : 100,
        permitCost: complexity === 'NEW_INSTALL' ? 150 : 75,
        estimatedHours: complexity === 'STANDARD' ? 2.5 
          : complexity === 'CODE_UPGRADE' ? 4 
          : complexity === 'DIFFICULT_ACCESS' ? 5 
          : 6,
      });
    }
  }
  
  return presets;
}