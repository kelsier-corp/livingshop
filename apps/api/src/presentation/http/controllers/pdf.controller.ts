import { Request, Response } from "express";
import { PdfService } from "@application/pdf/PdfService";
import { param } from "../utils/param";

function sendPdf(res: Response, fileName: string, buffer: Buffer): void {
  res.setHeader("Content-Type", "application/pdf");
  // "inline" disposition renders the PDF in the tab, but browsers largely ignore its filename
  // hint once the user actually saves the file from the viewer's own download button — they
  // fall back to the last URL segment (e.g. "sheet.pdf"). "attachment" is the only disposition
  // that reliably keeps our generated filename all the way to disk.
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(buffer);
}

export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  orderSheet = async (req: Request, res: Response): Promise<void> => {
    const { buffer, fileName } = await this.pdfService.orderSheet(param(req, "id"));
    sendPdf(res, fileName, buffer);
  };

  factorySheet = async (req: Request, res: Response): Promise<void> => {
    const { buffer, fileName } = await this.pdfService.factorySheet(param(req, "id"));
    sendPdf(res, fileName, buffer);
  };

  productionSheet = async (_req: Request, res: Response): Promise<void> => {
    const { buffer, fileName } = await this.pdfService.productionSheet();
    sendPdf(res, fileName, buffer);
  };

  salesSheet = async (req: Request, res: Response): Promise<void> => {
    const periodLabel =
      typeof req.query.period === "string" ? req.query.period : "Todos los períodos";
    const { buffer, fileName } = await this.pdfService.salesSheet(periodLabel);
    sendPdf(res, fileName, buffer);
  };
}
