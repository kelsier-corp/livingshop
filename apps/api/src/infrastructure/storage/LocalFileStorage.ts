import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { FileStorage, StoredFile } from "@domain/repositories/FileStorage";

export class LocalFileStorage implements FileStorage {
  constructor(private readonly uploadsDir: string, private readonly publicPath = "/uploads") {}

  async save(originalName: string, buffer: Buffer, _mimeType: string): Promise<StoredFile> {
    await fs.mkdir(this.uploadsDir, { recursive: true });
    const extension = path.extname(originalName);
    const fileName = `${randomUUID()}${extension}`;
    await fs.writeFile(path.join(this.uploadsDir, fileName), buffer);
    return { url: `${this.publicPath}/${fileName}`, fileName: originalName };
  }

  async delete(url: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, path.basename(url));
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}
