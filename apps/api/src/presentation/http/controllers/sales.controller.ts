import { Request, Response } from "express";
import { SalesExportService } from "@application/sales/SalesExportService";
import { SalesService } from "@application/sales/SalesService";
import { salesListQuerySchema } from "../validators/sales.validators";

export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly salesExportService: SalesExportService
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = salesListQuerySchema.parse(req.query);
    res.json(await this.salesService.list(query));
  };

  exportWeeklySheet = async (_req: Request, res: Response): Promise<void> => {
    const { buffer, fileName } = await this.salesExportService.weeklySheet();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    // See pdf.controller.ts#sendPdf for why "attachment" (not "inline") is what keeps the
    // generated filename all the way to disk once the user saves it.
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  };
}
