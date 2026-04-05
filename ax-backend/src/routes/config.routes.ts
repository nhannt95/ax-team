import { Router } from 'express';
import { getConfig, updateConfig, testConnection } from '../controllers/config.controller';

const router = Router();

// GET /api/config/db -> Lấy config hiện tại
router.get('/', getConfig);

// POST /api/config/db -> Cập nhật config mới và khởi động lại pool
router.post('/', updateConfig);

// POST /api/config/db/test -> Thử kết nối nhưng không lưu
router.post('/test', testConnection);

export default router;
