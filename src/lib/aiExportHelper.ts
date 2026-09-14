import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import { ChurchConfig } from '../types';

export const exportAIToPdf = async (
  elementId: string,
  docTitle: string,
  config: ChurchConfig
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const dataUrl = await toJpeg(element, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    const pageHeight = pdf.internal.pageSize.getHeight();

    let heightLeft = pdfHeight;
    let position = 0;

    // Add first page
    pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    // Multi-page support if content is long
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    const cleanTitle = docTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    pdf.save(`${cleanTitle}_${dateStr}.pdf`);
  } catch (error) {
    console.error('Error generating PDF from AI output:', error);
    // Fallback: Direct text-based PDF creation
    try {
      const textContent = element.innerText || '';
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text(config.name || 'Iglesia Central', 14, 20);
      pdf.setFontSize(12);
      pdf.text(docTitle, 14, 28);
      pdf.setFontSize(9);
      pdf.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 34);
      pdf.line(14, 38, 196, 38);
      pdf.setFontSize(10);
      const splitText = pdf.splitTextToSize(textContent, 180);
      pdf.text(splitText, 14, 46);
      pdf.save(`${docTitle.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('Fallback PDF also failed:', e);
    }
  }
};

export const exportAIToJpg = async (
  elementId: string,
  docTitle: string
) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const dataUrl = await toJpeg(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    const cleanTitle = docTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `${cleanTitle}_${dateStr}.jpg`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error generating JPG from AI output:', error);
  }
};
