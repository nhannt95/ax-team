-- departments: Danh muc phong ban
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- users: Danh sach chuyen gia va nhan su
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    department_id VARCHAR(50),
    group_name VARCHAR(50),
    team VARCHAR(50),
    role VARCHAR(100),
    user_type VARCHAR(20),
    FOREIGN KEY (department_id) REFERENCES departments(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- agents: Danh sach cac AI agent (LLM, tool, model) co the duoc gan vao project
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    technologies LONGTEXT
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- projects: Bang quan ly cac Project chinh
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'Idle',
    model VARCHAR(50),
    prompt TEXT,
    tools LONGTEXT,
    last_run VARCHAR(50),
    avg_latency INT,
    success_rate DECIMAL(5,2),
    description TEXT,
    tags LONGTEXT,
    created_at DATE,
    share_link VARCHAR(255),
    department_id VARCHAR(50),
    ai_expert_id VARCHAR(50),
    start_date DATE,
    planned_end_date DATE,
    actual_end_date DATE NULL,
    progress INT DEFAULT 0,
    plan TEXT,
    remarks TEXT,
    technologies LONGTEXT,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (ai_expert_id) REFERENCES users(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_crew: Many-to-Many giua project va user (crew members)
CREATE TABLE IF NOT EXISTS project_crew (
    project_id VARCHAR(50),
    user_id VARCHAR(50),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_agents: Many-to-Many - project su dung nhung agent nao
CREATE TABLE IF NOT EXISTS project_agents (
    project_id VARCHAR(50),
    agent_id VARCHAR(50),
    PRIMARY KEY (project_id, agent_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- weekly_updates: Tien do hang tuan cua tung project
CREATE TABLE IF NOT EXISTS weekly_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(50),
    week_name VARCHAR(50),
    tasks TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES projects(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- issues: Loi / van de phat sinh tren project
CREATE TABLE IF NOT EXISTS issues (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50),
    severity VARCHAR(20),
    title VARCHAR(255),
    detected_at VARCHAR(50),
    suggestion TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- deploy_history: Lich su trien khai
CREATE TABLE IF NOT EXISTS deploy_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(50),
    version VARCHAR(50),
    deployed_at VARCHAR(50),
    deployer VARCHAR(100),
    status VARCHAR(20),
    notes TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- project_logs: Log thuc thi cua project / agent (info, warn, error, success)
CREATE TABLE IF NOT EXISTS project_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(50),
    agent_id VARCHAR(50) NULL,
    task_id VARCHAR(50) NULL,
    level VARCHAR(20) DEFAULT 'info',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    INDEX idx_project_logs_project (project_id, created_at)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- tasks: Cong viec chi tiet cua tung project
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    deadline VARCHAR(50),
    priority VARCHAR(20),
    status VARCHAR(20) DEFAULT 'todo',
    FOREIGN KEY (project_id) REFERENCES projects(id)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed departments mac dinh
INSERT IGNORE INTO departments (id, name) VALUES
    ('engineering', 'Engineering'),
    ('data-science', 'Data Science'),
    ('product', 'Product'),
    ('marketing', 'Marketing'),
    ('operations', 'Operations'),
    ('security', 'Security');
