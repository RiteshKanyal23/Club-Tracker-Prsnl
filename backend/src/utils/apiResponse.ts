import { Response } from "express";

export const ok = (res: Response, data: any = null, message = "Success", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: null });

export const fail = (
  res: Response,
  message = "Error",
  status = 400,
  errors: any = null,
  data: any = null,
) => res.status(status).json({ success: false, data, message, errors });
