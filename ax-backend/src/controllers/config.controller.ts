import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { getDbConfig, updateDbConfig } from '../config/database';

export const getConfig = (req: Request, res: Response): void => {
    try {
        const config = getDbConfig();
        res.json({ success: true, data: config });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const testConnection = async (req: Request, res: Response): Promise<void> => {
    try {
        const { host, port, username, password, db_name } = req.body;
        if (!host || !username) {
            res.status(400).json({ success: false, message: 'Missing host or username' });
            return;
        }
        // Kết nối tới server (không kèm database) để xác thực credential
        const conn = await mysql.createConnection({
            host,
            port: Number(port) || 3306,
            user: username,
            password: password || '',
            charset: 'utf8mb4',
        });
        await conn.query('SELECT 1');
        // Check xem database có tồn tại không (chỉ để thông báo, không fail)
        let dbExists: boolean | null = null;
        if (db_name) {
            const [rows]: any = await conn.query(
                'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
                [db_name]
            );
            dbExists = rows.length > 0;
        }
        await conn.end();
        res.json({
            success: true,
            message: dbExists === false
                ? `Server reachable. Database "${db_name}" does not exist yet — it will be created on Save.`
                : 'Connection successful',
        });
    } catch (e: any) {
        res.status(400).json({ success: false, message: e.message });
    }
};

export const updateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const newConfig = req.body;
        // Kiểm tra sơ bộ các field
        if (!newConfig.host || !newConfig.username) {
            res.status(400).json({ success: false, message: "Missing required fields (host, username, etc.)" });
            return;
        }
        
        const connected = await updateDbConfig(newConfig);
        if (connected) {
            res.json({ success: true, message: 'Database configuration updated, reconnected, and schema created successfully!' });
        } else {
            res.json({ success: false, message: 'Database config saved but connection failed. Please check credentials.' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
