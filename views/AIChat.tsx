
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal, Send, Plus, Search, GitPullRequest, Users, HelpCircle, Bot, ExternalLink } from 'lucide-react';
import { aiService } from '../lib/aiService';
import { Department, AIMessage } from '../types';

interface AIChatProps {
  onNavigateToNotifications: () => void;
  onSwitchToOrg: () => void;
  onCreateProject?: (prefilledMembers?: any[]) => void;
  orgData?: Department;
  allProjects?: any[];
  messages: AIMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AIMessage[]>>;
}

export const AIChat: React.FC<AIChatProps> = ({ onNavigateToNotifications, onSwitchToOrg, onCreateProject, orgData, allProjects, messages, setMessages }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Extract experts from the last recommendation message for creating a project
  const getLatestExperts = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.type === 'recommendation' && msg.data?.experts) {
        return msg.data.experts.map((e: any, idx: number) => ({
          id: `expert-${idx}`,
          name: e.name.split('·')[1] || e.name,
          dept: e.name.split('·')[0] || '未知部门',
          role: e.desc?.split('：')[0] || '专家',
          avatar: `https://picsum.photos/seed/${encodeURIComponent(e.name)}/100`
        }));
      }
    }
    return [];
  };

  // Handle 创建项目 - Create project with 王经理 and 李律师 as members
  const handleCreateMeeting = () => {
    // Use fixed members: 王经理 and 李律师
    const prefilledMembers = [
      { id: 'm_wang_jl', name: '王经理', role: '财务经理', dept: '财务部' },
      { id: 'm_li_ls', name: '李律师', role: '法务顾问', dept: '法务部' }
    ];
    if (onCreateProject) {
      onCreateProject(prefilledMembers);
    }
  };

  // Handle 查找技术专家 - AI search for technical experts
  const handleSearchExpert = async () => {
    if (isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: '查找技术专家', type: 'text' }]);
    setIsLoading(true);

    try {
      // Flatten members for context
      const getAllMembers = (node: Department): any[] => {
        let list = [...(node.members || [])];
        node.children?.forEach(child => { list = [...list, ...getAllMembers(child)]; });
        return list;
      };
      const allMembers = orgData ? getAllMembers(orgData) : [];

      const responseText = await aiService.chatWithAI(
        `请从当前的组织架构中，识别并推荐2-3位具备技术专长或资深经验的成员（如工程师、专家、负责人等）。
        要求：
        1. 必须使用提供的【组织成员信息】中的真实姓名和职能。
        2. 严禁虚构。
        3. 请简洁地列出这些专家的名字、部门及推荐理由。`,
        messages.filter(m => m.type === 'text').map(m => ({ role: m.role, text: (m as any).text })),
        { members: allMembers, projects: allProjects }
      );

      setMessages(prev => [...prev, { role: 'model', text: responseText, type: 'text' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "抱歉，技术专家查找失败。", type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 获取合规模板 - Open Google search
  const handleSearchTemplates = () => {
    const searchQuery = encodeURIComponent('合规模板 审计 财务流程');
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

  // Handle 申请跨部门协作 - AI recommends cross-department members
  const handleCrossDeptCollaboration = async () => {
    if (isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: '申请跨部门协作', type: 'text' }]);
    setIsLoading(true);

    try {
      // Flatten members for context
      const getAllMembers = (node: Department): any[] => {
        let list = [...(node.members || [])];
        node.children?.forEach(child => { list = [...list, ...getAllMembers(child)]; });
        return list;
      };
      const allMembers = orgData ? getAllMembers(orgData) : [];

      const responseText = await aiService.chatWithAI(
        `请分析当前的组织架构，从已有的真实员工中推荐3位来自不同部门的协作成员。
        要求：
        1. 必须使用提供的【组织成员信息】中的真实姓名和部门。
        2. 严禁虚构不存在的人名或部门。
        3. 请按照以下格式返回：
           1. [部门名]·[成员姓名]
              专长：[基于其职位的具体技能]
           2. [部门名]·[成员姓名]
              专长：[基于其职位的具体技能]
           3. [部门名]·[成员姓名]
              专长：[基于其职位的具体技能]`,
        messages.filter(m => m.type === 'text').map(m => ({ role: m.role, text: (m as any).text })),
        { members: allMembers, projects: allProjects }
      );

      setMessages(prev => [...prev, { role: 'model', text: responseText, type: 'text' }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "**跨部门协作推荐：**\n\n1. **研发中心·李思** — Java专家，擅长系统集成\n2. **财务部·王经理** — 跨境审计经验丰富\n3. **法务部·李律师** — 合规风控专家",
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, type: 'text' }]);
    setIsLoading(true);

    try {
      // Flatten members for context
      const getAllMembers = (node: Department): any[] => {
        let list = [...(node.members || [])];
        node.children?.forEach(child => { list = [...list, ...getAllMembers(child)]; });
        return list;
      };
      const allMembers = orgData ? getAllMembers(orgData) : [];

      // Prepare history for AI
      const history = messages.map(m => ({
        role: m.role,
        text: m.role === 'model' && m.type === 'text' ? m.text : (m.type === 'recommendation' ? '我已为您提供了一些推荐协作资源。' : (m as any).text || '')
      }));

      const context = {
        members: allMembers,
        projects: allProjects
      };

      const responseText = await aiService.chatWithAI(userMessage, history, context);
      setMessages(prev => [...prev, { role: 'model', text: responseText, type: 'text' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "抱歉，网络连接似乎有问题。", type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (msg: AIMessage) => {
    if (msg.type === 'text') {
      // Simple formatting for bold text
      const parts = msg.text.split(/(\*\*.*?\*\*)/g);
      return (
        <div className="whitespace-pre-wrap leading-relaxed">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <span key={i} className="font-bold text-[#2C097F]">{part.slice(2, -2)}</span>;
            }
            return part;
          })}
        </div>
      );
    }

    if (msg.type === 'recommendation') {
      return (
        <div className="space-y-3">
          <p className="text-slate-800 font-medium text-xs">{msg.data.title}</p>
          <div className="space-y-2">
            {msg.data.experts.map((expert: any, idx: number) => (
              <div key={idx}>
                <p className="text-slate-800 font-bold mb-0.5 text-xs">
                  {idx + 1}. <span className="text-[#2C097F]">{expert.name}</span>
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {expert.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Action Buttons specific to the screenshot */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreateMeeting}
              className="flex-1 bg-[#E7C18F] hover:bg-[#dcb075] text-white py-2 rounded-lg flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <Users size={12} className="text-white" fill="currentColor" />
              <span className="text-[10px] font-bold">创建项目</span>
            </button>
            <button
              onClick={handleSearchTemplates}
              className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 py-2 rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <ExternalLink size={12} className="text-slate-500" />
              <span className="text-[10px] font-bold">获取合规模板</span>
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F6F6F8]">
      {/* Header */}
      <div className="bg-[#F6F6F8]/95 backdrop-blur-md sticky top-0 z-50 px-4 py-2 flex items-center justify-between border-b border-gray-100">
        <div className="w-6"></div>
        <div className="text-center">
          <h1 className="text-sm font-bold text-slate-900">AI 智能协作助手</h1>
          <div className="flex items-center justify-center gap-1 mt-0">
            <span className="w-1 h-1 rounded-full bg-green-500"></span>
            <p className="text-[9px] text-slate-500 font-bold">专家与跨部门对接已就绪</p>
          </div>
        </div>
        <div className="w-6"></div>
      </div>

      {/* Chat Area - Added bottom padding to account for fixed input and nav bar */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-[180px] no-scrollbar">
        <div className="text-center text-[10px] text-gray-400 font-medium tracking-wide my-1">今天 14:32</div>

        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-7 h-7 rounded-full bg-[#2C097F]/10 flex items-center justify-center border border-[#2C097F]/10 shrink-0">
                <BotIcon />
              </div>
            )}

            <div className={`rounded-xl px-3 py-2.5 shadow-sm text-xs max-w-[85%] ${msg.role === 'user'
              ? 'bg-[#2C097F] text-white rounded-tr-none'
              : 'bg-white text-slate-800 rounded-tl-none border border-gray-100'
              }`}>
              {renderMessageContent(msg)}
              {msg.isExample && index === 2 && (
                <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] text-gray-400 font-medium italic text-right">
                  以上为示例对话
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <img src="https://picsum.photos/seed/kexin/100" className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover" alt="User" />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2C097F]/10 flex items-center justify-center border border-[#2C097F]/10 shrink-0">
              <BotIcon />
            </div>
            <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-gray-50 flex gap-1.5 items-center">
              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce delay-75"></span>
              <span className="w-1 h-1 bg-gray-300 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed positioning above bottom nav */}
      <div className="fixed bottom-[60px] left-0 right-0 bg-white z-40 border-t border-gray-50 pb-1.5 shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
        {/* Suggestion Chips */}
        <div className="px-4 pb-2 pt-2 flex gap-2 overflow-x-auto no-scrollbar">
          <Chip
            icon={<Search size={12} className="text-[#2C097F]" />}
            label="查找技术专家"
            onClick={handleSearchExpert}
          />
          <Chip
            icon={<GitPullRequest size={12} className="text-[#2C097F]" />}
            label="申请跨部门协作"
            onClick={handleCrossDeptCollaboration}
          />
        </div>

        <div className="px-4 flex items-center gap-2">
          <div className="flex-1 bg-[#F9FAFB] rounded-full px-4 py-2 flex items-center border border-transparent focus-within:border-[#2C097F]/20 transition-colors h-9">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入需求..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400 text-slate-900"
            />
          </div>

          <button
            onClick={handleSend}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg shadow-[#2C097F]/30 transition-all active:scale-95 shrink-0 bg-[#2C097F]`}
          >
            <Send size={16} className="-ml-0.5" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Chip = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F3F4F6] hover:bg-gray-200 rounded-full text-slate-600 text-[10px] font-bold whitespace-nowrap transition-colors active:scale-95"
  >
    {icon}
    {label}
  </button>
);

const BotIcon = () => (
  <div className="relative">
    <Bot size={16} className="text-[#2C097F]" strokeWidth={2.5} />
  </div>
);
