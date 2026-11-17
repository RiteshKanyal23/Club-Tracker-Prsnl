import { Router } from "express";
import { CommunicationController } from "./communication.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { upload } from "../../middleware/upload.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import { validatePagination } from "../../middleware/pagination.middleware";
import { createChannelSchema } from "./communication.validation";

export const communicationRouter = Router();
communicationRouter.use(authMiddleware);

// channels
communicationRouter.get("/channels", CommunicationController.listChannels);
communicationRouter.post("/channels", validateBody(createChannelSchema.shape.body), CommunicationController.createChannel);
communicationRouter.get("/channels/:id", CommunicationController.getChannel);
communicationRouter.post("/channels/:id/join", CommunicationController.join);
communicationRouter.post("/channels/:id/read", CommunicationController.markRead);
communicationRouter.get("/channels/:id/messages", CommunicationController.listMessages);
communicationRouter.post("/channels/:id/messages", upload.single("file"), CommunicationController.sendMessage);

// legacy aliases
communicationRouter.get("/", validatePagination, CommunicationController.list);
communicationRouter.post("/", validateBody(createChannelSchema.shape.body), CommunicationController.create);
communicationRouter.get("/:id", CommunicationController.getById);
