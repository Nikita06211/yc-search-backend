import { Router } from "express";
import { syncData } from "../controllers/yc.controller";

const router = Router();

router.get("/sync", syncData);

export default router;
