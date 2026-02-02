import React, { useState, useMemo } from 'react';
import { ChevronLeft, ListChecks, AlertTriangle, Bell, Mail, Bot, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface NotificationsProps {
  onBack: () => void;
  onProjectClick: (id: string) => void;
  onViewProfile: (user: any) => void;
  activities: any[];
  onDeleteActivities?: (ids: string[]) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack, onProjectClick, onViewProfile, activities, onDeleteActivities }) => {
  const [filter, setFilter] = useState<'all' | 'alert' | 'ai'>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Convert activities to notification format
  const mappedNotifications = useMemo(() => {
    return (activities || []).map((act, index) => {
      // Preserve the original type for AI, otherwise map to appropriate type
      let mappedType = 'system';
      if (act.type === 'ai') {
        mappedType = 'ai';
      } else if (act.type === 'invite') {
        mappedType = 'message';
      } else if (act.type === 'task') {
        mappedType = 'alert';
      }

      return {
        id: act.id || `act-${index}`,
        type: mappedType,
        title: act.type === 'ai'
          ? `${act.action} ${act.target}`
          : `${act.userName || act.user_name} ${act.action} ${act.target} [${act.projectTitle || act.project_title}]`,
        time: act.time || act.time_text || '刚刚',
        tag: act.type === 'ai' ? 'AI建议' : (act.type === 'invite' ? '邀请' : (act.type === 'task' ? '任务' : '动态')),
        action: act.type === 'ai' ? '查看详情' : '查看详情',
        projectId: act.projectId || act.project_id,
        projectTitle: act.projectTitle || act.project_title,
        isOld: false
      };
    });
  }, [activities]);

  const [localNotifications, setLocalNotifications] = useState<any[]>([]);

  // Sync localNotifications with mappedNotifications but keep removals
  React.useEffect(() => {
    setLocalNotifications(mappedNotifications);
  }, [mappedNotifications]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleArchive = async () => {
    // Delete from Supabase database permanently
    const idsToDelete = Array.from(selectedIds);

    // Identify database IDs (UUIDs have specific format with dashes)
    const isUUID = (id: string) => {
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    };

    const uuidIds = idsToDelete.filter(id => isUUID(id as string));
    const allIds = idsToDelete.map(id => id as string);

    // Delete UUIDs from database
    if (uuidIds.length > 0) {
      try {
        const { error } = await supabase
          .from('activities')
          .delete()
          .in('id', uuidIds);

        if (error) {
          console.error('Error deleting notifications:', error);
        }
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }

    // Notify parent to update projectActivities state (removes from App state)
    if (onDeleteActivities) {
      onDeleteActivities(allIds);
    }

    // Update local state
    setLocalNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const filteredNotifications = localNotifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'alert') return n.type === 'alert';
    if (filter === 'ai') return n.type === 'ai';
    return true;
  });

  const recent = filteredNotifications.filter(n => !n.isOld);
  const old = filteredNotifications.filter(n => n.isOld);

  const handleAction = (item: any) => {
    if (isSelectionMode) return;
    if (item.isProfile && item.targetUser) {
      onViewProfile(item.targetUser);
    } else {
      onProjectClick(item.projectId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F6F6F8]">
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button onClick={onBack} className="flex items-center gap-1 font-bold text-slate-900">
          <ChevronLeft /> 工作台
        </button>
        <h1 className="text-lg font-bold text-slate-900">消息通知中心</h1>
        <button
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            setSelectedIds(new Set());
          }}
          className={`p-2 rounded-full transition-colors ${isSelectionMode ? 'bg-[#2C097F]/10 text-[#2C097F]' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <ListChecks size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 pb-20">
        {/* Filters - Compressed */}
        <div className="flex gap-4 mb-3 border-b border-gray-200 pb-0">
          <FilterTab label="全部" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterTab label="预警" active={filter === 'alert'} onClick={() => setFilter('alert')} />
          <FilterTab label="AI建议" active={filter === 'ai'} onClick={() => setFilter('ai')} />
        </div>

        <div className="space-y-2.5">
          {recent.map(item => (
            <NotificationCard
              key={item.id}
              item={item}
              onClick={() => isSelectionMode ? toggleSelection(item.id) : handleAction(item)}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(item.id)}
            />
          ))}

          {old.length > 0 && (
            <>
              <div className="flex items-center gap-4 py-2 opacity-60">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400">更早的消息</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
              {old.map(item => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  onClick={() => isSelectionMode ? toggleSelection(item.id) : handleAction(item)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(item.id)}
                  isOld
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Archive Bottom Bar */}
      {isSelectionMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom flex justify-between items-center z-[60] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <span className="text-sm font-bold text-slate-500">已选择 {selectedIds.size} 项</span>
          <button
            disabled={selectedIds.size === 0}
            onClick={handleArchive}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${selectedIds.size > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
              }`}
          >
            <Trash2 size={18} />
            归档删除
          </button>
        </div>
      )}
    </div>
  );
};

const FilterTab = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`pb-3 px-2 text-sm font-bold transition-colors relative ${active ? 'text-[#2C097F]' : 'text-gray-500 hover:text-gray-700'}`}
  >
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2C097F] rounded-full"></div>}
  </button>
);

const NotificationCard = ({ item, onClick, isOld, isSelectionMode, isSelected }: any) => {
  let icon = <Bell size={20} />;
  let iconBg = 'bg-blue-50 text-blue-500';
  let btnStyle = 'bg-gray-50 border-gray-200 text-gray-600';
  let tagStyle = 'text-gray-400';
  let isAlert = item.type === 'alert';

  if (item.type === 'alert') {
    icon = <AlertTriangle size={20} />;
    iconBg = 'bg-red-50 text-red-500';
    btnStyle = 'bg-red-50 border-red-100 text-red-500';
    tagStyle = 'text-red-500 bg-red-50 px-1.5 py-0.5 rounded font-bold';
  } else if (item.type === 'ai') {
    icon = <Bot size={20} />;
    iconBg = 'bg-purple-50 text-purple-600';
    btnStyle = 'bg-purple-50 border-purple-100 text-purple-600';
    tagStyle = 'text-purple-600 flex items-center gap-1 font-bold';
  } else if (item.type === 'system') {
    icon = <Bell size={20} />;
    iconBg = 'bg-blue-50 text-blue-500';
    tagStyle = 'text-gray-400';
  } else if (item.type === 'message') {
    icon = <Mail size={20} />;
    iconBg = 'bg-gray-100 text-gray-500';
  }

  const renderTitle = (title: string, type: string) => {
    if (type === 'ai') {
      // AI notifications: show the title with purple styling
      return (
        <>
          <span className="text-purple-600 font-bold">AI {title}</span>
          {item.projectTitle && <span className="text-gray-500 ml-1">[{item.projectTitle}]</span>}
        </>
      );
    }
    if (type === 'alert') {
      const parts = title.split(/(\[.*?\])/);
      return parts.map((part, i) =>
        part.startsWith('[') && part.endsWith(']')
          ? <span key={i} className="font-bold">{part}</span>
          : part
      );
    }
    return title;
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden flex items-center gap-2.5 transition-all ${isOld ? 'opacity-80' : ''} ${isSelected ? 'border-[#2C097F] bg-blue-50/30' : ''}`}
    >
      {isSelectionMode && (
        <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-[#2C097F] bg-[#2C097F]' : 'border-gray-300'}`}>
          {isSelected && <CheckCircle2 size={12} className="text-white" />}
        </div>
      )}

      {isAlert && !isSelectionMode && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
      {item.type === 'ai' && !isSelectionMode && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>}

      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {React.cloneElement(icon as React.ReactElement, { size: 16 })}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-2">
          <p className="text-[13px] text-slate-800 font-bold leading-snug flex-1">
            {renderTitle(item.title, item.type)}
          </p>
          {!isSelectionMode && (
            <button
              className={`text-[10px] font-black px-2.5 py-1 rounded-lg border whitespace-nowrap active:scale-95 transition-transform ${btnStyle}`}
            >
              {item.action}
            </button>
          )}
        </div>

        <div className="flex justify-between items-center mt-1.5">
          <div className={`text-[10px] ${tagStyle}`}>
            {item.type === 'ai' && '✨ '}
            {item.tag || (isOld ? item.time : '')}
          </div>
          {!isOld && <span className="text-[10px] text-gray-400">{item.time}</span>}
        </div>
      </div>
    </div>
  );
};