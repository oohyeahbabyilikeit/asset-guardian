import { supabase } from '@/integrations/supabase/client';

export type CaptureSource = 
  | 'findings_summary'      // From recommendation card CTA
  | 'findings_cta'          // From findings page action
  | 'replacement_quote'     // From tier selection page
  | 'maintenance_notify'    // From maintenance schedule card
  | 'handoff_remote'        // From technician handoff
  | 'emergency_flow'        // From panic mode
  | 'chat_escalation';      // From chatbot escalation

export interface LeadSubmission {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  captureSource: CaptureSource;
  captureContext?: Record<string, unknown>;
  propertyId?: string;
  waterHeaterId?: string;
  contractorId?: string;
  optInAlerts?: boolean;
  preferredContactMethod?: 'phone' | 'email' | 'sms';
}

export interface LeadResult {
  success: boolean;
  leadId?: string;
  error?: string;
}

/**
 * Submit a lead to the database
 * This captures homeowner contact information from various points in the app
 */
export async function submitLead(data: LeadSubmission): Promise<LeadResult> {
  try {
    // Use type assertion since the leads table was just created
    // and types may not have regenerated yet
    const insertData = {
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      customer_email: data.customerEmail || null,
      capture_source: data.captureSource,
      capture_context: data.captureContext || {},
      property_id: data.propertyId || null,
      water_heater_id: data.waterHeaterId || null,
      contractor_id: data.contractorId || null,
      opt_in_alerts: data.optInAlerts ?? true,
      preferred_contact_method: data.preferredContactMethod || 'phone',
      status: 'new',
    };

    const { data: lead, error } = await supabase
      .from('leads' as 'profiles') // Type workaround - 'leads' table exists but types not regenerated
      .insert(insertData as never)
      .select('id')
      .single();

    if (error) {
      console.error('[leadService] Error submitting lead:', error);
      return { success: false, error: error.message };
    }

    console.log('[leadService] Lead submitted successfully:', lead?.id);
    return { success: true, leadId: lead?.id };
  } catch (err) {
    console.error('[leadService] Unexpected error:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

/**
 * Check if we've already captured a lead for this session
 * Uses sessionStorage to prevent duplicate captures
 */
export function hasLeadBeenCaptured(key: string): boolean {
  try {
    return sessionStorage.getItem(`lead_captured_${key}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark that a lead has been captured for this session
 */
export function markLeadCaptured(key: string): void {
  try {
    sessionStorage.setItem(`lead_captured_${key}`, 'true');
  } catch {
    // sessionStorage not available (e.g., private browsing)
  }
}
