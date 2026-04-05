import { Request, Response } from 'express';
import { getPool } from '../config/database';

function ensurePool(res: Response) {
    const pool = getPool();
    if (!pool) {
        res.status(503).json({ success: false, message: 'Database is not connected.' });
        return null;
    }
    return pool;
}

function mapRow(row: any) {
    return {
        id: row.id,
        projectId: row.project_id,
        agentId: row.agent_id,
        taskId: row.task_id,
        level: row.level,
        message: row.message,
        createdAt: row.created_at,
    };
}

export const listLogs = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { projectId, level, limit } = req.query;
        const where: string[] = [];
        const params: any[] = [];
        if (projectId) { where.push('project_id = ?'); params.push(projectId); }
        if (level) { where.push('level = ?'); params.push(level); }
        const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
        const lim = Math.min(Number(limit) || 200, 1000);
        const [rows] = await pool.query(
            `SELECT * FROM project_logs ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ?`,
            [...params, lim]
        );
        res.json({ success: true, data: (rows as any[]).map(mapRow) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createLog = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { projectId, agentId, taskId, level, message } = req.body;
        if (!projectId || !message) {
            res.status(400).json({ success: false, message: 'projectId and message are required' });
            return;
        }
        const [result]: any = await pool.query(
            'INSERT INTO project_logs (project_id, agent_id, task_id, level, message) VALUES (?, ?, ?, ?, ?)',
            [projectId, agentId || null, taskId || null, level || 'info', message]
        );
        res.status(201).json({ success: true, data: { id: result.insertId, projectId, agentId, taskId, level, message } });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteLogs = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { projectId } = req.query;
        if (projectId) {
            await pool.query('DELETE FROM project_logs WHERE project_id = ?', [projectId]);
        } else {
            await pool.query('TRUNCATE TABLE project_logs');
        }
        res.json({ success: true, message: 'Logs cleared' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};
