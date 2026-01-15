import { useState, useCallback, useMemo } from 'react';
import { CommandCenter } from '@/components/CommandCenter';
import { ModeSelectScreen } from '@/components/ModeSelectScreen';
import { TechnicianFlow } from '@/components/TechnicianFlow';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { ForensicReport } from '@/components/ForensicReport';
import { ReplacementOptionsPage } from '@/components/ReplacementOptionsPage';
import { PanicMode } from '@/components/PanicMode';
import { MaintenancePlan } from '@/components/MaintenancePlan';
import { type ForensicInputs, calculateOpterraRisk, type OpterraResult } from '@/lib/opterraAlgorithm';
import { generateRandomScenario, type GeneratedScenario } from '@/lib/generateRandomScenario';
import { type TechnicianInspectionData, DEFAULT_TECHNICIAN_DATA } from '@/types/technicianInspection';
import { mapTechnicianToForensicInputs, mapTechnicianToAssetDisplay } from '@/types/technicianMapper';
import { type OnboardingData, DEFAULT_ONBOARDING_DATA, mapOnboardingToForensicInputs } from '@/types/onboarding';
import type { AssetData } from '@/data/mockAsset';
import { getInfrastructureIssues } from '@/lib/infrastructureIssues';

type AppScreen = 
  | 'mode-select'
  | 'technician-flow'
  | 'onboarding'
  | 'command-center'
  | 'forensic-report'
  | 'replacement-options'
  | 'panic-mode'
  | 'maintenance-plan';

interface AppState {
  screen: AppScreen;
  mode: 'technician' | 'demo' | null;
  technicianData: TechnicianInspectionData | null;
  onboardingData: OnboardingData | null;
  demoScenario: GeneratedScenario | null;
}

const Index = () => {
  const [state, setState] = useState<AppState>({
    screen: 'mode-select',
    mode: null,
    technicianData: null,
    onboardingData: null,
    demoScenario: null,
  });

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

  // Handle navigation to replacement options ("See My Options" CTA)
  const handleServiceRequest = useCallback(() => {
    setState(prev => ({
      ...prev,
      screen: 'replacement-options',
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
          onServiceRequest={handleServiceRequest}
          onViewReport={handleViewReport}
          onMaintenancePlan={handleMaintenancePlan}
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

    case 'forensic-report':
      return (
        <ForensicReport
          asset={currentAsset}
          inputs={currentInputs}
          onBack={handleReportBack}
        />
      );

    case 'replacement-options':
      return (
        <ReplacementOptionsPage
          onBack={handleBackToCommandCenter}
          onSchedule={handleBackToCommandCenter}
          currentInputs={currentInputs}
          infrastructureIssues={getInfrastructureIssues(currentInputs, opterraResult.metrics)}
          isSafetyReplacement={isCritical}
          agingRate={opterraResult.metrics.agingRate}
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
