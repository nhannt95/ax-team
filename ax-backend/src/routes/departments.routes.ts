import { Router } from 'express';
import { listDepartments, createDepartment, deleteDepartment } from '../controllers/departments.controller';

const router = Router();

router.get('/', listDepartments);
router.post('/', createDepartment);
router.delete('/:id', deleteDepartment);

export default router;
