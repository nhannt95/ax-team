import { Router } from 'express';
import { weeklyProgress } from '../controllers/stats.controller';

const router = Router();

router.get('/weekly-progress', weeklyProgress);

export default router;
