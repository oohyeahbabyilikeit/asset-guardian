import { describe, it, expect } from 'vitest';
import { validateScenario, ALL_VALIDATED_SCENARIOS } from './scenarioValidation';

describe('Algorithm Scenario Validation (v9.1.2)', () => {
  for (const scenario of ALL_VALIDATED_SCENARIOS) {
    it(`[${scenario.source}] ${scenario.name} → expects ${scenario.expected.action}`, () => {
      const result = validateScenario(scenario);
      if (!result.passed) {
        console.log(`  Expected: ${result.expected.action}${result.expected.actionAlternatives ? ` or ${result.expected.actionAlternatives.join('/')}` : ''}`);
        console.log(`  Actual:   ${result.actual.action} - "${result.actual.title}"`);
        console.log(`  Badge:    ${result.actual.badge}`);
        console.log(`  Metrics:  bioAge=${result.metrics.bioAge.toFixed(1)}, failProb=${result.metrics.failProb.toFixed(1)}%, health=${result.metrics.healthScore}`);
      }
      expect(result.passed, result.discrepancy ?? '').toBe(true);
    });
  }
});
