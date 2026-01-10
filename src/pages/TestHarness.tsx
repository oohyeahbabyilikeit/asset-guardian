import { useNavigate } from 'react-router-dom';
import { AlgorithmTestHarness } from '@/components/AlgorithmTestHarness';

export default function TestHarness() {
  const navigate = useNavigate();
  
  return <AlgorithmTestHarness onBack={() => navigate('/')} />;
}
