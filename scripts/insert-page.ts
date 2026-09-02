import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import path from 'path';

async function insertPage() {
  const existingPdfPath = 'C:/Users/Pekay/OneDrive - Ghana Communication Technology University/AerojetAviation/Module 9 - Human Factors/suntech/EASA-Module-9a-Human-Factors-Complete.pdf';
  const newPageImagePath = 'flipbook-output/EASA-Module-9a-Human-Factors-Complete/page_0302.jpeg';
  const outputPdfPath = 'C:/Users/Pekay/OneDrive - Ghana Communication Technology University/AerojetAviation/Module 9 - Human Factors/suntech/EASA-Module-9a-Human-Factors-Complete.pdf';

  console.log('Loading existing PDF...');
  const existingPdfBytes = await fs.readFile(existingPdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pageCount = pdfDoc.getPageCount();
  console.log(`Loaded PDF with ${pageCount} pages`);

  // Check if we need to insert at position 233 (0-indexed) to make it page 234
  // The existing PDF has 301 pages (missing page 234)
  // We need to insert the new page at index 233 (between page 233 and 235)

  console.log('Loading new page image...');
  const imageBytes = await fs.readFile(newPageImagePath);
  const image = await pdfDoc.embedJpg(imageBytes);
  const { width, height } = image.scale(1);

  console.log(`Inserting new page at position 234 (${width}x${height})...`);
  const newPage = pdfDoc.insertPage(233, [width, height]);
  newPage.drawImage(image, {
    x: 0,
    y: 0,
    width,
    height,
  });

  console.log(`New page count: ${pdfDoc.getPageCount()}`);

  console.log('Saving updated PDF...');
  const updatedPdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPdfPath, updatedPdfBytes);

  console.log(`Saved updated PDF (${updatedPdfBytes.length} bytes)`);
}

insertPage().catch(console.error);
