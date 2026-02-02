
import React, { useState } from 'react';
import { Filter, AlertCircle, Clock, CheckCircle2, Star, Lock, ShieldAlert, Globe, Users, ChevronDown, Eye, EyeOff, Layout } from 'lucide-react';

interface ProjectListProps {
  onNavigateToProject: (id: string, context?: { filter: 'all' | 'my' | 'participated' | 'followed' | 'completed' }) => void;
  onNavigateToNotifications: () => void;
  followedProjects: Set<string>;
  onToggleFollow: (id: string) => void;
  projects: any[];
  onUpdateProject: (project: any) => void;
  initialFilter?: 'all' | 'my' | 'participated' | 'followed' | 'completed';
  onFilterChange?: (filter: 'all' | 'my' | 'participated' | 'followed' | 'completed') => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  onNavigateToProject,
  onNavigateToNotifications,
  followedProjects,
  onToggleFollow,
  projects,
  onUpdateProject,
  initialFilter = 'all',
  onFilterChange
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'my' | 'participated' | 'followed' | 'completed'>(initialFilter);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastIcon, setToastIcon] = useState<React.ReactNode>(null);

  const showNotification = (msg: string, icon: React.ReactNode) => {
    setToastMessage(msg);
    setToastIcon(icon);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleFollow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isFollowing = followedProjects.has(id);
    onToggleFollow(id);
    if (!isFollowing) {
      showNotification("已加入关注列表", <Star size={18} className="text-white fill-white" />);
    } else {
      showNotification("已取消关注", <Star size={18} className="text-white" />);
    }
  };

  const handleProjectClick = (project: any) => {
    // Check if user is manager
    const isManager = project.manager === "王可欣" || project.manager_id === 'kexin';
    // Check if user is a member (in members array)
    const isMember = project.members?.some((m: any) => m.id === 'kexin' || m.name === '王可欣');
    // Check if user has participant role
    const isParticipant = project.role === 'participant' || project.role === 'manager';

    // User has access if: manager OR member OR participant OR project is public
    const hasAccess = isManager || isMember || isParticipant || project.visibility === 'public';

    // Block access only if user has no access AND project visibility is restricted
    if (!hasAccess && project.visibility === 'members') {
      showNotification("无权限访问", <ShieldAlert size={18} className="text-white" />);
      return;
    }
    onNavigateToProject(project.id, { filter: activeFilter });
  };

  const toggleProjectVisibility = (e: React.MouseEvent, project: any) => {
    e.stopPropagation();
    const newVisibility = project.visibility === 'public' ? 'members' : 'public';
    showNotification(
      newVisibility === 'public' ? "设置为所有人可见" : "设置为仅成员可见",
      newVisibility === 'public' ? <Globe size={18} className="text-white" /> : <Users size={18} className="text-white" />
    );
    onUpdateProject({ ...project, visibility: newVisibility });
  };

  const filteredProjects = projects.filter(p => {
    // Current user identification
    const isMyProject = p.manager === "王可欣" || p.manager_id === 'kexin';
    const isParticipant = p.role === 'participant' || p.members?.some((m: any) => m.id === 'kexin' || m.name === '王可欣');

    // "All" filter should truly show ALL company projects
    if (activeFilter === 'all') return true;

    // Completed filter: show only 100% progress projects
    if (activeFilter === 'completed') return p.progress === 100;

    // Other specific filters
    if (activeFilter === 'followed') return followedProjects.has(p.id);
    if (activeFilter === 'my') return isMyProject;
    if (activeFilter === 'participated') return isParticipant;

    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#F6F6F8] relative">
      {/* Toast Popup */}
      {showToast && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[90%] bg-slate-900/95 backdrop-blur text-white px-4 py-3.5 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 animate-fade-in-down transition-all duration-300">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toastMessage.includes('无权限') ? 'bg-red-500' : 'bg-[#2C097F]'}`}>
            {toastIcon}
          </div>
          <div>
            <p className="font-bold text-sm">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Header - Compressed */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 flex flex-col items-center pt-10 pb-0">
        <h1 className="text-lg font-bold text-slate-900 mb-2">项目监控</h1>
        {/* Sub-header Banner */}
        <div className="w-full bg-[#A78BFA] py-1 flex justify-center items-center shadow-inner">
          <span className="text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
            <Layout size={10} className="fill-white/20 stroke-white" />
            项目监控看板
          </span>
        </div>
      </div>

      {/* Stats Cards - Compressed */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[65px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">总项目</span>
          <span className="text-xl font-bold text-slate-900 leading-none">{projects.length}</span>
        </div>
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[65px]">
          <span className="text-[10px] font-bold text-[#2C097F] uppercase tracking-tighter">进行中</span>
          <span className="text-xl font-bold text-[#2C097F] leading-none">{projects.filter(p => p.hasPermission && p.progress < 100).length}</span>
        </div>
        <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between h-[65px]">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-tighter">已延期</span>
          <div className="flex justify-between items-end">
            <span className="text-xl font-bold text-red-600 leading-none">{projects.filter(p => p.status === 'delayed').length}</span>
            <AlertCircle size={14} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters - Compressed */}
      <div className="px-4 flex items-center gap-3 mb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0">筛选</span>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          <FilterButton label="全部" active={activeFilter === 'all'} onClick={() => { setActiveFilter('all'); onFilterChange?.('all'); }} />
          <FilterButton label="已完成" active={activeFilter === 'completed'} onClick={() => { setActiveFilter('completed'); onFilterChange?.('completed'); }} completed />
          <FilterButton label="我负责的" active={activeFilter === 'my'} onClick={() => { setActiveFilter('my'); onFilterChange?.('my'); }} />
          <FilterButton label="我参与的" active={activeFilter === 'participated'} onClick={() => { setActiveFilter('participated'); onFilterChange?.('participated'); }} />
          <FilterButton label="我关注的" active={activeFilter === 'followed'} onClick={() => { setActiveFilter('followed'); onFilterChange?.('followed'); }} />
        </div>
      </div>

      {/* Active Projects List - Compressed */}
      <div className="px-3 pb-32 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-2.5">
          <h2 className="text-sm font-bold text-slate-900">
            {activeFilter === 'followed' ? '我的关注' : activeFilter === 'participated' ? '我参与的项目' : activeFilter === 'my' ? '我负责的项目' : '活跃项目'}
          </h2>
          <span className="text-[#2C097F] text-[10px] font-bold bg-[#2C097F]/5 px-2 py-0.5 rounded-lg">共 {filteredProjects.length} 个</span>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock size={32} className="opacity-50" />
            </div>
            <p className="text-sm font-medium">暂无项目</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map(p => {
              // Unified Access Logic - check if current user is manager, member, or has role
              const isManager = p.manager === "王可欣" || p.manager_id === 'kexin';
              const isMember = p.members?.some((m: any) => m.id === 'kexin' || m.name === '王可欣');
              const isParticipant = p.role === 'participant' || p.role === 'manager';

              // User has access if: manager OR member OR participant OR project is public
              const hasAccess = isManager || isMember || isParticipant || p.visibility === 'public';
              // isLocked should be true ONLY when: not accessible AND visibility is members-only (restricted)
              const isLocked = !hasAccess && p.visibility === 'members';

              return (
                <ProjectCard
                  key={p.id}
                  title={p.title}
                  manager={p.manager}
                  progress={p.progress}
                  status={p.status}
                  deadline={p.deadline}
                  visibility={p.visibility}
                  isFollowed={followedProjects.has(p.id)}
                  hasPermission={p.hasPermission}
                  isManager={isManager}
                  isLocked={isLocked}
                  onClick={() => handleProjectClick(p)}
                  onFollow={(e: React.MouseEvent) => handleFollow(e, p.id)}
                  onToggleVisibility={(e: React.MouseEvent) => toggleProjectVisibility(e, p)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const FilterButton = ({ label, active, onClick, completed }: { label: string, active: boolean, onClick: () => void, completed?: boolean }) => (
  <button
    onClick={onClick}
    className={`h-8 px-3.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all ${active
      ? 'bg-[#2C097F] text-white shadow-lg shadow-[#2C097F]/20 scale-105'
      : 'bg-white border border-slate-200 text-slate-600'
      }`}
  >
    {label}
  </button>
);

const ProjectCard = ({ title, manager, progress, status, deadline, onClick, onFollow, isFollowed, hasPermission, isManager, visibility, onToggleVisibility, isLocked }: any) => {
  const isDelayed = status === 'delayed';
  // isLocked is now passed from parent
  const progressColor = isDelayed ? 'bg-red-500' : 'bg-[#2C097F]';

  // Styles for locked state
  const containerClass = isLocked
    ? "bg-slate-50 border-slate-200"
    : `bg-white ${isDelayed ? 'border-red-200' : 'border-slate-100'}`;

  const titleClass = isLocked ? "text-slate-500" : "text-slate-900";

  return (
    <div onClick={onClick} className={`${containerClass} p-4 rounded-2xl shadow-sm border active:scale-98 transition-all relative overflow-hidden group`}>
      {/* Locked Overlay Icon */}
      {isLocked && (
        <div className="absolute right-3 top-3 opacity-[0.03] pointer-events-none">
          <Lock size={60} className="text-slate-900" />
        </div>
      )}

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="min-w-0 flex-1 mr-2">
          <h3 className={`font-bold text-sm mb-1.5 leading-tight flex items-center gap-1.5 ${titleClass}`}>
            {title}
            {isLocked && <Lock size={12} className="text-slate-400" />}
          </h3>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              {!isLocked && <img src={`https://picsum.photos/seed/${manager}/50`} className="w-5 h-5 rounded-full border border-slate-100" alt="" />}
              {isLocked && <div className="w-5 h-5 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center"><Lock size={8} className="text-slate-400" /></div>}
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[80px]">{manager}</span>
            </div>

            {/* Manager Visibility Toggle */}
            {isManager && (
              <button
                onClick={onToggleVisibility}
                className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                {visibility === 'public' ? <Eye size={10} className="text-[#2C097F]" /> : <EyeOff size={10} className="text-slate-500" />}
                <span className={`text-[10px] font-bold ${visibility === 'public' ? 'text-[#2C097F]' : 'text-slate-500'}`}>
                  {visibility === 'public' ? '公开' : '受限'}
                </span>
                <ChevronDown size={10} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {isLocked ? (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-200 text-slate-500">无权限</span>
        ) : isDelayed ? (
          <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-2xl absolute top-0 right-0 rounded-tr-3xl flex items-center gap-1 shadow-red-200 shadow-sm">
            <AlertCircle size={10} className="fill-white stroke-red-500" />
            <span>{deadline}</span>
          </div>
        ) : progress === 100 ? (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-green-100 text-green-600">已完成</span>
        ) : (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${status === 'normal' ? 'bg-emerald-100 text-emerald-600' : 'bg-[#2C097F]/10 text-[#2C097F]'}`}>
            {status === 'normal' ? '正常' : '进行中'}
          </span>
        )}
      </div>

      <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tight">
          <span className={isDelayed ? 'text-red-500' : 'text-slate-400'}>{isDelayed ? '进度预警' : isLocked ? '进度未知' : '当前进度'}</span>
          {!isLocked && <span className={`text-[13px] font-black ${isDelayed ? 'text-red-500' : 'text-slate-900'}`}>{progress}%</span>}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          {!isLocked && (
            <div className={`h-full rounded-full ${progressColor} ${isDelayed ? 'shadow-[0_0_10px_rgba(239,68,68,0.3)]' : ''}`} style={{ width: `${progress}%` }}></div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2.5 border-t border-slate-50 mt-1.5">
          {isLocked ? (
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
              <ShieldAlert size={10} />
              <span>成员可见</span>
            </div>
          ) : isDelayed ? (
            <div className="flex items-center gap-1 text-red-600 text-[10px] font-medium bg-red-50 px-1.5 py-0.5 rounded">
              <AlertCircle size={10} />
              <span>协调中</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
              <Clock size={10} />
              <span>{deadline} 截止</span>
            </div>
          )}

          <button
            onClick={onFollow}
            className={`h-7 px-3.5 rounded-full text-[10px] font-black border flex items-center gap-1 transition-all ${isFollowed
              ? 'bg-[#2C097F] border-[#2C097F] text-white shadow-md shadow-[#2C097F]/20'
              : isLocked
                ? 'border-slate-300 text-slate-500 bg-white hover:bg-slate-50'
                : isDelayed
                  ? 'border-red-200 text-red-500 bg-white'
                  : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'
              }`}
          >
            <Star size={10} className={isFollowed ? "fill-white" : ""} />
            {isFollowed ? '已关注' : '关注'}
          </button>
        </div>
      </div>
    </div>
  );
};
