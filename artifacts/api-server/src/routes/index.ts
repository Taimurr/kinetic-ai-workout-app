import { Router, type IRouter } from "express";
import healthRouter from "./health";
import generatePlanRouter from "./generate-plan";
import authRouter from "./auth";
import profileRouter from "./profile";
import planRouter from "./plan";
import sessionsRouter from "./sessions";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(generatePlanRouter);
router.use(profileRouter);
router.use(planRouter);
router.use(sessionsRouter);

export default router;
