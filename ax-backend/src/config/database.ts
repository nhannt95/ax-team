import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import mysql from 'mysql2/promise';

const CONFIG_PATH = path.resolve(__dirname, '../../config.yaml');
let pool: mysql.Pool | null = null;

export function getDbConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        throw new Error('config.yaml not found at ' + CONFIG_PATH);
    }
    const file = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = yaml.load(file) as any;
    return parsed.database;
}

let lastError: string | null = null;

export function getLastError() {
    return lastError;
}

export async function initDb() {
    const config = getDbConfig();

    // Đừng khởi tạo nếu không có host hoặc port hợp lệ
    // Nếu rỗng, app vẫn chạy để đợi FE điền config
    if (!config.host || !config.db_name) {
        lastError = 'No valid config found. Waiting for frontend to provide config...';
        console.warn('[DB] ' + lastError);
        return false;
    }

    if (pool) {
        try { await pool.end(); } catch { /* ignore */ }
        pool = null;
    }

    // Nếu database chưa tồn tại, tạo mới trước khi kết nối vào nó
    try {
        const bootstrap = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            charset: 'utf8mb4',
        });
        await bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${config.db_name}\` DEFAULT CHARSET=utf8mb4`);
        await bootstrap.end();
    } catch (e: any) {
        lastError = e.message;
        console.warn('[DB] Cannot reach MySQL server. Error: ' + e.message);
        pool = null;
        return false;
    }

    const candidate = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.db_name,
        waitForConnections: true,
        connectionLimit: 10,
        multipleStatements: true, // Bắt buộc để chạy nguyên cục schema.sql
        charset: 'utf8mb4',
        dateStrings: true, // Trả DATE dạng 'YYYY-MM-DD' thay vì Date object
    });

    try {
        // Test connection
        await candidate.query('SELECT 1');
        pool = candidate;
        lastError = null;
        console.log('[DB] Database pool initialized successfully and connected.');
        return true;
    } catch (e: any) {
        lastError = e.message;
        console.warn('[DB] Connection failed. Waiting for config update... Error: ' + e.message);
        try { await candidate.end(); } catch { /* ignore */ }
        pool = null;
        return false;
    }
}

async function ensureCharset() {
    if (!pool) return;
    const config = getDbConfig();
    const dbName = config.db_name;
    // Ép DB và tất cả bảng cũ về utf8mb4 để FK không lệch collation
    await pool.query(`ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    const [tables]: any = await pool.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_COLLATION NOT LIKE 'utf8mb4%'`,
        [dbName]
    );
    if (tables.length) {
        console.log(`[DB] Converting ${tables.length} legacy table(s) to utf8mb4...`);
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const t of tables) {
            await pool.query(
                `ALTER TABLE \`${t.TABLE_NAME}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
            );
        }
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    }
}

async function migrateAgentsToProjects() {
    if (!pool) return;
    const config = getDbConfig();
    const dbName = config.db_name;

    // Neu da co 'projects' thi skip
    const [proj]: any = await pool.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects'`,
        [dbName]
    );
    if (proj.length) return;

    // Kiem tra xem 'agents' co phai bang project cu khong (co cot 'status')
    const [cols]: any = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'agents' AND COLUMN_NAME = 'status'`,
        [dbName]
    );
    if (!cols.length) return;

    console.log('[DB] Migrating agents -> projects...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    await pool.query('RENAME TABLE agents TO projects');

    const [agentCrew]: any = await pool.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'agent_crew'`,
        [dbName]
    );
    if (agentCrew.length) {
        await pool.query('RENAME TABLE agent_crew TO project_crew');
    }

    for (const table of ['project_crew', 'weekly_updates', 'issues', 'deploy_history', 'tasks']) {
        const [c]: any = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'agent_id'`,
            [dbName, table]
        );
        if (c.length) {
            console.log(`[DB] Renaming ${table}.agent_id -> project_id`);
            await pool.query(`ALTER TABLE \`${table}\` CHANGE COLUMN agent_id project_id VARCHAR(50)`);
        }
    }

    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[DB] Migration complete.');
}

async function ensureColumns() {
    if (!pool) return;
    const config = getDbConfig();
    const dbName = config.db_name;
    // Danh sach cot bat buoc cho tung bang (cho cac cot moi them vao schema)
    const required: Array<[string, string, string]> = [
        ['users', 'role', 'VARCHAR(100)'],
        ['users', 'department_id', 'VARCHAR(50)'],
        ['projects', 'department_id', 'VARCHAR(50)'],
        ['agents', 'technologies', 'LONGTEXT'],
    ];
    for (const [table, col, type] of required) {
        const [rows]: any = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [dbName, table, col]
        );
        if (!rows.length) {
            console.log(`[DB] Adding missing column ${table}.${col}`);
            await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${type}`);
        }
    }

    // Xoa cac cot khong con dung nua
    const obsolete: Array<[string, string]> = [
        ['projects', 'cost_24h'],
        ['projects', 'cpu'],
        ['projects', 'memory'],
        ['projects', 'tokens_used'],
    ];
    for (const [table, col] of obsolete) {
        const [rows]: any = await pool.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [dbName, table, col]
        );
        if (rows.length) {
            console.log(`[DB] Dropping obsolete column ${table}.${col}`);
            await pool.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${col}\``);
        }
    }
}

export async function initSchema() {
    if (!pool) return;
    try {
        await ensureCharset();
        await migrateAgentsToProjects();
        const schemaPath = path.resolve(__dirname, '../../schema.sql');
        // Chay schema truoc de tao bang neu chua co, sau do them cot moi (migration)
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            console.log('[DB] Running schema initialization...');
            await pool.query(schemaSql);
            await ensureColumns();
            console.log('[DB] Schema initialized successfully.');
        } else {
            console.warn('[DB] schema.sql not found at ' + schemaPath);
        }
    } catch (e: any) {
        console.error('[DB] Schema init error:', e.message);
        throw e;
    }
}

export async function updateDbConfig(newConfig: any) {
    const yamlStr = yaml.dump({ database: newConfig });
    fs.writeFileSync(CONFIG_PATH, yamlStr, 'utf8');
    console.log('[DB] config.yaml has been updated.');
    const connected = await initDb();
    if (connected) {
        await initSchema(); // Khởi tạo bảng ngay sau khi kết nối thành công
    }
    return connected;
}

export function isConnected() {
    return pool !== null;
}

export function getPool() {
    return pool;
}
