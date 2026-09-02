import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { ReportPreviewResult } from '@x10think/types';

/**
 * Formula Injection Protection:
 * Neutralize dangerous spreadsheet prefixes (=, +, -, @, \t, \r)
 */
function sanitizeCSVCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();

  // If starts with dangerous character, prepend single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Quote escaping for CSV
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSVReport(data: ReportPreviewResult): string {
  const headers = data.columns.map((c) => sanitizeCSVCell(c.label)).join(',');
  const rows = data.rows.map((row) =>
    data.columns.map((col) => sanitizeCSVCell(row[col.key])).join(','),
  );

  return [headers, ...rows].join('\n');
}

export async function generateXLSXReport(data: ReportPreviewResult): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DineX Restaurant Management System';
  workbook.lastModifiedBy = 'DineX System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(data.title.slice(0, 30));

  // Add Report Header Metadata
  worksheet.addRow(['DineX Restaurant Management System - ' + data.title]);
  worksheet.addRow([
    `Generated: ${new Date(data.generatedAt).toLocaleString()} | Timezone: ${data.timezone}`,
  ]);
  worksheet.addRow([`Date Range: ${data.dateRange.startDate} to ${data.dateRange.endDate}`]);
  worksheet.addRow([]); // empty spacing

  // Add Columns Header
  const colHeaders = data.columns.map((c) => c.label);
  const headerRow = worksheet.addRow(colHeaders);

  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark slate
  };

  // Set column widths
  worksheet.columns = data.columns.map((c) => ({
    key: c.key,
    width: Math.max(c.label.length + 4, 18),
  }));

  // Add Rows
  for (const row of data.rows) {
    const rowValues = data.columns.map((c) => {
      const val = row[c.key];
      if (c.type === 'currency' && typeof val === 'number') {
        return `₹${val.toFixed(2)}`;
      }
      if (typeof val === 'string' && /^[=+\-@\t\r]/.test(val.trim())) {
        return `'${val.trim()}`;
      }
      return val ?? '';
    });
    worksheet.addRow(rowValues);
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export function generatePDFReport(data: ReportPreviewResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // DineX Header
    doc
      .fontSize(20)
      .fillColor('#f59e0b') // Amber
      .text('DineX Restaurant System', { align: 'left' });

    doc.fontSize(14).fillColor('#1e293b').text(data.title, { align: 'left' });

    doc.moveDown(0.5);
    doc
      .fontSize(9)
      .fillColor('#64748b')
      .text(
        `Generated: ${new Date(data.generatedAt).toLocaleString()} | Timezone: ${data.timezone}`,
      );
    doc.text(`Date Range: ${data.dateRange.startDate} to ${data.dateRange.endDate}`);

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#cbd5e1').stroke();
    doc.moveDown(1);

    // Table Columns Header
    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#1e293b');

    let xPos = 40;
    const colWidth = Math.floor(510 / Math.min(data.columns.length, 5));

    data.columns.slice(0, 5).forEach((col) => {
      doc.font('Helvetica-Bold').text(col.label, xPos, tableTop, { width: colWidth - 5 });
      xPos += colWidth;
    });

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#94a3b8').stroke();
    doc.moveDown(0.5);

    // Data Rows
    doc.font('Helvetica').fontSize(9).fillColor('#334155');

    data.rows.slice(0, 30).forEach((row) => {
      let currentX = 40;
      const rowY = doc.y;

      data.columns.slice(0, 5).forEach((col) => {
        let valStr = String(row[col.key] ?? '');
        if (col.type === 'currency' && typeof row[col.key] === 'number') {
          valStr = `Rs.${Number(row[col.key]).toFixed(2)}`;
        }
        doc.text(valStr, currentX, rowY, { width: colWidth - 5 });
        currentX += colWidth;
      });

      doc.moveDown(0.5);
    });

    doc.moveDown(1);
    doc
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(`DineX Confidential Operational Report — Page 1 of 1`, { align: 'center' });

    doc.end();
  });
}
