import * as fs from 'fs/promises';
import * as path from 'path';
import { jsPDF } from 'jspdf';
import { FlipbookConfig } from './config';

export class PDFConverter {
  constructor(private config: FlipbookConfig) {}

  async imagesToPdf(imagePaths: string[], outputPath: string): Promise<void> {
    if (imagePaths.length === 0) {
      throw new Error('No images to convert');
    }

    const firstImage = imagePaths[0];
    const imageData = await this.getImageDimensions(firstImage);

    let pdf: jsPDF;

    if (this.config.pdfOptions.pageSize === 'fit') {
      pdf = new jsPDF({
        orientation: imageData.width > imageData.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imageData.width, imageData.height],
      });
    } else {
      pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: this.config.pdfOptions.pageSize,
      });
    }

    for (let i = 0; i < imagePaths.length; i++) {
      const imgPath = imagePaths[i];
      const base64 = await this.imageToBase64(imgPath);

      if (i > 0) {
        if (this.config.pdfOptions.pageSize === 'fit') {
          const dims = await this.getImageDimensions(imgPath);
          pdf.addPage([dims.width, dims.height]);
        } else {
          pdf.addPage();
        }
      }

      if (this.config.pdfOptions.pageSize === 'fit') {
        const dims = await this.getImageDimensions(imgPath);
        pdf.addImage(base64, 'JPEG', 0, 0, dims.width, dims.height);
      } else {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = this.config.pdfOptions.margin;
        pdf.addImage(base64, 'JPEG', margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
      }
    }

    const pdfBuffer = pdf.output('arraybuffer');
    await fs.writeFile(outputPath, Buffer.from(pdfBuffer));
  }

  private async getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    const sharp = await import('sharp');
    const metadata = await sharp.default(imagePath).metadata();
    return {
      width: metadata.width || 1920,
      height: metadata.height || 1080,
    };
  }

  private async imageToBase64(imagePath: string): Promise<string> {
    const buffer = await fs.readFile(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
}
