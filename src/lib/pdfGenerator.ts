import jsPDF from 'jspdf';
import { 
  demoAsset, 
  demoContractor, 
  demoForensicInputs,
  demoAuditFindings 
} from '@/data/mockAsset';
import { calculateOpterraRisk } from '@/lib/opterraAlgorithm';

// Calculate all values dynamically from the algorithm
const opterraResult = calculateOpterraRisk(demoForensicInputs);
const { bioAge, failProb, sedimentLbs } = opterraResult.metrics;

// Derive dynamic vitals and health score
const demoHealthScore = {
  score: Math.round(100 - failProb),
  status: (failProb >= 20 ? 'critical' : failProb >= 10 ? 'warning' : 'optimal') as 'critical' | 'warning' | 'optimal',
  failureProbability: Math.round(failProb * 10) / 10,
  recommendation: opterraResult.verdict.action,
};

const demoVitals = {
  pressure: {
    current: demoForensicInputs.psi,
    limit: 80,
    status: (demoForensicInputs.psi >= 80 ? 'critical' : demoForensicInputs.psi >= 70 ? 'warning' : 'optimal') as 'critical' | 'warning' | 'optimal',
  },
  sedimentLoad: {
    pounds: sedimentLbs,
    gasLossEstimate: Math.round(sedimentLbs * 4.5),
    status: (sedimentLbs >= 15 ? 'critical' : sedimentLbs >= 10 ? 'warning' : 'optimal') as 'critical' | 'warning' | 'optimal',
  },
  liabilityStatus: {
    insured: false,
    location: demoAsset.location,
    status: (demoAsset.location === 'Attic' || demoAsset.location === 'Utility Closet' ? 'critical' : 'warning') as 'critical' | 'warning' | 'optimal',
  },
  biologicalAge: {
    real: Math.round(bioAge * 10) / 10,
    paper: demoForensicInputs.calendarAge,
    status: (bioAge >= 12 ? 'critical' : bioAge >= 8 ? 'warning' : 'optimal') as 'critical' | 'warning' | 'optimal',
  },
};

export function generatePDF() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Helper function for centered text
  const centerText = (text: string, y: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Helper for line spacing
  const addLine = (height: number = 7) => {
    yPosition += height;
  };

  // Header
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  centerText('OPTERRA HOME ASSET VAULT', 15, 18);
  
  doc.setFont('helvetica', 'normal');
  centerText('Official Health Certificate', 25, 12);
  centerText(`Authorized by: ${demoContractor.name}`, 35, 10);

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPosition = 55;

  // Asset Information Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ASSET INFORMATION', 20, yPosition);
  addLine(10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const assetInfo = [
    ['Asset ID:', demoAsset.id],
    ['Type:', `${demoAsset.brand} ${demoAsset.type}`],
    ['Model:', demoAsset.model],
    ['Serial Number:', demoAsset.serialNumber],
    ['Install Date:', demoAsset.installDate],
    ['Location:', demoAsset.location],
    ['Capacity:', demoAsset.specs.capacity],
    ['Fuel Type:', demoAsset.specs.fuelType],
  ];

  assetInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, yPosition);
    addLine(6);
  });

  addLine(5);

  // Health Score Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('HEALTH ASSESSMENT', 20, yPosition);
  addLine(10);

  // Health Score Box
  const scoreColor = demoHealthScore.status === 'critical' ? [239, 68, 68] : 
                     demoHealthScore.status === 'warning' ? [245, 158, 11] : 
                     [16, 185, 129];
  
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(20, yPosition, 50, 30, 3, 3, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(`${demoHealthScore.score}`, 35, yPosition + 15);
  doc.setFontSize(10);
  doc.text('/100', 48, yPosition + 15);
  doc.setFontSize(8);
  doc.text('HEALTH SCORE', 27, yPosition + 25);

  // Status details
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Status: ${demoHealthScore.status.toUpperCase()}`, 80, yPosition + 10);
  doc.text(`Failure Probability: ${demoHealthScore.failureProbability}%`, 80, yPosition + 18);
  doc.text(`Recommendation: ${demoHealthScore.recommendation}`, 80, yPosition + 26);

  yPosition += 40;

  // Vitals Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DIAGNOSTIC VITALS', 20, yPosition);
  addLine(10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const vitals = [
    ['Static Pressure:', `${demoVitals.pressure.current} PSI`, `Limit: ${demoVitals.pressure.limit} PSI`, demoVitals.pressure.status],
    ['Biological Age:', `${demoVitals.biologicalAge.real} Years`, `Paper Age: ${demoVitals.biologicalAge.paper} Years`, demoVitals.biologicalAge.status],
    ['Sediment Load:', `${demoVitals.sedimentLoad.pounds} LBS`, `Est. Gas Loss: $${demoVitals.sedimentLoad.gasLossEstimate}/yr`, demoVitals.sedimentLoad.status],
    ['Liability Status:', demoVitals.liabilityStatus.insured ? 'INSURED' : 'UNINSURED', `Location: ${demoVitals.liabilityStatus.location}`, demoVitals.liabilityStatus.status],
  ];

  vitals.forEach(([label, value, note, status]) => {
    const statusColor = status === 'critical' ? [239, 68, 68] : 
                        status === 'warning' ? [245, 158, 11] : 
                        [16, 185, 129];
    
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.circle(23, yPosition - 2, 2, 'F');
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(label, 28, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 80, yPosition);
    doc.setTextColor(128, 128, 128);
    doc.text(note, 130, yPosition);
    doc.setTextColor(0, 0, 0);
    addLine(8);
  });

  addLine(5);

  // Audit Findings Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AUDIT FINDINGS', 20, yPosition);
  addLine(10);

  demoAuditFindings.forEach((finding) => {
    const statusIcon = finding.passed ? '✓' : '✗';
    const statusColor = finding.passed ? [16, 185, 129] : [239, 68, 68];
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(statusIcon, 20, yPosition);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${finding.name}: ${finding.value}`, 28, yPosition);
    addLine(5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    // Word wrap for details
    const splitDetails = doc.splitTextToSize(finding.details, pageWidth - 50);
    splitDetails.forEach((line: string) => {
      doc.text(line, 28, yPosition);
      addLine(4);
    });
    
    addLine(3);
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, footerY - 5, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  centerText(`Generated on ${new Date().toLocaleDateString()} | ${demoContractor.name}`, footerY + 5, 8);
  centerText('This document is for informational purposes and does not constitute a warranty.', footerY + 12, 7);

  // Save the PDF
  doc.save(`Opterra-Health-Report-${demoAsset.id}.pdf`);
}
