import { useState, useCallback, useMemo } from 'react';
import { CommandCenter } from '@/components/CommandCenter';
import { type ForensicInputs, calculateOpterraRisk } from '@/lib/opterraAlgorithm';
import { generateRandomScenario, type GeneratedScenario } from '@/lib/generateRandomScenario';
import type { AssetData } from '@/data/mockAsset';

const Index = () => {
  // Generate initial random scenario
  const [scenario, setScenario] = useState<GeneratedScenario>(() => generateRandomScenario());
  const [currentInputs, setCurrentInputs] = useState<ForensicInputs>(scenario.inputs);
  
  // Convert scenario to asset display format
  const currentAsset: AssetData = useMemo(() => ({
    id: scenario.serialNumber,
    type: 'Water Heater',
    brand: scenario.brand,
    model: scenario.model,
    serialNumber: scenario.serialNumber,
    installDate: new Date(Date.now() - scenario.inputs.calendarAge * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paperAge: scenario.inputs.calendarAge,
    biologicalAge: scenario.inputs.calendarAge,
    location: scenario.inputs.location,
    specs: {
      capacity: scenario.inputs.tankCapacity > 0 ? `${scenario.inputs.tankCapacity}-Gal` : 'Tankless',
      fuelType: scenario.inputs.fuelType,
      ventType: scenario.inputs.ventType || 'N/A',
      piping: '3/4" Copper',
    },
  }), [scenario]);
  
  // Calculate Opterra result
  const opterraResult = useMemo(() => calculateOpterraRisk(currentInputs), [currentInputs]);
  
  // Randomize handler
  const handleRandomize = useCallback(() => {
    const newScenario = generateRandomScenario();
    setScenario(newScenario);
    setCurrentInputs(newScenario.inputs);
  }, []);
  
  // Derive status
  const isHealthy = opterraResult.verdict.action === 'PASS';
  const isCritical = opterraResult.verdict.badge === 'CRITICAL' || opterraResult.verdict.action === 'REPLACE';
  const whStatus: 'optimal' | 'warning' | 'critical' = 
    isCritical ? 'critical' : isHealthy ? 'optimal' : 'warning';

  return (
    <CommandCenter
      onPanicMode={() => {}}
      onServiceRequest={() => {}}
      onViewReport={() => {}}
      onMaintenancePlan={() => {}}
      currentAsset={currentAsset}
      currentInputs={currentInputs}
      opterraResult={opterraResult}
      onInputsChange={setCurrentInputs}
      onRandomize={handleRandomize}
      scenarioName={scenario.name}
      serviceHistory={[]}
      hasSoftener={currentInputs.hasSoftener}
      waterHeaterStatus={whStatus}
      softenerStatus="optimal"
    />
  );
};

export default Index;
