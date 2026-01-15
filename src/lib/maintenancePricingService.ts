import { supabase } from '@/integrations/supabase/client';

export interface MaintenancePrice {
  serviceType: string;
  unitType: 'tank' | 'tankless' | 'hybrid';
  price: number;
  label: string;
  description: string;
  estimatedMinutes?: number;
}

// Default maintenance pricing when no contractor pricing exists
const DEFAULT_MAINTENANCE_PRICES: Record<string, { price: number; label: string; description: string; minutes: number }> = {
  flush: {
    price: 150,
    label: 'Tank Flush',
    description: 'Removes sediment buildup that reduces efficiency and causes damage',
    minutes: 45,
  },
  anode: {
    price: 350,
    label: 'Anode Inspection & Replacement',
    description: 'Prevents corrosion damage to your tank lining',
    minutes: 60,
  },
  descale: {
    price: 200,
    label: 'Descaling Service',
    description: 'Removes mineral buildup from heat exchanger for optimal performance',
    minutes: 90,
  },
  filter_clean: {
    price: 100,
    label: 'Filter Cleaning',
    description: 'Cleans inlet filter to maintain proper water flow',
    minutes: 30,
  },
  air_filter: {
    price: 75,
    label: 'Air Filter Service',
    description: 'Cleans or replaces air filter for proper combustion',
    minutes: 20,
  },
  condensate_drain: {
    price: 125,
    label: 'Condensate Drain Check',
    description: 'Ensures proper drainage and prevents water damage',
    minutes: 30,
  },
  tp_valve: {
    price: 125,
    label: 'T&P Valve Test',
    description: 'Tests temperature and pressure relief valve for safety',
    minutes: 20,
  },
  isolation_valve: {
    price: 100,
    label: 'Isolation Valve Check',
    description: 'Verifies service valves operate properly for future maintenance',
    minutes: 25,
  },
  // Infrastructure tasks - critical priority
  exp_tank_install: {
    price: 350,
    label: 'Expansion Tank Installation',
    description: 'Protects equipment from thermal expansion damage in closed-loop systems',
    minutes: 90,
  },
  exp_tank_replace: {
    price: 325,
    label: 'Expansion Tank Replacement',
    description: 'Replaces failed/waterlogged expansion tank to restore protection',
    minutes: 75,
  },
  prv_install: {
    price: 450,
    label: 'Pressure Regulator Installation',
    description: 'Reduces high water pressure to safe levels to prevent equipment damage',
    minutes: 120,
  },
  prv_replace: {
    price: 425,
    label: 'Pressure Regulator Replacement',
    description: 'Replaces failed pressure regulator to restore pressure protection',
    minutes: 90,
  },
};

// Map maintenance task types to service types
export const TASK_TO_SERVICE_MAP: Record<string, string> = {
  flush: 'flush',
  anode: 'anode',
  descale: 'descale',
  filter: 'filter_clean',
  air_filter: 'air_filter',
  condensate: 'condensate_drain',
  tp_valve: 'tp_valve',
  isolation_valve: 'isolation_valve',
};

/**
 * Fetch maintenance prices for a specific contractor
 * Falls back to default pricing if no contractor prices exist
 */
export async function getMaintenancePrices(
  contractorId: string | null,
  unitType: 'tank' | 'tankless' | 'hybrid'
): Promise<MaintenancePrice[]> {
  if (!contractorId) {
    return getDefaultMaintenancePrices(unitType);
  }

  try {
    const { data, error } = await supabase
      .from('contractor_service_prices')
      .select('*')
      .eq('contractor_id', contractorId)
      .eq('unit_type', unitType);

    if (error || !data || data.length === 0) {
      console.log('No contractor pricing found, using defaults');
      return getDefaultMaintenancePrices(unitType);
    }

    return data.map((row) => ({
      serviceType: row.service_type,
      unitType: row.unit_type as 'tank' | 'tankless' | 'hybrid',
      price: Number(row.price_usd),
      label: DEFAULT_MAINTENANCE_PRICES[row.service_type]?.label || row.service_type,
      description: row.description || DEFAULT_MAINTENANCE_PRICES[row.service_type]?.description || '',
      estimatedMinutes: row.estimated_minutes || undefined,
    }));
  } catch (err) {
    console.error('Error fetching contractor prices:', err);
    return getDefaultMaintenancePrices(unitType);
  }
}

/**
 * Get default maintenance prices for a unit type
 */
export function getDefaultMaintenancePrices(unitType: 'tank' | 'tankless' | 'hybrid'): MaintenancePrice[] {
  const serviceTypes = getServiceTypesForUnit(unitType);
  
  return serviceTypes.map((serviceType) => {
    const defaults = DEFAULT_MAINTENANCE_PRICES[serviceType];
    return {
      serviceType,
      unitType,
      price: defaults?.price || 100,
      label: defaults?.label || serviceType,
      description: defaults?.description || '',
      estimatedMinutes: defaults?.minutes,
    };
  });
}

/**
 * Get relevant service types based on unit type
 */
function getServiceTypesForUnit(unitType: 'tank' | 'tankless' | 'hybrid'): string[] {
  switch (unitType) {
    case 'tank':
      return ['flush', 'anode', 'tp_valve'];
    case 'tankless':
      return ['descale', 'filter_clean', 'isolation_valve'];
    case 'hybrid':
      return ['flush', 'air_filter', 'condensate_drain', 'tp_valve'];
    default:
      return ['flush', 'anode'];
  }
}

/**
 * Get a single maintenance price by service type
 */
export function getMaintenancePriceByType(
  prices: MaintenancePrice[],
  taskType: string
): MaintenancePrice | undefined {
  const serviceType = TASK_TO_SERVICE_MAP[taskType] || taskType;
  return prices.find((p) => p.serviceType === serviceType);
}

/**
 * Calculate total annual maintenance cost
 */
export function calculateAnnualMaintenanceCost(
  prices: MaintenancePrice[],
  taskTypes: string[],
  intervalsMonths: number[]
): number {
  let annualCost = 0;
  
  taskTypes.forEach((taskType, index) => {
    const price = getMaintenancePriceByType(prices, taskType);
    if (price) {
      const intervalMonths = intervalsMonths[index] || 12;
      const timesPerYear = 12 / intervalMonths;
      annualCost += price.price * timesPerYear;
    }
  });
  
  return Math.round(annualCost);
}

/**
 * Submit a maintenance notification request
 */
export async function submitNotificationRequest(request: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  maintenanceType: string;
  dueDate: Date;
  propertyId?: string;
  waterHeaterId?: string;
  contractorId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('maintenance_notification_requests').insert({
      customer_name: request.customerName,
      customer_phone: request.customerPhone,
      customer_email: request.customerEmail || null,
      maintenance_type: request.maintenanceType,
      due_date: request.dueDate.toISOString().split('T')[0],
      property_id: request.propertyId || null,
      water_heater_id: request.waterHeaterId || null,
      contractor_id: request.contractorId || null,
      status: 'pending',
    });

    if (error) {
      console.error('Error submitting notification request:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Error submitting notification request:', err);
    return { success: false, error: 'Failed to submit request' };
  }
}
