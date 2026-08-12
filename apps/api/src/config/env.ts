import path from "path";
import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  uploadsDir: path.resolve(process.env.UPLOADS_DIR ?? "./uploads"),
};
