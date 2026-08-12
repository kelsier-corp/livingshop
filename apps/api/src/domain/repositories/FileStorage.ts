export interface StoredFile {
  url: string;
  fileName: string;
}

export interface FileStorage {
  save(originalName: string, buffer: Buffer, mimeType: string): Promise<StoredFile>;
  delete(url: string): Promise<void>;
}
