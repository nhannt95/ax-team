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

function slugify(s: string) {
    return s.toLowerCase().trim().replace(/\s+/g, '-');
}

export const listDepartments = async (_req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [rows] = await pool.query('SELECT * FROM departments ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { name } = req.body;
        if (!name) { res.status(400).json({ success: false, message: 'name is required' }); return; }
        const id = slugify(name);
        await pool.query('INSERT INTO departments (id, name) VALUES (?, ?)', [id, name]);
        res.status(201).json({ success: true, data: { id, name } });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [result]: any = await pool.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'Department not found' }); return; }
        res.json({ success: true, message: 'Department deleted' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};
