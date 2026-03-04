import { ExtractionResult } from '../types/invoice';

/**
 * Extract invoice data from XML/PDF files.
 * Currently performs basic client-side XML parsing with mock fallback.
 */
export const extractInvoiceData = async (
  xmlFile: File | null, 
  pdfFile: File | null
): Promise<ExtractionResult> => {
  
  console.log("🚀 Extracción de datos (mock)...");

  if (!xmlFile && !pdfFile) {
    throw new Error("No se proporcionaron archivos para extracción.");
  }
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  // If XML is provided, try to extract basic data from it
  if (xmlFile) {
    try {
      const xmlContent = await xmlFile.text();
      
      // Basic XML extraction (same as real implementation would start with)
      const uuidMatch = xmlContent.match(/UUID\s*=\s*["']([A-Fa-f0-9-]{36})["']/i);
      const rfcEmisorMatch = xmlContent.match(/Emisor[^>]*Rfc\s*=\s*["']([^"']+)["']/i);
      const nombreEmisorMatch = xmlContent.match(/Emisor[^>]*Nombre\s*=\s*["']([^"']+)["']/i);
      const totalMatch = xmlContent.match(/Total\s*=\s*["']([0-9.]+)["']/i);
      const subtotalMatch = xmlContent.match(/SubTotal\s*=\s*["']([0-9.]+)["']/i);
      const fechaMatch = xmlContent.match(/Fecha\s*=\s*["']([^"']+)["']/i);
      const monedaMatch = xmlContent.match(/Moneda\s*=\s*["']([^"']+)["']/i);
      const folioMatch = xmlContent.match(/Folio\s*=\s*["']([^"']+)["']/i);

      if (uuidMatch || rfcEmisorMatch) {
        return {
          uuid: uuidMatch?.[1]?.toUpperCase() || '',
          issuerRfc: rfcEmisorMatch?.[1]?.toUpperCase() || '',
          issuerName: nombreEmisorMatch?.[1] || '',
          totalAmount: totalMatch ? parseFloat(totalMatch[1]) : 0,
          subtotal: subtotalMatch ? parseFloat(subtotalMatch[1]) : 0,
          currency: monedaMatch?.[1] || 'MXN',
          invoiceDate: fechaMatch?.[1]?.split('T')[0] || '',
          folio: folioMatch?.[1] || '',
          // Fields that would come from deeper parsing
          receiverRfc: '',
          receiverName: '',
          issuerRegime: '',
          issuerZipCode: '',
          receiverRegime: '',
          receiverZipCode: '',
          cfdiUse: '',
          paymentMethod: undefined,
          paymentForm: '',
          totalTax: 0,
          items: [],
        } as ExtractionResult;
      }
    } catch (err) {
      console.error("Error parsing XML:", err);
    }
  }
  
  // Return mock data if no XML or extraction failed
  return {
    uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    folio: '1042',
    series: 'A',
    issuerRfc: 'GASA850101AAA',
    issuerName: 'Transportes García SA de CV',
    issuerRegime: '601',
    issuerZipCode: '03100',
    receiverRfc: 'XAXX010101000',
    receiverName: 'Empresa Receptora SA de CV',
    receiverRegime: '601',
    receiverZipCode: '06600',
    cfdiUse: 'G03',
    invoiceDate: '2026-02-20',
    certificationDate: '2026-02-20T10:30:45',
    paymentMethod: 'PUE',
    paymentForm: '03',
    subtotal: 39379.31,
    totalTax: 6300.69,
    totalAmount: 45680.00,
    currency: 'MXN',
    items: [
      {
        description: 'Servicio de transporte de carga — Ruta CDMX-Puebla',
        quantity: 1,
        unitPrice: 25000.00,
        amount: 25000.00,
        unit: 'E48',
        productKey: '78101500',
      },
      {
        description: 'Servicio de última milla — 15 entregas zona sur',
        quantity: 15,
        unitPrice: 958.62,
        amount: 14379.31,
        unit: 'E48',
        productKey: '78101500',
      },
    ],
  } as ExtractionResult;
};
