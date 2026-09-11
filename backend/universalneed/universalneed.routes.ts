import { Router } from "express";
import {
  queryUniversalNeedHandler,
  getUniversalNeedExamplesHandler,
} from "./universalneed.controller";

const router = Router();

router.get("/query", queryUniversalNeedHandler);
router.post("/query", queryUniversalNeedHandler);
router.get("/examples", getUniversalNeedExamplesHandler);

export default router;
