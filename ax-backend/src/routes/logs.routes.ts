import { Router } from 'express';
import { listLogs, createLog, deleteLogs } from '../controllers/logs.controller';

const router = Router();

router.get('/', listLogs);
router.post('/', createLog);
router.delete('/', deleteLogs);

export default router;
