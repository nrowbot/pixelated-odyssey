import { Router } from "express";
import videoRoutes from "./videoRoutes";

const router = Router();

router.use("/api", videoRoutes);

export default router;
