import crypto from 'crypto';
import path from 'path';

export class StorageProvider {
  /**
   * Mock implementation for file upload.
   */
  static async uploadFile(fileBuffer: Buffer, originalname: string, mimetype: string): Promise<string> {
    const extension = path.extname(originalname) || '';
    const filename = `${crypto.randomUUID()}${extension}`;
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return `https://storage.noblenet.mock/${filename}`;
  }

  static async deleteFile(fileUrl: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}
