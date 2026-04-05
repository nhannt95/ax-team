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
    let techs: string[] = [];
    try { techs = row.technologies ? JSON.parse(row.technologies) : []; } catch { techs = []; }
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        technologies: techs,
    };
}

export const listAgents = async (_req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [rows] = await pool.query('SELECT * FROM agents ORDER BY name');
        res.json({ success: true, data: (rows as any[]).map(mapRow) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const getAgent = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [rows] = await pool.query('SELECT * FROM agents WHERE id = ?', [req.params.id]);
        const list = rows as any[];
        if (!list.length) { res.status(404).json({ success: false, message: 'Agent not found' }); return; }
        res.json({ success: true, data: mapRow(list[0]) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createAgent = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { id, name, description, technologies } = req.body;
        if (!id || !name) { res.status(400).json({ success: false, message: 'id and name are required' }); return; }
        await pool.query(
            'INSERT INTO agents (id, name, description, technologies) VALUES (?, ?, ?, ?)',
            [id, name, description || null, JSON.stringify(technologies || [])]
        );
        res.status(201).json({ success: true, data: { id, name, description, technologies } });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const updateAgent = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const { name, description, technologies } = req.body;
        const [result]: any = await pool.query(
            'UPDATE agents SET name = ?, description = ?, technologies = ? WHERE id = ?',
            [name, description || null, JSON.stringify(technologies || []), req.params.id]
        );
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'Agent not found' }); return; }
        res.json({ success: true, message: 'Agent updated' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteAgent = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        await pool.query('DELETE FROM project_agents WHERE agent_id = ?', [req.params.id]);
        const [result]: any = await pool.query('DELETE FROM agents WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'Agent not found' }); return; }
        res.json({ success: true, message: 'Agent deleted' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};
