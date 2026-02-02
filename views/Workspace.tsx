
import React, { useState, useMemo } from 'react';
import { Bell, ChevronRight, Plus, AlertCircle, CalendarClock, Activity, ClipboardList, PenTool, Layout, Clock, Rocket, MessageSquare, CheckCircle2, UserPlus, FileText, Bot, X } from 'lucide-react';
import { ProjectActivity, Project } from '../types';

interface WorkspaceProps {
  user: {
    name: string;
    id: string;
    title: string;
    dept: string;
    avatar: string;
  };
  onNavigateToProject: (id: string) => void;
  onNavigateToCreate: () => void;
  onNavigateToNotifications: () => void;
  activities: ProjectActivity[];
  urgentTasks: Project[];
  latestFollowedProject: Project | null;
  onAcceptProject: (projectId: string) => void;
  allProjects: Project[];
}

export const Workspace: React.FC<WorkspaceProps> = ({ user, onNavigateToProject, onNavigateToCreate, onNavigateToNotifications, activities, urgentTasks, latestFollowedProject, onAcceptProject, allProjects }) => {
  const [activeTab, setActiveTab] = useState<'urgent' | 'updates'>('urgent');
  const [showStatModal, setShowStatModal] = useState(false);
  const [selectedStatType, setSelectedStatType] = useState<'ongoing' | 'todos' | 'delayed' | null>(null);

  // Filter projects by user participation (manager or participant)
  const userProjects = useMemo(() => {
    return allProjects.filter(p => {
      const isManager = p.manager === user.name || (p as any).manager_id === user.id;
      const isParticipant = p.role === 'participant' || p.members?.some((m: any) => m.id === user.id || m.name === user.name);
      return isManager || isParticipant;
    });
  }, [allProjects, user.name, user.id]);

  // Ongoing: user's incomplete projects (manager or participant)
  const ongoingProjects = useMemo(() => {
    return userProjects.filter(p => p.progress >= 0 && p.progress < 100);
  }, [userProjects]);

  // Delayed: projects behind schedule
  const delayedProjects = useMemo(() => {
    return userProjects.filter(p => p.status === 'delayed' && p.progress < 100);
  }, [userProjects]);

  // Todos: urgent tasks (simplified - use urgentTasks prop)
  const todoProjects = urgentTasks;

  const getStatProjects = () => {
    if (selectedStatType === 'ongoing') return ongoingProjects;
    if (selectedStatType === 'todos') return todoProjects;
    if (selectedStatType === 'delayed') return delayedProjects;
    return [];
  };

  const getStatTitle = () => {
    if (selectedStatType === 'ongoing') return '进行中的项目';
    if (selectedStatType === 'todos') return '待办事项';
    if (selectedStatType === 'delayed') return '延期预警';
    return '';
  };

  // Permission check before navigating to project
  const handleNavigateWithPermission = (projectId: string) => {
    const project = allProjects.find(p => p.id === projectId);
    if (project) {
      // Check if locked and user has no permission
      const isUserMemberOrManager = project.manager === user.name || project.role === 'participant' || project.role === 'manager';
      const isLocked = project.status === 'locked' || (project.visibility === 'members' && !isUserMemberOrManager);

      if (isLocked && !isUserMemberOrManager) {
        alert('您没有访问此项目的权限');
        return;
      }
    }
    onNavigateToProject(projectId);
  };

  const handleStatClick = (type: 'ongoing' | 'todos' | 'delayed') => {
    setSelectedStatType(type);
    setShowStatModal(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F6F8]">
      {/* Short Purple Header - Compressed for density */}
      <div className="bg-[#2C097F] text-white pt-10 pb-3 px-4 shadow-md relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white/30 object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">早安，{user.name}</h1>
              <p className="text-[10px] text-white/70 font-medium leading-tight">{user.dept} · {user.title}</p>
            </div>
          </div>
          <button onClick={onNavigateToNotifications} className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <Bell size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 pb-32 overflow-y-auto no-scrollbar">
        {/* Today's Overview - Compressed */}
        <div className="mb-4">
          <h2 className="text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-tight">今日概览</h2>
          <div className="flex gap-2">
            <StatCard
              title="进行中"
              count={ongoingProjects.length}
              color="blue"
              icon={<Rocket size={18} />}
              onClick={() => handleStatClick('ongoing')}
            />
            <StatCard
              title="待处理"
              count={todoProjects.length}
              color="purple"
              icon={<ClipboardList size={18} />}
              onClick={() => handleStatClick('todos')}
            />
            <StatCard
              title="延期"
              count={delayedProjects.length}
              color="red"
              icon={<AlertCircle size={18} />}
              onClick={() => handleStatClick('delayed')}
            />
          </div>
        </div>

        {/* Stat Projects Popup Modal */}
        {showStatModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 w-full max-w-sm rounded-2xl p-5 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">{getStatTitle()}</h3>
                <button onClick={() => setShowStatModal(false)} className="p-1 bg-slate-100 rounded-full hover:bg-slate-200">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {getStatProjects().length > 0 ? getStatProjects().map((project: Project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      setShowStatModal(false);
                      handleNavigateWithPermission(project.id);
                    }}
                    className="p-3 bg-slate-50 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{project.title}</h4>
                      <p className="text-xs text-gray-500">负责人: {project.manager}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: project.status === 'delayed' ? '#EF4444' : '#3B82F6' }}>
                        {project.progress}%
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-8">暂无项目</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* New Project Button - Compressed */}
        <div className="mb-4">
          <button
            onClick={onNavigateToCreate}
            className="w-full bg-white h-12 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all hover:shadow-md"
          >
            <div className="w-7 h-7 rounded-lg bg-[#2C097F]/10 flex items-center justify-center text-[#2C097F] border-2 border-[#2C097F]/20">
              <Plus size={18} strokeWidth={3} />
            </div>
            <span className="text-gray-700 font-bold text-sm tracking-tight text-[#2C097F]">新建项目</span>
          </button>
        </div>

        {/* Urgent Tasks & Project Updates Tabs - Compressed */}
        <div className="mb-2.5">
          <div className="flex items-center gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('urgent')}
              className={`pb-1.5 font-bold text-sm rounded-sm transition-colors ${activeTab === 'urgent' ? 'text-[#2C097F] border-b-2 border-[#5311EE]' : 'text-gray-400 border-transparent'}`}
            >
              紧急待办
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`pb-1.5 font-bold text-sm rounded-sm transition-colors ${activeTab === 'updates' ? 'text-[#2C097F] border-b-2 border-[#5311EE]' : 'text-gray-400 border-transparent'}`}
            >
              项目动态
            </button>
          </div>
        </div>

        {activeTab === 'urgent' ? (
          <div className="space-y-2 mb-6 animate-fade-in">
            {urgentTasks.length > 0 ? urgentTasks.map(task => (
              <WarningCard
                key={task.id}
                title={task.title}
                deadline={task.deadline}
                actionLabel={task.status === 'delayed' ? "一键催办" : "去处理"}
                type={task.status === 'delayed' ? "red" : "orange"}
                onAction={() => handleNavigateWithPermission(task.id)}
              />
            )) : (
              <div className="text-center text-gray-400 py-6 text-xs italic">暂无紧急待办</div>
            )}
          </div>
        ) : (
          <div className="space-y-2 mb-6 animate-fade-in">
            {/* Filter out AI activities - they only show in Notifications */}
            {activities.filter(a => a.type !== 'ai').length > 0 ? activities.filter(a => a.type !== 'ai').map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onClick={() => handleNavigateWithPermission(activity.projectId)}
                currentUser={user.name}
                onAccept={() => onAcceptProject(activity.projectId)}
              />
            )) : (
              <div className="text-center text-gray-400 py-6 text-xs italic">暂无最新动态</div>
            )}
          </div>
        )}

        {/* Latest Followed Projects - Compressed */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 mb-2 pl-1 uppercase tracking-tight">最新关注项目</h3>

          {latestFollowedProject ? (
            <div onClick={() => handleNavigateWithPermission(latestFollowedProject.id)} className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-200">
                    {latestFollowedProject.title.charAt(0)}
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{latestFollowedProject.title}</h4>
                </div>
                <span className="px-2 py-0.5 bg-[#2C097F]/10 text-[#2C097F] text-[10px] font-bold rounded-lg border border-[#2C097F]/10">
                  {latestFollowedProject.status === 'ongoing' ? '进行中' : (latestFollowedProject.status === 'delayed' ? '延期' : '正常')}
                </span>
              </div>

              <div className="flex justify-between text-[10px] text-gray-500 mb-1.5 font-medium">
                <span>总体进度</span>
                <span className="text-gray-900 font-bold">{latestFollowedProject.progress}%</span>
              </div>

              {/* Custom Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3 overflow-hidden">
                <div className="bg-[#2C097F] h-1.5 rounded-full" style={{ width: `${latestFollowedProject.progress}%` }}></div>
              </div>

              <div className="flex items-center gap-2 pt-2.5 border-t border-gray-50">
                <img src={`https://picsum.photos/seed/${latestFollowedProject.manager}/50`} className="w-5 h-5 rounded-full border border-gray-100 object-cover" alt="" />
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-gray-500 font-medium">{latestFollowedProject.manager}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-400">刚刚更新</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400">
              去项目中通过关注一个项目吧
            </div>
          )}
        </div>

        {/* Bottom Spacer for safe area and nav bar */}
        <div className="h-12"></div>
      </div>
    </div>
  );
};

const StatCard = ({ title, count, color, icon, onClick }: { title: string, count: number, color: 'blue' | 'purple' | 'red', icon: React.ReactNode, onClick?: () => void }) => {
  const iconColors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-[#2C097F]/10 text-[#2C097F]',
    red: 'bg-red-100 text-red-500',
  };

  const countColors = {
    blue: 'text-gray-900',
    purple: 'text-gray-900',
    red: 'text-red-600'
  };

  return (
    <div
      onClick={onClick}
      className="flex-1 bg-white p-2.5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-1 min-h-[85px] text-center cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-0.5 ${iconColors[color]}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-gray-500 mb-0.5">{title}</span>
        <div className={`text-xl font-black ${countColors[color]} leading-none`}>{count}</div>
      </div>
    </div>
  );
};

const WarningCard: React.FC<{ title: string, deadline: string, actionLabel: string, type: 'red' | 'orange' | 'reminder', icon?: React.ReactNode, onAction: () => void, highlightTitle?: boolean }> = ({ title, deadline, actionLabel, type, icon, onAction, highlightTitle }) => {
  let iconContainer = '';
  let buttonStyle = '';

  if (type === 'red') {
    iconContainer = 'bg-red-50 text-red-500';
    buttonStyle = 'bg-[#2C097F]/10 text-[#2C097F] border border-[#2C097F]/20';
  } else if (type === 'orange') {
    iconContainer = 'bg-orange-50 text-orange-500';
    buttonStyle = 'bg-gray-100 text-gray-600 border border-gray-200';
  } else {
    // Reminder style
    iconContainer = 'bg-[#2C097F]/10 text-[#2C097F]';
    buttonStyle = 'bg-gray-100 text-gray-600 border border-gray-200';
  }

  return (
    <div
      onClick={onAction}
      className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.99] transition-transform cursor-pointer"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative ${iconContainer}`}>
        {icon ? icon : <AlertCircle size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm mb-0.5 truncate ${highlightTitle ? 'font-black text-[#2C097F]' : 'font-bold text-gray-900'}`}>{title}</h4>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
          <Clock size={10} />
          <span>{deadline} 到期</span>
        </div>
      </div>
      <button
        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap active:scale-95 transition-transform ${buttonStyle}`}
      >
        {actionLabel}
      </button>
    </div>
  );
};

const ActivityCard: React.FC<{ activity: ProjectActivity, onClick: () => void, currentUser: string, onAccept: () => void }> = ({ activity, onClick, currentUser, onAccept }) => {
  const getIcon = () => {
    if (activity.category === 'ai') return <Bot size={16} />;
    if (activity.category === 'alert') return <AlertCircle size={16} />;

    switch (activity.type) {
      case 'invite': return <UserPlus size={16} />;
      case 'review': return <CheckCircle2 size={16} />;
      case 'upload': return <FileText size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getActionColor = () => {
    if (activity.category === 'ai') return 'text-purple-600 bg-purple-50';
    if (activity.category === 'alert') return 'text-red-600 bg-red-50';

    // Default/Update colors (Yellow-ish/Blue-ish)
    switch (activity.type) {
      case 'invite': return 'text-green-600 bg-green-50';
      case 'review': return 'text-blue-600 bg-blue-50';
      case 'upload': return 'text-orange-600 bg-orange-50';
      default: return 'text-amber-600 bg-amber-50'; // Yellow/Amber for general
    }
  };

  const getTagStyle = () => {
    if (activity.category === 'ai') return 'text-purple-600 bg-purple-50 border-purple-100';
    if (activity.category === 'alert') return 'text-red-600 bg-red-50 border-red-100';
    return 'text-gray-400 bg-gray-50 border-gray-100';
  };

  return (
    <div onClick={onClick} className={`bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex gap-3.5 items-start active:scale-[0.99] transition-transform cursor-pointer overflow-hidden relative ${activity.category === 'alert' ? 'border-red-100 shadow-red-50' : ''}`}>
      {activity.category === 'alert' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
      {activity.category === 'ai' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}

      <img src={activity.userAvatar} className="w-8 h-8 rounded-full border border-gray-100 shrink-0 object-cover" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <span className="text-[13px] font-bold text-slate-900 truncate">
            {activity.category === 'ai' && <span className="text-purple-600 mr-1">✨</span>}
            {activity.userName}
          </span>
          <span className="text-[9px] text-gray-400 whitespace-nowrap tracking-tighter">{activity.time}</span>
        </div>
        <p className="text-[12px] text-slate-600 leading-tight mb-1">
          {activity.action} <span className="font-bold text-slate-800">{activity.target}</span>
        </p>
        <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded w-fit mt-1 border ${getTagStyle()}`}>
          <Layout size={8} />
          {activity.projectTitle}
        </div>

        {activity.type === 'invite' && activity.target === currentUser && (
          <button
            onClick={(e) => { e.stopPropagation(); onAccept(); }}
            className="mt-2 bg-[#2C097F] text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm active:scale-95 transition-transform"
          >
            接受邀请
          </button>
        )}
      </div>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${getActionColor()}`}>
        {React.cloneElement(getIcon(), { size: 14 })}
      </div>
    </div>
  );
};
