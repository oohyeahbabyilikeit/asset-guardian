import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CommandCenter } from '@/components/CommandCenter';
import { ModeSelectScreen } from '@/components/ModeSelectScreen';
import { TechnicianFlow } from '@/components/TechnicianFlow';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { AlgorithmTestHarness } from '@/components/AlgorithmTestHarness';
import { ForensicReport } from '@/components/ForensicReport';
import { ReplacementOptionsPage } from '@/components/ReplacementOptionsPage';
import { PanicMode } from '@/components/PanicMode';
import { MaintenancePlan } from '@/components/MaintenancePlan';
import { FindingsSummaryPage } from '@/components/FindingsSummaryPage';
import { PriceAnalysisLoader } from '@/components/PriceAnalysisLoader';
import { type ForensicInputs, calculateOpterraRisk, type OpterraResult } from '@/lib/opterraAlgorithm';
import { generateRandomScenario, type GeneratedScenario } from '@/lib/generateRandomScenario';
import { type TechnicianInspectionData, DEFAULT_TECHNICIAN_DATA } from '@/types/technicianInspection';
import { mapTechnicianToForensicInputs, mapTechnicianToAssetDisplay } from '@/types/technicianMapper';
import { type OnboardingData, DEFAULT_ONBOARDING_DATA, mapOnboardingToForensicInputs } from '@/types/onboarding';
import type { AssetData } from '@/data/mockAsset';
import { getInfrastructureIssues } from '@/lib/infrastructureIssues';
import type { TierPricing } from '@/hooks/useTieredPricing';
import type { QualityTier } from '@/lib/opterraAlgorithm';
import { usePrefetchFindings } from '@/hooks/useGeneratedFindings';
import { usePrefetchRationale } from '@/hooks/useReplacementRationale';
type AppScreen = 
  | 'mode-select'
  | 'technician-flow'
  | 'onboarding'
  | 'command-center'
  | 'test-harness'
  | 'forensic-report'
  | 'findings-summary'
  | 'analyzing-options'
  | 'replacement-options'
  | 'panic-mode'
  | 'maintenance-plan';

interface AppState {
  screen: AppScreen;
  mode: 'technician' | 'demo' | null;
  technicianData: TechnicianInspectionData | null;
  onboardingData: OnboardingData | null;
  demoScenario: GeneratedScenario | null;
  prefetchedTiers?: Record<QualityTier, TierPricing>;
  showQuoteLoader?: boolean;
}

const Index = () => {
  const [state, setState] = useState<AppState>({
    screen: 'mode-select',
    mode: null,
    technicianData: null,
    onboardingData: null,
    demoScenario: null,
  });
  
  const { prefetch: prefetchFindings } = usePrefetchFindings();
  const { prefetch: prefetchRationale } = usePrefetchRationale();
  const prefetchTriggeredRef = useRef(false);

  // Handle mode selection
  const handleModeSelect = useCallback((mode: 'technician' | 'demo') => {
    if (mode === 'technician') {
      setState(prev => ({
        ...prev,
        mode: 'technician',
        screen: 'technician-flow',
        technicianData: null,
        onboardingData: null,
        demoScenario: null,
      }));
    } else {
      // Demo mode: generate random scenario and go to onboarding
      const scenario = generateRandomScenario();
      setState(prev => ({
        ...prev,
        mode: 'demo',
        screen: 'onboarding',
        demoScenario: scenario,
        technicianData: null,
        onboardingData: null,
      }));
    }
  }, []);

  // Handle technician flow completion
  const handleTechnicianComplete = useCallback((data: TechnicianInspectionData) => {
    // DEBUG: Log the complete technician data at handoff
    console.log('[Index] handleTechnicianComplete called with data:', data);
    console.log('[Index] Brand:', data.asset.brand);
    console.log('[Index] Age:', data.calendarAge);
    console.log('[Index] Capacity:', data.asset.tankCapacity);
    console.log('[Index] PSI:', data.measurements.housePsi);
    
    setState(prev => ({
      ...prev,
      technicianData: data,
      screen: 'onboarding',
    }));
  }, []);

  // Handle technician flow back
  const handleTechnicianBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'mode-select',
      mode: null,
      technicianData: null,
    }));
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    setState(prev => ({
      ...prev,
      onboardingData: data,
      screen: 'command-center',
    }));
  }, []);

  // Handle view report
  const handleViewReport = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'forensic-report',
    }));
  }, []);

  // Handle back from report
  const handleReportBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'command-center',
    }));
  }, []);

  // Handle start new assessment
  const handleStartNew = useCallback(() => {
    setState({
      screen: 'mode-select',
      mode: null,
      technicianData: null,
      onboardingData: null,
      demoScenario: null,
    });
  }, []);

  // Handle quick random scenario - skips onboarding, goes straight to command center
  const handleQuickRandom = useCallback(() => {
    const scenario = generateRandomScenario();
    setState({
      screen: 'command-center',
      mode: 'demo',
      demoScenario: scenario,
      technicianData: null,
      onboardingData: DEFAULT_ONBOARDING_DATA,
    });
  }, []);

  // Handle navigation to findings summary (education-first approach)
  const handleViewFindings = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'findings-summary',
    }));
  }, []);

  // Handle navigation to replacement options with loader overlay
  const handleServiceRequest = useCallback(() => {
    console.log('[nav] handleServiceRequest -> replacement-options with loader');
    setState(prev => ({
      ...prev,
      screen: 'replacement-options',
      prefetchedTiers: undefined,
      showQuoteLoader: true,
    }));
  }, []);

  // Handle loader complete - clear the loader flag
  const handleLoaderComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      showQuoteLoader: false,
    }));
  }, []);

  // Handle navigation to panic mode ("Emergency" CTA)
  const handlePanicMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'panic-mode',
    }));
  }, []);

  // Handle navigation to maintenance plan ("See Maintenance Plan" CTA)
  const handleMaintenancePlan = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'maintenance-plan',
    }));
  }, []);

  // Handle back from any sub-screen to command center
  const handleBackToCommandCenter = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'command-center',
    }));
  }, []);

  // Open the algorithm test harness from the dashboard
  const handleOpenTestHarness = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'test-harness',
    }));
  }, []);
  const { currentInputs, currentAsset, opterraResult } = useMemo(() => {
    let inputs: ForensicInputs;
    let asset: AssetData;

    // DEBUG: Log data flow to trace technician data
    console.log('[Index] Computing inputs - Mode:', state.mode);
    console.log('[Index] technicianData:', state.technicianData);
    console.log('[Index] onboardingData:', state.onboardingData);

    if (state.mode === 'technician' && state.technicianData) {
      // Technician mode: ALWAYS use technician data first (priority)
      const baseInputs = mapTechnicianToForensicInputs(state.technicianData);
      
      if (state.onboardingData) {
        inputs = mapOnboardingToForensicInputs(state.onboardingData, baseInputs);
      } else {
        inputs = baseInputs;
      }

      // Map technician display data and extend with required AssetData fields
      const displayData = mapTechnicianToAssetDisplay(state.technicianData);
      const installDate = displayData.installYear 
        ? `${displayData.installYear}-01-01` 
        : new Date(Date.now() - displayData.calendarAge * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      asset = {
        id: displayData.id,
        type: displayData.type,
        brand: displayData.brand,
        model: displayData.model,
        serialNumber: displayData.serialNumber,
        installDate,
        paperAge: displayData.calendarAge,
        biologicalAge: displayData.biologicalAge ?? displayData.calendarAge,
        location: displayData.location,
        specs: displayData.specs,
      };

      console.log('[Index] Mapped technician inputs:', inputs);
      console.log('[Index] Mapped technician asset:', asset);
    } else if (state.mode === 'demo' && state.demoScenario) {
      // Demo mode: use random scenario as base, merge with onboarding
      const baseInputs = state.demoScenario.inputs;
      
      if (state.onboardingData) {
        inputs = mapOnboardingToForensicInputs(state.onboardingData, baseInputs);
      } else {
        inputs = baseInputs;
      }

      // Create asset from demo scenario
      const installDate = new Date(Date.now() - inputs.calendarAge * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      asset = {
        id: state.demoScenario.serialNumber,
        type: 'Water Heater',
        brand: state.demoScenario.brand,
        model: state.demoScenario.model,
        serialNumber: state.demoScenario.serialNumber,
        installDate,
        paperAge: inputs.calendarAge,
        biologicalAge: inputs.calendarAge,
        location: inputs.location,
        specs: {
          capacity: inputs.tankCapacity > 0 ? `${inputs.tankCapacity}-Gal` : 'Tankless',
          fuelType: inputs.fuelType,
          ventType: inputs.ventType || 'N/A',
          piping: '3/4" Copper',
        },
      };
    } else {
      // Fallback: generate random for initial render safety
      // This should NOT happen if data flow is correct
      console.warn('[Index] FALLBACK TO RANDOM - This indicates data loss!');
      console.warn('[Index] state.mode:', state.mode);
      console.warn('[Index] state.technicianData:', state.technicianData);
      
      const fallback = generateRandomScenario();
      inputs = fallback.inputs;
      const installDate = new Date(Date.now() - inputs.calendarAge * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      asset = {
        id: fallback.serialNumber,
        type: 'Water Heater',
        brand: fallback.brand,
        model: fallback.model,
        serialNumber: fallback.serialNumber,
        installDate,
        paperAge: inputs.calendarAge,
        biologicalAge: inputs.calendarAge,
        location: inputs.location,
        specs: {
          capacity: inputs.tankCapacity > 0 ? `${inputs.tankCapacity}-Gal` : 'Tankless',
          fuelType: inputs.fuelType,
          ventType: inputs.ventType || 'N/A',
          piping: '3/4" Copper',
        },
      };
    }

    // Calculate algorithm result once
    const result = calculateOpterraRisk(inputs);

    return { currentInputs: inputs, currentAsset: asset, opterraResult: result };
  }, [state.mode, state.demoScenario, state.technicianData, state.onboardingData]);

  // Prefetch AI-generated findings and rationale when entering command-center
  useEffect(() => {
    if (state.screen === 'command-center' && !prefetchTriggeredRef.current) {
      prefetchTriggeredRef.current = true;
      
      // Determine recommendation type for prefetch
      const urgency = opterraResult.financial.budgetUrgency;
      const verdict = opterraResult.verdict;
      let recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR' = 'MONITOR';
      
      if (verdict.action === 'REPLACE' || urgency === 'IMMEDIATE') {
        recommendationType = 'REPLACE_NOW';
      } else if (urgency === 'HIGH' || opterraResult.metrics.bioAge >= 10) {
        recommendationType = 'REPLACE_SOON';
      } else if (verdict.action === 'REPAIR' || verdict.action === 'MAINTAIN') {
        recommendationType = 'MAINTAIN';
      }
      
      console.log('[Index] Prefetching AI findings in background...');
      prefetchFindings(currentInputs, opterraResult, recommendationType);
      
      // Also prefetch replacement rationale if replacement is recommended
      if (recommendationType === 'REPLACE_NOW' || recommendationType === 'REPLACE_SOON') {
        console.log('[Index] Prefetching replacement rationale in background...');
        prefetchRationale(currentInputs, opterraResult, recommendationType);
      }
    }
  }, [state.screen, currentInputs, opterraResult, prefetchFindings, prefetchRationale]);

  // Derive status for CommandCenter
  const isHealthy = opterraResult.verdict.action === 'PASS';
  const isCritical = opterraResult.verdict.badge === 'CRITICAL' || opterraResult.verdict.action === 'REPLACE';
  const whStatus: 'optimal' | 'warning' | 'critical' = 
    isCritical ? 'critical' : isHealthy ? 'optimal' : 'warning';

  // Determine if softener is present
  const hasSoftener = state.technicianData?.softener?.hasSoftener ?? 
                      state.demoScenario?.inputs.hasSoftener ?? 
                      false;

  // Get street hardness for technician flow (from root technicianData, not measurements)
  const streetHardness = state.technicianData?.streetHardnessGPG ?? undefined;

  // Render based on current screen
  switch (state.screen) {
    case 'mode-select':
      return <ModeSelectScreen onSelectMode={handleModeSelect} onQuickRandom={handleQuickRandom} />;

    case 'technician-flow':
      return (
        <TechnicianFlow
          onComplete={handleTechnicianComplete}
          onBack={handleTechnicianBack}
          initialStreetHardness={streetHardness}
        />
      );

    case 'onboarding':
      return (
        <OnboardingFlow
          initialData={state.onboardingData ?? DEFAULT_ONBOARDING_DATA}
          hasSoftener={hasSoftener}
          onComplete={handleOnboardingComplete}
        />
      );

    case 'command-center':
      return (
        <CommandCenter
          onPanicMode={handlePanicMode}
          onServiceRequest={handleViewFindings}
          onViewReport={handleViewReport}
          onMaintenancePlan={handleViewFindings}
          onTestHarness={handleOpenTestHarness}
          currentAsset={currentAsset}
          currentInputs={currentInputs}
          opterraResult={opterraResult}
          onInputsChange={() => {}}
          onRandomize={handleStartNew}
          scenarioName={state.mode === 'demo' ? state.demoScenario?.name : 'Technician Assessment'}
          serviceHistory={[]}
          hasSoftener={hasSoftener}
          waterHeaterStatus={whStatus}
          softenerStatus="optimal"
        />
      );

    case 'test-harness':
      return <AlgorithmTestHarness onBack={handleBackToCommandCenter} />;

    case 'findings-summary':
      return (
        <FindingsSummaryPage
          currentInputs={currentInputs}
          opterraResult={opterraResult}
          infrastructureIssues={getInfrastructureIssues(currentInputs, opterraResult.metrics)}
          onMaintenance={handleMaintenancePlan}
          onOptions={handleServiceRequest}
          onEmergency={handlePanicMode}
          onBack={handleBackToCommandCenter}
        />
      );

    case 'forensic-report':
      return (
        <ForensicReport
          asset={currentAsset}
          inputs={currentInputs}
          onBack={handleReportBack}
        />
      );

    case 'analyzing-options':
      // Redirect old path to replacement-options with loader
      setState(prev => ({ ...prev, screen: 'replacement-options', showQuoteLoader: true }));
      return null;

    case 'replacement-options':
      return (
        <ReplacementOptionsPage
          onBack={handleBackToCommandCenter}
          onSchedule={handleBackToCommandCenter}
          currentInputs={currentInputs}
          infrastructureIssues={getInfrastructureIssues(currentInputs, opterraResult.metrics)}
          isSafetyReplacement={isCritical}
          agingRate={opterraResult.metrics.agingRate}
          prefetchedTiers={state.prefetchedTiers}
          showFakeLoader={state.showQuoteLoader}
          onFakeLoaderDone={handleLoaderComplete}
        />
      );

    case 'panic-mode':
      return (
        <PanicMode onBack={handleBackToCommandCenter} />
      );

    case 'maintenance-plan':
      return (
        <div className="min-h-screen bg-background p-4">
          <MaintenancePlan
            onBack={handleBackToCommandCenter}
            onScheduleService={handleServiceRequest}
            currentInputs={currentInputs}
            serviceHistory={[]}
          />
        </div>
      );

    default:
      return <ModeSelectScreen onSelectMode={handleModeSelect} />;
  }
};

export default Index;
