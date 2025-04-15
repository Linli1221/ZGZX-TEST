'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';

interface SidebarProps {
  activeMenu?: string;
}

export default function Sidebar({ activeMenu = 'works' }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isFirstVisit } = useNavigation();

  // 导航处理函数
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // 当前路径
  const isActive = (path: string): boolean => {
    if (!pathname) return false;
    return pathname === path;
  };

  return (
    <div className="sidebar w-64 border-r border-accent-brown/30 bg-card-color shadow-md flex flex-col rounded-tr-2xl rounded-br-2xl">
      <div className="p-5 border-b border-accent-brown/30 flex items-center">
        <div className="w-10 h-10 bg-primary-green rounded-xl flex items-center justify-center text-white font-bold mr-3 text-base shadow-sm">智</div>
        <span 
          className="text-xl font-medium text-text-dark"
          style={{ fontFamily: "'Ma Shan Zheng', cursive" }}
        >
          逐光写作
        </span>
      </div>

      <div className="flex-1 py-8 px-3">
        <div className="mb-6 px-4">
          <h3 className="text-xs font-semibold text-text-medium uppercase tracking-wider mb-3">主要功能</h3>
        </div>
        
        <div
          className={`menu-item ${activeMenu === 'novel' ? 'active' : ''}`}
          onClick={() => handleNavigation('/')}
        >
          <div className="menu-icon">
            <span className="material-icons text-xl">home</span>
          </div>
          <span className="menu-text">首页</span>
        </div>
        
        <div
          className={`menu-item ${activeMenu === 'works' || (pathname && pathname.startsWith('/works')) ? 'active' : ''}`}
          onClick={() => handleNavigation('/works')}
        >
          <div className="menu-icon">
            <span className="material-icons text-xl">auto_stories</span>
          </div>
          <span className="menu-text">小说创作</span>
        </div>
        
        <div
          className={`menu-item ${activeMenu === 'creativemap' || (pathname && pathname.startsWith('/creativemap')) ? 'active' : ''}`}
          onClick={() => handleNavigation('/creativemap')}
        >
          <div className="menu-icon">
            <span className="material-icons text-xl">map</span>
          </div>
          <span className="menu-text">创意地图</span>
        </div>

        <div className="mt-8 mb-4 px-4">
          <h3 className="text-xs font-semibold text-text-medium uppercase tracking-wider mb-3">工具</h3>
        </div>
        
        <div
          className={`menu-item ${activeMenu === 'prompts' || (pathname && pathname.startsWith('/prompts')) ? 'active' : ''}`}
          onClick={() => handleNavigation('/prompts')}
        >
          <div className="menu-icon">
            <span className="material-icons text-xl">edit_note</span>
          </div>
          <span className="menu-text">提示词管理</span>
        </div>
      </div>

      <div className="p-4 mt-auto">
        <div className="bg-bg-color rounded-xl p-4 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-primary-green/20 rounded-full opacity-70"></div>
          <h4 className="font-medium text-text-dark text-sm mb-2 font-ma-shan">写作助手</h4>
          <p className="text-xs text-text-medium mb-3 relative z-10">探索AI辅助创作的各种新功能和技巧</p>
          <button className="bg-white text-primary-green text-xs font-medium py-1.5 px-3 rounded-lg shadow-sm hover:shadow transition-shadow duration-200 flex items-center">
            <span>查看指南</span>
            <span className="material-icons ml-1 text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}