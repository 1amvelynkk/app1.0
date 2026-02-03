-- ==========================================
-- 同步前端 orgData 成员到数据库 members 表
-- ==========================================
-- 这个脚本会添加所有前端定义但数据库中缺失的成员
-- 运行方法：在 Supabase SQL Editor 中执行

-- 添加缺失的成员（使用 ON CONFLICT 避免重复插入）
INSERT INTO members (id, name, role, title, dept_id, project_count, status, tags, avatar, join_days) VALUES
-- 后端开发部 (m4 已存在但名字不同，m5, m5-1 缺失)
('m5', '王五', 'Go 开发', 'Go 开发', 'backend', 2, 'busy', '{"Go", "K8s"}', 'https://picsum.photos/seed/wangwu/100', 450),
('m5-1', '赵六', '架构师', '系统架构师', 'backend', 6, 'online', '{"Microservices"}', 'https://picsum.photos/seed/zhaoliu/100', 1200),

-- AI 实验室
('ai1', 'Dr. Wu', 'AI 科学家', '首席科学家', 'ai-lab', 2, 'online', '{"LLM", "Python"}', 'https://picsum.photos/seed/drwu/100', 200),
('ai2', 'Alex', '算法工程师', '算法工程师', 'ai-lab', 4, 'busy', '{"PyTorch"}', 'https://picsum.photos/seed/alex/100', 400),
('ai3', 'Sarah', '数据分析师', '数据分析师', 'ai-lab', 1, 'offline', '{"Data Mining"}', 'https://picsum.photos/seed/sarah/100', 150),

-- UI 设计部
('m6', '张欣', 'UI 设计师', 'UI 设计师', 'design', 3, 'online', '{"Figma", "Sketch"}', 'https://picsum.photos/seed/zhangxin/100', 700),
('m7', 'Kiki', '交互设计师', '交互设计师', 'design', 2, 'busy', '{"UX", "Protopie"}', 'https://picsum.photos/seed/kiki/100', 500),
('m8', 'Leo', '视觉专家', '视觉专家', 'design', 4, 'online', '{"C4D", "Blender"}', 'https://picsum.photos/seed/leo/100', 900),

-- 人力资源部
('hr1', 'HRD', '人力总监', '人力总监', 'hr', 2, 'busy', '{"Recruitment"}', 'https://picsum.photos/seed/hrd/100', 2000),
('hr2', 'Amy', '招聘经理', '招聘经理', 'hr', 5, 'online', '{"Hiring"}', 'https://picsum.photos/seed/amy/100', 600),
('hr3', 'Ben', '薪酬专员', '薪酬专员', 'hr', 1, 'offline', '{"C&B"}', 'https://picsum.photos/seed/ben/100', 300),

-- 行政部
('adm1', '行政小李', '行政主管', '行政主管', 'admin-dept', 10, 'online', '{"Event"}', 'https://picsum.photos/seed/adm1/100', 800),
('adm2', 'Tom', '资产管理', '资产管理', 'admin-dept', 2, 'offline', '{"Assets"}', 'https://picsum.photos/seed/tom/100', 400),
('adm3', 'Jerry', '前台接待', '前台接待', 'admin-dept', 0, 'online', '{"Service"}', 'https://picsum.photos/seed/jerry/100', 100)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  title = EXCLUDED.title;

-- 验证：查看所有成员
SELECT id, name, dept_id FROM members ORDER BY id;
