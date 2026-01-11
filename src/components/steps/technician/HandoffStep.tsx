import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  User, 
  Clock, 
  ArrowRight,
  Flame,
  Zap,
  Droplets,
  Wind,
  AlertTriangle,
  Gauge,
  MapPin,
  Shield,
  Tablet,
  Send,
  Link,
  Copy,
  Check,
  Mail,
  Phone
} from 'lucide-react';
import type { TechnicianInspectionData } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';

function getUnitTypeIcon(fuelType: FuelType) {
  switch (fuelType) {
    case 'TANKLESS_GAS':
      return <Wind className="h-4 w-4" />;
    case 'TANKLESS_ELECTRIC':
      return <Zap className="h-4 w-4" />;
    case 'HYBRID':
      return <Droplets className="h-4 w-4" />;
    case 'ELECTRIC':
      return <Zap className="h-4 w-4" />;
    default:
      return <Flame className="h-4 w-4" />;
  }
}

function getUnitTypeLabel(fuelType: FuelType): string {
  switch (fuelType) {
    case 'TANKLESS_GAS':
      return 'Tankless Gas';
    case 'TANKLESS_ELECTRIC':
      return 'Tankless Electric';
    case 'HYBRID':
      return 'Hybrid Heat Pump';
    case 'ELECTRIC':
      return 'Electric Tank';
    default:
      return 'Gas Tank';
  }
}

function formatLocation(location: string): string {
  return location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

type HandoffMode = 'select' | 'tablet' | 'remote';

interface HandoffStepProps {
  data: TechnicianInspectionData;
  onComplete: () => void;
  onSendRemoteLink?: (contact: { type: 'email' | 'sms'; value: string }) => void;
}

export function HandoffStep({ data, onComplete, onSendRemoteLink }: HandoffStepProps) {
  const [mode, setMode] = useState<HandoffMode>('select');
  const [contactType, setContactType] = useState<'email' | 'sms'>('email');
  const [contactValue, setContactValue] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  
  const hasIssues = data.location.isLeaking || data.location.visualRust;
  
  // Generate a mock report link (in production this would be a real URL)
  const reportLink = `https://opterra.app/report/${Date.now().toString(36)}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(reportLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
  
  const handleSendLink = () => {
    if (contactValue.trim()) {
      onSendRemoteLink?.({ type: contactType, value: contactValue.trim() });
      setLinkSent(true);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--status-optimal))]/20 text-[hsl(var(--status-optimal))] mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Inspection Complete</h2>
        <p className="text-muted-foreground mt-1">
          All equipment data has been recorded
        </p>
      </div>
      
      {/* Critical Alerts */}
      {hasIssues && (
        <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Critical Issues Found</p>
              <ul className="text-sm text-muted-foreground mt-1.5 space-y-0.5">
                {data.location.isLeaking && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    Active leak detected
                  </li>
                )}
                {data.location.visualRust && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    Visible rust or corrosion
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Card */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Inspection Summary
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Unit Info Row */}
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {getUnitTypeIcon(data.asset.fuelType)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {data.asset.brand || 'Unknown'} {getUnitTypeLabel(data.asset.fuelType)}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.asset.tankCapacity 
                  ? `${data.asset.tankCapacity} Gallon Tank`
                  : data.asset.ratedFlowGPM
                    ? `${data.asset.ratedFlowGPM} GPM Rated`
                    : 'Capacity Unknown'}
              </p>
            </div>
            {data.calendarAge > 0 && (
              <Badge variant="secondary" className="font-mono">
                {data.calendarAge} yr
              </Badge>
            )}
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Pressure</p>
                <p className="text-sm font-medium">{data.measurements.housePsi} PSI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hardness</p>
                <p className="text-sm font-medium">{data.streetHardnessGPG} GPG</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{formatLocation(data.location.location)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Softener</p>
                <p className="text-sm font-medium">
                  {data.softener.hasSoftener ? `Yes (${data.softener.saltStatus || 'OK'})` : 'None'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Equipment Badges */}
          {(data.equipment.hasExpTank || data.equipment.hasPrv || data.equipment.hasCircPump) && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {data.equipment.hasExpTank && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  <CheckCircle className="h-3 w-3 mr-1 text-[hsl(var(--status-optimal))]" />
                  Expansion Tank
                </Badge>
              )}
              {data.equipment.hasPrv && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  <CheckCircle className="h-3 w-3 mr-1 text-[hsl(var(--status-optimal))]" />
                  PRV
                </Badge>
              )}
              {data.equipment.hasCircPump && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  <CheckCircle className="h-3 w-3 mr-1 text-[hsl(var(--status-optimal))]" />
                  Circ Pump
                </Badge>
              )}
              {data.equipment.isClosedLoop && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  Closed Loop
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Handoff Mode Selection */}
      {mode === 'select' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground text-center">
            How would you like to collect homeowner information?
          </p>
          
          {/* Option: Hand Tablet */}
          <button
            onClick={() => setMode('tablet')}
            className="w-full p-4 rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent hover:border-primary/60 transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Tablet className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Hand Tablet to Homeowner</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Homeowner is present - they can answer questions now
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>About 2 minutes</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary mt-3" />
            </div>
          </button>
          
          {/* Option: Send Link */}
          <button
            onClick={() => setMode('remote')}
            className="w-full p-4 rounded-xl border-2 border-border bg-card hover:border-primary/40 transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
                <Send className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Homeowner Not Present</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Send a link via email or SMS for them to complete later
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <Link className="h-4 w-4" />
                  <span>Complete remotely</span>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mt-3" />
            </div>
          </button>
        </div>
      )}
      
      {/* Tablet Handoff Mode */}
      {mode === 'tablet' && (
        <>
          <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Ready for Homeowner</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Hand the device to the homeowner to answer a few quick questions about their usage habits and service history.
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>About 2 minutes</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setMode('select')} className="flex-1">
              Back
            </Button>
            <Button onClick={onComplete} className="flex-1 h-12 text-base font-semibold" size="lg">
              <span>Start Questions</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </>
      )}
      
      {/* Remote Link Mode */}
      {mode === 'remote' && !linkSent && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Link className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Report Link</span>
            </div>
            <div className="flex gap-2">
              <Input 
                value={reportLink} 
                readOnly 
                className="text-sm font-mono bg-background"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleCopyLink}
                className="flex-shrink-0"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-[hsl(var(--status-optimal))]" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-card rounded-xl border border-border space-y-4">
            <p className="text-sm font-medium text-foreground">
              Send link to homeowner
            </p>
            
            {/* Contact Type Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setContactType('email')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  contactType === 'email' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/40'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email</span>
              </button>
              <button
                onClick={() => setContactType('sms')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  contactType === 'sms' 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/40'
                }`}
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm font-medium">SMS</span>
              </button>
            </div>
            
            {/* Contact Input */}
            <Input
              type={contactType === 'email' ? 'email' : 'tel'}
              placeholder={contactType === 'email' ? 'homeowner@email.com' : '(555) 123-4567'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              className="h-12"
            />
            
            <Button 
              onClick={handleSendLink} 
              className="w-full h-12"
              disabled={!contactValue.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Report Link
            </Button>
          </div>
          
          <Button variant="outline" onClick={() => setMode('select')} className="w-full">
            Back
          </Button>
        </div>
      )}
      
      {/* Link Sent Confirmation */}
      {mode === 'remote' && linkSent && (
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--status-optimal))]/20 text-[hsl(var(--status-optimal))] mb-4">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Link Sent!</h3>
            <p className="text-muted-foreground mt-2">
              The homeowner will receive the report link via {contactType === 'email' ? 'email' : 'SMS'} at:
            </p>
            <p className="font-mono text-sm text-primary mt-1">{contactValue}</p>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground text-center">
              You can continue to the next inspection. The homeowner's responses will be linked to this report automatically.
            </p>
          </div>
          
          <Button onClick={() => setMode('select')} variant="outline" className="w-full">
            Start Another Inspection
          </Button>
        </div>
      )}
    </div>
  );
}
