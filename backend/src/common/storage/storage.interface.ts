export interface FileMetadata {
  mimetype: string;
  size: number;
  originalname: string;
  filename?: string;
  buffer?: Buffer;
}

export interface IStorageProvider {
  uploadFile(file: FileMetadata, directory: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  getFileUrl(path: string): string;
}
