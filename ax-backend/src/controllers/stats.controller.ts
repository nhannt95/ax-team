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

// Tra ve progress theo tuan: {week, completed, inProgress, pending, completionRate}
export const weeklyProgress = async (_req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        // Tinh diem tien do trung binh cua cac project theo tuan:
        //   completed = 100, in-progress = 50, pending = 0
        const [rows]: any = await pool.query(
            `SELECT
                week_name AS week,
                AVG(CASE
                    WHEN status = 'completed' THEN 100
                    WHEN status = 'in-progress' THEN 50
                    ELSE 0
                END) AS avgProgress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS inProgress,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
                COUNT(DISTINCT project_id) AS projects,
                COUNT(*) AS total
             FROM weekly_updates
             WHERE week_name IS NOT NULL AND week_name <> ''
             GROUP BY week_name
             ORDER BY
                CAST(REGEXP_REPLACE(week_name, '[^0-9]', '') AS UNSIGNED),
                week_name`
        );
        const data = rows.map((r: any) => ({
            week: r.week,
            progress: Math.round(Number(r.avgProgress) || 0),
            completed: Number(r.completed) || 0,
            inProgress: Number(r.inProgress) || 0,
            pending: Number(r.pending) || 0,
            projects: Number(r.projects) || 0,
            total: Number(r.total) || 0,
        }));
        res.json({ success: true, data });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};
