-- SQL Script to Clean Up IntelliWork Database
-- Execute these commands in your Supabase SQL Editor

-- 1. Delete test projects (测试, 测试2.0, 测试3.0)
DELETE FROM projects 
WHERE title IN ('测试', '测试2.0', '测试3.0');

-- 2. Delete project members associated with test projects (cleanup orphaned records)
DELETE FROM project_members 
WHERE project_id IN (
  SELECT id FROM projects WHERE title LIKE '测试%'
);

-- 3. Find and delete duplicate "紧急：财务审计初审" projects
-- Keep only the one with the earliest created_at timestamp
DELETE FROM projects
WHERE title = '紧急：财务审计初审'
AND created_at NOT IN (
  SELECT MIN(created_at) 
  FROM projects 
  WHERE title = '紧急：财务审计初审'
);

-- 4. Reassign unknown/generic managers to "王可欣"
-- Identify targets: projects managed by generic names or placeholders
UPDATE projects
SET manager = '王可欣',
    manager_id = 'kexin'
WHERE manager IN ('张三', '王五', 'HRD', 'CTO', '行政部', '李思思') 
   OR manager IS NULL;

-- 5. Strict Manager Assignment for Specific Projects
-- Ensure "2024 年度薪酬结构调整" is assigned to 王可欣
UPDATE projects
SET manager = '王可欣',
    manager_id = 'kexin'
WHERE title = '2024 年度薪酬结构调整';

-- 6. Verify changes
SELECT id, title, manager, created_at 
FROM projects 
ORDER BY created_at DESC 
LIMIT 20;
