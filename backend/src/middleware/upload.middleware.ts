import multer from "multer";
import path from "path";
import { uploadDir, maxFileSizeBytes } from "../config/storage";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, safe);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes },
});
