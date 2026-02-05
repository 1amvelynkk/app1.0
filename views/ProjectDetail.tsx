
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, MoreHorizontal, Bell, Clock, AlertCircle, Check, Plus, PenTool, Layout, FileImage, FileText, CheckCircle2, Lock, ListChecks, X, Search, Filter, Users, Sparkles, Bookmark, Star, ThumbsUp, ThumbsDown, Eye, EyeOff } from 'lucide-react';
import { Department, Member, Project, ProjectRating } from '../types';
import { aiService } from '../lib/aiService';
import { supabase } from '../lib/supabaseClient';

interface ProjectDetailProps {
  onBack: () => void;
  projectId: string | null;
  fromNotification?: boolean;
  organizationData: Department;
  onInviteMember: (memberId: string, projectTitle: string) => void;
  onRemind: (projectId: string, projectTitle: string, milestoneTitle: string) => void;
  onToggleFollow: (projectId: string) => void;
  onViewProfile: (user: any) => void;
  followedProjectIds: string[];
  allProjects: Project[];
  allRatings: ProjectRating[];
  onDeleteProject: (projectId: string) => void;
  onLeaveProject: (projectId: string) => void;
  onRateMember: (projectId: string, memberId: string, score: number) => void;
  onMarkComplete?: (projectId: string) => void;
  onUpdateProject?: (project: any) => void;
  currentUser?: any;
}

export default function ProjectDetail({
  onBack,
  projectId,
  fromNotification,
  organizationData,
  onInviteMember,
  onRemind,
  onToggleFollow,
  onViewProfile,
  followedProjectIds,
  allProjects,
  allRatings,
  onDeleteProject,
  onLeaveProject,
  onRateMember,
  onMarkComplete,
  onUpdateProject,
  currentUser
}: ProjectDetailProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'remind' | 'invite' | 'upload' | 'rating'>('remind');
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('全部');
  const [projectInsight, setProjectInsight] = useState<string>('');
  // Material Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingMaterial, setReviewingMaterial] = useState<any>(null);
  const [materialNotUploaded, setMaterialNotUploaded] = useState(false);

  const isFollowed = followedProjectIds.includes(projectId || '');

  // 使用从 props 传入的 currentUser，如果没有则默认为 "王可欣"
  const currentUserName = currentUser?.name || "王可欣";

  // Find the project from global list
  const foundProject = allProjects.find(p => p.id === projectId);

  useEffect(() => {
    if (foundProject) {
      aiService.getProjectInsights(foundProject.title, foundProject.progress, milestonesTemplate)
        .then(setProjectInsight);
    }
  }, [projectId]);

  // Handle the remind action
  const handleRemind = (milestoneTitle: string) => {
    if (projectId && foundProject) {
      onRemind(projectId, foundProject.title, milestoneTitle);
      setToastType('remind');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  // Flatten organization data for the modal
  const allMembers = useMemo(() => {
    const members: Member[] = [];
    const traverse = (node: Department) => {
      if (node.members) members.push(...node.members);
      if (node.children) node.children.forEach(traverse);
    };
    traverse(organizationData);
    return members;
  }, [organizationData]);

  // Extract all department names for filter
  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    const traverse = (node: Department) => {
      if (node.members.length > 0) depts.add(node.name);
      if (node.children) node.children.forEach(traverse);
    };
    traverse(organizationData);
    return ['全部', ...Array.from(depts)];
  }, [organizationData]);

  const filteredMembers = allMembers.filter(m => {
    const matchesName = m.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === '全部' || m.dept === selectedDeptFilter;
    // 排除当前用户自己
    const isNotSelf = currentUser ? (m.id !== currentUser.id && m.name !== currentUser.name) : true;
    return matchesName && matchesDept && isNotSelf;
  });

  // Default Template Data for Demo Projects to ensure visual richness
  const milestonesTemplate = [
    { title: "第一阶段：市场调研与审计", date: "10月15日", status: "completed" },
    { title: "第二阶段：广告投放与创意测试", date: "11月20日", status: "active", alert: "即将到期", responsible: "王可欣" },
    { title: "第三阶段：渠道扩展与SEO优化", date: "12月10日", status: "pending" },
    { title: "最终交付与复盘", date: "12月31日", status: "pending" }
  ];

  // Specific data for hardcoded IDs to maintain demo quality
  let data: any = {
    title: foundProject?.title || "未知项目",
    status: (foundProject?.progress === 100 || foundProject?.status === 'done') ? '已完成' :
      (foundProject?.status === 'delayed' ? '紧急' :
        (foundProject?.status === 'normal' ? '正常' : '进行中')),
    department: foundProject?.department || "其他部门",
    manager: foundProject?.manager || (foundProject?.manager_id === 'kexin' ? '王可欣' : foundProject?.manager_id) || "未知负责人",
    progress: foundProject?.progress || 0,
    deadline: foundProject?.deadline || "TBD",
    visibility: foundProject?.visibility || 'public',
    image: `https://picsum.photos/seed/${projectId}/200`,
    color: "#6D28D9",
    milestones: milestonesTemplate,
    members: foundProject?.members || [] // Use members from project if available
  };

  if (projectId === 'q3-finance') {
    data = {
      ...data, color: "#EF4444", image: "https://picsum.photos/seed/finance/200", milestones: [
        { title: "原始数据归集", date: "10月28日", status: "completed" },
        { title: "部门费用核对", date: "10月30日", status: "completed" },
        { title: "报表初稿生成", date: "11月01日", status: "completed" },
        { title: "最终合规性审查", date: "今天", status: "active", alert: "剩余2小时", responsible: "赵会计" }
      ]
    };
  } else if (projectId === 'ui-design') {
    data = {
      ...data, color: "#F59E0B", image: "https://picsum.photos/seed/uidesign/200", milestones: [
        { title: "首页视觉风格确认", date: "10月20日", status: "completed" },
        { title: "组件库规范定义", date: "10月25日", status: "completed" },
        { title: "高保真原型输出", date: "11月01日", status: "active", alert: "需在此节点验收", responsible: "李设计" },
        { title: "开发交付与切图", date: "11月05日", status: "pending" }
      ]
    };
  } else if (projectId === 'crm-v2') {
    data = { ...data, color: "#3B82F6", image: "https://picsum.photos/seed/crm/200" };
  } else if (projectId === 'ai-customer') {
    data = { ...data, color: "#8B5CF6", image: "https://picsum.photos/seed/aicust/200" };
  } else if (projectId === 'travel-plan') {
    data = { ...data, color: "#10B981", image: "https://picsum.photos/seed/travel/200" };
  } else if (projectId === 'core-data') {
    data = { ...data, color: "#64748B", image: "https://picsum.photos/seed/database/200" };
  } else if (projectId === 'alpha') {
    data = { ...data, color: "#2563EB", image: "https://picsum.photos/seed/alpha/200" };
  } else {
    // New Project Logic
    // If it's a newly created project (not one of the hardcoded specific ones), we use the data from foundProject
    // and generate a generic milestone list if none exists.
    data.milestones = [
      { title: "项目启动", date: foundProject?.deadline ? "Started" : "Today", status: "completed" },
      { title: "执行阶段", date: "进行中", status: "active", alert: "进行中", responsible: foundProject?.manager },
      { title: "项目交付", date: foundProject?.deadline || "TBD", status: "pending" }
    ];
  }

  const activeMilestone = data.milestones.find((m: any) => m.status === 'active') || data.milestones[data.milestones.length - 1];

  // Use real members from project if they exist
  const displayMembers = useMemo(() => {
    // 直接使用项目的真实成员列表，不再使用硬编码的 fallback
    return foundProject?.members || [];
  }, [foundProject]);

  const isManager = data.manager === currentUserName;
  const isParticipant = foundProject?.role === 'participant';
  const isCompleted = data.progress === 100; // Completed projects have restrictions
  const isPhaseResponsible = activeMilestone?.responsible === currentUserName;

  let buttonConfig = {
    label: "提交审核材料",
    icon: <FileText size={18} />,
    disabled: false,
    color: data.color
  };

  if (!isManager && !isPhaseResponsible) {
    buttonConfig = {
      label: "查看项目详情",
      icon: <FileText size={18} />,
      disabled: true,
      color: "#9CA3AF"
    };
  } else if (isManager && !isPhaseResponsible) {
    buttonConfig = {
      label: "审核本阶段材料",
      icon: <ListChecks size={18} />,
      disabled: false,
      color: data.color
    };
  }

  const handleConfirmInvite = (memberId: string) => {
    onInviteMember(memberId, data.title);
    setShowMemberModal(false);
    setToastType('invite');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleButtonClick = async () => {
    if (buttonConfig.label === "提交审核材料") {
      fileInputRef.current?.click();
    } else if (buttonConfig.label === "审核本阶段材料") {
      // Check if phase responsible member has uploaded materials
      const responsibleMember = activeMilestone?.responsible;
      if (!responsibleMember || !projectId) {
        setMaterialNotUploaded(true);
        setShowReviewModal(true);
        return;
      }

      try {
        // Query materials from Supabase
        const { data: materials, error } = await supabase
          .from('project_materials')
          .select('*')
          .eq('project_id', projectId)
          .eq('milestone', activeMilestone?.title || '');

        if (error) {
          console.error('Error fetching materials:', error);
          setMaterialNotUploaded(true);
          setShowReviewModal(true);
          return;
        }

        if (!materials || materials.length === 0) {
          setMaterialNotUploaded(true);
          setReviewingMaterial(null);
        } else {
          setMaterialNotUploaded(false);
          setReviewingMaterial(materials[0]);
        }
        setShowReviewModal(true);
      } catch (err) {
        console.error('Failed to fetch materials:', err);
        setMaterialNotUploaded(true);
        setShowReviewModal(true);
      }
    }
  };

  // Handle material review approval/rejection
  const handleReviewDecision = async (approved: boolean) => {
    if (!reviewingMaterial) return;

    try {
      const { error } = await supabase
        .from('material_reviews')
        .insert({
          material_id: reviewingMaterial.id,
          reviewer_id: 'kexin',
          status: approved ? 'approved' : 'rejected',
          comment: approved ? '审核通过' : '审核不通过'
        });

      if (error) {
        console.error('Error saving review:', error);
        alert('审核保存失败');
        return;
      }

      setShowReviewModal(false);
      setToastMessage(approved ? '已通过审核' : '已拒绝审核');
      setToastType('rating');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Review failed:', err);
      alert('操作失败');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setToastType('upload');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!foundProject || !onUpdateProject) return;
    const newVisibility = foundProject.visibility === 'public' ? 'members' : 'public';
    onUpdateProject({ ...foundProject, visibility: newVisibility });
  };


  return (
    <div className="flex flex-col h-full bg-[#111827] text-white relative">
      {/* Member Selection Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-t-2xl sm:rounded-3xl p-5 h-[80vh] flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">添加成员</h3>
              <button onClick={() => setShowMemberModal(false)} className="p-1 bg-slate-100 rounded-full hover:bg-slate-200">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="搜索姓名..."
                className="w-full bg-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-[#2C097F]"
              />
            </div>

            {/* Department Filter */}
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase">部门筛选</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {allDepartments.map((dept, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${selectedDeptFilter === dept ? 'bg-[#2C097F] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredMembers.length > 0 ? filteredMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => handleConfirmInvite(member.id)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img src={member.avatar} className="w-10 h-10 rounded-full bg-slate-200 object-cover" alt="" />
                    <div>
                      <p className="font-bold text-sm">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.dept} · {member.title}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-[#2C097F] group-hover:bg-[#2C097F] group-hover:text-white transition-all">
                    <Plus size={16} className="text-slate-300 group-hover:text-white" />
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-400 py-10">未找到成员</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-white text-[#111827] px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-fade-in-down w-[80%] max-w-sm">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
          <div>
            <p className="font-bold text-base">操作成功</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {toastType === 'remind' ? '已发送提醒' : (toastType === 'invite' ? '已发送项目邀请' : (toastType === 'rating' ? toastMessage : '文件已上传并同步到云端'))}
            </p>
          </div>
        </div>
      )}

      {/* Header - Compressed */}
      <div className="bg-[#111827] sticky top-0 z-50 px-4 py-3 flex items-center justify-between pt-10">
        <button onClick={onBack} className="flex items-center gap-1 text-white font-bold text-sm">
          <ChevronLeft size={18} /> {fromNotification ? "消息" : "返回"}
        </button>
        <h1 className="text-base font-bold">项目详情</h1>
        <button
          onClick={() => projectId && onToggleFollow(projectId)}
          className={`p-1.5 rounded-full transition-colors ${isFollowed ? 'bg-[#2C097F] text-white shadow-lg' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
        >
          <Bookmark size={18} fill={isFollowed ? "currentColor" : "none"} />
        </button>

        {isManager && (
          <button
            onClick={() => projectId && onDeleteProject(projectId)}
            className="p-1.5 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-colors ml-1.5"
            title="删除"
          >
            <X size={18} />
          </button>
        )}

        {isParticipant && projectId && (
          <button
            onClick={() => onLeaveProject(projectId)}
            className="px-2 py-1 bg-gray-500/10 text-gray-500 rounded-lg hover:bg-gray-500/20 transition-colors ml-1.5 text-[10px] font-bold"
          >
            退出
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Project Header - Compressed */}
        <div className="flex gap-3 mb-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0">
            <img src={data.image} className="w-full h-full object-cover" alt="Cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-lg font-bold leading-tight truncate">{data.title}</h2>
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full border opacity-90 ml-2 whitespace-nowrap"
                style={{
                  backgroundColor: data.status === '已完成' ? '#22c55e20' : `${data.color}20`,
                  color: data.status === '已完成' ? '#22c55e' : data.color,
                  borderColor: data.status === '已完成' ? '#22c55e' : data.color
                }}
              >
                {data.status}
              </span>
            </div>
            <div className="space-y-0.5 text-xs text-gray-400">
              <p className="truncate">部 门: {data.department}</p>
              <div className="flex items-center gap-2 truncate">
                <span>负责人: {data.manager}</span>
                {isManager && (
                  <button
                    onClick={toggleVisibility}
                    className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {data.visibility === 'public' ? <Eye size={10} className="text-[#8B5CF6]" /> : <EyeOff size={10} className="text-gray-400" />}
                    <span className={`text-[9px] font-bold ${data.visibility === 'public' ? 'text-[#8B5CF6]' : 'text-gray-400'}`}>
                      {data.visibility === 'public' ? '公开' : '受限'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card - Compressed */}
        <div className="bg-[#1e293b] rounded-xl p-3 border border-white/5 shadow-lg mb-4">
          <div className="flex justify-between items-end mb-1.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-gray-400">总体进度</span>
            <span className="font-black text-sm" style={{ color: data.color }}>{data.progress}%</span>
          </div>
          <div className="w-full bg-[#324867] rounded-full h-1.5 mb-2.5">
            <div
              className="h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${data.progress}%`, backgroundColor: data.color }}
            ></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-[#92a9c9]">
              <Clock size={10} />
              <span>{data.deadline} 截止</span>
            </div>
            {/* Mark Complete Button - Only visible for manager on incomplete projects */}
            {isManager && !isCompleted && onMarkComplete && (
              <button
                onClick={() => projectId && onMarkComplete(projectId)}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 size={10} />
                标记已完成
              </button>
            )}
            {isCompleted && (
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                <CheckCircle2 size={10} />
                已完成
              </span>
            )}
          </div>
        </div>

        {/* AI Insight Overlay - Compressed */}
        {projectInsight && (
          <div className="mb-4 bg-gradient-to-r from-[#2C097F]/20 to-transparent border border-[#2C097F]/30 p-3 rounded-xl flex gap-2.5 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-[#2C097F] flex items-center justify-center shrink-0 shadow-lg shadow-[#2C097F]/30">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <h4 className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-wider mb-0.5">AI 智能洞察</h4>
              <p className="text-[13px] text-gray-100 leading-snug">{projectInsight}</p>
            </div>
          </div>
        )}

        {/* Members - Compressed */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2.5">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">核心成员</h3>
            {displayMembers.length > 3 && <span className="text-[9px] text-green-400 font-bold bg-green-500/20 px-1.5 py-0.5 rounded">NEW</span>}
          </div>

          <div className="space-y-2">
            {displayMembers.map((m: any, i: number) => {
              const isMe = m.id === 'kexin';
              const existingRating = allRatings.find(r => r.project_id === projectId && r.ratee_id === m.id);

              return (
                <div key={i} className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                  <div
                    className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity min-w-0 flex-1"
                    onClick={() => {
                      // 从 allMembers 中查找完整的成员信息（包含 tags）
                      const fullMember = allMembers.find(member => member.id === m.id) || m;
                      onViewProfile({
                        ...m,
                        tags: fullMember.tags || m.tags || []
                      });
                    }}
                  >
                    <img src={m.avatar} className="w-7 h-7 rounded-full object-cover ring-2 ring-transparent hover:ring-[#2C097F] transition-all shrink-0" alt="" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-gray-100 truncate">{m.name}</div>
                      <div className="text-[9px] text-gray-500 truncate">{m.role}</div>
                    </div>
                  </div>

                  {isManager && !isMe ? (
                    <div className="flex items-center gap-0.5 pl-2">
                      {[1, 2, 3, 4, 5].map(star => {
                        const active = (existingRating?.score || 0) >= star;
                        return (
                          <button
                            key={star}
                            onClick={() => {
                              if (projectId) {
                                onRateMember(projectId, m.id, star);
                                setToastType('rating');
                                setToastMessage(`已为 ${m.name} 评分 ${star} 星`);
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 2000);
                              }
                            }}
                            className={`transition-colors active:scale-125 ${active ? 'text-amber-400' : 'text-gray-700'}`}
                          >
                            <Star size={12} fill={active ? "currentColor" : "none"} />
                          </button>
                        );
                      })}
                    </div>
                  ) : existingRating && (
                    <div className="flex items-center gap-1 text-amber-400 pl-2">
                      <Star size={10} fill="currentColor" />
                      <span className="text-[11px] font-black">{existingRating.score}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {isManager && !isCompleted && (
              <button
                onClick={() => setShowMemberModal(true)}
                className="w-full py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 gap-1.5 hover:bg-white/10 transition-colors text-[10px] font-bold"
              >
                <Plus size={14} /> 邀请新成员
              </button>
            )}
          </div>
        </div>

        {/* Goals - Only show if not empty */}
        <div className="bg-[#1e293b]/50 rounded-xl p-4 border border-white/5 mb-8">
          <h3 className="font-bold text-base mb-3 text-white">项目目标</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center mt-1 shrink-0" style={{ backgroundColor: data.color }}>
                <Check size={10} className="text-white" />
              </div>
              <span className="text-sm font-bold text-[#DAE9FD]">{foundProject?.description || "完成阶段性里程碑验收，确保交付质量。"}</span>
            </li>
          </ul>
        </div>

        {/* Milestones - Compressed */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base">关键里程碑</h3>
            <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: data.color }}>查看全部</span>
          </div>

          <div className="space-y-3 relative pl-2.5">
            <div className="absolute left-[13.5px] top-3 bottom-3 w-0.5 bg-[#324867]"></div>

            {data.milestones.map((milestone: any, index: number) => {
              const isActive = milestone.status === 'active';
              const isCompleted = milestone.status === 'completed';

              return (
                <div key={index} className={`relative pl-6 ${(!isActive && !isCompleted) ? 'opacity-40' : ''}`}>
                  <div
                    className={`absolute left-0 top-2 w-3.5 h-3.5 rounded-full ring-4 ring-[#111827] z-10`}
                    style={{ backgroundColor: isActive ? data.color : (isCompleted ? '#4F46E5' : '#324867') }}
                  ></div>

                  {isActive ? (
                    <div className="bg-[#1e293b] border-l-4 rounded-lg p-3 shadow-xl" style={{ borderLeftColor: data.color }}>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-sm leading-tight">{milestone.title}</span>
                        {milestone.alert && (
                          <span
                            className="text-black text-[7px] font-black px-1.5 py-0.5 rounded-l-md -mr-3 uppercase"
                            style={{ backgroundColor: data.color }}
                          >
                            {milestone.alert}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[#92a9c9] mb-3">
                        <Clock size={10} />
                        <span>截止: {milestone.date}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={displayMembers.find((m: any) => m.name === milestone.responsible)?.avatar || `https://picsum.photos/seed/${milestone.responsible || 'manager'}/50`}
                            className="w-5 h-5 rounded-full object-cover"
                            alt=""
                          />
                          <span className="text-[11px] text-[#92a9c9]">{milestone.responsible || data.manager}</span>
                        </div>
                        {isManager && (
                          <button
                            onClick={() => handleRemind(milestone.title)}
                            className="text-black text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1 shadow-lg active:scale-95 transition-transform"
                            style={{ backgroundColor: data.color }}
                          >
                            <Bell size={8} />
                            催办
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1e293b]/30 border border-white/5 rounded-lg p-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs truncate max-w-[200px]">{milestone.title}</span>
                        <span className="text-[10px] text-[#92a9c9]">{milestone.date}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#111827] sticky bottom-0 safe-bottom">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleButtonClick}
          disabled={buttonConfig.disabled}
          className={`w-full text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 shadow-2xl active:scale-[0.98] transition-transform border border-white/10 ${buttonConfig.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ backgroundColor: buttonConfig.color }}
        >
          {React.cloneElement(buttonConfig.icon as React.ReactElement, { size: 16 })}
          <span className="text-sm">{buttonConfig.label}</span>
        </button>
      </div>
    </div >
  );
};
