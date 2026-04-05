import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb, getPool, initSchema, isConnected, getLastError } from './config/database';
import configRoutes from './routes/config.routes';
import usersRoutes from './routes/users.routes';
import agentsRoutes from './routes/agents.routes';
import projectsRoutes from './routes/projects.routes';
import departmentsRoutes from './routes/departments.routes';
import tasksRoutes from './routes/tasks.routes';
import logsRoutes from './routes/logs.routes';
import statsRoutes from './routes/stats.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Khởi tạo DB khi server bắt đầu
initDb().then(async connected => {
    if (connected) {
        await initSchema();
    } else {
        console.log("Server started, waiting for DB config from FE.");
    }
}).catch(e => {
    console.error("[DB Init Error]", e.message);
});

// Router quản lý config API cho database (Cập nhật config lúc runtime)
app.use('/api/config/db', configRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/stats', statsRoutes);

// Endpoint trả về trạng thái kết nối DB để FE biết có cần hiện form config hay không
app.get('/api/db/status', (_req, res) => {
    res.json({
        success: true,
        connected: isConnected(),
        error: getLastError(),
    });
});

// Endpoint kiểm tra kết nối DB
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = getPool();
        if (!pool) {
            res.status(500).json({ success: false, message: "Pool is not initialized" });
            return;
        }
        const [rows] = await pool.query('SELECT 1 + 1 AS db_check');
        res.json({ success: true, message: 'Database connected and query executed!', data: rows });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
    }
});

// Hello world
app.get('/', (req, res) => {
    res.send('AX Dashboard Backend is running.');
});

app.listen(PORT, () => {
    console.log(`🚀 AX Backend Server is running on port ${PORT}`);
});
