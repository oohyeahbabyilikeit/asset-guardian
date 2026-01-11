/**
 * Serial Number Age Decoder
 * 
 * Decodes serial numbers from various water heater manufacturers
 * to determine the manufacture date and age.
 */

export interface DecodedSerial {
  year?: number;
  month?: number;
  ageYears?: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

const currentYear = new Date().getFullYear();

/**
 * Rheem/Ruud Serial Number Decoder
 * Format: First 4 characters = MMYY (Month + Year)
 * Example: 0714XXXXX = July 2014
 */
function decodeRheemSerial(serial: string): DecodedSerial {
  if (serial.length < 4) {
    return { confidence: 'LOW', notes: 'Serial too short' };
  }
  
  const monthCode = serial.substring(0, 2);
  const yearCode = serial.substring(2, 4);
  
  const month = parseInt(monthCode, 10);
  const yearSuffix = parseInt(yearCode, 10);
  
  if (month >= 1 && month <= 12 && !isNaN(yearSuffix)) {
    const year = yearSuffix >= 50 ? 1900 + yearSuffix : 2000 + yearSuffix;
    const ageYears = currentYear - year;
    
    if (ageYears >= 0 && ageYears <= 50) {
      return { year, month, ageYears, confidence: 'HIGH' };
    }
  }
  
  return { confidence: 'LOW', notes: 'Could not decode Rheem format' };
}

/**
 * A.O. Smith Serial Number Decoder
 * Format: First 4 characters = YYWW (Year + Week)
 * Example: 1423XXXXX = Year 2014, Week 23
 */
function decodeAOSmithSerial(serial: string): DecodedSerial {
  if (serial.length < 4) {
    return { confidence: 'LOW', notes: 'Serial too short' };
  }
  
  const yearCode = serial.substring(0, 2);
  const weekCode = serial.substring(2, 4);
  
  const yearSuffix = parseInt(yearCode, 10);
  const week = parseInt(weekCode, 10);
  
  if (!isNaN(yearSuffix) && week >= 1 && week <= 53) {
    const year = yearSuffix >= 50 ? 1900 + yearSuffix : 2000 + yearSuffix;
    const month = Math.ceil(week / 4.33);
    const ageYears = currentYear - year;
    
    if (ageYears >= 0 && ageYears <= 50) {
      return { year, month, ageYears, confidence: 'HIGH' };
    }
  }
  
  return { confidence: 'LOW', notes: 'Could not decode A.O. Smith format' };
}

/**
 * Bradford White Serial Number Decoder
 * Format: First 2 characters = Letter codes for Year + Month
 * A=1964/1984/2004, B=1965/1985/2005, etc.
 * Second letter = Month (A=Jan, B=Feb, etc.)
 */
function decodeBradfordWhiteSerial(serial: string): DecodedSerial {
  if (serial.length < 2) {
    return { confidence: 'LOW', notes: 'Serial too short' };
  }
  
  const yearLetter = serial.charAt(0).toUpperCase();
  const monthLetter = serial.charAt(1).toUpperCase();
  
  const yearOffset = yearLetter.charCodeAt(0) - 'A'.charCodeAt(0);
  const monthOffset = monthLetter.charCodeAt(0) - 'A'.charCodeAt(0);
  
  if (yearOffset >= 0 && yearOffset <= 25 && monthOffset >= 0 && monthOffset <= 11) {
    // Try 2004+ first
    let year = 2004 + yearOffset;
    let ageYears = currentYear - year;
    
    // If age is negative, try 1984 base
    if (ageYears < 0) {
      year = 1984 + yearOffset;
      ageYears = currentYear - year;
    }
    
    // If still unreasonable, try 1964 base
    if (ageYears > 40) {
      year = 2004 + yearOffset;
      ageYears = currentYear - year;
    }
    
    const month = monthOffset + 1;
    
    if (ageYears >= 0 && ageYears <= 50) {
      return { year, month, ageYears, confidence: 'MEDIUM', notes: 'Bradford White letter code' };
    }
  }
  
  return { confidence: 'LOW', notes: 'Could not decode Bradford White format' };
}

/**
 * Rinnai Serial Number Decoder
 * Format: Typically 10 digits, positions 3-4 = Year (YY)
 */
function decodeRinnaiSerial(serial: string): DecodedSerial {
  if (serial.length < 5) {
    return { confidence: 'LOW', notes: 'Serial too short' };
  }
  
  const yearCode = serial.substring(2, 4);
  const yearSuffix = parseInt(yearCode, 10);
  
  if (!isNaN(yearSuffix)) {
    const year = yearSuffix >= 50 ? 1900 + yearSuffix : 2000 + yearSuffix;
    const ageYears = currentYear - year;
    
    if (ageYears >= 0 && ageYears <= 30) {
      return { year, ageYears, confidence: 'MEDIUM', notes: 'Rinnai YY format' };
    }
  }
  
  return { confidence: 'LOW', notes: 'Could not decode Rinnai format' };
}

/**
 * Navien Serial Number Decoder
 * Format: First character = Year letter (A=2010, B=2011, etc.)
 */
function decodeNavienSerial(serial: string): DecodedSerial {
  if (serial.length < 1) {
    return { confidence: 'LOW', notes: 'Serial too short' };
  }
  
  const yearLetter = serial.charAt(0).toUpperCase();
  const yearOffset = yearLetter.charCodeAt(0) - 'A'.charCodeAt(0);
  
  if (yearOffset >= 0 && yearOffset <= 25) {
    const year = 2010 + yearOffset;
    const ageYears = currentYear - year;
    
    if (ageYears >= 0 && ageYears <= 25) {
      return { year, ageYears, confidence: 'MEDIUM', notes: 'Navien letter code' };
    }
  }
  
  return { confidence: 'LOW', notes: 'Could not decode Navien format' };
}

/**
 * State Water Heater Serial Number Decoder
 * Same format as A.O. Smith (they're the same company)
 */
function decodeStateSerial(serial: string): DecodedSerial {
  return decodeAOSmithSerial(serial);
}

/**
 * Noritz Serial Number Decoder
 * Format: Various, often YYMMDD in first 6 positions
 */
function decodeNoritzSerial(serial: string): DecodedSerial {
  if (serial.length < 6) {
    return { confidence: 'LOW', notes: 'Serial too short' };
  }
  
  const yearCode = serial.substring(0, 2);
  const monthCode = serial.substring(2, 4);
  
  const yearSuffix = parseInt(yearCode, 10);
  const month = parseInt(monthCode, 10);
  
  if (!isNaN(yearSuffix) && month >= 1 && month <= 12) {
    const year = yearSuffix >= 50 ? 1900 + yearSuffix : 2000 + yearSuffix;
    const ageYears = currentYear - year;
    
    if (ageYears >= 0 && ageYears <= 30) {
      return { year, month, ageYears, confidence: 'MEDIUM', notes: 'Noritz YYMMDD format' };
    }
  }
  
  return { confidence: 'LOW', notes: 'Could not decode Noritz format' };
}

/**
 * Takagi Serial Number Decoder
 * Format: Similar to Noritz
 */
function decodeTakagiSerial(serial: string): DecodedSerial {
  return decodeNoritzSerial(serial);
}

/**
 * Generic fallback decoder
 * Tries common patterns
 */
function decodeGenericSerial(serial: string): DecodedSerial {
  if (serial.length < 2) {
    return { confidence: 'LOW', notes: 'Serial too short' };
  }
  
  // Try YYWW pattern (positions 1-4)
  const pattern1 = serial.substring(0, 4);
  const year1 = parseInt(pattern1.substring(0, 2), 10);
  const week1 = parseInt(pattern1.substring(2, 4), 10);
  
  if (!isNaN(year1) && !isNaN(week1) && week1 >= 1 && week1 <= 53) {
    const fullYear = year1 >= 50 ? 1900 + year1 : 2000 + year1;
    const ageYears = currentYear - fullYear;
    
    if (ageYears >= 0 && ageYears <= 50) {
      return { 
        year: fullYear, 
        ageYears, 
        confidence: 'LOW', 
        notes: 'Generic YYWW pattern' 
      };
    }
  }
  
  // Try finding a 4-digit year
  const yearMatch = serial.match(/20[0-2][0-9]/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10);
    const ageYears = currentYear - year;
    
    if (ageYears >= 0 && ageYears <= 30) {
      return { 
        year, 
        ageYears, 
        confidence: 'LOW', 
        notes: 'Found 4-digit year in serial' 
      };
    }
  }
  
  return { confidence: 'LOW', notes: 'Could not decode serial number' };
}

// Brand to decoder mapping
const BRAND_DECODERS: Record<string, (serial: string) => DecodedSerial> = {
  'Rheem': decodeRheemSerial,
  'Ruud': decodeRheemSerial,
  'A.O. Smith': decodeAOSmithSerial,
  'Bradford White': decodeBradfordWhiteSerial,
  'Rinnai': decodeRinnaiSerial,
  'Navien': decodeNavienSerial,
  'State': decodeStateSerial,
  'Noritz': decodeNoritzSerial,
  'Takagi': decodeTakagiSerial,
  'American': decodeAOSmithSerial,
  'Lochinvar': decodeAOSmithSerial,
};

/**
 * Main decoder function
 * Attempts to decode a serial number based on brand
 */
export function decodeSerialNumber(brand: string, serial: string): DecodedSerial {
  const cleanSerial = serial.trim().toUpperCase();
  
  if (!cleanSerial) {
    return { confidence: 'LOW', notes: 'No serial number provided' };
  }
  
  // Try brand-specific decoder first
  const decoder = BRAND_DECODERS[brand];
  if (decoder) {
    const result = decoder(cleanSerial);
    if (result.confidence !== 'LOW') {
      return result;
    }
  }
  
  // Fall back to generic decoder
  return decodeGenericSerial(cleanSerial);
}

/**
 * Get age string for display
 */
export function getAgeDisplayString(decoded: DecodedSerial): string {
  if (decoded.ageYears !== undefined) {
    if (decoded.ageYears === 0) {
      return 'Less than 1 year old';
    } else if (decoded.ageYears === 1) {
      return '1 year old';
    } else {
      return `${decoded.ageYears} years old`;
    }
  }
  return 'Age unknown';
}

/**
 * Get confidence badge color
 */
export function getConfidenceColor(confidence: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  switch (confidence) {
    case 'HIGH':
      return 'text-green-600 bg-green-100';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-100';
    case 'LOW':
      return 'text-muted-foreground bg-muted';
  }
}
