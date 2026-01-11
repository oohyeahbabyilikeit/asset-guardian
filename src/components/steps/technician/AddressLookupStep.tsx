import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  MapPin, 
  Search, 
  Home, 
  Droplets, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus,
  ChevronRight,
  Loader2,
  Navigation,
  LocateFixed
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { useGPS } from '@/hooks/useGPS';

interface PropertyWithAssets {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  waterHeaters: {
    id: string;
    manufacturer: string | null;
    fuel_type: string;
    tank_capacity_gallons: number;
    lastAssessment: {
      created_at: string;
      health_score: number | null;
    } | null;
  }[];
  waterSofteners: {
    id: string;
    manufacturer: string | null;
  }[];
}

export interface NewPropertyAddress {
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  gpsCoords?: { lat: number; lng: number };
}

interface AddressLookupStepProps {
  onSelectProperty: (property: PropertyWithAssets | null, gpsCoords?: { lat: number; lng: number }) => void;
  onCreateNew: (address: NewPropertyAddress) => void;
}

function getInspectionStatus(lastAssessment: { created_at: string } | null): {
  needed: boolean;
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  if (!lastAssessment) {
    return {
      needed: true,
      label: 'Never Inspected',
      color: 'text-destructive bg-destructive/10',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    };
  }

  const daysSince = differenceInDays(new Date(), new Date(lastAssessment.created_at));
  
  if (daysSince >= 365) {
    return {
      needed: true,
      label: `${Math.floor(daysSince / 365)}y ago — Due`,
      color: 'text-amber-600 bg-amber-100',
      icon: <Clock className="h-3.5 w-3.5" />,
    };
  }
  
  return {
    needed: false,
    label: formatDistanceToNow(new Date(lastAssessment.created_at), { addSuffix: true }),
    color: 'text-green-600 bg-green-100',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  };
}

export function AddressLookupStep({ onSelectProperty, onCreateNew }: AddressLookupStepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PropertyWithAssets[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // GPS hook
  const { isLocating, isReverseGeocoding, getPositionAndAddress, position } = useGPS();
  
  // New address entry mode
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<NewPropertyAddress>({
    address_line1: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // GPS auto-fill handler
  const handleGPSFill = useCallback(async () => {
    const result = await getPositionAndAddress();
    if (result) {
      const { address, position } = result;
      
      // Store GPS coords for water hardness lookup
      setGpsCoords({ lat: position.latitude, lng: position.longitude });
      
      // Build street address
      const streetAddr = [address.streetNumber, address.street]
        .filter(Boolean)
        .join(' ');
      
      setNewAddress({
        address_line1: streetAddr || '',
        city: address.city || '',
        state: address.state?.slice(0, 2).toUpperCase() || '',
        zip_code: address.zipCode || '',
        gpsCoords: { lat: position.latitude, lng: position.longitude },
      });
      
      // Also set search query for property lookup
      if (streetAddr) {
        setSearchQuery(streetAddr);
      }
      
      setShowAddressForm(true);
    }
  }, [getPositionAndAddress]);

  const searchAddress = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    
    try {
      // Search properties by address
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id, address_line1, address_line2, city, state, zip_code')
        .or(`address_line1.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,zip_code.ilike.%${searchQuery}%`)
        .limit(10);
      
      if (propError) throw propError;
      
      if (!properties || properties.length === 0) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      
      // For each property, fetch water heaters and their latest assessment
      const propertiesWithAssets: PropertyWithAssets[] = await Promise.all(
        properties.map(async (prop) => {
          // Get water heaters
          const { data: heaters } = await supabase
            .from('water_heaters')
            .select('id, manufacturer, fuel_type, tank_capacity_gallons')
            .eq('property_id', prop.id);
          
          // Get assessments for each heater
          const heatersWithAssessments = await Promise.all(
            (heaters || []).map(async (heater) => {
              const { data: assessments } = await supabase
                .from('assessments')
                .select('created_at, health_score')
                .eq('water_heater_id', heater.id)
                .order('created_at', { ascending: false })
                .limit(1);
              
              return {
                ...heater,
                lastAssessment: assessments?.[0] || null,
              };
            })
          );
          
          // Get water softeners
          const { data: softeners } = await supabase
            .from('water_softeners')
            .select('id, manufacturer')
            .eq('property_id', prop.id);
          
          return {
            ...prop,
            waterHeaters: heatersWithAssessments,
            waterSofteners: softeners || [],
          };
        })
      );
      
      setResults(propertiesWithAssets);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search properties. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchAddress();
    }
  };

  const handleStartNewInspection = () => {
    setShowAddressForm(true);
    // Pre-fill with search query if it looks like an address
    if (searchQuery.trim()) {
      setNewAddress(prev => ({ ...prev, address_line1: searchQuery.trim() }));
    }
  };

  const handleSubmitNewAddress = () => {
    if (!newAddress.address_line1.trim() || !newAddress.city.trim() || 
        !newAddress.state.trim() || !newAddress.zip_code.trim()) {
      setError('Please fill in all address fields');
      return;
    }
    onCreateNew(newAddress);
  };

  const isAddressValid = newAddress.address_line1.trim() && newAddress.city.trim() && 
                         newAddress.state.trim() && newAddress.zip_code.trim();

  // Show address entry form
  if (showAddressForm) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">New Property</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the property address for this inspection
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Street Address</Label>
            <Input
              value={newAddress.address_line1}
              onChange={(e) => setNewAddress(prev => ({ ...prev, address_line1: e.target.value }))}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={newAddress.city}
                onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Phoenix"
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={newAddress.state}
                onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
                placeholder="AZ"
                maxLength={2}
                className="uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ZIP Code</Label>
            <Input
              value={newAddress.zip_code}
              onChange={(e) => setNewAddress(prev => ({ ...prev, zip_code: e.target.value.replace(/\D/g, '').slice(0, 5) }))}
              placeholder="85004"
              maxLength={5}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAddressForm(false)}
            className="flex-1"
          >
            Back
          </Button>
          <Button 
            onClick={handleSubmitNewAddress}
            disabled={!isAddressValid}
            className="flex-1 gap-2"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Property Lookup</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Search by address or use GPS to auto-fill location
        </p>
      </div>

      {/* GPS Auto-Fill Button - Hero */}
      <Button
        variant="outline"
        onClick={handleGPSFill}
        disabled={isLocating || isReverseGeocoding}
        className="w-full h-14 border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 gap-3"
      >
        {isLocating || isReverseGeocoding ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>{isLocating ? 'Getting location...' : 'Finding address...'}</span>
          </>
        ) : (
          <>
            <LocateFixed className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="font-medium">📍 Use My Location</p>
              <p className="text-xs text-muted-foreground">Auto-fill address from GPS</p>
            </div>
          </>
        )}
      </Button>
      
      {/* Search Input */}
      <div className="space-y-3">
        <Label>Or search by address</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="123 Main St or 85004"
              className="pl-9"
            />
          </div>
          <Button onClick={searchAddress} disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}
      
      {/* Results */}
      {hasSearched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">
              {results.length > 0 
                ? `${results.length} ${results.length === 1 ? 'property' : 'properties'} found`
                : 'No properties found'
              }
            </Label>
          </div>
          
          {results.length === 0 && !isSearching && (
            <Card className="p-6 text-center border-dashed">
              <Home className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No existing records for this address
              </p>
              <Button onClick={handleStartNewInspection} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Property
              </Button>
            </Card>
          )}
          
          {results.map((property) => {
            // Check if any heater needs inspection
            const needsInspection = property.waterHeaters.length === 0 || 
              property.waterHeaters.some(h => getInspectionStatus(h.lastAssessment).needed);
            
            return (
              <Card 
                key={property.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  needsInspection ? 'border-amber-300 bg-amber-50/50' : 'border-green-300 bg-green-50/50'
                }`}
                onClick={() => onSelectProperty(property)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium text-foreground truncate">
                        {property.address_line1}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {property.city}, {property.state} {property.zip_code}
                    </p>
                    
                    {/* Assets Summary */}
                    <div className="mt-3 ml-6 space-y-2">
                      {property.waterHeaters.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No water heaters on file</p>
                      ) : (
                        property.waterHeaters.map((heater) => {
                          const status = getInspectionStatus(heater.lastAssessment);
                          return (
                            <div key={heater.id} className="flex items-center gap-2 text-sm">
                              <Droplets className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">
                                {heater.manufacturer || 'Unknown'} • {heater.fuel_type} • {heater.tank_capacity_gallons}gal
                              </span>
                              <Badge className={`${status.color} text-xs gap-1 shrink-0`}>
                                {status.icon}
                                {status.label}
                              </Badge>
                            </div>
                          );
                        })
                      )}
                      
                      {property.waterSofteners.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="ml-5">+ {property.waterSofteners.length} water softener(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    {needsInspection ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inspection Needed
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Up to Date
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Skip / New Inspection */}
      <div className="pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handleStartNewInspection}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Property
        </Button>
      </div>
    </div>
  );
}
