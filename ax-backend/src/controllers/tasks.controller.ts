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
        title: row.title,
        deadline: row.deadline,
        priority: row.priority,
        status: row.status,
    };
}

export const listTasks = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { projectId } = req.query;
        let rows;
        if (projectId) {
            [rows] = await pool.query('SELECT * FROM tasks WHERE project_id = ? ORDER BY id', [projectId]);
        } else {
            [rows] = await pool.query('SELECT * FROM tasks ORDER BY id');
        }
        res.json({ success: true, data: (rows as any[]).map(mapRow) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { id, projectId, title, deadline, priority, status } = req.body;
        if (!id || !title) { res.status(400).json({ success: false, message: 'id and title are required' }); return; }
        await pool.query(
            'INSERT INTO tasks (id, project_id, title, deadline, priority, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id, projectId || null, title, deadline || null, priority || 'medium', status || 'todo']
        );
        res.status(201).json({ success: true, data: { id, projectId, title, deadline, priority, status } });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { projectId, title, deadline, priority, status } = req.body;
        const [result]: any = await pool.query(
            'UPDATE tasks SET project_id = ?, title = ?, deadline = ?, priority = ?, status = ? WHERE id = ?',
            [projectId || null, title, deadline || null, priority, status, req.params.id]
        );
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'Task not found' }); return; }
        res.json({ success: true, message: 'Task updated' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [result]: any = await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'Task not found' }); return; }
        res.json({ success: true, message: 'Task deleted' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};
