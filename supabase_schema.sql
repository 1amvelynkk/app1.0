-- ==========================================
-- IntelliWork Database Setup Script (Reset & Init)
-- ==========================================

-- ⚠️ WARNING: This will drop existing tables and data!
-- Run this in Supabase SQL Editor to reset your database to a clean, correct state.

-- 1. Drop existing tables (Order matters due to foreign keys)
DROP TABLE IF EXISTS project_follows;
DROP TABLE IF EXISTS material_reviews;
DROP TABLE IF EXISTS project_materials;
DROP TABLE IF EXISTS project_ratings;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS departments;

-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create Departments Table
CREATE TABLE departments (
  id text PRIMARY KEY,
  name text NOT NULL,
  en_name text,
  count_text text,
  level integer DEFAULT 0,
  parent_id text REFERENCES departments(id)
);

-- 4. Create Members Table
CREATE TABLE members (
  id text PRIMARY KEY,
  name text NOT NULL,
  role text,
  title text,
  dept_id text REFERENCES departments(id),
  project_count integer DEFAULT 0,
  status text CHECK (status IN ('online', 'offline', 'busy')),
  tags text[],
  avatar text,
  join_days integer,
  email text UNIQUE
);

-- 5. Create Projects Table
CREATE TABLE projects (
  id text PRIMARY KEY,
  title text NOT NULL,
  manager text,        -- Display name (e.g. "王可欣")
  manager_id text REFERENCES members(id), -- Foreign Key to member
  department text,
  progress integer DEFAULT 0,
  status text,         -- 'normal', 'delayed', 'ongoing', 'locked'
  deadline text,
  description text,
  visibility text CHECK (visibility IN ('public', 'members')),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Project Members Junction Table
CREATE TABLE project_members (
  project_id text REFERENCES projects(id) ON DELETE CASCADE,
  member_id text REFERENCES members(id) ON DELETE CASCADE,
  role text, -- 'manager', 'participant'
  PRIMARY KEY (project_id, member_id)
);

-- 7. Create Activities Table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name text,
  user_avatar text,
  action text,
  target text,
  project_title text,
  project_id text REFERENCES projects(id) ON DELETE SET NULL,
  time_text text, 
  type text CHECK (type IN ('invite', 'upload', 'review', 'task', 'ai')),
  created_at timestamp WITH time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Project Ratings Table
CREATE TABLE project_ratings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id text REFERENCES projects(id) ON DELETE CASCADE, -- Changed to text to match projects.id
  rater_id text NOT NULL,
  ratee_id text NOT NULL,
  score integer CHECK (score >= 1 AND score <= 5),
  comment text,
  created_at timestamp WITH time zone DEFAULT now(),
  UNIQUE(project_id, rater_id, ratee_id)
);

-- 9. Create Project Follows Table
CREATE TABLE project_follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id text REFERENCES members(id) ON DELETE CASCADE,
  project_id text REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamp WITH time zone DEFAULT now(),
  UNIQUE(member_id, project_id)
);

-- Enable RLS
ALTER TABLE project_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Follow Access" ON project_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their own follows" ON project_follows FOR ALL USING (true);

-- Enable RLS
ALTER TABLE project_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Rating Access" ON project_ratings FOR SELECT USING (true);
CREATE POLICY "Manager Rating Write" ON project_ratings FOR ALL USING (true);


-- ==========================================
-- 9. Insert Initial Data
-- ==========================================

-- Departments
INSERT INTO departments (id, name, en_name, count_text, level, parent_id) VALUES
('root', '集团总部', 'Group Headquarters', '200+人', 0, null),
('rnd', '研发中心', 'R&D Center', '80人', 1, 'root'),
('frontend', '前端开发部', 'Frontend Department', '24人', 2, 'rnd'),
('backend', '后端开发部', 'Backend Department', '38人', 2, 'rnd'),
('ai-lab', 'AI 实验室', 'AI Laboratory', '15人', 2, 'rnd'),
('product', '产品设计中心', 'Product & Design', '30人', 1, 'root'),
('design', 'UI 设计部', 'UI Design Dept', '12人', 2, 'product'),
('admin', '行政与人力', 'Admin & HR', '20人', 1, 'root'),
('hr', '人力资源部', 'HR Dept', '10人', 2, 'admin'),
('admin-dept', '行政部', 'Administration', '10人', 2, 'admin'),
('finance', '财务部', 'Finance Dept', '15人', 1, 'root'),
('marketing', '市场营销部', 'Marketing', '20人', 1, 'root'),
('hardware', '硬件部', 'Hardware', '30人', 1, 'rnd');

-- Members (Including 'kexin' and others needed for manager references)
INSERT INTO members (id, name, role, title, dept_id, project_count, status, tags, avatar, join_days) VALUES
('kexin', '王可欣', '高级产品经理', '高级产品经理', 'product', 8, 'online', '{"Product", "UI"}', 'https://picsum.photos/seed/kexin/200', 1240),
('m1', '林木风', '资深前端专家', '资深前端专家', 'frontend', 3, 'online', '{"Vue", "React", "Arco"}', 'https://picsum.photos/seed/lin/100', 800),
('m2', '陈雪依', '中级开发工程师', '中级开发工程师', 'frontend', 1, 'offline', '{"React", "Tailwind"}', 'https://picsum.photos/seed/chen/100', 300),
('m3', '张宏伟', '前端团队负责人', '前端团队负责人', 'frontend', 5, 'busy', '{"Management", "Architecture"}', 'https://picsum.photos/seed/zhanghw/100', 1500),
('m4', '张大千', '技术总监', '技术总监', 'backend', 4, 'online', '{"Backend", "Go"}', 'https://picsum.photos/seed/zhang/100', 2000),
('m_zhao', '赵会计', '财务主管', '财务主管', 'finance', 2, 'busy', '{"Finance"}', 'https://picsum.photos/seed/zhao/100', 500),
('m_li', '李思思', '市场总监', '市场总监', 'marketing', 3, 'online', '{"Marketing"}', 'https://picsum.photos/seed/lisi/100', 600),
('m_wang_jl', '王经理', '财务经理', '财务经理', 'finance', 2, 'online', '{"Finance", "Audit"}', 'https://picsum.photos/seed/wangjl/100', 800),
('m_li_ls', '李律师', '法务顾问', '法务顾问', 'admin', 1, 'online', '{"Legal", "Compliance"}', 'https://picsum.photos/seed/lils/100', 600);


-- Projects (Cleaned Data: No Test Projects, Correct Managers)
INSERT INTO projects (id, title, manager, manager_id, department, progress, status, deadline, visibility) VALUES
-- Managed by others (Participant Role)
('q3-finance', 'Q3 财务报表审计', '赵会计', 'm_zhao', '财务部', 95, 'normal', '今天', 'members'),
('q4-market', 'Q4 市场增长战略', '李思思', 'm_li', '市场营销部', 42, 'delayed', '剩 3 天', 'public'), -- Urgent task example
('crm-v2', 'CRM 系统二期功能迭代', '张大千', 'm4', '技术研发部', 85, 'ongoing', '今天 20:00', 'members'),

-- Locked Projects (No Access for User)
('secret-project-x', 'Project X 机密研发', '张大千', 'm4', '研发中心', 10, 'locked', '-', 'members'), -- Private, no permission
('confidential-audit', '2025 年度合规内审', '赵会计', 'm_zhao', '审计部', 0, 'locked', '-', 'members'), -- Private, no permission

-- Managed by Wang Kexin (Manager Role)
('ui-design', 'UI 设计图验收', '王可欣', 'kexin', '产品设计部', 80, 'normal', '明天', 'public'),
('alpha', 'Alpha 研发项目', '王可欣', 'kexin', '研发中心', 75, 'ongoing', '2024-12-01', 'public'),
('hw-v3', '智能硬件 V3.0 设计', '王可欣', 'kexin', '硬件部', 60, 'normal', '2024-12-15', 'public'),
('salary-adjust', '2024 年度薪酬结构调整', '王可欣', 'kexin', '人力资源部', 0, 'locked', '-', 'members'),
('ai-customer', 'AI 客服系统重构', '王可欣', 'kexin', '研发中心', 15, 'ongoing', '2025-01-20', 'members'),
('travel-plan', '年度员工旅游策划', '王可欣', 'kexin', '行政部', 90, 'normal', '本周五', 'public'),
('core-data', '核心数据库迁移', '王可欣', 'kexin', '技术委员会', 5, 'locked', '-', 'members');


-- Project Members (Establishing Relationships)
INSERT INTO project_members (project_id, member_id, role) VALUES
-- Q3 Finance (Participant)
('q3-finance', 'm_zhao', 'manager'),
('q3-finance', 'kexin', 'participant'),

-- Q4 Market (Participant - Urgent Task Assigned)
('q4-market', 'm_li', 'manager'),
('q4-market', 'kexin', 'participant'),  -- User is participant
('q4-market', 'm2', 'participant'),

-- CRM V2 (Participant)
('crm-v2', 'm4', 'manager'),
('crm-v2', 'kexin', 'participant'),

-- RESTRICTED PROJECTS (No Access for User)
-- 'secret-project-x' members: only manager
('secret-project-x', 'm4', 'manager'),
-- 'confidential-audit' members: only manager
('confidential-audit', 'm_zhao', 'manager'),

-- UI Design (Manager)
('ui-design', 'kexin', 'manager'),
('ui-design', 'm3', 'participant'),

-- Alpha (Manager)
('alpha', 'kexin', 'manager'),
('alpha', 'm1', 'participant'),

-- Hardware V3 (Manager)
('hw-v3', 'kexin', 'manager'),

-- Salary Adjust (Manager - Locked)
('salary-adjust', 'kexin', 'manager'),

-- AI Customer (Manager)
('ai-customer', 'kexin', 'manager'),

-- Travel Plan (Manager)
('travel-plan', 'kexin', 'manager'),

-- Core Data (Manager - Locked)
('core-data', 'kexin', 'manager');


-- Activities (Demo Data)
INSERT INTO activities (user_name, user_avatar, action, target, project_title, project_id, time_text, type) VALUES
('李思思', 'https://picsum.photos/seed/lisi/100', '上传了', '市场调研报告 v1.2', 'Q4 市场增长战略', 'q4-market', '10分钟前', 'upload'),
('张大千', 'https://picsum.photos/seed/zhang/100', '审核通过了', '后端接口文档', 'CRM 系统二期功能迭代', 'crm-v2', '1小时前', 'review'),
('王可欣', 'https://picsum.photos/seed/kexin/200', '完成了', '首页 UI 走查', 'UI 设计图验收', 'ui-design', '昨天 16:30', 'task');

-- ==========================================
-- 10. Project Materials Table (材料上传)
-- ==========================================
CREATE TABLE project_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id text REFERENCES projects(id) ON DELETE CASCADE,
  uploader_id text REFERENCES members(id),
  milestone text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  created_at timestamp WITH time zone DEFAULT now()
);

-- ==========================================
-- 11. Material Reviews Table (审核记录)
-- ==========================================
CREATE TABLE material_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id uuid REFERENCES project_materials(id) ON DELETE CASCADE,
  reviewer_id text REFERENCES members(id),
  status text CHECK (status IN ('approved', 'rejected')),
  comment text,
  created_at timestamp WITH time zone DEFAULT now()
);

-- RLS 策略
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Material Access" ON project_materials FOR ALL USING (true);
CREATE POLICY "Review Access" ON material_reviews FOR ALL USING (true);

-- Demo材料数据
INSERT INTO project_materials (project_id, uploader_id, milestone, file_name, file_url, file_type) VALUES
('ui-design', 'm3', '第二阶段：广告投放与创意测试', 'UI设计稿v2.pdf', 'https://example.com/files/ui-v2.pdf', 'pdf'),
('crm-v2', 'm4', '功能测试', 'API接口文档.docx', 'https://example.com/files/api-doc.docx', 'docx');

