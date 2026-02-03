-- 更新数据库中所有未知负责人的项目为王可欣 (kexin)
-- 运行此脚本在 Supabase SQL Editor

-- =====================================================
-- 1. 查看当前项目的负责人情况
-- =====================================================
SELECT id, title, manager, manager_id FROM projects;

-- =====================================================
-- 2. 更新所有 manager_id 为空或 manager 为空/未知的项目
-- =====================================================
UPDATE projects 
SET 
  manager = '王可欣',
  manager_id = 'kexin'
WHERE 
  manager_id IS NULL 
  OR manager_id = ''
  OR manager IS NULL
  OR manager = '' 
  OR manager = '未知'
  OR manager = '未知负责人';

-- =====================================================
-- 3. 确保 project_members 表中有对应的管理员记录
-- =====================================================
-- 对于新设置的负责人项目，添加 manager 角色
INSERT INTO project_members (project_id, member_id, role)
SELECT id, 'kexin', 'manager'
FROM projects 
WHERE manager_id = 'kexin'
  AND id NOT IN (
    SELECT project_id FROM project_members 
    WHERE member_id = 'kexin' AND role = 'manager'
  )
ON CONFLICT (project_id, member_id) DO UPDATE SET role = 'manager';

-- =====================================================
-- 4. 验证更新结果
-- =====================================================
SELECT 
  p.id, 
  p.title, 
  p.manager, 
  p.manager_id,
  p.status,
  p.progress
FROM projects p
ORDER BY p.created_at DESC;

-- =====================================================
-- 5. 验证项目成员表
-- =====================================================
SELECT 
  pm.project_id, 
  pm.member_id, 
  pm.role,
  p.title as project_title
FROM project_members pm
JOIN projects p ON pm.project_id = p.id
WHERE pm.member_id = 'kexin'
ORDER BY pm.role;
