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

function parseJson(value: any) {
    if (value == null) return [];
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value); } catch { return []; }
}

function mapRow(
    row: any,
    crew: Array<{ name: string; role: string }> = [],
    agents: Array<{ id: string; name: string }> = []
) {
    return {
        id: row.id,
        name: row.name,
        status: row.status,
        model: row.model,
        prompt: row.prompt,
        tools: parseJson(row.tools),
        lastRun: row.last_run,
        avgLatency: row.avg_latency,
        successRate: row.success_rate != null ? Number(row.success_rate) : 0,
        description: row.description,
        tags: parseJson(row.tags),
        createdAt: row.created_at,
        shareLink: row.share_link,
        department: row.department_name || row.department_id,
        departmentId: row.department_id,
        aiExpertId: row.ai_expert_id,
        aiExpert: row.expert_name
            ? { name: row.expert_name, role: row.expert_role || '' }
            : { name: '', role: '' },
        aiCrew: crew,
        agents,
        startDate: row.start_date,
        plannedEndDate: row.planned_end_date,
        actualEndDate: row.actual_end_date,
        progress: row.progress,
        plan: row.plan,
        remarks: row.remarks,
        technologies: parseJson(row.technologies),
    };
}

async function fetchCrewMap(pool: any, projectIds: string[]): Promise<Record<string, Array<{ name: string; role: string }>>> {
    if (!projectIds.length) return {};
    const placeholders = projectIds.map(() => '?').join(',');
    const [rows]: any = await pool.query(
        `SELECT pc.project_id, u.full_name, u.role
         FROM project_crew pc JOIN users u ON pc.user_id = u.id
         WHERE pc.project_id IN (${placeholders})`,
        projectIds
    );
    const map: Record<string, Array<{ name: string; role: string }>> = {};
    for (const r of rows) {
        if (!map[r.project_id]) map[r.project_id] = [];
        map[r.project_id].push({ name: r.full_name, role: r.role || '' });
    }
    return map;
}

async function fetchAgentsMap(pool: any, projectIds: string[]): Promise<Record<string, Array<{ id: string; name: string; description: string; technologies: string[] }>>> {
    if (!projectIds.length) return {};
    const placeholders = projectIds.map(() => '?').join(',');
    const [rows]: any = await pool.query(
        `SELECT pa.project_id, a.id, a.name, a.description, a.technologies
         FROM project_agents pa JOIN agents a ON pa.agent_id = a.id
         WHERE pa.project_id IN (${placeholders})`,
        projectIds
    );
    const map: Record<string, Array<{ id: string; name: string; description: string; technologies: string[] }>> = {};
    for (const r of rows) {
        if (!map[r.project_id]) map[r.project_id] = [];
        let techs: string[] = [];
        try { techs = r.technologies ? JSON.parse(r.technologies) : []; } catch { techs = []; }
        map[r.project_id].push({ id: r.id, name: r.name, description: r.description || '', technologies: techs });
    }
    return map;
}

// Upsert user theo name, tra ve user id (dung cho aiExpert va aiCrew free-form)
async function upsertUserByName(pool: any, name: string, role?: string, userType: string = 'AI Expert'): Promise<string | null> {
    const trimmed = (name || '').trim();
    if (!trimmed) return null;
    const [found]: any = await pool.query('SELECT id FROM users WHERE full_name = ? LIMIT 1', [trimmed]);
    if (found.length) {
        if (role) await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, found[0].id]);
        return found[0].id;
    }
    const newId = 'KNOX-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
    await pool.query(
        'INSERT INTO users (id, full_name, role, user_type) VALUES (?, ?, ?, ?)',
        [newId, trimmed, role || null, userType]
    );
    return newId;
}

async function syncAiCrew(pool: any, projectId: string, crew: Array<{ name: string; role?: string }>) {
    await pool.query('DELETE FROM project_crew WHERE project_id = ?', [projectId]);
    if (!crew.length) return;
    const userIds: string[] = [];
    for (const m of crew) {
        const uid = await upsertUserByName(pool, m.name, m.role, 'AI Crew');
        if (uid) userIds.push(uid);
    }
    if (userIds.length) {
        const values = userIds.map(uid => [projectId, uid]);
        await pool.query('INSERT IGNORE INTO project_crew (project_id, user_id) VALUES ?', [values]);
    }
}

// Upsert danh sach agent (theo name) + link voi project
async function syncProjectAgents(pool: any, projectId: string, projectAgents: Array<{ name: string; description?: string; technologies?: string[] }>) {
    // Xoa link cu
    await pool.query('DELETE FROM project_agents WHERE project_id = ?', [projectId]);
    if (!projectAgents.length) return;
    const agentIds: string[] = [];
    for (const pa of projectAgents) {
        const name = (pa.name || '').trim();
        if (!name) continue;
        const techJson = JSON.stringify(Array.isArray(pa.technologies) ? pa.technologies : []);
        // Tim agent theo name
        const [found]: any = await pool.query('SELECT id FROM agents WHERE name = ? LIMIT 1', [name]);
        let agentId: string;
        if (found.length) {
            agentId = found[0].id;
            await pool.query('UPDATE agents SET description = ?, technologies = ? WHERE id = ?', [pa.description || null, techJson, agentId]);
        } else {
            agentId = 'AGT-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
            await pool.query('INSERT INTO agents (id, name, description, technologies) VALUES (?, ?, ?, ?)', [agentId, name, pa.description || null, techJson]);
        }
        agentIds.push(agentId);
    }
    if (agentIds.length) {
        const values = agentIds.map(aid => [projectId, aid]);
        await pool.query('INSERT IGNORE INTO project_agents (project_id, agent_id) VALUES ?', [values]);
    }
}

export const listProjects = async (_req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [rows] = await pool.query(
            `SELECT p.*, d.name AS department_name,
                    u.full_name AS expert_name, u.role AS expert_role
             FROM projects p
             LEFT JOIN departments d ON p.department_id = d.id
             LEFT JOIN users u ON p.ai_expert_id = u.id
             ORDER BY p.id`
        );
        const list = rows as any[];
        const ids = list.map(r => r.id);
        const crewMap = await fetchCrewMap(pool, ids);
        const agentsMap = await fetchAgentsMap(pool, ids);
        res.json({ success: true, data: list.map(r => mapRow(r, crewMap[r.id] || [], agentsMap[r.id] || [])) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const getProject = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const [rows] = await pool.query(
            `SELECT p.*, d.name AS department_name,
                    u.full_name AS expert_name, u.role AS expert_role
             FROM projects p
             LEFT JOIN departments d ON p.department_id = d.id
             LEFT JOIN users u ON p.ai_expert_id = u.id
             WHERE p.id = ?`,
            [req.params.id]
        );
        const list = rows as any[];
        if (!list.length) { res.status(404).json({ success: false, message: 'Project not found' }); return; }
        const crewMap = await fetchCrewMap(pool, [list[0].id]);
        const agentsMap = await fetchAgentsMap(pool, [list[0].id]);
        res.json({ success: true, data: mapRow(list[0], crewMap[list[0].id] || [], agentsMap[list[0].id] || []) });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const b = req.body;
        if (!b.id || !b.name) { res.status(400).json({ success: false, message: 'id and name are required' }); return; }
        const deptId = b.department ? slugify(b.department) : null;
        // Upsert AI expert neu co
        let expertId = b.aiExpertId || null;
        if (!expertId && b.aiExpert && b.aiExpert.name) {
            expertId = await upsertUserByName(pool, b.aiExpert.name, b.aiExpert.role, 'AI Expert');
        }
        await pool.query(
            `INSERT INTO projects (
                id, name, status, model, prompt, tools, last_run, avg_latency,
                success_rate, description, tags, created_at,
                share_link, department_id, ai_expert_id, start_date, planned_end_date,
                actual_end_date, progress, plan, remarks, technologies
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                b.id, b.name, b.status || 'Idle', b.model || null, b.prompt || null,
                JSON.stringify(b.tools || []), b.lastRun || null, b.avgLatency || 0,
                b.successRate || 0,
                b.description || null, JSON.stringify(b.tags || []), b.createdAt || null,
                b.shareLink || null, deptId, expertId,
                b.startDate || null, b.plannedEndDate || null, b.actualEndDate || null,
                b.progress || 0, b.plan || null, b.remarks || null,
                JSON.stringify(b.technologies || []),
            ]
        );
        if (Array.isArray(b.aiCrew)) {
            await syncAiCrew(pool, b.id, b.aiCrew);
        }
        if (Array.isArray(b.aiCrewIds) && b.aiCrewIds.length) {
            const values = b.aiCrewIds.map((uid: string) => [b.id, uid]);
            await pool.query('INSERT IGNORE INTO project_crew (project_id, user_id) VALUES ?', [values]);
        }
        if (Array.isArray(b.agentIds) && b.agentIds.length) {
            const values = b.agentIds.map((aid: string) => [b.id, aid]);
            await pool.query('INSERT IGNORE INTO project_agents (project_id, agent_id) VALUES ?', [values]);
        }
        if (Array.isArray(b.projectAgents)) {
            await syncProjectAgents(pool, b.id, b.projectAgents);
        }
        res.status(201).json({ success: true, data: b });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        const b = req.body;
        const deptId = b.department ? slugify(b.department) : null;
        let expertId = b.aiExpertId || null;
        if (!expertId && b.aiExpert && b.aiExpert.name) {
            expertId = await upsertUserByName(pool, b.aiExpert.name, b.aiExpert.role, 'AI Expert');
        }
        const [result]: any = await pool.query(
            `UPDATE projects SET
                name = ?, status = ?, model = ?, prompt = ?, tools = ?, last_run = ?,
                avg_latency = ?, success_rate = ?,
                description = ?, tags = ?, created_at = ?, share_link = ?,
                department_id = ?, ai_expert_id = ?, start_date = ?, planned_end_date = ?,
                actual_end_date = ?, progress = ?, plan = ?, remarks = ?, technologies = ?
             WHERE id = ?`,
            [
                b.name, b.status || 'Idle', b.model || null, b.prompt || null,
                JSON.stringify(b.tools || []), b.lastRun || null, b.avgLatency || 0,
                b.successRate || 0,
                b.description || null, JSON.stringify(b.tags || []), b.createdAt || null,
                b.shareLink || null, deptId, expertId,
                b.startDate || null, b.plannedEndDate || null, b.actualEndDate || null,
                b.progress || 0, b.plan || null, b.remarks || null,
                JSON.stringify(b.technologies || []),
                req.params.id,
            ]
        );
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'Project not found' }); return; }
        if (Array.isArray(b.aiCrew)) {
            await syncAiCrew(pool, String(req.params.id), b.aiCrew);
        }
        if (Array.isArray(b.aiCrewIds)) {
            await pool.query('DELETE FROM project_crew WHERE project_id = ?', [req.params.id]);
            if (b.aiCrewIds.length) {
                const values = b.aiCrewIds.map((uid: string) => [req.params.id, uid]);
                await pool.query('INSERT IGNORE INTO project_crew (project_id, user_id) VALUES ?', [values]);
            }
        }
        if (Array.isArray(b.agentIds)) {
            await pool.query('DELETE FROM project_agents WHERE project_id = ?', [req.params.id]);
            if (b.agentIds.length) {
                const values = b.agentIds.map((aid: string) => [req.params.id, aid]);
                await pool.query('INSERT IGNORE INTO project_agents (project_id, agent_id) VALUES ?', [values]);
            }
        }
        if (Array.isArray(b.projectAgents)) {
            await syncProjectAgents(pool, String(req.params.id), b.projectAgents);
        }
        res.json({ success: true, message: 'Project updated' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    const pool = ensurePool(res); if (!pool) return;
    try {
        await pool.query('DELETE FROM project_crew WHERE project_id = ?', [req.params.id]);
        await pool.query('DELETE FROM project_agents WHERE project_id = ?', [req.params.id]);
        await pool.query('DELETE FROM weekly_updates WHERE project_id = ?', [req.params.id]);
        await pool.query('DELETE FROM issues WHERE project_id = ?', [req.params.id]);
        await pool.query('DELETE FROM deploy_history WHERE project_id = ?', [req.params.id]);
        await pool.query('DELETE FROM tasks WHERE project_id = ?', [req.params.id]);
        const [result]: any = await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        if (!result.affectedRows) { res.status(404).json({ success: false, message: 'Project not found' }); return; }
        res.json({ success: true, message: 'Project deleted' });
    } catch (e: any) {
        res.status(500).json({ success: false, message: e.message });
    }
};
