/**
 * Brand Dielectric Lookup Utility
 * 
 * Many modern water heater manufacturers use factory-installed dielectric
 * nipples (stainless steel, brass, or plastic-lined) that eliminate galvanic
 * corrosion risk even with direct copper connections.
 * 
 * This lookup prevents false positives when flagging "Direct Copper" as a risk.
 */

// Brands known to use factory dielectric/stainless/heat-trap nipples
const FACTORY_PROTECTED_BRANDS = [
  'bradford white',   // Hydrojet/dielectric waterway fittings
  'rheem',            // Heat trap nipples with plastic inserts
  'ruud',             // Same as Rheem (sister brand)
  'a.o. smith',       // Dynaclean nipples
  'ao smith',         // Alternate spelling
  'state',            // A.O. Smith brand
  'american',         // A.O. Smith brand
  'lochinvar',        // Commercial-grade dielectric fittings
  'navien',           // Stainless steel connections
  'rinnai',           // Stainless steel connections
  'noritz',           // Stainless steel connections
  'takagi',           // Stainless steel connections
];

// Maximum age to assume factory protection still applies
// Older units may have degraded plastic insulators or replaced nipples
const MAX_AGE_FOR_FACTORY_PROTECTION = 15; // years

/**
 * Check if a brand is known to use factory dielectric nipples
 * @param brand - The water heater brand name
 * @param calendarAge - The age of the unit in years
 * @returns true if the brand/age combination likely has factory protection
 */
export function hasFactoryDielectricNipples(brand: string, calendarAge: number): boolean {
  if (!brand) return false;
  
  const normalizedBrand = brand.toLowerCase().trim();
  const isProtectedBrand = FACTORY_PROTECTED_BRANDS.some(
    protectedBrand => normalizedBrand.includes(protectedBrand)
  );
  
  // Brand must be in protected list AND unit must be less than 15 years old
  return isProtectedBrand && calendarAge < MAX_AGE_FOR_FACTORY_PROTECTION;
}

/**
 * Get a human-readable explanation of why a brand is protected
 * @param brand - The water heater brand name
 * @returns Explanation string or null if not a known protected brand
 */
export function getProtectionExplanation(brand: string): string | null {
  if (!brand) return null;
  
  const normalizedBrand = brand.toLowerCase().trim();
  
  if (normalizedBrand.includes('bradford white')) {
    return 'Bradford White uses Hydrojet® dielectric waterway fittings';
  }
  if (normalizedBrand.includes('rheem') || normalizedBrand.includes('ruud')) {
    return 'Rheem/Ruud uses heat trap nipples with dielectric inserts';
  }
  if (normalizedBrand.includes('a.o. smith') || normalizedBrand.includes('ao smith') || 
      normalizedBrand.includes('state') || normalizedBrand.includes('american')) {
    return 'A.O. Smith family brands use Dynaclean® dielectric nipples';
  }
  if (['navien', 'rinnai', 'noritz', 'takagi'].some(b => normalizedBrand.includes(b))) {
    return 'Tankless units use stainless steel connections (no galvanic risk)';
  }
  if (normalizedBrand.includes('lochinvar')) {
    return 'Lochinvar uses commercial-grade dielectric fittings';
  }
  
  return null;
}
