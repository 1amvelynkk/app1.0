
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, Calendar, Plus, Rocket, X, RefreshCw, Search } from 'lucide-react';
import { Department, Member } from '../types';
import { aiService } from '../lib/aiService';

interface CreateProjectProps {
  onBack: () => void;
  orgData: Department;
  onCreateProject: (projectData: any, members: any[]) => void;
  allProjects: any[];
  prefilledMembers?: any[];
  onPrefilledMembersUsed?: () => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({ onBack, orgData, onCreateProject, allProjects, prefilledMembers, onPrefilledMembersUsed }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('全部');

  // Use prefilledMembers if provided, otherwise start with empty array
  // Note: 不使用硬编码的默认成员，因为它们的 ID 在数据库中不存在，会导致外键约束失败
  const [selectedMembers, setSelectedMembers] = useState<any[]>(
    prefilledMembers && prefilledMembers.length > 0 ? prefilledMembers : []
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  // Clear prefilledMembers state after using
  useEffect(() => {
    if (prefilledMembers && prefilledMembers.length > 0 && onPrefilledMembersUsed) {
      onPrefilledMembersUsed();
    }
  }, []);

  // Handle Refresh AI - analyzes current team composition
  const handleRefreshAI = async () => {
    if (!projectName && !projectDesc) {
      setAiSuggestion("请先输入项目名称和描述，以获取智能建议。");
      return;
    }
    setAiLoading(true);
    try {
      const suggestion = await aiService.getMemberSuggestions(
        projectName + ": " + projectDesc,
        allMembers,
        selectedMembers // Pass currently selected members for analysis
      );
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error('AI suggestion error:', error);
      setAiSuggestion("基于多维度综合分析，建议优选领域经验丰富且当前负载较低的成员配合执行。");
    }
    setAiLoading(false);
  };

  // Flatten org data and calculate workload
  const allMembers = useMemo(() => {
    const members: Member[] = [];
    const traverse = (node: Department) => {
      if (node.members) members.push(...node.members);
      if (node.children) node.children.forEach(traverse);
    };
    traverse(orgData);

    const totalProjCount = allProjects.length || 1;

    return members.map(m => {
      // Calculate Workload = (ManagedProjects * 1.0 + ParticipatedProjects * 0.5) / TotalOrganizationProjects
      const managedCount = allProjects.filter(p => p.manager_id === m.id || p.manager === m.name).length;
      // Note: for participation, we check project_members in a real app, 
      // here we check the local 'members' array if available on the project object
      const participatedCount = allProjects.filter(p =>
        p.members?.some((pm: any) => pm.id === m.id) && !(p.manager_id === m.id || p.manager === m.name)
      ).length;

      const workloadValue = ((managedCount * 1.0 + participatedCount * 0.5) / totalProjCount) * 100;
      const workload = Math.min(Math.round(workloadValue), 100) + '%';
      const status = workloadValue > 70 ? '繁忙' : (workloadValue > 30 ? '通常' : '空闲');

      return { ...m, load: workload, loadStatus: status };
    });
  }, [orgData, allProjects]);

  // Extract departments
  const allDepartments = useMemo(() => {
    const depts = new Set<string>();
    const traverse = (node: Department) => {
      if (node.members.length > 0) depts.add(node.name);
      if (node.children) node.children.forEach(traverse);
    };
    traverse(orgData);
    return ['全部', ...Array.from(depts)];
  }, [orgData]);

  // Auto-trigger AI analysis when members or project changes
  useEffect(() => {
    // Debounce to avoid too many API calls
    const timer = setTimeout(() => {
      if ((projectName || projectDesc) && allMembers.length > 0) {
        handleRefreshAI();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [selectedMembers, projectName, projectDesc]);

  const filteredMembers = allMembers.filter(m => {
    const matchesName = m.name.toLowerCase().includes(memberSearchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === '全部' || m.dept === selectedDeptFilter;
    return matchesName && matchesDept;
  });

  const handleAddMember = (member: any) => {
    if (selectedMembers.some(m => m.id === member.id)) return;

    // Convert to simplified member object for display
    const newMember = {
      id: member.id,
      name: member.name,
      role: member.title,
      dept: member.dept,
      avatar: member.avatar,
      status: member.loadStatus,
      load: member.load
    };

    setSelectedMembers([...selectedMembers, newMember]);
    setShowMemberModal(false);
  };

  const handleRemoveMember = (id: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.id !== id));
  };

  const handleStartProject = () => {
    if (!projectName.trim()) {
      alert("请输入项目名称");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      alert("错误：结束日期不能早于开始日期。");
      return;
    }

    const projectData = {
      name: projectName,
      description: projectDesc,
      startDate: startDate,
      endDate: endDate
    };
    onCreateProject(projectData, selectedMembers);
  };

  return (
    <div className="flex flex-col h-full bg-[#F6F6F8] relative">
      {/* Member Selection Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-t-2xl sm:rounded-3xl p-5 h-[80vh] flex flex-col animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">跨部门选择</h3>
              <button onClick={() => setShowMemberModal(false)} className="p-1 bg-slate-100 rounded-full hover:bg-slate-200">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

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

            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredMembers.length > 0 ? filteredMembers.map(member => (
                <div
                  key={member.id}
                  onClick={() => handleAddMember(member)}
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

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={onBack}><ChevronLeft className="text-slate-900" /></button>
        <h1 className="text-lg font-bold text-slate-900">创建项目</h1>
        <MoreHorizontal className="text-slate-900" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900/80 uppercase tracking-widest mb-4">基本信息</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-900/60 mb-2">项目名称</label>
              <div className="bg-[#2C097F] rounded-lg p-3 text-white shadow-lg shadow-[#2C097F]/20">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例如：Q4 市场推广方案"
                  className="bg-transparent w-full outline-none placeholder:text-white/50 text-base font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900/60 mb-2">项目描述</label>
              <div className="bg-[#192433] rounded-lg p-3 shadow-md">
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="bg-transparent w-full h-24 outline-none text-white/90 text-sm resize-none placeholder:text-white/30"
                  placeholder="描述项目的核心目标、涉及部门及预期成果..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900/40 uppercase tracking-widest mb-4">起止时间</h2>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-slate-700 shadow-sm">
            <div className="flex items-center divide-x divide-gray-100">
              <div className="flex-1 p-3">
                <label className="block text-xs font-bold text-gray-400 mb-1">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-sm font-bold bg-transparent outline-none text-[#2C097F]"
                />
              </div>
              <div className="flex-1 p-3 bg-gray-50/50">
                <label className="block text-xs font-bold text-gray-400 mb-1">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-sm font-bold bg-transparent outline-none text-[#2C097F]"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-900/40 uppercase tracking-widest">成员指派</h2>
            <button
              onClick={() => setShowMemberModal(true)}
              className="text-blue-500 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              <Plus size={12} /> 跨部门选择
            </button>
          </div>

          <div className="space-y-3">
            {selectedMembers.map(member => (
              <div key={member.id} className={`bg-[#192433] rounded-xl p-3 border border-slate-700 flex justify-between items-center relative overflow-hidden group ${member.status === '繁忙' ? 'opacity-90' : ''}`}>
                <div className={`absolute top-0 right-0 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg ${member.status === '空闲' ? 'bg-green-500/20 text-[#4ADE80]' : 'bg-red-500/20 text-[#F87171]'}`}>
                  {member.status}
                </div>

                <div className="flex items-center gap-3">
                  <img src={member.avatar} className="w-10 h-10 rounded-full object-cover" alt={member.name} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{member.name}</span>
                      <span className="text-[9px] bg-[#2C097F]/30 text-[#2C097F] px-1.5 py-0.5 rounded border border-[#2C097F]/20">{member.dept}</span>
                    </div>
                    <p className="text-white/50 text-[10px]">{member.role}</p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <p className="text-white/30 text-[9px] mt-4 mr-1">当前负载: {member.load}</p>
                  <button onClick={() => handleRemoveMember(member.id)} className="text-white/40 hover:text-red-400 p-1 rounded-full hover:bg-white/5 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI Suggestion */}
          <div className="mt-4 bg-gradient-to-br from-blue-500/10 to-[#192433] border border-blue-500/20 p-4 rounded-xl flex gap-3 shadow-sm relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#2C097F] flex items-center justify-center shrink-0 shadow-lg shadow-[#2C097F]/30 z-10">
              <Rocket size={16} className="text-white" />
            </div>
            <div className="z-10 flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-blue-500 uppercase">AI 智能指派建议</h3>
                <button
                  onClick={handleRefreshAI}
                  disabled={aiLoading}
                  className={`text-blue-400 hover:text-blue-300 p-1 rounded-full ${aiLoading ? 'animate-spin' : ''}`}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <p className={`text-white/90 text-sm leading-snug transition-opacity duration-300 ${aiLoading ? 'opacity-50' : 'opacity-100'}`}>
                {aiLoading ? "正在分析团队负载数据..." : aiSuggestion}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 safe-bottom">
        <button
          onClick={handleStartProject}
          className="w-full bg-[#6D28D9] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl active:scale-[0.98] transition-transform"
        >
          <Rocket size={20} />
          启动项目
        </button>
      </div>
    </div>
  );
};
