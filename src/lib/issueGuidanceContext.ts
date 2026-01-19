/**
 * Helper functions for preparing issue guidance context
 */

import type { ForensicInputs, OpterraMetrics, Recommendation } from './opterraAlgorithm';
import type { InfrastructureIssue } from './infrastructureIssues';
import { DAMAGE_SCENARIOS, getLocationKey } from '@/data/damageScenarios';

export interface IssueGuidanceContext {
  issueId: string;
  issueName: string;
  friendlyName: string;
  recommendation: {
    action: string; // ActionType from algorithm
    reason: string;
  };
  location: string;
  damageScenario: {
    min: number;
    max: number;
    description: string;
  };
  unitAge: number;
  healthScore: number;
  agingRate: number;
  isServiceable: boolean;
  manufacturer?: string;
  stressFactors?: Record<string, number>;
}

/**
 * Prepare context for the issue guidance edge function
 */
export function getIssueGuidanceContext(
  issue: InfrastructureIssue,
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  recommendation: Recommendation,
  healthScore: number
): IssueGuidanceContext {
  const locationKey = getLocationKey(inputs.location);
  const damageScenario = DAMAGE_SCENARIOS[locationKey];
  
  // Determine if fixing makes economic sense
  // Don't recommend fixing if unit should be replaced or health is very low
  const isServiceable = 
    recommendation.action !== 'REPLACE' && 
    healthScore > 30 &&
    inputs.calendarAge < 12;
  
  return {
    issueId: issue.id,
    issueName: issue.name,
    friendlyName: issue.friendlyName,
    recommendation: {
      action: recommendation.action,
      reason: recommendation.reason,
    },
    location: inputs.location,
    damageScenario: {
      min: damageScenario.waterDamage.min,
      max: damageScenario.waterDamage.max,
      description: damageScenario.description,
    },
    unitAge: inputs.calendarAge,
    healthScore,
    agingRate: metrics.agingRate,
    isServiceable,
    manufacturer: inputs.manufacturer,
    stressFactors: metrics.stressFactors,
  };
}

/**
 * Get a static fallback guidance when AI is unavailable
 */
export function getStaticGuidance(
  issue: InfrastructureIssue,
  isServiceable: boolean,
  healthScore: number,
  location: string
): {
  headline: string;
  explanation: string;
  yourSituation: string;
  recommendation: string;
  economicContext: string;
  actionItems: string[];
  shouldFix: boolean;
} {
  const locationKey = getLocationKey(location);
  const damageScenario = DAMAGE_SCENARIOS[locationKey];
  const isHighRisk = ['ATTIC', 'UTILITY_CLOSET', 'LIVING_AREA'].includes(locationKey);

  // Static explanations for common issues
  const explanations: Record<string, string> = {
    'exp_tank_required': 'An expansion tank absorbs pressure spikes that occur every time your water heater heats up. Without one, this pressure stresses your tank and fittings with every heating cycle.',
    'exp_tank_replace': 'Expansion tanks can become waterlogged over time, losing their ability to absorb pressure spikes. When this happens, your system is under the same stress as having no tank at all.',
    'prv_critical': 'A Pressure Reducing Valve (PRV) protects your entire plumbing system from excessive water pressure. At your current pressure levels, your fixtures and appliances are under significant stress.',
    'prv_failed': 'Your existing PRV is no longer regulating pressure properly. This means your system is exposed to the full street pressure, which can damage fixtures and cause leaks.',
    'prv_recommended': 'While your pressure is within safe limits, installing a PRV would reduce wear on your plumbing system and help your water heater last longer.',
    'prv_longevity': 'Proactive pressure management can add years to your water heater\'s lifespan by reducing the daily stress on tank walls and fittings.',
    'softener_service': 'Your water softener isn\'t removing minerals effectively. Hard water passing through to your water heater causes scale buildup that reduces efficiency and shortens lifespan.',
    'softener_replace': 'Your water softener has reached the end of its effective life. Replacing it will protect your new water heater from scale damage.',
    'softener_new': 'Hard water causes mineral scale to build up inside your water heater, reducing efficiency and accelerating wear. A softener prevents this damage.',
  };

  if (isServiceable) {
    return {
      headline: 'Protect Your Investment',
      explanation: explanations[issue.id] || issue.description,
      yourSituation: `Your water heater is in ${healthScore >= 60 ? 'good' : 'fair'} condition and worth protecting. ${isHighRisk ? `Being installed in ${location.toLowerCase().replace('_', ' ')}, a failure here could cause significant damage.` : 'Addressing this issue now prevents bigger problems later.'}`,
      recommendation: `We recommend addressing this issue to protect your current unit. Fixing this now is much easier than dealing with the potential damage from a failure.`,
      economicContext: `${isHighRisk ? 'Your location makes this especially important to address.' : 'Taking care of this now prevents bigger problems later.'}`,
      actionItems: [
        'Have your plumber reach out to discuss this issue',
        'Ask about bundling with annual maintenance',
        'Consider additional protective measures for your location',
      ],
      shouldFix: true,
    };
  } else {
    return {
      headline: 'Plan for Replacement',
      explanation: explanations[issue.id] || issue.description,
      yourSituation: `Given your unit's current condition (health score: ${healthScore}/100), investing in repairs isn't the best use of your money. Your replacement will include proper infrastructure.`,
      recommendation: `Don't spend money fixing this on a unit that needs replacement. Your new water heater installation will include the proper infrastructure to protect your investment from day one.`,
      economicContext: `Your replacement will include ${issue.friendlyName.toLowerCase()} as part of the complete installation package.`,
      actionItems: [
        'Have your plumber reach out to discuss replacement options',
        'Ask about what protections are included in installation',
        'Learn about financing options for a complete system upgrade',
      ],
      shouldFix: false,
    };
  }
}
