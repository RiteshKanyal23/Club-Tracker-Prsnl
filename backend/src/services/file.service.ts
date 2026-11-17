import path from "path";
import { uploadDir } from "../config/storage";

export const fileService = {
  resolvePath(filename: string) {
    return path.join(uploadDir, path.basename(filename));
  },
};
