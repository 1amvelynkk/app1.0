
import React, { useState, useMemo } from 'react';
import { Share2, Check, Link, Rocket, Share2 as ShareIcon, Award, ChevronLeft, Plus, X, Settings } from 'lucide-react';
import { Department } from '../types';

interface ProfileProps {
  user: any;
  setUser: (user: any) => void;
  readOnly?: boolean;
  onBack?: () => void;
  onInviteMember?: (memberId: string, projectName: string) => void;
  onViewProfile?: (memberId: string) => void;
  orgData?: Department;
  allProjects?: any[];
  allRatings?: any[];
}

export const Profile: React.FC<ProfileProps> = ({ user, setUser, readOnly = false, onBack, onInviteMember, onViewProfile, orgData, allProjects = [], allRatings = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteToast, setShowInviteToast] = useState(false);

  // 年度成就展开状态
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false);

  // 技能标签状态 - 从用户 tags 初始化
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // 从组织数据获取用户的技能标签
  useMemo(() => {
    if (user.tags && user.tags.length > 0) {
      setSkillTags(user.tags);
    } else if (orgData) {
      // 从组织结构中查找用户的 tags
      const findUserTags = (node: Department): string[] | null => {
        const member = node.members?.find(m => m.id === user.id || m.name === user.name);
        if (member && member.tags) return member.tags;
        if (node.children) {
          for (const child of node.children) {
            const tags = findUserTags(child);
            if (tags) return tags;
          }
        }
        return null;
      };
      const tags = findUserTags(orgData);
      if (tags) setSkillTags(tags);
    }
  }, [user.id, user.name, user.tags, orgData]);

  const handleShare = () => {
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleInvite = (projectTitle: string) => {
    if (onInviteMember && user.id) {
      onInviteMember(user.id, projectTitle);
    }
    setShowInviteModal(false);
    setShowInviteToast(true);
    setTimeout(() => setShowInviteToast(false), 2500);
  };

  // Synchronized Project Data from allProjects - 只显示进行中的项目
  const myRealProjects = useMemo(() => {
    return allProjects.filter(p => {
      const isManager = p.manager_id === user.id || p.manager === user.name;
      // 检查 members 数组（前端数据）
      const isMemberInMembers = p.members?.some((m: any) => m.id === user.id || m.name === user.name);
      // 检查 project_members 数组（数据库数据）
      const isMemberInProjectMembers = p.project_members?.some((m: any) => m.member_id === user.id);
      const isMember = isMemberInMembers || isMemberInProjectMembers;
      const isInProgress = p.progress < 100 && p.status !== 'done'; // 只显示进行中的项目
      return (isManager || isMember) && isInProgress;
    }).map(p => ({
      id: p.id,
      title: p.title,
      role: (p.manager_id === user.id || p.manager === user.name) ? '负责人' : '参与者'
    }));
  }, [allProjects, user.id, user.name]);

  const displayedProjects = isExpanded ? myRealProjects : myRealProjects.slice(0, 3);

  // 已完成项目用于生成年度成就时间轴
  const completedProjects = useMemo(() => {
    return allProjects.filter(p => {
      const isManager = p.manager_id === user.id || p.manager === user.name;
      // 检查 members 数组（前端数据）
      const isMemberInMembers = p.members?.some((m: any) => m.id === user.id || m.name === user.name);
      // 检查 project_members 数组（数据库数据）
      const isMemberInProjectMembers = p.project_members?.some((m: any) => m.member_id === user.id);
      const isMember = isMemberInMembers || isMemberInProjectMembers;
      const isCompleted = p.progress === 100 || p.status === 'done';
      return (isManager || isMember) && isCompleted;
    }).map((p, index) => ({
      id: p.id,
      title: p.title,
      date: p.deadline || '已完成',
      role: (p.manager_id === user.id || p.manager === user.name) ? '负责人' : '参与者',
      desc: (p.manager_id === user.id || p.manager === user.name) ? '项目负责人' : '项目参与者'
    }));
  }, [allProjects, user.id, user.name]);

  // 显示的成就（3个或全部）
  const displayedAchievements = isAchievementsExpanded ? completedProjects : completedProjects.slice(0, 3);

  // 添加技能标签
  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skillTags.includes(newSkillInput.trim())) {
      setSkillTags([...skillTags, newSkillInput.trim()]);
      setNewSkillInput('');
      setIsAddingSkill(false);
    }
  };

  // 删除技能标签
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillTags(skillTags.filter(s => s !== skillToRemove));
  };

  const averageRating = useMemo(() => {
    const myRatings = allRatings.filter(r => r.ratee_id === user.id);
    if (myRatings.length === 0) return 0;
    const sum = myRatings.reduce((acc, curr) => acc + curr.score, 0);
    return (sum / myRatings.length).toFixed(1);
  }, [allRatings, user.id]);

  // 计算负责的项目数量（包含进行中和已完成）
  const managedProjectsCount = useMemo(() => {
    return allProjects.filter(p =>
      p.manager_id === user.id || p.manager === user.name
    ).length;
  }, [allProjects, user.id, user.name]);

  // Calculate collaboration hours based on participated projects
  const collaborationHours = useMemo(() => {
    const totalHours = myRealProjects.reduce((acc, proj) => {
      const project = allProjects.find(p => p.id === proj.id);
      if (project && project.estimatedHours) {
        // Calculate actual contributed hours based on progress
        const contributedHours = Math.round((project.estimatedHours * project.progress) / 100);
        return acc + contributedHours;
      }
      return acc + 80; // Default fallback hours per project
    }, 0);
    return totalHours;
  }, [myRealProjects, allProjects]);

  // Derive unique titles and departments from orgData
  // Only include departments that have members with specific roles
  const options = useMemo(() => {
    const deptToTitles: Record<string, Set<string>> = {};

    const traverse = (node: Department) => {
      // Only add department if it has members with titles
      if (node.members && node.members.length > 0) {
        if (!deptToTitles[node.name]) deptToTitles[node.name] = new Set();
        node.members.forEach(member => {
          if (member.title) {
            deptToTitles[node.name].add(member.title);
          }
        });
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    if (orgData) {
      traverse(orgData);
    }

    // Filter out departments with no titles (parent departments without roles)
    const deptsWithTitles = Object.entries(deptToTitles)
      .filter(([_, titles]) => titles.size > 0)
      .map(([dept]) => dept);

    return {
      deptToTitles: Object.fromEntries(
        Object.entries(deptToTitles)
          .filter(([_, titles]) => titles.size > 0)
          .map(([dept, titles]) => [dept, Array.from(titles).sort()])
      ),
      depts: deptsWithTitles.sort(),
    };
  }, [orgData]);

  const filteredTitles = useMemo(() => {
    return options.deptToTitles[user.dept] || [];
  }, [options.deptToTitles, user.dept]);

  return (
    <div className="bg-[#F6F6F8] min-h-screen pb-32 font-inter relative">
      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">邀请加入项目</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1 bg-gray-100 rounded-full hover:bg-gray-200">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">请选择您负责的项目：</p>
            <div className="space-y-3 mb-6">
              {allProjects.filter(p => p.manager_id === 'kexin' || p.manager === '王可欣').length > 0 ? (
                allProjects.filter(p => p.manager_id === 'kexin' || p.manager === '王可欣').map(p => (
                  <div key={p.id} onClick={() => handleInvite(p.title)} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl active:scale-[0.98] transition-all cursor-pointer hover:border-[#2C097F]/30 hover:bg-[#2C097F]/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-sm font-bold text-[#2C097F]">
                        {p.title.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{p.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">负责人</p>
                      </div>
                    </div>
                    <Plus size={20} className="text-[#2C097F]" />
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-4 text-sm">暂无负责的项目</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {showShareToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-5 py-3 rounded-full text-sm font-bold shadow-xl z-[60] flex items-center gap-2 animate-bounce-in">
          <Link size={16} className="text-blue-400" />
          个人档案链接已复制
        </div>
      )}
      {showInviteToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl z-[60] flex items-center gap-2 animate-bounce-in">
          <Check size={18} />
          邀请已发送
        </div>
      )}

      {/* Header */}
      <div className="bg-[#F6F6F8] sticky top-0 z-50 px-6 py-2 pt-8 flex items-center justify-between">
        {readOnly && onBack ? (
          <button onClick={onBack} className="p-1 -ml-1 hover:bg-slate-200 rounded-full transition-colors flex items-center gap-1 text-slate-900 font-bold">
            <ChevronLeft size={20} />
          </button>
        ) : (
          <div className="w-5"></div>
        )}

        <h1 className="text-base font-bold text-slate-900">{readOnly ? "个人档案" : "个人工作档案"}</h1>
        <button onClick={handleShare} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
          <Share2 className="text-slate-900" size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center mt-2 px-4">
        {/* Avatar with Glow */}
        <div className="w-20 h-20 rounded-full p-0.5 bg-white shadow-lg mb-3 relative z-10">
          <div className="w-full h-full rounded-full overflow-hidden border border-white">
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Name and Info */}
        {isEditing ? (
          <input
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="text-lg font-bold text-slate-900 mb-1 text-center bg-transparent border-b-2 border-[#2C097F] outline-none w-1/2"
          />
        ) : (
          <h2 className="text-lg font-bold text-slate-900 mb-1 tracking-tight">{user.name}</h2>
        )}

        {isEditing ? (
          <div className="flex flex-col gap-2 mt-2 w-full items-center animate-fade-in bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="w-full">
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">修改职位与部门</p>
                <select
                  value={user.dept}
                  onChange={(e) => {
                    const newDept = e.target.value;
                    const titles = options.deptToTitles[newDept] || [];
                    setUser({ ...user, dept: newDept, title: titles[0] || '' });
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full outline-none font-medium mb-0.5 appearance-none cursor-pointer"
                >
                  <option value="" disabled>选择部门</option>
                  {options.depts.map((d, i) => (
                    <option key={i} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={user.title}
                  onChange={(e) => setUser({ ...user, title: e.target.value })}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full outline-none font-medium appearance-none cursor-pointer"
                >
                  <option value="" disabled>选择职位</option>
                  {filteredTitles.map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-4">
            <p className="text-slate-500 text-xs font-medium flex items-center justify-center gap-2">
              {user.title} <span className="w-px h-3 bg-slate-300"></span> {user.dept}
            </p>
            <p className="text-slate-400 text-[10px] mt-1 font-medium">入职 {(user.joinDays || 0).toLocaleString()} 天</p>
          </div>
        )}

        {/* Wide Edit Button - Dark Purple */}
        {!readOnly ? (
          <div className="w-full px-2 mb-6">
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="w-full h-10 bg-[#2C097F] text-white rounded-xl shadow-lg shadow-[#2C097F]/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-transform relative overflow-hidden group"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              {isEditing ? <><Check size={14} /> 保存资料</> : "编辑资料"}
            </button>
          </div>
        ) : (
          <div className="w-full px-2 mb-6">
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full h-10 bg-[#2C097F] text-white rounded-xl shadow-lg shadow-[#2C097F]/30 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <Plus size={16} /> 邀请加入项目
            </button>
          </div>
        )}

        {/* Stats Cards - White Boxes */}
        <div className="grid grid-cols-3 gap-3 w-full px-2">
          <StatBox label="负责项目" value={`${managedProjectsCount}`} />
          <StatBox label="平均评分" value={averageRating > 0 ? `${averageRating}` : "—"} isRating />
          <StatBox label="协作时长" value={`${collaborationHours.toLocaleString()}h`} />
        </div>
      </div>

      {/* Projects List */}
      <div className="px-6 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-slate-900">进行中项目</h3>
          <span className="text-[#2C097F] text-xs font-bold">共 {myRealProjects.length} 个</span>
        </div>
        <div className="space-y-2">
          {displayedProjects.length > 0 ? displayedProjects.map((p: any) => (
            <div key={p.id} className="bg-white px-4 py-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
              <span className="font-bold text-xs text-slate-800">{p.title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${p.role === '负责人' ? 'bg-[#2C097F]/10 text-[#2C097F]' : 'bg-slate-100 text-slate-500'}`}>{p.role}</span>
            </div>
          )) : (
            <div className="text-center text-gray-400 py-3 text-xs">暂无进行中项目</div>
          )}

          {myRealProjects.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-2.5 text-xs font-bold text-[#2C097F] bg-white rounded-xl border border-gray-100 flex items-center justify-center gap-2"
            >
              {isExpanded ? "收起" : `展开更多 (${myRealProjects.length - 3})`}
            </button>
          )}
        </div>
      </div>

      {/* Annual Achievements Timeline */}
      <div className="px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-900">年度成就时间轴</h3>
          {completedProjects.length > 3 && (
            <button
              onClick={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
              className="text-[#2C097F] text-xs font-bold"
            >
              {isAchievementsExpanded ? '收起' : `查看全部 (${completedProjects.length})`}
            </button>
          )}
          {completedProjects.length <= 3 && completedProjects.length > 0 && (
            <span className="text-[#2C097F] text-xs font-bold">共 {completedProjects.length} 个</span>
          )}
        </div>

        {completedProjects.length > 0 ? (
          <div className="relative pl-4 space-y-6">
            {/* Timeline Line */}
            <div className="absolute left-[2.25rem] top-4 bottom-4 w-[2px] bg-indigo-100"></div>

            {displayedAchievements.map((project: any, index: number) => {
              const colors = ['bg-[#6D28D9]', 'bg-[#4F46E5]', 'bg-[#7C3AED]', 'bg-[#8B5CF6]', 'bg-[#A78BFA]'];
              const icons = [Rocket, Award, ShareIcon];
              const IconComponent = icons[index % icons.length];

              return (
                <TimelineItem
                  key={project.id}
                  icon={<IconComponent size={18} className="text-white" />}
                  bgColor={colors[index % colors.length]}
                  title={project.title}
                  date={project.date}
                  desc={project.desc}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-6 text-xs bg-white rounded-xl border border-gray-100">
            暂无已完成项目
          </div>
        )}
      </div>

      <div className="px-6 mt-8 mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-slate-900">核心技能标签</h3>
          {!readOnly && (
            <button
              onClick={() => setIsAddingSkill(!isAddingSkill)}
              className="text-[#2C097F] text-xs font-bold flex items-center gap-1"
            >
              {isAddingSkill ? <X size={14} /> : <Plus size={14} />}
              {isAddingSkill ? '取消' : '添加'}
            </button>
          )}
        </div>

        {/* 添加新技能输入框 */}
        {isAddingSkill && !readOnly && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="输入新技能..."
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#2C097F]"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 bg-[#2C097F] text-white text-xs font-bold rounded-lg"
            >
              添加
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {skillTags.length > 0 ? skillTags.map((skill, index) => (
            <div
              key={skill}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${index < 3
                ? 'bg-[#E0E7FF] text-[#2C097F] border border-[#C7D2FE]'
                : 'bg-[#F1F5F9] text-slate-600 border border-slate-200'
                }`}
            >
              {skill}
              {!readOnly && (
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )) : (
            <div className="text-gray-400 text-xs">暂无技能标签</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, isRating }: { label: string, value: string | number, isRating?: boolean }) => (
  <div className="bg-white p-3 rounded-xl shadow-sm flex flex-col justify-between h-[70px]">
    <p className="text-[10px] text-slate-500 font-bold">{label}</p>
    <div className="flex items-baseline gap-1">
      <p className="text-xl font-black text-[#2C097F] leading-none">{value}</p>
      {isRating && value !== "—" && <Award size={12} className="text-amber-500" />}
    </div>
  </div>
);

const TimelineItem = ({ icon, bgColor, title, date, desc }: any) => (
  <div className="flex gap-3 relative z-10">
    <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center shrink-0 shadow-md border-4 border-[#F6F6F8]`}>
      {React.cloneElement(icon as React.ReactElement, { size: 14 })}
    </div>
    <div className="pb-4">
      <h4 className="text-sm font-bold text-slate-900 leading-tight">{title}</h4>
      <p className="text-[11px] text-slate-500 mt-0.5">{date} · {desc}</p>
    </div>
  </div>
);

const SkillTag = ({ label, highlight }: { label: string, highlight?: boolean }) => {
  const style = highlight
    ? "bg-[#E0E7FF] text-[#2C097F] border border-[#C7D2FE]"
    : "bg-[#F1F5F9] text-slate-600 border border-slate-200";

  return (
    <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${style}`}>
      {label}
    </div>
  );
};
