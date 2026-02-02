
import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, User, Users } from 'lucide-react';
import { Department, Member } from '../types';

interface OrganizationProps {
  onNavigateToNotifications: () => void;
  onViewProfile: (user: any) => void;
  data: Department;
}

const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="text-orange-500 font-bold">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
};

export const Organization: React.FC<OrganizationProps> = ({ onNavigateToNotifications, onViewProfile, data }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']));
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectDept = (dept: Department) => {
    // Always toggle expand if it has children
    if (dept.children && dept.children.length > 0) {
      toggleExpand(dept.id);
    }

    // Only open bottom sheet if there are members directly in this department
    if (dept.members && dept.members.length > 0) {
      if (selectedDeptId === dept.id) {
        setSelectedDeptId(null);
      } else {
        setSelectedDeptId(dept.id);
      }
    } else {
      // If no members (just structure), ensure bottom sheet is closed
      if (selectedDeptId === dept.id) {
        setSelectedDeptId(null);
      }
    }
  };

  // Helper to find dept by id in original data
  const findDept = (node: Department, id: string | null): Department | null => {
    if (!id) return null;
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findDept(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Filter Data Function
  const filterData = (node: Department, query: string): Department | null => {
    if (!query) return node;

    const lowerQuery = query.toLowerCase();

    // Check members
    const filteredMembers = node.members.filter(m =>
      m.name.toLowerCase().includes(lowerQuery) ||
      m.role.toLowerCase().includes(lowerQuery) ||
      m.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );

    // Check children
    const filteredChildren: Department[] = [];
    if (node.children) {
      for (const child of node.children) {
        const result = filterData(child, query);
        if (result) filteredChildren.push(result);
      }
    }

    const matchesSelf = node.name.toLowerCase().includes(lowerQuery);

    if (matchesSelf) {
      return {
        ...node,
        members: filteredMembers.length > 0 ? filteredMembers : (matchesSelf ? node.members : []),
        children: filteredChildren.length > 0 ? filteredChildren : (matchesSelf ? node.children : [])
      };
    }

    if (filteredMembers.length > 0 || filteredChildren.length > 0) {
      return {
        ...node,
        members: filteredMembers,
        children: filteredChildren
      };
    }

    return null;
  };

  const displayData = useMemo(() => filterData(data, searchQuery), [data, searchQuery]);

  // Auto-expand all if searching
  useEffect(() => {
    if (searchQuery && displayData) {
      const allIds = new Set<string>();
      const collectIds = (node: Department) => {
        allIds.add(node.id);
        node.children?.forEach(collectIds);
      };
      collectIds(displayData);
      setExpandedIds(allIds);
    } else {
      // Reset to default on clear
      setExpandedIds(new Set(['root']));
    }
  }, [searchQuery, displayData]);

  const selectedDept = findDept(data, selectedDeptId);

  const renderTree = (node: Department) => {
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedDeptId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    const directNameMatch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

    const hasMemberMatch = searchQuery && node.members.some(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const isResult = directNameMatch || hasMemberMatch;

    // Visual Adjustment: Increase indentation margin and apply width constraint 
    // to simulate "shorter" visual structure for child nodes
    const levelStyle: React.CSSProperties = node.level > 0 ? {
      marginLeft: '1.25rem', // Reduced from 2.5rem for mobile
      width: `calc(100% - ${node.level * 0.75}rem)`, // Reduced shortening factor
    } : {};

    return (
      <div key={node.id} className="relative">
        <div className="relative" style={levelStyle}>
          {/* Connecting lines for children */}
          {node.level > 0 && <div className="absolute -left-6 top-1/2 w-4 h-0.5 bg-slate-300"></div>}
          {node.level > 0 && <div className="absolute -left-8 top-0 bottom-0 w-0.5 bg-slate-300"></div>}

          <div
            onClick={() => handleSelectDept(node)}
            className={`rounded-xl p-3 flex items-center justify-between shadow-sm z-10 cursor-pointer transition-all duration-200 border ${isSelected
                ? 'bg-[#2C097F]/5 border-[#2C097F]/30 ring-1 ring-[#2C097F]/20'
                : isResult
                  ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200'
                  : 'bg-white border-slate-100 hover:border-[#2C097F]/20'
              }`}
          >
            <div className="flex items-center gap-3">
              {node.level === 0 && (
                <div className="w-10 h-10 bg-[#2C097F] rounded-lg flex items-center justify-center text-white">
                  <BuildingIcon />
                </div>
              )}
              <div>
                <h3 className={`text-sm font-bold ${isSelected ? 'text-[#2C097F]' : directNameMatch ? 'text-orange-600' : 'text-slate-900'}`}>
                  <HighlightText text={node.name} query={searchQuery} />
                </h3>
                <p className={`text-xs ${isSelected ? 'text-[#2C097F]/70' : 'text-slate-400'}`}>{node.enName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${node.level === 0 || isSelected ? 'font-bold text-[#2C097F]' : 'text-slate-500'}`}>{node.count}</span>
              {hasChildren && (
                <div onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}>
                  {isExpanded ? <ChevronUp size={16} className={isSelected ? "text-[#2C097F]" : "text-slate-400"} /> : <ChevronDown size={16} className={isSelected ? "text-[#2C097F]" : "text-slate-400"} />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Vertical line connecting children */}
            {node.level >= 0 && (
              <div
                className="absolute bg-slate-300 w-0.5"
                style={{
                  left: node.level === 0 ? '24px' : '40px', // Matches indent
                  top: '0',
                  bottom: '24px'
                }}
              ></div>
            )}
            <div className="pt-4">
              {node.children!.map(child => (
                <div key={child.id} className="mb-4 last:mb-0 relative">
                  {renderTree(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F6F6F8]">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md sticky top-0 z-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="w-5"></div>
          <h1 className="text-lg font-bold text-slate-900">组织架构与人才地图</h1>
          <div className="w-5"></div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索人名、部门、技能"
            className="w-full bg-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#2C097F]"
          />
        </div>
      </div>

      <div className="p-4 overflow-y-auto pb-64">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-[#2C097F] rounded text-white flex items-center justify-center text-xs">
            <Users size={12} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">组织层级树</h2>
        </div>

        {/* Tree Container */}
        <div className="relative pl-2">
          {displayData ? renderTree(displayData) : <div className="text-gray-400 text-sm text-center py-10">未找到匹配结果</div>}
        </div>
      </div>

      {/* Bottom Sheet for Members */}
      <div className={`fixed inset-x-0 bottom-0 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 z-40 transform transition-transform duration-300 ${selectedDeptId ? 'translate-y-0' : 'translate-y-full'}`}>
        <div
          onClick={() => setSelectedDeptId(null)}
          className="w-full flex justify-center pt-3 pb-1 cursor-pointer"
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        <div className="px-6 pb-2 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{selectedDept?.name} 成员</h3>
            <p className="text-xs text-slate-500">共有 {selectedDept?.members.length || 0} 位团队成员</p>
          </div>
          <button onClick={() => setSelectedDeptId(null)} className="text-slate-400 p-2">
            <ChevronDown size={20} />
          </button>
        </div>

        <div className="max-h-[40vh] min-h-[200px] overflow-y-auto px-4 pb-20 space-y-3 no-scrollbar">
          {selectedDept && selectedDept.members.length > 0 ? (
            selectedDept.members.map(member => (
              <MemberCard
                key={member.id}
                name={member.name}
                role={member.role}
                projectCount={member.projectCount}
                status={member.status}
                tags={member.tags}
                avatar={member.avatar}
                searchQuery={searchQuery}
                onClick={() => onViewProfile(member)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              暂无成员或该部门为上级组织
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MemberCard = ({ name, role, projectCount, status, tags, avatar, onClick, searchQuery }: any) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-slate-300',
    busy: 'bg-yellow-500'
  };

  return (
    <div onClick={onClick} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer">
      <div className="relative">
        <img src={avatar} className="w-12 h-12 rounded-full object-cover" alt={name} />
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusColors[status as keyof typeof statusColors]}`}></div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-sm text-slate-900">
            <HighlightText text={name} query={searchQuery} />
          </h4>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${projectCount > 0 ? 'bg-[#2C097F]/10 text-[#2C097F]' : 'bg-slate-200 text-slate-500'}`}>
            当前 {projectCount} 个项目
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          <HighlightText text={role} query={searchQuery} />
        </p>
        {/* Tags */}
        <div className="flex gap-1 mt-1.5">
          {tags.map((tag: string) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500">
              <HighlightText text={tag} query={searchQuery} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const BuildingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" />
    <path d="M16 6h.01" />
    <path d="M12 6h.01" />
    <path d="M12 10h.01" />
    <path d="M12 14h.01" />
    <path d="M16 10h.01" />
    <path d="M16 14h.01" />
    <path d="M8 10h.01" />
    <path d="M8 14h.01" />
  </svg>
);
