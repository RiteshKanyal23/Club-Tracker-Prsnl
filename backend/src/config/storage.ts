import path from "path";
import fs from "fs";
import { env } from "./environment";

export const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const maxFileSizeBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
