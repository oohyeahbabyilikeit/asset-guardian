import { AlertTriangle, CheckCircle, ChevronRight, MessageSquare, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import type { OpterraResult } from '@/lib/opterraAlgorithm';

interface PrescriptionItem {
  icon: 'critical' | 'warning' | 'info';
  finding: string;
  remediation: string;
}

interface PrescriptionPadProps {
  issues: InfrastructureIssue[];
  opterraResult: OpterraResult;
  handoffMode: 'tablet' | 'remote';
  contractorPhone?: string;
  onReviewWithTechnician: () => void;
  onReadyToProceed?: () => void;
  className?: string;
}

/**
 * PrescriptionPad - Maps findings to billable remediation line items
 * 
 * This is the "Doctor's Orders" view that validates the technician's advice
 * with objective data. Each finding explicitly maps to an actionable item.
 */
export function PrescriptionPad({
  issues,
  opterraResult,
  handoffMode,
  contractorPhone,
  onReviewWithTechnician,
  onReadyToProceed,
  className,
}: PrescriptionPadProps) {
  const { verdict, metrics } = opterraResult;
  const isReplacementRecommended = verdict.action === 'REPLACE' || verdict.badge === 'CRITICAL';
  
  // Build prescription items from issues + verdict
  const prescriptionItems: PrescriptionItem[] = [];
  
  // Add unit replacement if recommended
  if (isReplacementRecommended) {
    prescriptionItems.push({
      icon: 'critical',
      finding: metrics.healthScore <= 10 
        ? 'Containment Failure Detected' 
        : metrics.bioAge >= 12 
          ? 'End of Service Life'
          : 'Safety Integrity Compromised',
      remediation: 'Unit Replacement',
    });
  }
  
  // Add infrastructure issues from algorithm
  issues.forEach(issue => {
    const icon = issue.category === 'VIOLATION' ? 'critical' 
      : issue.category === 'INFRASTRUCTURE' ? 'warning' 
      : 'info';
    
    prescriptionItems.push({
      icon,
      finding: issue.name,
      remediation: issue.remediationLabel,
    });
  });

  // Get icon and colors for each severity
  const getIconStyles = (icon: 'critical' | 'warning' | 'info') => {
    switch (icon) {
      case 'critical':
        return {
          bg: 'bg-destructive/20',
          text: 'text-destructive',
          dot: 'bg-destructive',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/20',
          text: 'text-amber-500',
          dot: 'bg-amber-500',
        };
      case 'info':
        return {
          bg: 'bg-primary/20',
          text: 'text-primary',
          dot: 'bg-primary',
        };
    }
  };

  // Generate SMS link with pre-filled message
  const generateSmsLink = () => {
    if (!contractorPhone) return '#';
    const message = encodeURIComponent(
      `I've reviewed the Cortex report. I understand the risks and I'm ready to schedule the replacement. Please call me to finalize.`
    );
    return `sms:${contractorPhone}?body=${message}`;
  };

  const handleReadyToProceed = () => {
    if (contractorPhone) {
      // Open SMS link
      window.location.href = generateSmsLink();
    }
    onReadyToProceed?.();
  };

  return (
    <Card className={cn("overflow-hidden border-2 border-primary/30", className)}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {isReplacementRecommended ? 'Critical Failure Protocol' : 'Remediation Protocol'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Findings & Required Actions
              </p>
            </div>
          </div>
        </div>

        {/* Prescription Items */}
        <div className="divide-y divide-border/50">
          {prescriptionItems.map((item, index) => {
            const styles = getIconStyles(item.icon);
            return (
              <div key={index} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  {/* Severity Indicator */}
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", styles.dot)} />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.finding}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className={cn("text-sm font-semibold", styles.text)}>
                        {item.remediation}
                      </span>
                      {item.icon === 'critical' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium ml-1">
                          REQUIRED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {prescriptionItems.length === 0 && (
          <div className="px-4 py-8 text-center">
            <CheckCircle className="w-10 h-10 text-primary/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No critical issues detected
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-muted/30 border-t border-border/50">
          {handoffMode === 'tablet' ? (
            // Shoulder-to-shoulder: Hand back to technician
            <div className="space-y-3">
              <Button 
                onClick={onReviewWithTechnician}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Review Solutions with Technician
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Turn to your technician to discuss next steps
              </p>
            </div>
          ) : (
            // Remote: SMS to plumber
            <div className="space-y-3">
              <Button 
                onClick={handleReadyToProceed}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                I'm Ready to Proceed
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Opens a text message to your plumber
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
