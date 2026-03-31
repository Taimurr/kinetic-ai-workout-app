import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generatePlanRouter from "./generate-plan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(generatePlanRouter);

export default router;
