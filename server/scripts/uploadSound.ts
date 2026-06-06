import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../src/config/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const localPath = path.resolve(__dirname, "../../sound.mp3");
  console.log(`[Upload] Source: ${localPath}`);

  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });

  const response = await cloudinary.uploader.upload(localPath, {
    resource_type: "video",
    public_id: "meetnote/assets/notification-ding",
    overwrite: true,
  });

  console.log("[Upload] Success.");
  console.log(`  public_id: ${response.public_id}`);
  console.log(`  url:       ${response.secure_url}`);
}

main().catch((err) => {
  console.error("[Upload] Failed:", err);
  process.exit(1);
});
