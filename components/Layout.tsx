
import React from 'react';
import { Tab } from '../types';
import { LayoutGrid, Building2, Bot, ClipboardList, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  hideBottomNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentTab, onTabChange, hideBottomNav }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-[#F6F6F8] overflow-hidden relative shadow-2xl font-inter">
      <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        {children}
      </main>

      {!hideBottomNav && (
        <div className="bg-white border-t border-gray-100 safe-bottom z-50 absolute bottom-0 w-full shadow-[0_-5px_20px_rgba(0,0,0,0.03)] pb-2">
          <div className="flex justify-between items-center h-[65px] px-2 relative">

            {/* Left Items */}
            <div className="flex-1 flex justify-around">
              <NavItem
                icon={<LayoutGrid size={24} />}
                label="工作台"
                isActive={currentTab === Tab.Workspace}
                onClick={() => onTabChange(Tab.Workspace)}
              />
              <NavItem
                icon={<Building2 size={24} />}
                label="组织"
                isActive={currentTab === Tab.Organization}
                onClick={() => onTabChange(Tab.Organization)}
              />
            </div>

            {/* Center AI Button - Popped Up */}
            <div className="relative w-16 flex flex-col items-center justify-end z-10 -top-5" onClick={() => onTabChange(Tab.AI)}>
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg mb-1 ${currentTab === Tab.AI ? 'bg-[#2C097F] shadow-[#2C097F]/40 scale-110 ring-4 ring-white' : 'bg-white border border-gray-100 text-[#2C097F]'}`}>
                <Bot size={28} className={currentTab === Tab.AI ? "text-white" : "text-[#2C097F]"} strokeWidth={2} />
              </div>
              <span className={`text-[10px] font-bold ${currentTab === Tab.AI ? 'text-[#2C097F]' : 'text-gray-400'}`}>AI助手</span>
            </div>

            {/* Right Items */}
            <div className="flex-1 flex justify-around">
              <NavItem
                icon={<ClipboardList size={24} />}
                label="项目"
                isActive={currentTab === Tab.Project}
                onClick={() => onTabChange(Tab.Project)}
              />
              <NavItem
                icon={<User size={24} />}
                label="我的"
                isActive={currentTab === Tab.My}
                onClick={() => onTabChange(Tab.My)}
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 h-full w-14 ${isActive ? 'text-[#2C097F]' : 'text-gray-400 hover:text-gray-500'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, {
      strokeWidth: isActive ? 2.5 : 2,
      size: 22
    })}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);
