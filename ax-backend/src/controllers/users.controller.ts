import { Request, Response } from 'express';
import { getPool } from '../config/database';

function ensurePool(res: Response) {
    const pool = getPool();
    if (!pool) {
        res.status(503).json({ success: false, message: 'Database is not connected. Configure DB in Settings.' });
        return null;
    }
    return pool;
}

function slugify(s: string) {
    return s.toLowerCase().trim().replace(/\s+/g, '-');
}

function mapRow(row: any) {
    return {
        id: row.id,
        fullName: row.full_name,
        department: row.department_name || row.department_id, // hiển thị tên nếu có join
        departmentId: row.department_id,
        group: row.group_name,
        team: row.team,
        role: row.role,
        type: row.user_type,
    };
}

export const listUsers = async (_req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [rows] = await pool.query(
            `SELECT u.*, d.name AS department_name
             FROM users u LEFT JOIN departments d ON u.department_id = d.id
             ORDER BY u.id`
        );
        res.json({ success: true, data: (rows as any[]).map(mapRow) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [rows] = await pool.query(
            `SELECT u.*, d.name AS department_name
             FROM users u LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = ?`,
            [req.params.id]
        );
        const list = rows as any[];
        if (!list.length) { res.status(404).json({ success: false, message: 'User not found' }); return; }
        res.json({ success: true, data: mapRow(list[0]) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { id, fullName, department, group, team, role, type } = req.body;
        if (!id || !fullName) { res.status(400).json({ success: false, message: 'id and fullName are required' }); return; }
        const deptId = department ? slugify(department) : null;
        await pool.query(
            'INSERT INTO users (id, full_name, department_id, group_name, team, role, user_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, fullName, deptId, group || null, team || null, role || null, type || null]
        );
        res.status(201).json({ success: true, data: { id, fullName, department, departmentId: deptId, group, team, role, type } });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { fullName, department, group, team, role, type } = req.body;
        const deptId = department ? slugify(department) : null;
        const [result]: any = await pool.query(
            'UPDATE users SET full_name = ?, department_id = ?, group_name = ?, team = ?, role = ?, user_type = ? WHERE id = ?',
            [fullName, deptId, group || null, team || null, role || null, type || null, req.params.id]
        );
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'User not found' }); return; }
        res.json({ success: true, message: 'User updated' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        await pool.query('DELETE FROM project_crew WHERE user_id = ?', [req.params.id]);
        const [result]: any = await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'User not found' }); return; }
        res.json({ success: true, message: 'User deleted' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};
