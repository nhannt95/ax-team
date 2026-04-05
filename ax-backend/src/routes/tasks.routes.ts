import { Router } from 'express';
import { listTasks, createTask, updateTask, deleteTask } from '../controllers/tasks.controller';

const router = Router();

router.get('/', listTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
