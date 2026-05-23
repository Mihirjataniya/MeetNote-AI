import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { config } from "../config/index";
import type { CloudinaryFile } from "../types/index";
import path from "node:path";

class StorageService {
  private configured = false;

  private ensureConfigured(): void {
    if (this.configured) return;
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });
    this.configured = true;
  }

  async uploadAudioFiles(filePaths: string[], roomId: string): Promise<CloudinaryFile[]> {
    this.ensureConfigured();

    const results: CloudinaryFile[] = [];
    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      const publicId = `meetnote/recordings/${roomId}/${path.parse(fileName).name}`;

      const response: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
        resource_type: "video",
        public_id: publicId,
        overwrite: true,
      });

      results.push({
        fileName,
        url: response.secure_url,
        publicId: response.public_id,
      });

      console.log(`[Storage] Uploaded ${fileName} → ${response.secure_url}`);
    }

    return results;
  }

  async deleteAudioFiles(publicIds: string[]): Promise<void> {
    this.ensureConfigured();

    for (const publicId of publicIds) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    }
  }
}

export const storageService = new StorageService();
