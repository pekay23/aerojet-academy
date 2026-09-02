import PDFDocument from 'pdfkit';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

async function imagesToPdf(imageDir: string, outputPath: string) {
  const files = (await fs.readdir(imageDir))
    .filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'))
    .sort();

  console.log(`Found ${files.length} images`);

  const doc = new PDFDocument({ autoFirstPage: false });
  const writeStream = require('fs').createWriteStream(outputPath);
  doc.pipe(writeStream);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(imageDir, file);

    // Convert to JPEG buffer (handles WebP and other formats)
    const jpegBuffer = await sharp(filePath).jpeg({ quality: 90 }).toBuffer();
    const metadata = await sharp(jpegBuffer).metadata();
    const width = metadata.width || 2121;
    const height = metadata.height || 1500;

    doc.addPage({ size: [width, height] });
    doc.image(jpegBuffer, 0, 0, { width, height });

    if (i % 50 === 0) {
      console.log(`Processing ${i + 1}/${files.length}`);
    }
  }

  doc.end();

  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  console.log(`PDF saved: ${outputPath}`);
}

const imageDir = process.argv[2];
const outputPath = process.argv[3];

if (!imageDir || !outputPath) {
  console.error('Usage: bun run script.ts <image-dir> <output-pdf>');
  process.exit(1);
}

imagesToPdf(imageDir, outputPath).catch(console.error);
