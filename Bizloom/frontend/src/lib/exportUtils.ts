import { toast } from 'react-hot-toast';

export const exportToCSV = (headers: string[], rows: any[][], filename: string) => {
  try {
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully');
  } catch (error) {
    console.error('CSV Export Error:', error);
    toast.error('Failed to export CSV');
  }
};

export const exportToPDF = async (title: string, headers: string[], rows: any[][], filename: string) => {
  const loading = toast.loading('Generating PDF...');
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    
    // Meta info
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
    doc.setTextColor(0);
    
    let y = 30;
    const colWidth = 180 / headers.length;
    
    // Headers background and text
    doc.setFillColor(79, 70, 229); // Indigo bg
    doc.rect(14, y - 4, 182, 6, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(255);
    
    headers.forEach((header, index) => {
      doc.text(header, 16 + (index * colWidth), y);
    });
    
    y += 7;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(0);
    
    // Rows
    rows.forEach((row, rowIdx) => {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      
      // Alternating background colors
      if (rowIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 4, 182, 6, 'F');
      }
      
      row.forEach((cell, cellIdx) => {
        doc.text(String(cell ?? '').substring(0, 18), 16 + (cellIdx * colWidth), y);
      });
      y += 6;
    });
    
    doc.save(filename);
    toast.success('PDF exported successfully', { id: loading });
  } catch (error) {
    console.error('PDF Export Error:', error);
    toast.error('Failed to export PDF', { id: loading });
  }
};
