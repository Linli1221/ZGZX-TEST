'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import BackButton from '@/components/BackButton';
import TopBar from '@/components/TopBar';
import { getApiKey } from '@/lib/settingsManager'; // 导入设置管理模块

// 导入openDB
import { openDB } from 'idb';

// 创意地图项目类型定义及颜色方案
const creativeMapItems = [
  {
    id: 'introduction',
    name: '导语',
    description: '创作引人入胜的开篇导语',
    icon: 'format_quote',
    color: 'bg-[#7D85CC20]',
    textColor: 'text-[#7D85CC]',
    borderColor: 'border-[rgba(125,133,204,0.4)]',
    gradient: 'from-[#7D85CC] to-[#6F9CE0]',
    tapeColor: 'rgba(125,133,204,0.7)'
  },
  {
    id: 'outline',
    name: '大纲',
    description: '构建故事的骨架和框架',
    icon: 'format_list_bulleted',
    color: 'bg-[#E0976F20]',
    textColor: 'text-[#E0976F]',
    borderColor: 'border-[rgba(224,151,111,0.4)]',
    gradient: 'from-[#E0976F] to-[#E0C56F]',
    tapeColor: 'rgba(224,149,117,0.7)'
  },
  {
    id: 'detailed_outline',
    name: '细纲',
    description: '规划更详细的章节内容',
    icon: 'subject',
    color: 'bg-[#E0C56F20]',
    textColor: 'text-[#E0C56F]',
    borderColor: 'border-[rgba(224,197,111,0.4)]',
    gradient: 'from-[#E0C56F] to-[#E0976F]',
    tapeColor: 'rgba(224,197,111,0.7)'
  },
  {
    id: 'worldbuilding',
    name: '世界观',
    description: '构建故事发生的世界和设定',
    icon: 'public',
    color: 'bg-[#E06F9C20]',
    textColor: 'text-[#E06F9C]',
    borderColor: 'border-[rgba(224,111,156,0.4)]',
    gradient: 'from-[#E06F9C] to-[#E0976F]',
    tapeColor: 'rgba(224,111,156,0.7)'
  },
  {
    id: 'character',
    name: '角色',
    description: '设计故事中的人物形象',
    icon: 'person',
    color: 'bg-[#9C6FE020]',
    textColor: 'text-[#9C6FE0]',
    borderColor: 'border-[rgba(156,111,224,0.4)]',
    gradient: 'from-[#9C6FE0] to-[#7D85CC]',
    tapeColor: 'rgba(156,111,224,0.7)'
  },
  {
    id: 'plot',
    name: '情节',
    description: '规划故事的发展和转折',
    icon: 'timeline',
    color: 'bg-[#6F9CE020]',
    textColor: 'text-[#6F9CE0]',
    borderColor: 'border-[rgba(111,156,224,0.4)]',
    gradient: 'from-[#6F9CE0] to-[#9C6FE0]',
    tapeColor: 'rgba(111,156,224,0.7)'
  },
] as const; // 使用 as const 确保 id 类型

type CreativeMapItemId = typeof creativeMapItems[number]['id'];

// 提示词模板 (修正 detailedOutline 为 detailed_outline)
const promptTemplates: Record<CreativeMapItemId, string> = {
  'introduction': '为[类型]的故事创建一个引人入胜的开篇导语，设定[氛围]的基调，并引导读者关注[焦点]。请基于以下要求生成：\n\n',
  'outline': '为[主题]的[类型]故事创建一个大纲，包括主线规划、章节划分和核心情节点。请基于以下要求生成：\n\n',
  'detailed_outline': '基于大纲，为[章节名]创建详细的内容规划，包括场景描述、对话设计和情感氛围。请基于以下要求生成：\n\n', // 修正为 snake_case
  'character': '创建一个[性格特点]的角色，包括其背景故事、动机、外貌特征和行为模式。请基于以下要求生成：\n\n',
  'worldbuilding': '设计一个[类型]的世界，包括其[历史/地理/文化/政治]等方面。重点描述[特点]。请基于以下要求生成：\n\n',
  'plot': ''
};

export default function CreativeMapPage() {
  const router = useRouter();

  // AI 相关状态
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(''); // 用于检查API Key是否存在

  // 加载API密钥
  useEffect(() => {
    const loadData = async () => {
      // 加载 API Key
      try {
        const savedApiKey = await getApiKey();
        if (savedApiKey) {
          setApiKey(savedApiKey); // 存储API Key用于检查
        }
      } catch (error) {
        console.error('加载API密钥失败:', error);
      }
    };
    loadData();
  }, []);

  // 返回的JSX结构
  return (
    <div className="flex h-screen bg-bg-color animate-fadeIn overflow-hidden">
      {/* 背景网格 */}
      <div className="grid-background"></div>

      {/* 装饰元素，在小屏幕上减少数量 */}
      <div className="dot hidden md:block" style={{ top: "120px", left: "15%" }}></div>
      <div className="dot" style={{ bottom: "80px", right: "20%" }}></div>
      <div className="dot hidden md:block" style={{ top: "30%", right: "25%" }}></div>
      <div className="dot hidden md:block" style={{ bottom: "40%", left: "30%" }}></div>

      <svg className="wave hidden md:block" style={{ bottom: "20px", left: "10%" }} width="100" height="20" viewBox="0 0 100 20">
        <path d="M0,10 Q25,0 50,10 T100,10" fill="none" stroke="var(--accent-brown)" strokeWidth="2" />
      </svg>

      <svg className="wave hidden md:block" style={{ top: "15%", right: "5%" }} width="100" height="20" viewBox="0 0 100 20">
        <path d="M0,10 Q25,0 50,10 T100,10" fill="none" stroke="var(--accent-brown)" strokeWidth="2" />
      </svg>

      {/* 左侧导航栏 */}
      <Sidebar activeMenu="creativemap" />

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 顶部导航栏 */}
        <TopBar
          title="创意地图"
          showBackButton={true}
        />

        {/* 主要内容区 */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {/* 创意地图卡片部分 - 这里是修改后的部分 */}
            <div className="animate-fadeIn">
              <h2 className="section-title flex items-center text-lg lg:text-xl mb-6">
                <span className="material-icons text-primary-green mr-2">map</span>
                创作工具箱
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {creativeMapItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="ghibli-card group h-80 text-center relative" 
                  >
                    {/* 胶带效果 */}
                    <div className="tape" style={{ backgroundColor: item.tapeColor }}>
                      <div className="tape-texture"></div>
                    </div>
                    
                    <div className="flex flex-col items-center p-8">
                      <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <span className={`material-icons text-2xl ${item.textColor}`}>{item.icon}</span>
                      </div>
                      <h3 
                        className="font-medium text-text-dark text-xl mb-3" 
                        style={{fontFamily: "'Ma Shan Zheng', cursive"}}
                      >
                        {item.name}
                      </h3>
                      <p className="text-text-medium text-sm mb-6">{item.description}</p>
                      <button className={`px-5 py-2 rounded-full ${item.textColor.replace('text-', 'bg-')} text-white hover:bg-opacity-80 transition-colors duration-200 flex items-center`}>
                        <span className="material-icons mr-2 text-sm">edit</span>
                        开始创作
                      </button>
                    </div>
                    
                    {/* 翻页效果 */}
                    <div className="page-curl"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-white border border-red-300 rounded-xl p-4 shadow-md animate-fadeIn z-50">
          <div className="flex items-center">
            <span className="material-icons text-red-500 mr-2">error</span>
            <span className="text-text-dark">{error}</span>
            <button
              className="ml-4 text-text-dark hover:text-red-500"
              onClick={() => setError(null)}
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}