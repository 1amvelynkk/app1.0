
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { Workspace } from './views/Workspace';
import { Organization } from './views/Organization';
import { AIChat } from './views/AIChat';
import { ProjectList } from './views/ProjectList';
import { Profile } from './views/Profile';
import ProjectDetail from './views/ProjectDetail';
import { CreateProject } from './views/CreateProject';
import { Notifications } from './views/Notifications';
import { Tab, Department, Member, ProjectActivity, Project, ProjectRating } from './types';
import { supabase } from './lib/supabaseClient';
import { aiService } from './lib/aiService';

// Initial Data Construction
const initialOrgData: Department = {
  id: 'root',
  name: '集团总部',
  enName: 'Group Headquarters',
  count: '21人',
  level: 0,
  members: [],
  children: [
    {
      id: 'rnd',
      name: '研发中心',
      enName: 'R&D Center',
      count: '9人',
      level: 1,
      members: [],
      children: [
        {
          id: 'frontend',
          name: '前端开发部',
          enName: 'Frontend Department',
          count: '3人',
          level: 2,
          members: [
            { id: 'm1', name: "林木风", role: "资深前端专家", title: "资深前端专家", dept: "前端开发部", projectCount: 3, status: "online", tags: ['Vue', 'React', 'Arco'], avatar: "https://picsum.photos/seed/lin/100", joinDays: 800, projects: [{ id: 'p1', title: 'Q4市场战略', role: '参与者' }] },
            { id: 'm2', name: "陈雪依", role: "中级开发工程师", title: "中级开发工程师", dept: "前端开发部", projectCount: 1, status: "offline", tags: ['React', 'Tailwind'], avatar: "https://picsum.photos/seed/chen/100", joinDays: 300, projects: [] },
            { id: 'm3', name: "张宏伟", role: "前端团队负责人", title: "前端团队负责人", dept: "前端开发部", projectCount: 5, status: "busy", tags: ['Management', 'Architecture'], avatar: "https://picsum.photos/seed/zhanghw/100", joinDays: 1500, projects: [] }
          ]
        },
        {
          id: 'backend',
          name: '后端开发部',
          enName: 'Backend Department',
          count: '3人',
          level: 2,
          members: [
            { id: 'm4', name: "李思", role: "Java 专家", title: "Java 专家", dept: "后端开发部", projectCount: 4, status: "online", tags: ['Java', 'Spring'], avatar: "https://picsum.photos/seed/lisi/100", joinDays: 600, projects: [] },
            { id: 'm5', name: "王五", role: "Go 开发", title: "Go 开发", dept: "后端开发部", projectCount: 2, status: "busy", tags: ['Go', 'K8s'], avatar: "https://picsum.photos/seed/wangwu/100", joinDays: 450, projects: [] },
            { id: 'm5-1', name: "赵六", role: "架构师", title: "系统架构师", dept: "后端开发部", projectCount: 6, status: "online", tags: ['Microservices'], avatar: "https://picsum.photos/seed/zhaoliu/100", joinDays: 1200, projects: [] }
          ]
        },
        {
          id: 'ai-lab',
          name: 'AI 实验室',
          enName: 'AI Laboratory',
          count: '3人',
          level: 2,
          members: [
            { id: 'ai1', name: "Dr. Wu", role: "AI 科学家", title: "首席科学家", dept: "AI 实验室", projectCount: 2, status: "online", tags: ['LLM', 'Python'], avatar: "https://picsum.photos/seed/drwu/100", joinDays: 200, projects: [] },
            { id: 'ai2', name: "Alex", role: "算法工程师", title: "算法工程师", dept: "AI 实验室", projectCount: 4, status: "busy", tags: ['PyTorch'], avatar: "https://picsum.photos/seed/alex/100", joinDays: 400, projects: [] },
            { id: 'ai3', name: "Sarah", role: "数据分析师", title: "数据分析师", dept: "AI 实验室", projectCount: 1, status: "offline", tags: ['Data Mining'], avatar: "https://picsum.photos/seed/sarah/100", joinDays: 150, projects: [] }
          ]
        }
      ]
    },
    {
      id: 'product',
      name: '产品设计中心',
      enName: 'Product & Design',
      count: '3人',
      level: 1,
      members: [],
      children: [
        {
          id: 'design',
          name: 'UI 设计部',
          enName: 'UI Design Dept',
          count: '3人',
          level: 2,
          members: [
            { id: 'm6', name: "张欣", role: "UI 设计师", title: "UI 设计师", dept: "UI 设计部", projectCount: 3, status: "online", tags: ['Figma', 'Sketch'], avatar: "https://picsum.photos/seed/zhangxin/100", joinDays: 700, projects: [] },
            { id: 'm7', name: "Kiki", role: "交互设计师", title: "交互设计师", dept: "UI 设计部", projectCount: 2, status: "busy", tags: ['UX', 'Protopie'], avatar: "https://picsum.photos/seed/kiki/100", joinDays: 500, projects: [] },
            { id: 'm8', name: "Leo", role: "视觉专家", title: "视觉专家", dept: "UI 设计部", projectCount: 4, status: "online", tags: ['C4D', 'Blender'], avatar: "https://picsum.photos/seed/leo/100", joinDays: 900, projects: [] }
          ]
        }
      ]
    },
    {
      id: 'admin',
      name: '行政与人力',
      enName: 'Admin & HR',
      count: '9人',
      level: 1,
      members: [],
      children: [
        {
          id: 'hr',
          name: '人力资源部',
          enName: 'HR Dept',
          count: '3人',
          level: 2,
          members: [
            { id: 'hr1', name: "HRD", role: "人力总监", title: "人力总监", dept: "人力资源部", projectCount: 2, status: "busy", tags: ['Recruitment'], avatar: "https://picsum.photos/seed/hrd/100", joinDays: 2000, projects: [] },
            { id: 'hr2', name: "Amy", role: "招聘经理", title: "招聘经理", dept: "人力资源部", projectCount: 5, status: "online", tags: ['Hiring'], avatar: "https://picsum.photos/seed/amy/100", joinDays: 600, projects: [] },
            { id: 'hr3', name: "Ben", role: "薪酬专员", title: "薪酬专员", dept: "人力资源部", projectCount: 1, status: "offline", tags: ['C&B'], avatar: "https://picsum.photos/seed/ben/100", joinDays: 300, projects: [] }
          ]
        },
        {
          id: 'admin-dept',
          name: '行政部',
          enName: 'Administration',
          count: '3人',
          level: 2,
          members: [
            { id: 'adm1', name: "行政小李", role: "行政主管", title: "行政主管", dept: "行政部", projectCount: 10, status: "online", tags: ['Event'], avatar: "https://picsum.photos/seed/adm1/100", joinDays: 800, projects: [] },
            { id: 'adm2', name: "Tom", role: "资产管理", title: "资产管理", dept: "行政部", projectCount: 2, status: "offline", tags: ['Assets'], avatar: "https://picsum.photos/seed/tom/100", joinDays: 400, projects: [] },
            { id: 'adm3', name: "Jerry", role: "前台接待", title: "前台接待", dept: "行政部", projectCount: 0, status: "online", tags: ['Service'], avatar: "https://picsum.photos/seed/jerry/100", joinDays: 100, projects: [] }
          ]
        },
        {
          id: 'finance-dept',
          name: '财务部',
          enName: 'Finance Dept',
          count: '2人',
          level: 2,
          members: [
            { id: 'm_wang_jl', name: "王经理", role: "财务经理", title: "财务经理", dept: "财务部", projectCount: 2, status: "online", tags: ['Finance', 'Audit'], avatar: "https://picsum.photos/seed/wangjl/100", joinDays: 800, projects: [] },
            { id: 'm_zhao', name: "赵会计", role: "财务主管", title: "财务主管", dept: "财务部", projectCount: 2, status: "busy", tags: ['Finance'], avatar: "https://picsum.photos/seed/zhao/100", joinDays: 500, projects: [] }
          ]
        },
        {
          id: 'legal-dept',
          name: '法务部',
          enName: 'Legal Dept',
          count: '1人',
          level: 2,
          members: [
            { id: 'm_li_ls', name: "李律师", role: "法务顾问", title: "法务顾问", dept: "法务部", projectCount: 1, status: "online", tags: ['Legal', 'Compliance'], avatar: "https://picsum.photos/seed/lils/100", joinDays: 600, projects: [] }
          ]
        }
      ]
    }
  ]
};

const initialActivities: ProjectActivity[] = [
  // AI suggestions (purple)
  { id: 'ai1', userName: 'AI 助手', userAvatar: 'https://picsum.photos/seed/aibot/100', action: '发现', target: '李工最近完成了类似项目', projectTitle: 'Alpha 研发项目', projectId: 'alpha', time: '5分钟前', type: 'ai', category: 'ai' },
  { id: 'ai2', userName: 'AI 助手', userAvatar: 'https://picsum.photos/seed/aibot/100', action: '建议', target: '提前安排下周的评审会议', projectTitle: 'CRM 系统二期功能迭代', projectId: 'crm-v2', time: '30分钟前', type: 'ai', category: 'ai' },
  { id: 'ai3', userName: 'AI 助手', userAvatar: 'https://picsum.photos/seed/aibot/100', action: '预警', target: '项目进度可能延期，建议增加资源', projectTitle: 'UI 设计图验收', projectId: 'ui-design', time: '1小时前', type: 'ai', category: 'ai' },
  // Regular activities
  { id: 'a1', userName: '李思思', userAvatar: 'https://picsum.photos/seed/lisi/100', action: '上传了', target: '市场调研报告 v1.2', projectTitle: 'Q4 市场增长战略', projectId: 'q4-market', time: '10分钟前', type: 'upload' },
  { id: 'a2', userName: '张大千', userAvatar: 'https://picsum.photos/seed/zhang/100', action: '审核通过了', target: '后端接口文档', projectTitle: 'CRM 系统二期功能迭代', projectId: 'crm-v2', time: '1小时前', type: 'review' },
  { id: 'a3', userName: '王可欣', userAvatar: 'https://picsum.photos/seed/kexin/200', action: '完成了', target: '首页 UI 走查', projectTitle: 'UI 设计图验收', projectId: 'ui-design', time: '昨天 16:30', type: 'task' },
];

const initialProjects: Project[] = [
  {
    id: 'q3-finance',
    title: "Q3 财务报表审计",
    manager: "赵会计",
    department: "财务部",
    progress: 95,
    status: 'normal',
    deadline: "今天",
    role: 'participant',
    hasPermission: true,
    milestones: [
      { title: "数据收集", date: "昨天", status: "completed", responsible: "赵会计" },
      { title: "合规性自查", date: "今天 23:00", status: "active", responsible: "赵会计", alert: "待录入" }
    ],
    members: [
      { id: 'kexin', name: '王可欣', avatar: 'https://picsum.photos/seed/kexin/200', dept: '产品设计中心' },
      { id: 'm1', name: '林木风', avatar: 'https://picsum.photos/seed/lin/100', dept: '前端开发部' }
    ]
  },
  {
    id: 'q4-market',
    title: "Q4 市场增长战略",
    manager: "李思思",
    department: "市场营销部",
    progress: 42,
    estimatedHours: 320,
    status: "delayed",
    deadline: "剩 3 天",
    role: 'participant',
    hasPermission: true,
    visibility: 'public',
    members: [
      { id: 'kexin', name: '王可欣', avatar: 'https://picsum.photos/seed/kexin/200', dept: '产品设计中心' },
      { id: 'm2', name: '陈雪依', avatar: 'https://picsum.photos/seed/chen/100', dept: '前端开发部' },
      { id: 'm3', name: '张宏伟', avatar: 'https://picsum.photos/seed/zhanghw/100', dept: '前端开发部' }
    ]
  },
  {
    id: 'ui-design',
    title: "UI 设计图验收",
    manager: "王可欣",
    department: "产品设计部",
    progress: 80,
    estimatedHours: 180,
    status: "normal",
    deadline: "明天",
    role: 'manager',
    hasPermission: true,
    milestones: [
      { title: "草案设计", date: "前天", status: "completed", responsible: "王可欣" },
      { title: "收尾审核", date: "今天 17:00", status: "active", responsible: "王可欣", alert: "今天到期" }
    ],
    members: [
      { id: 'kexin', name: '王可欣', avatar: 'https://picsum.photos/seed/kexin/200', dept: '产品设计中心' },
      { id: 'm3', name: '张宏伟', avatar: 'https://picsum.photos/seed/zhanghw/100', dept: '前端开发部' }
    ]
  },
  {
    id: 'alpha',
    title: "Alpha 研发项目",
    manager: "王可欣",
    department: "研发中心",
    progress: 75,
    estimatedHours: 560,
    status: "ongoing",
    deadline: "2024-12-01",
    role: 'manager',
    hasPermission: true,
    visibility: 'public'
  },
  {
    id: 'crm-v2',
    title: "CRM 系统二期功能迭代",
    manager: "张大千",
    department: "技术研发部",
    progress: 85,
    estimatedHours: 480,
    status: "ongoing",
    deadline: "今天 20:00",
    role: 'participant',
    hasPermission: true,
    visibility: 'members',
    milestones: [
      { title: "数据迁移", date: "昨天", status: "completed", responsible: "张大千" },
      { title: "功能测试", date: "今天 20:00", status: "active", responsible: "王可欣", alert: "待确认" }
    ],
    members: [
      { id: 'kexin', name: '王可欣', avatar: 'https://picsum.photos/seed/kexin/200', dept: '产品设计中心' },
      { id: 'm4', name: '张大千', avatar: 'https://picsum.photos/seed/zhang/100', dept: '技术研发部' }
    ]
  },
  {
    id: 'hw-v3',
    title: "智能硬件 V3.0 设计",
    manager: "王可欣",
    department: "硬件部",
    progress: 60,
    estimatedHours: 720,
    status: "normal",
    deadline: "2024-12-15",
    role: 'manager',
    hasPermission: true,
    visibility: 'public'
  },
  {
    id: 'salary-adjust',
    title: "2024 年度薪酬结构调整",
    manager: "王可欣",
    department: "人力资源部",
    progress: 0,
    status: "locked",
    deadline: "-",
    role: 'manager',
    hasPermission: false,
    visibility: 'members'
  },
  {
    id: 'ai-customer',
    title: "AI 客服系统重构",
    manager: "王可欣",
    department: "研发中心",
    progress: 15,
    status: "ongoing",
    deadline: "2025-01-20",
    role: 'manager',
    hasPermission: true,
    visibility: 'members'
  },
  {
    id: 'travel-plan',
    title: "年度员工旅游策划",
    manager: "王可欣",
    department: "行政部",
    progress: 90,
    status: "normal",
    deadline: "本周五",
    role: 'manager',
    hasPermission: true,
    visibility: 'public'
  },
  {
    id: 'core-data',
    title: "核心数据库迁移",
    manager: "王可欣",
    department: "技术委员会",
    progress: 5,
    status: "locked",
    deadline: "-",
    role: 'manager',
    hasPermission: false,
    visibility: 'members'
  }
];

// Navigation State for back button
interface NavigationState {
  tab: Tab;
  view: string;
  filter?: 'all' | 'my' | 'participated' | 'followed';
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.Workspace);
  const [currentView, setCurrentView] = useState<string>('main');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Demo Mode detection
  const isDemoMode = useMemo(() => {
    return new URLSearchParams(window.location.search).get('mode') === 'demo';
  }, []);

  const [previousNavState, setPreviousNavState] = useState<NavigationState | null>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [projectListFilter, setProjectListFilter] = useState<'all' | 'my' | 'participated' | 'followed'>('all');
  const [prefilledMembers, setPrefilledMembers] = useState<any[]>([]);

  const [orgData, setOrgData] = useState<Department>(initialOrgData);
  const [projectActivities, setProjectActivities] = useState<ProjectActivity[]>(initialActivities);
  const [followedProjectIds, setFollowedProjectIds] = useState<string[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>(initialProjects);
  const [allRatings, setAllRatings] = useState<ProjectRating[]>([]);
  const [user, setUser] = useState({
    name: "王可欣",
    id: "kexin", // Added ID
    title: "高级产品经理",
    dept: "研发中心",
    avatar: "https://picsum.photos/seed/kexin/200",
    joinDays: 1240,
    projects: [] as any[]
  });

  // Fetch Initial Data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Projects
        const { data: projectsData } = await supabase
          .from('projects')
          .select(`
            *,
            project_members (
              member_id,
              role
            )
          `)
          .order('created_at', { ascending: false });

        if (projectsData) {
          const dbProjects = projectsData.map((p: any) => ({
            ...p,
            hasPermission: true,
            role: p.project_members?.find((m: any) => m.member_id === user.id)?.role || 'none'
          }));

          setAllProjects(prev => {
            const dbProjectMap = new Map(dbProjects.map(p => [p.id, p]));

            // Update hardcoded projects with DB values if they exist in database
            const mergedHardcoded = prev.filter(p => !p.created_at).map(localProject => {
              const dbVersion = dbProjectMap.get(localProject.id);
              if (dbVersion) {
                // Merge DB values (progress, status, role) into local project to persist changes
                const updatedMembers = dbVersion.role === 'none'
                  ? (localProject.members?.filter((m: any) => m.id !== user.id && m.name !== user.name) || [])
                  : localProject.members;

                return {
                  ...localProject,
                  progress: dbVersion.progress,
                  status: dbVersion.status,
                  role: dbVersion.role, // PERSIST PERMANENT LEAVE
                  members: updatedMembers
                };
              }
              return localProject;
            });

            // Add DB projects that don't have hardcoded versions
            const hardcodedIds = new Set(prev.filter(p => !p.created_at).map(p => p.id));
            const newDbProjects = dbProjects.filter(p => !hardcodedIds.has(p.id));

            return [...mergedHardcoded, ...newDbProjects];
          });
        }

        // Fetch Activities
        const { data: activitiesData } = await supabase
          .from('activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (activitiesData && activitiesData.length > 0) {
          const dbActivities = activitiesData.map((a: any) => ({
            ...a,
            id: a.id.toString(),
            projectId: a.project_id,
            projectTitle: a.project_title,
            time: a.time_text,
            userName: a.user_name,
            userAvatar: a.user_avatar
          }));

          setProjectActivities(prev => {
            const existingIds = new Set(prev.map(act => act.id));
            const uniqueDbActivities = dbActivities.map(act => {
              // Map types to categories based on action/type
              let category: 'alert' | 'update' | 'ai' = 'update';
              if (act.type === 'task' || act.action.includes('到期')) category = 'alert';
              else if (act.type === 'ai') category = 'ai';

              return { ...act, category };
            }).filter(a => !existingIds.has(a.id));
            return [...uniqueDbActivities, ...prev];
          });
        }

        // Only update orgData if Supabase has data (to keep examples)
        const { data: deptCount } = await supabase.from('departments').select('id', { count: 'exact', head: true });
        if (deptCount && (deptCount as any).count > 0) {
          // Recursive fetch logic could be here if needed for full sync
        }

        // Fetch Ratings
        const { data: ratingsData } = await supabase.from('project_ratings').select('*');
        if (ratingsData) setAllRatings(ratingsData);

        // Fetch Follows
        const { data: followsData } = await supabase
          .from('project_follows')
          .select('project_id')
          .eq('member_id', user.id);

        if (followsData) {
          setFollowedProjectIds(followsData.map((f: any) => f.project_id));
        }
      } catch (err) {
        console.error('Failed to fetch from Supabase:', err);
      }
    };

    fetchData();
  }, [user.id]);

  // Generate dynamic AI suggestions from real project and member data
  useEffect(() => {
    const generateDynamicAISuggestions = async () => {
      // Collect all members from org structure
      const collectMembers = (dept: Department): Member[] => {
        let members: Member[] = [...(dept.members || [])];
        if (dept.children) {
          dept.children.forEach(child => {
            members = [...members, ...collectMembers(child)];
          });
        }
        return members;
      };

      const allMembers = collectMembers(orgData);

      if (allProjects.length > 0 && allMembers.length > 0) {
        try {
          console.log('Calling AI to generate dynamic suggestions...');
          const suggestions = await aiService.generateAISuggestions(allProjects, allMembers, user.name);

          if (suggestions && suggestions.length > 0) {
            // Convert AI suggestions to ProjectActivity format and add to activities
            const aiActivities: ProjectActivity[] = suggestions.slice(0, 3).map((s: any, idx: number) => ({
              id: `ai-dynamic-${idx}`,
              userName: 'AI 助手',
              userAvatar: 'https://picsum.photos/seed/aibot/100',
              action: s.action || '建议',
              target: s.target || '智能管理建议',
              projectTitle: s.projectTitle || allProjects[0]?.title || '项目',
              projectId: s.projectId || allProjects[0]?.id || 'p1',
              time: ['刚刚', '5分钟前', '10分钟前'][idx] || '刚刚',
              type: 'ai' as const,
              category: 'ai' as const
            }));

            // Replace hardcoded AI suggestions with dynamic ones
            setProjectActivities(prev => {
              // Remove old hardcoded AI suggestions
              const nonAI = prev.filter(a => !a.id.startsWith('ai'));
              return [...aiActivities, ...nonAI];
            });
            console.log('Dynamic AI suggestions added:', aiActivities);
          }
        } catch (error) {
          console.error('Failed to generate AI suggestions:', error);
        }
      }
    };

    // Delay to allow initial data to load
    const timer = setTimeout(() => {
      generateDynamicAISuggestions();
    }, 2000);

    return () => clearTimeout(timer);
  }, [allProjects, orgData, user.name]);

  // Inject demo ratings for "王可欣" if empty
  useEffect(() => {
    if (allRatings.length === 0 && allProjects.length > 0) {
      const demoRatings: ProjectRating[] = [
        { id: 'r1', project_id: 'p1', rater_id: 'm88', ratee_id: user.id, score: 5, comment: '表现出色', created_at: '2026-01-15' },
        { id: 'r2', project_id: 'p2', rater_id: 'm1', ratee_id: user.id, score: 4, comment: '协作积极', created_at: '2026-01-20' }
      ];
      setAllRatings(demoRatings);
    }
  }, [allProjects.length, allRatings.length, user.id]);

  const urgentTasks = useMemo(() => {
    return allProjects.filter(p => {
      const isManager = p.manager_id === user.id || p.manager === user.name;
      const isParticipant = p.role === 'participant' || p.members?.some((m: any) => m.id === user.id || m.name === user.name);

      if (!isManager && !isParticipant) return false;

      // Get active milestones that are urgent (due within 24h)
      const urgentMilestones = p.milestones?.filter((m: any) =>
        m.status === 'active' &&
        (m.date.includes("今天") || m.date.includes("24小时") || m.alert)
      ) || [];

      if (isManager) {
        // Managers see ALL urgent milestones for their projects
        return urgentMilestones.length > 0 || p.deadline.includes("今天") || p.deadline.includes("2小时");
      }

      if (isParticipant && !isManager) {
        // Participants ONLY see urgent if they are the responsible person for an active urgent milestone
        // NOT for delayed projects (that's manager's responsibility) or project deadlines
        const hasMyUrgentMilestone = urgentMilestones.some((m: any) => m.responsible === user.name);
        return hasMyUrgentMilestone;
      }

      return false;
    });
  }, [allProjects, user.id, user.name]);

  const latestFollowedProject = useMemo(() => {
    if (followedProjectIds.length === 0) return null;
    const latestId = followedProjectIds[followedProjectIds.length - 1];
    return allProjects.find(p => p.id === latestId) || null;
  }, [allProjects, followedProjectIds]);

  const handleRemindMember = async (projectId: string, projectTitle: string, milestoneTitle: string) => {
    const newActivity: any = {
      user_name: user.name,
      user_avatar: user.avatar,
      action: '提醒了',
      target: '相关成员',
      project_title: projectTitle,
      project_id: projectId,
      time_text: '刚刚',
      type: 'task'
    };

    // 1. Insert into Supabase
    if (!isDemoMode) {
      await supabase.from('activities').insert(newActivity);
    }

    // 2. Update local state
    setProjectActivities(prev => [{
      ...newActivity,
      id: `temp-${Date.now()}`,
      time: '刚刚',
      userName: user.name,
      userAvatar: user.avatar,
      projectId: projectId,
      projectTitle: projectTitle
    }, ...prev]);
  };

  const navigateToProject = (id: string, context?: { tab?: Tab; view?: string; filter?: 'all' | 'my' | 'participated' | 'followed' }) => {
    setSelectedProjectId(id);
    setPreviousNavState({
      tab: context?.tab ?? currentTab,
      view: context?.view ?? 'main',
      filter: context?.filter ?? projectListFilter
    });
    setCurrentView('detail');
  };

  const navigateToCreate = () => {
    setPreviousNavState({ tab: currentTab, view: 'main' });
    setCurrentView('create');
  };

  const navigateToNotifications = () => {
    setPreviousNavState({ tab: currentTab, view: 'main' });
    setCurrentView('notifications');
  };

  const navigateToUserProfile = (targetUser: any) => {
    setViewingUser(targetUser);
    setPreviousNavState({
      tab: currentTab,
      view: currentView === 'notifications' ? 'notifications' : 'organization'
    });
    setCurrentView('user-profile');
  };

  const goBack = () => {
    if (previousNavState) {
      // Restore tab if coming back from detail/create/notifications
      if (currentView === 'detail' || currentView === 'create' || currentView === 'notifications') {
        setCurrentTab(previousNavState.tab);
        // Restore filter if returning to ProjectList
        if (previousNavState.tab === Tab.Project && previousNavState.filter) {
          setProjectListFilter(previousNavState.filter);
        }
      }

      if (currentView === 'detail' && previousNavState.view === 'notifications') {
        setCurrentView('notifications');
        return;
      }

      if (currentView === 'user-profile') {
        if (previousNavState.view === 'organization') {
          setCurrentView('main');
        } else {
          setCurrentView(previousNavState.view);
        }
        setViewingUser(null);
        return;
      }

      if (currentView === 'notifications') {
        setCurrentView('main');
        return;
      }
    }

    setCurrentView('main');
    setSelectedProjectId(null);
    setPreviousNavState(null);
  };

  const handleToggleFollow = async (id: string) => {
    const isFollowing = followedProjectIds.includes(id);

    // Optimistic UI update
    setFollowedProjectIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });

    if (isDemoMode) return;
    try {
      if (isFollowing) {
        // Unfollow in DB
        const { error } = await supabase
          .from('project_follows')
          .delete()
          .match({ member_id: user.id, project_id: id });

        if (error) throw error;
      } else {
        // Follow in DB
        const { error } = await supabase
          .from('project_follows')
          .insert({ member_id: user.id, project_id: id });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Rollback on error
      setFollowedProjectIds(prev => {
        if (isFollowing) return [...prev, id];
        return prev.filter(p => p !== id);
      });
    }
  };

  const handleUpdateProject = async (updatedProject: any) => {
    if (!isDemoMode) {
      const { error } = await supabase
        .from('projects')
        .update({
          title: updatedProject.title,
          progress: updatedProject.progress,
          status: updatedProject.status,
          deadline: updatedProject.deadline,
          description: updatedProject.description,
          visibility: updatedProject.visibility
        })
        .eq('id', updatedProject.id);

      if (error) {
        console.error('Error updating project:', error);
        return;
      }
    }

    setAllProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleCreateProject = async (newProjectData: any, selectedMembers: any[]) => {
    const newProjectId = `proj-${Date.now()}`;

    const newProject: Project = {
      id: newProjectId,
      title: newProjectData.name,
      manager: user.name, // Ensure manager name is included
      department: user.dept,
      progress: 0,
      status: 'normal',
      deadline: newProjectData.endDate || 'TBD',
      visibility: 'members',
      description: newProjectData.description,
      hasPermission: true,
      role: 'manager'
    };

    // Update local state immediately so user sees "it works"
    setAllProjects(prev => [{
      ...newProject,
      title: newProjectData.name,
      hasPermission: true,
      role: 'manager',
      members: selectedMembers
    }, ...prev]);

    // Navigate immediately
    setSelectedProjectId(newProjectId);
    setCurrentView('detail');

    // Perform database operations in background
    if (isDemoMode) return;
    try {
      // 1. Insert Project (Map to DB schema)
      const projectToInsert = {
        id: newProject.id,
        title: newProject.title,
        manager_id: user.id, // DB expects manager_id
        department: newProject.department,
        progress: newProject.progress,
        status: newProject.status,
        deadline: newProject.deadline,
        description: newProject.description,
        visibility: newProject.visibility
      };

      const { error: projectError } = await supabase
        .from('projects')
        .insert(projectToInsert);

      if (projectError) {
        console.error('Error creating project in DB:', projectError);
        return;
      }

      // 2. Insert Project Members
      const memberInserts = selectedMembers.map(m => ({
        project_id: newProjectId,
        member_id: m.id,
        role: 'participant'
      }));

      memberInserts.push({
        project_id: newProjectId,
        member_id: user.id,
        role: 'manager'
      });

      await supabase.from('project_members').insert(memberInserts);

      // 3. Insert Activities (Invitation + Creation)
      const creationActivity = {
        user_name: user.name,
        user_avatar: user.avatar,
        action: '创建了',
        target: '新项目',
        project_title: newProjectData.name,
        project_id: newProjectId,
        time_text: '刚刚',
        type: 'task'
      };

      const invitationActivities = selectedMembers.map(m => ({
        user_name: user.name,
        user_avatar: user.avatar,
        action: '邀请了',
        target: m.name,
        project_title: newProjectData.name,
        project_id: newProjectId,
        time_text: '刚刚',
        type: 'invite'
      }));

      const allActivityInserts = [creationActivity, ...invitationActivities];

      await supabase.from('activities').insert(allActivityInserts);

      const newActivitiesMapped = allActivityInserts.map((a, index) => ({
        ...a,
        id: `temp-${Date.now()}-${index}`,
        time: a.time_text,
        userName: a.user_name,
        userAvatar: a.user_avatar,
        projectId: a.project_id,
        projectTitle: a.project_title,
        type: a.type as any
      }));
      setProjectActivities(prev => [...newActivitiesMapped, ...prev]);

      // Also update User's local project list to show in Profile
      setUser(prev => ({
        ...prev,
        projects: [...(prev.projects || []), { id: newProject.id, title: newProject.title, role: '负责人' }]
      }));
    } catch (err) {
      console.error('Database operation failed:', err);
    }
  };

  const handleAcceptProject = async (projectId: string) => {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return;

    try {
      const newActivity: any = {
        user_name: user.name,
        user_avatar: user.avatar,
        action: '接受了',
        target: '项目邀请',
        project_title: project.title,
        project_id: projectId,
        time_text: '刚刚',
        type: 'accept'
      };

      if (!isDemoMode) {
        await supabase.from('activities').insert(newActivity);
      }

      setProjectActivities(prev => [{
        id: `temp-${Date.now()}`,
        userName: user.name,
        userAvatar: user.avatar,
        action: '接受了',
        target: '项目邀请',
        projectTitle: project.title,
        projectId: projectId,
        time: '刚刚',
        type: 'accept'
      }, ...prev]);

      alert(`已接受项目：${project.title}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRateMember = async (projectId: string, rateeId: string, score: number) => {
    if (isDemoMode) {
      setAllRatings(prev => {
        const filtered = prev.filter(r => !(r.project_id === projectId && r.rater_id === user.id && r.ratee_id === rateeId));
        return [...filtered, { project_id: projectId, rater_id: user.id, ratee_id: rateeId, score: score, id: `demo-${Date.now()}` }];
      });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('project_ratings')
        .upsert({
          project_id: projectId,
          rater_id: user.id,
          ratee_id: rateeId,
          score: score
        }, { onConflict: 'project_id,rater_id,ratee_id' })
        .select();

      if (error) throw error;

      if (data) {
        setAllRatings(prev => {
          const filtered = prev.filter(r => !(r.project_id === projectId && r.rater_id === user.id && r.ratee_id === rateeId));
          return [...filtered, data[0]];
        });
      }
    } catch (err) {
      console.error('Rating failed:', err);
      alert('评分失败');
    }
  };

  const handleInviteMember = async (memberId: string, projectTitle: string) => {
    let invitedMemberName = '';

    const project = allProjects.find(p => p.title === projectTitle);
    const pid = project ? project.id : 'unknown';

    try {
      // 3. Insert Activity record in Supabase
      if (!isDemoMode) {
        // 1. Insert Project Member (Wrap in demo check)
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: pid,
            member_id: memberId,
            role: 'participant'
          });

        if (memberError) {
          console.error('Error inviting member:', memberError);
          return;
        }

        const newActivityInDB: any = {
          user_name: user.name,
          user_avatar: user.avatar,
          action: '邀请了',
          target: invitedMemberName || '用户',
          project_title: projectTitle,
          project_id: pid,
          time_text: '刚刚',
          type: 'invite'
        };

        await supabase.from('activities').insert(newActivityInDB);
      }

      // 4. Update local activities state
      setProjectActivities(prev => [{
        id: `temp-${Date.now()}`,
        userName: user.name,
        userAvatar: user.avatar,
        action: '邀请了',
        target: invitedMemberName || '用户',
        projectTitle: projectTitle,
        projectId: pid,
        time: '刚刚',
        type: 'invite'
      }, ...prev]);

      // 5. Update local organization state (optimistic update)
      const updateMemberInTree = (node: Department): Department => {
        const updatedMembers = node.members.map(m => {
          if (m.id === memberId) {
            if (m.projects?.some(p => p.title === projectTitle)) return m;
            return {
              ...m,
              projects: [...(m.projects || []), { id: pid, title: projectTitle, role: '参与者' }],
              projectCount: (m.projectCount || 0) + 1
            };
          }
          return m;
        });

        const updatedChildren = node.children?.map(child => updateMemberInTree(child));

        return {
          ...node,
          members: updatedMembers,
          children: updatedChildren
        };
      };
      setOrgData(prev => updateMemberInTree(prev));

      // 6. Update local allProjects state (optimistic update)
      // We need to add this person to the project's member list
      const flattenMembers = (node: Department): Member[] => {
        const members = [...node.members];
        if (node.children) {
          node.children.forEach(child => members.push(...flattenMembers(child)));
        }
        return members;
      };
      const allMembersFlat = flattenMembers(orgData);

      setAllProjects(prev => prev.map(p => {
        if (p.id === pid) {
          const alreadyIn = p.members?.some((m: any) => m.id === memberId);
          if (alreadyIn) return p;

          const invitedMember = allMembersFlat.find(m => m.id === memberId);
          return {
            ...p,
            members: [...(p.members || []), {
              id: memberId,
              name: invitedMember?.name || '新成员',
              avatar: invitedMember?.avatar || 'https://picsum.photos/seed/new/50',
              dept: invitedMember?.dept || '未知部门'
            }]
          };
        }
        return p;
      }));

      setOrgData(prev => updateMemberInTree(prev));

      if (viewingUser && viewingUser.id === memberId) {
        setViewingUser((prev: any) => ({
          ...prev,
          projects: [...(prev.projects || []), { id: pid, title: projectTitle, role: '参与者' }],
          projectCount: (prev.projectCount || 0) + 1
        }));
      }
    } catch (err) {
      console.error('Invite member flow failed:', err);
    }
  };

  const handleLeaveProject = async (projectId: string) => {
    if (isDemoMode) {
      updateLocalState(projectId);
      return;
    }

    try {
      // 0. Ensure project exists in DB if it's a demo project
      const project = allProjects.find(p => (p.id || (p as any).projectId) === projectId);
      if (project && !project.created_at) {
        await supabase.from('projects').upsert({
          id: project.id,
          title: project.title,
          manager: project.manager || '未知',
          department: project.department || '未知',
          progress: project.progress,
          status: project.status,
          deadline: project.deadline
        });
      }

      // 1. Remove from Supabase project_members
      const { error } = await supabase
        .from('project_members')
        .delete()
        .match({ project_id: projectId, member_id: user.id });

      if (error) {
        console.error('Error leaving project:', error);
        alert('退出失败');
        return;
      }

      updateLocalState(projectId);
    } catch (err) {
      console.error('Leave project failed:', err);
    }
  };

  const updateLocalState = (pid: string) => {
    // 2. Update local state
    setAllProjects(prev => prev.map(p => {
      if ((p.id || (p as any).projectId) === pid) {
        return {
          ...p,
          role: 'none',
          members: p.members?.filter((m: any) => m.id !== user.id && m.name !== user.name) || []
        };
      }
      return p;
    }));
    setSelectedProjectId(null);
    setCurrentView('main');

    alert('已成功退出项目');
  };

  // Mark project as 100% complete and sync to database
  const handleMarkComplete = async (projectId: string) => {
    if (!window.confirm('确定要标记此项目为已完成吗？此操作将把进度设为100%。')) return;

    try {
      // 1. Update progress to 100% in Supabase
      if (!isDemoMode) {
        const { error } = await supabase
          .from('projects')
          .update({ progress: 100, status: 'done' })
          .eq('id', projectId);

        if (error) {
          console.error('Error marking project complete:', error);
          alert('标记失败，请重试');
          return;
        }
      }

      // 2. Update local state
      setAllProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, progress: 100, status: 'done' } : p
      ));

      alert('项目已标记为完成！');
    } catch (err) {
      console.error('Mark complete failed:', err);
      alert('操作失败');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('确定要删除此项目吗？该操作不可撤销。')) return;

    try {
      // 1. Delete from Supabase
      if (!isDemoMode) {
        await supabase.from('activities').delete().eq('project_id', projectId);
        await supabase.from('project_members').delete().eq('project_id', projectId);
        const { error } = await supabase.from('projects').delete().eq('id', projectId);

        if (error) {
          console.error('Error deleting project:', error);
          return;
        }
      }

      // 2. Update local state
      setAllProjects(prev => prev.filter(p => (p.id || (p as any).projectId) !== projectId));
      setProjectActivities(prev => prev.filter(act => act.projectId !== projectId));
      setSelectedProjectId(null);
      setCurrentView('main');

      alert('项目及相关动态已成功删除');
    } catch (err) {
      console.error('Delete flow failed:', err);
    }
  };

  const renderContent = () => {
    if (currentView === 'detail') {
      return (
        <ProjectDetail
          onBack={goBack}
          projectId={selectedProjectId}
          fromNotification={previousNavState?.view === 'notifications'}
          organizationData={orgData}
          onInviteMember={handleInviteMember}
          onRemind={handleRemindMember}
          onToggleFollow={handleToggleFollow}
          onViewProfile={navigateToUserProfile}
          onDeleteProject={handleDeleteProject}
          onLeaveProject={handleLeaveProject}
          onRateMember={handleRateMember}
          onMarkComplete={handleMarkComplete}
          allRatings={allRatings}
          followedProjectIds={followedProjectIds}
          allProjects={allProjects}
        />
      );
    }
    if (currentView === 'create') {
      return (
        <CreateProject
          onBack={goBack}
          orgData={orgData}
          onCreateProject={handleCreateProject}
          allProjects={allProjects}
          prefilledMembers={prefilledMembers}
          onPrefilledMembersUsed={() => setPrefilledMembers([])}
        />
      );
    }
    if (currentView === 'notifications') {
      return (
        <Notifications
          onBack={goBack}
          onProjectClick={(id) => navigateToProject(id, { view: 'notifications' })}
          onViewProfile={navigateToUserProfile}
          activities={projectActivities}
          onDeleteActivities={(ids) => {
            // Remove deleted activities from state
            setProjectActivities(prev => prev.filter(a => !ids.includes(a.id)));
          }}
        />
      );
    }
    if (currentView === 'user-profile' && viewingUser) {
      return (
        <Profile
          user={viewingUser}
          setUser={() => { }}
          readOnly={true}
          onBack={goBack}
          onInviteMember={handleInviteMember}
          onViewProfile={navigateToUserProfile}
          allProjects={allProjects}
          allRatings={allRatings}
        />
      );
    }

    switch (currentTab) {
      case Tab.Workspace:
        return (
          <Workspace
            user={user}
            onNavigateToProject={(id) => navigateToProject(id, { tab: Tab.Workspace, view: 'main' })}
            onNavigateToCreate={navigateToCreate}
            onNavigateToNotifications={navigateToNotifications}
            activities={projectActivities}
            urgentTasks={urgentTasks}
            latestFollowedProject={latestFollowedProject}
            onAcceptProject={handleAcceptProject}
            allProjects={allProjects}
          />
        );
      case Tab.Organization:
        return (
          <Organization
            onNavigateToNotifications={navigateToNotifications}
            onViewProfile={navigateToUserProfile}
            data={orgData}
          />
        );
      case Tab.AI:
        return (
          <AIChat
            onNavigateToNotifications={navigateToNotifications}
            onSwitchToOrg={() => setCurrentTab(Tab.Organization)}
            onCreateProject={(members) => {
              // Navigate to create project page with prefilled members
              setCurrentTab(Tab.Project);
              setCurrentView('create');
              // Store prefilled members for CreateProject to use
              if (members && members.length > 0) {
                setPrefilledMembers(members);
              }
            }}
            orgData={orgData}
          />
        );
      case Tab.Project:
        return (
          <ProjectList
            onNavigateToProject={(id, context) => navigateToProject(id, { tab: Tab.Project, view: 'main', filter: context?.filter })}
            onNavigateToNotifications={navigateToNotifications}
            followedProjects={new Set(followedProjectIds)}
            onToggleFollow={handleToggleFollow}
            projects={allProjects}
            onUpdateProject={handleUpdateProject}
            initialFilter={projectListFilter}
            onFilterChange={setProjectListFilter}
          />
        );
      case Tab.My:
        return (
          <Profile
            user={user}
            setUser={setUser}
            onViewProfile={navigateToUserProfile}
            orgData={orgData}
            allProjects={allProjects}
            allRatings={allRatings}
          />
        );
      default:
        return (
          <Workspace
            user={user}
            onNavigateToProject={(id) => navigateToProject(id, { tab: Tab.Workspace, view: 'main' })}
            onNavigateToCreate={navigateToCreate}
            onNavigateToNotifications={navigateToNotifications}
            activities={projectActivities}
            urgentTasks={urgentTasks}
            latestFollowedProject={latestFollowedProject}
            onAcceptProject={handleAcceptProject}
            allProjects={allProjects}
          />
        );
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onTabChange={(tab) => {
        setCurrentTab(tab);
        setCurrentView('main');
      }}
      hideBottomNav={currentView !== 'main' && currentTab !== Tab.AI}
    >
      {renderContent()}
    </Layout>
  );
}
