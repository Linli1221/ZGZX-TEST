'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { saveApiKey } from '@/lib/settingsManager';
import { resetAllDatabases } from '@/lib/dbManager';
import { getApiKey } from '@/lib/settingsManager';

export default function Home() {
  // 修改默认选中的菜单为小说创作
  const [activeMenu, setActiveMenu] = useState('novel');
  const router = useRouter();

  // 添加设置弹窗状态
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // 加载保存的API密钥
  useEffect(() => {
    const loadApiKey = async () => {
      // Ensure this runs only on the client
      if (typeof window !== 'undefined') {
        try {
          // 使用settingsManager获取API密钥
          const savedApiKey = await getApiKey();
          if (savedApiKey) {
            setApiKey(savedApiKey);
          }
        } catch (error) {
          console.error('加载API密钥失败:', error);
        }
      }
    };

    loadApiKey();
  }, []);

  // 保存API密钥
  const handleSaveApiKey = async () => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
      try {
        await saveApiKey(apiKey);
        setShowSettings(false);
      } catch (error) {
        console.error('保存API密钥失败:', error);
        alert('保存API密钥失败，请重试');
      }
    }
  };

  // 重置数据库
  const handleResetDatabases = async () => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined' && window.confirm('确定要重置所有数据库吗？这将删除所有存储的数据，包括作品、提示词等。')) {
      try {
        setIsResetting(true);
        await resetAllDatabases(); // 使用新的重置函数
        alert('数据库已重置，页面将刷新');
        window.location.reload();
      } catch (error) {
        console.error('重置数据库失败:', error);
        alert('重置数据库失败，请查看控制台获取详细信息');
      } finally {
        setIsResetting(false);
      }
    }
  };

  // 创建卡片内容，避免条件渲染导致的问题
  const renderCards = () => {
    return (
      <>
        <div className="ghibli-card group cursor-pointer h-80 text-center" onClick={() => router.push('/works')}>
          <div className="tape" style={{ backgroundColor: 'rgba(125,133,204,0.7)' }}>
            <div className="tape-texture"></div>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-14 h-14 mb-6 fill-current text-[#7D85CC]" viewBox="0 0 24 24">
              <path d="M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5A2,2 0 0,0 17,3M7,5H17V16L12,14.25L7,16V5Z" />
            </svg>
            <h3 className="font-medium text-text-dark text-xl mb-4" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>我的作品</h3>
            <p className="text-text-medium text-sm mb-6">探索和管理你的创作，随时继续你的写作</p>
            <button className="px-5 py-2 rounded-full bg-[#7D85CC] text-white hover:bg-[#6970B9] transition-colors duration-200">查看作品集</button>
          </div>
          <div className="page-curl"></div>
        </div>

        <div className="ghibli-card h-80 text-center">
          <div className="tape" style={{ backgroundColor: 'rgba(224,149,117,0.7)' }}>
            <div className="tape-texture"></div>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-14 h-14 mb-6 fill-current text-[#E0976F]" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M7,10L12,15L17,10H7Z" />
            </svg>
            <h3 className="font-medium text-text-dark text-xl mb-4" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>模板中心</h3>
            <p className="text-text-medium text-sm mb-6">使用专业模板快速开始你的创作历程</p>
            <div className="grid grid-cols-2 gap-3 px-2">
              <div className="bg-white bg-opacity-50 p-2 rounded-lg flex items-center space-x-1">
                <span className="material-icons text-[#9C6FE0] text-sm">psychology</span>
                <span className="text-xs text-text-medium font-medium">奇幻</span>
              </div>
              <div className="bg-white bg-opacity-50 p-2 rounded-lg flex items-center space-x-1">
                <span className="material-icons text-[#E06F9C] text-sm">favorite</span>
                <span className="text-xs text-text-medium font-medium">爱情</span>
              </div>
              <div className="bg-white bg-opacity-50 p-2 rounded-lg flex items-center space-x-1">
                <span className="material-icons text-[#6F9CE0] text-sm">rocket_launch</span>
                <span className="text-xs text-text-medium font-medium">科幻</span>
              </div>
              <div className="bg-white bg-opacity-50 p-2 rounded-lg flex items-center space-x-1">
                <span className="material-icons text-[#E0C56F] text-sm">local_police</span>
                <span className="text-xs text-text-medium font-medium">悬疑</span>
              </div>
            </div>
          </div>
          <div className="page-curl"></div>
        </div>

        <div className="ghibli-card h-80 text-center">
          <div className="tape" style={{ backgroundColor: 'rgba(156,111,224,0.7)' }}>
            <div className="tape-texture"></div>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-14 h-14 mb-6 fill-current text-[#9C6FE0]" viewBox="0 0 24 24">
              <path d="M12,8A3,3 0 0,0 15,5A3,3 0 0,0 12,2A3,3 0 0,0 9,5A3,3 0 0,0 12,8M12,11.54C9.64,9.35 6.5,8 3,8V19C6.5,19 9.64,20.35 12,22.54C14.36,20.35 17.5,19 21,19V8C17.5,8 14.36,9.35 12,11.54Z" />
            </svg>
            <h3 className="font-medium text-text-dark text-xl mb-4" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>创作统计</h3>
            <p className="text-text-medium text-sm mb-6">跟踪你的写作进度和创作成果</p>
            <div className="space-y-4 px-4">
              <div className="flex items-center">
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                  <div className="bg-[#9C6FE0] h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-[#9C6FE0] font-bold ml-3 text-sm">25%</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#9C6FE0]">3</div>
                  <div className="text-xs text-text-light">作品</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#7D85CC]">12</div>
                  <div className="text-xs text-text-light">章节</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#E0976F]">8k</div>
                  <div className="text-xs text-text-light">字数</div>
                </div>
              </div>
            </div>
          </div>
          <div className="page-curl"></div>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen animate-fadeIn overflow-hidden">
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
      <Sidebar activeMenu="novel" />

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 使用通用顶边栏组件 */}
        <TopBar
          title="在字里行间，寻找属于你的光"
          isHomePage={true}
          actions={
            <button
              className="ghibli-button outline text-sm"
              onClick={() => setShowSettings(true)}
            >
              <span className="material-icons mr-1 text-sm">settings</span>
              设置
            </button>
          }
        />

        {/* 主要内容 - 添加flex-1和overflow-auto确保内容区域可滚动但不影响外部容器 */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="section-title flex items-center text-base md:text-lg lg:text-xl">
              <span className="material-icons text-primary-green mr-2">dashboard</span>
              开启你的创作旅程
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
              {renderCards()}
            </div>

            {/* 创意灵感区域 */}
            <div className="mt-8 md:mt-12">
              <h2 className="section-title flex items-center text-base md:text-lg lg:text-xl">
                <span className="material-icons text-[#7D85CC] mr-2">lightbulb</span>
                今日创意灵感
              </h2>

              <div className="ghibli-card mt-6 p-8 relative overflow-hidden">
                <div className="tape rotate-12 -right-4 -top-2" style={{ backgroundColor: 'rgba(125,133,204,0.7)' }}>
                  <div className="tape-texture"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-text-dark text-xl mb-4" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>写作提示</h3>
                    <div className="p-4 bg-white bg-opacity-40 rounded-lg border border-[#7D85CC] border-opacity-20 relative">
                      <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full bg-[#7D85CC] bg-opacity-10 flex items-center justify-center text-[#7D85CC]">
                        <span className="material-icons">format_quote</span>
                      </div>
                      <p className="text-text-medium italic pl-6">
                        "一个旅行者发现了一个古老的地图，上面标记着一个神秘的地点。这个地点在现代地图上并不存在。出于好奇，他决定前往探索..."
                      </p>
                      <div className="mt-4 flex justify-end">
                        <button className="px-4 py-1.5 rounded-full text-[#7D85CC] border border-[#7D85CC] hover:bg-[rgba(125,133,204,0.1)] transition-colors duration-200 flex items-center">
                          <span className="material-icons text-sm mr-1">play_arrow</span>
                          开始写作
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-text-dark text-xl mb-4" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>写作技巧</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-white bg-opacity-40 rounded-lg flex items-start hover:bg-white hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                        <span className="material-icons text-[#E0976F] mr-3 mt-0.5">tips_and_updates</span>
                        <div>
                          <h4 className="text-text-dark font-medium text-sm">角色塑造的深度</h4>
                          <p className="text-text-light text-xs mt-1">给你的角色创造一个内在冲突，让他们更加立体和真实。</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white bg-opacity-40 rounded-lg flex items-start hover:bg-white hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                        <span className="material-icons text-[#9C6FE0] mr-3 mt-0.5">psychology</span>
                        <div>
                          <h4 className="text-text-dark font-medium text-sm">构建引人入胜的开场</h4>
                          <p className="text-text-light text-xs mt-1">开场的前50个词决定了读者是否会继续阅读，从冲突或悬念开始。</p>
                        </div>
                      </div>

                      <div className="p-3 bg-white bg-opacity-40 rounded-lg flex items-start hover:bg-white hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                        <span className="material-icons text-[#6F9CE0] mr-3 mt-0.5">visibility</span>
                        <div>
                          <h4 className="text-text-dark font-medium text-sm">展示而非讲述</h4>
                          <p className="text-text-light text-xs mt-1">通过角色的行动和对话来展示情感，而不是直接描述他们的感受。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="page-curl"></div>
              </div>
            </div>

            {/* 辅助功能区域 */}
            <div className="mt-8 md:mt-12">
              <h2 className="section-title flex items-center text-base md:text-lg lg:text-xl">
                <span className="material-icons text-[#E0976F] mr-2">support_agent</span>
                智能辅助
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
                <div className="ghibli-card p-4 md:p-6 relative overflow-hidden">
                  <div className="tape -rotate-6 -left-4 -top-2" style={{ backgroundColor: 'rgba(231,169,85,0.7)' }}>
                    <div className="tape-texture"></div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-3 md:mr-4">
                      <span className="material-icons text-[#E0C56F]">smart_toy</span>
                    </div>
                    <div>
                      <h3 className="text-text-dark text-base md:text-lg" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>智能对话助手</h3>
                      <p className="text-text-light text-xs md:text-sm">与AI对话，获取写作建议和灵感</p>
                    </div>
                  </div>

                  <div className="bg-white bg-opacity-40 rounded-lg p-3 md:p-4 border border-[#E0C56F] border-opacity-20 mb-4">
                    <div className="flex items-start mb-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#E0C56F] bg-opacity-10 flex items-center justify-center mr-2 md:mr-3 mt-1 flex-shrink-0">
                        <span className="material-icons text-[#E0C56F] text-xs md:text-sm">smart_toy</span>
                      </div>
                      <div className="text-text-medium text-xs md:text-sm">
                        你好！我是你的智能写作助手。我可以帮你构思情节、完善角色或修改文稿。你正在创作什么样的故事呢？
                      </div>
                    </div>
                  </div>

                  <div className="flex">
                    <input
                      type="text"
                      className="flex-1 px-3 md:px-4 py-2 rounded-l-lg bg-white bg-opacity-70 border border-[#E0C56F] border-opacity-20 focus:outline-none focus:border-[#E0C56F] focus:ring-1 focus:ring-[#E0C56F] text-sm"
                      placeholder="输入你的问题..."
                    />
                    <button className="px-3 md:px-4 py-2 rounded-r-lg bg-[#E0C56F] text-white hover:bg-[#D1B660] transition-colors duration-200">
                      <span className="material-icons">send</span>
                    </button>
                  </div>

                  <div className="page-curl"></div>
                </div>

                <div className="ghibli-card p-4 md:p-6 relative overflow-hidden">
                  <div className="tape rotate-6 -right-4 -top-2">
                    <div className="tape-texture"></div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 md:mr-4">
                      <span className="material-icons text-blue-600">auto_fix_high</span>
                    </div>
                    <div>
                      <h3 className="text-text-dark text-base md:text-lg" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>智能优化</h3>
                      <p className="text-text-light text-xs md:text-sm">一键优化你的文章结构和表达</p>
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <div className="p-2 md:p-3 bg-white bg-opacity-40 rounded-lg flex items-center cursor-pointer hover:bg-white hover:bg-opacity-60 transition-all duration-300">
                      <span className="material-icons text-blue-500 mr-2 md:mr-3">title</span>
                      <div className="flex-1">
                        <h4 className="text-text-dark font-medium text-xs md:text-sm">标题优化</h4>
                      </div>
                      <span className="material-icons text-text-light text-xs md:text-sm">chevron_right</span>
                    </div>

                    <div className="p-2 md:p-3 bg-white bg-opacity-40 rounded-lg flex items-center cursor-pointer hover:bg-white hover:bg-opacity-60 transition-all duration-300">
                      <span className="material-icons text-blue-500 mr-2 md:mr-3">grading</span>
                      <div className="flex-1">
                        <h4 className="text-text-dark font-medium text-xs md:text-sm">语法修正</h4>
                      </div>
                      <span className="material-icons text-text-light text-xs md:text-sm">chevron_right</span>
                    </div>

                    <div className="p-2 md:p-3 bg-white bg-opacity-40 rounded-lg flex items-center cursor-pointer hover:bg-white hover:bg-opacity-60 transition-all duration-300">
                      <span className="material-icons text-blue-500 mr-2 md:mr-3">auto_awesome</span>
                      <div className="flex-1">
                        <h4 className="text-text-dark font-medium text-xs md:text-sm">表达润色</h4>
                      </div>
                      <span className="material-icons text-text-light text-xs md:text-sm">chevron_right</span>
                    </div>

                    <div className="p-2 md:p-3 bg-white bg-opacity-40 rounded-lg flex items-center cursor-pointer hover:bg-white hover:bg-opacity-60 transition-all duration-300">
                      <span className="material-icons text-blue-500 mr-2 md:mr-3">format_color_text</span>
                      <div className="flex-1">
                        <h4 className="text-text-dark font-medium text-xs md:text-sm">风格转换</h4>
                      </div>
                      <span className="material-icons text-text-light text-xs md:text-sm">chevron_right</span>
                    </div>
                  </div>

                  <div className="page-curl"></div>
                </div>
              </div>
            </div>

            {/* 社区交流区域 */}
            <div className="mt-8 md:mt-12 mb-6">
              <h2 className="section-title flex items-center text-base md:text-lg lg:text-xl">
                <span className="material-icons text-primary-green mr-2">groups</span>
                创作社区
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="ghibli-card p-6 relative overflow-hidden">
                  <div className="tape -rotate-3 -left-2 -top-2">
                    <div className="tape-texture"></div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span className="material-icons text-purple-600">forum</span>
                    </div>
                    <h3 className="text-text-dark text-lg" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>热门讨论</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white bg-opacity-40 rounded-lg p-4 hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-cover bg-center mr-3 flex-shrink-0" style={{backgroundImage: "url('/assets/avatar1.jpg')"}}></div>
                        <div>
                          <h4 className="text-text-dark font-medium text-sm">如何构建复杂的角色背景故事？</h4>
                          <div className="flex items-center mt-1 text-xs text-text-light">
                            <span>李小明</span>
                            <span className="mx-1">•</span>
                            <span>3小时前</span>
                            <div className="flex items-center ml-3">
                              <span className="material-icons text-xs mr-1">comment</span>
                              <span>28</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-40 rounded-lg p-4 hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-cover bg-center mr-3 flex-shrink-0" style={{backgroundImage: "url('/assets/avatar2.jpg')"}}></div>
                        <div>
                          <h4 className="text-text-dark font-medium text-sm">奇幻世界观设定指南分享</h4>
                          <div className="flex items-center mt-1 text-xs text-text-light">
                            <span>张文静</span>
                            <span className="mx-1">•</span>
                            <span>昨天</span>
                            <div className="flex items-center ml-3">
                              <span className="material-icons text-xs mr-1">comment</span>
                              <span>42</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-40 rounded-lg p-4 hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-cover bg-center mr-3 flex-shrink-0" style={{backgroundImage: "url('/assets/avatar3.jpg')"}}></div>
                        <div>
                          <h4 className="text-text-dark font-medium text-sm">大家如何克服写作瓶颈期？</h4>
                          <div className="flex items-center mt-1 text-xs text-text-light">
                            <span>王大海</span>
                            <span className="mx-1">•</span>
                            <span>2天前</span>
                            <div className="flex items-center ml-3">
                              <span className="material-icons text-xs mr-1">comment</span>
                              <span>54</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button className="ghibli-button outline text-sm py-2">
                      浏览更多讨论
                    </button>
                  </div>

                  <div className="page-curl"></div>
                </div>

                <div className="ghibli-card p-6 relative overflow-hidden">
                  <div className="tape rotate-3 -right-2 -top-2">
                    <div className="tape-texture"></div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                      <span className="material-icons text-pink-600">trending_up</span>
                    </div>
                    <h3 className="text-text-dark text-lg" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>热门作品</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white bg-opacity-40 rounded-lg p-4 hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                      <h4 className="text-text-dark font-medium">《星辰之海》</h4>
                      <p className="text-text-light text-sm mt-1 line-clamp-2">一个关于深海探险家发现神秘星辰文明的奇幻故事...</p>
                      <div className="flex items-center mt-2 text-xs text-text-light">
                        <span>陈梦琪</span>
                        <div className="flex items-center ml-3">
                          <span className="material-icons text-xs mr-1 text-red-500">favorite</span>
                          <span>238</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-40 rounded-lg p-4 hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                      <h4 className="text-text-dark font-medium">《山村旧事》</h4>
                      <p className="text-text-light text-sm mt-1 line-clamp-2">回忆一个被遗忘的山村，那里有着不为人知的故事和秘密...</p>
                      <div className="flex items-center mt-2 text-xs text-text-light">
                        <span>刘老师</span>
                        <div className="flex items-center ml-3">
                          <span className="material-icons text-xs mr-1 text-red-500">favorite</span>
                          <span>186</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-40 rounded-lg p-4 hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                      <h4 className="text-text-dark font-medium">《未来城市编年史》</h4>
                      <p className="text-text-light text-sm mt-1 line-clamp-2">2150年，人类与人工智能共同构建的世界，充满了希望与挑战...</p>
                      <div className="flex items-center mt-2 text-xs text-text-light">
                        <span>赵科技</span>
                        <div className="flex items-center ml-3">
                          <span className="material-icons text-xs mr-1 text-red-500">favorite</span>
                          <span>162</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button className="ghibli-button outline text-sm py-2">
                      浏览更多作品
                    </button>
                  </div>

                  <div className="page-curl"></div>
                </div>

                <div className="ghibli-card p-6 relative overflow-hidden">
                  <div className="tape -rotate-1 left-6 -top-2">
                    <div className="tape-texture"></div>
                  </div>

                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <span className="material-icons text-green-600">event</span>
                    </div>
                    <h3 className="text-text-dark text-lg" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>社区活动</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-primary-green bg-opacity-10 rounded-lg p-4 hover:bg-opacity-20 transition-all duration-300 cursor-pointer border border-primary-green border-opacity-30">
                      <div className="flex justify-between">
                        <h4 className="text-text-dark font-medium">春季创作挑战赛</h4>
                        <span className="text-primary-green text-xs px-2 py-1 bg-primary-green bg-opacity-10 rounded-full">进行中</span>
                      </div>
                      <p className="text-text-light text-sm mt-2">以"重生"为主题，创作一篇短篇小说</p>
                      <div className="flex items-center mt-2 text-xs text-text-light">
                        <span className="material-icons text-xs mr-1">schedule</span>
                        <span>还剩7天结束</span>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-40 rounded-lg p-4 hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                      <div className="flex justify-between">
                        <h4 className="text-text-dark font-medium">线上写作工作坊</h4>
                        <span className="text-orange-500 text-xs px-2 py-1 bg-orange-100 rounded-full">即将开始</span>
                      </div>
                      <p className="text-text-light text-sm mt-2">知名作家王明辉分享创意写作技巧</p>
                      <div className="flex items-center mt-2 text-xs text-text-light">
                        <span className="material-icons text-xs mr-1">event</span>
                        <span>5月15日 19:30</span>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-40 rounded-lg p-4 hover:bg-opacity-60 transition-all duration-300 cursor-pointer">
                      <div className="flex justify-between">
                        <h4 className="text-text-dark font-medium">读书会活动</h4>
                        <span className="text-blue-500 text-xs px-2 py-1 bg-blue-100 rounded-full">每周活动</span>
                      </div>
                      <p className="text-text-light text-sm mt-2">本周主题：科幻小说中的人性探索</p>
                      <div className="flex items-center mt-2 text-xs text-text-light">
                        <span className="material-icons text-xs mr-1">event</span>
                        <span>每周六 15:00</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button className="ghibli-button outline text-sm py-2">
                      浏览全部活动
                    </button>
                  </div>

                  <div className="page-curl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">设置</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowSettings(false)}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                API密钥
              </label>
              <input
                type="text"
                className="input"
                placeholder="请输入API密钥"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div className="mt-2 space-y-2">
                <p className="text-xs text-gray-500">
                  设置API密钥以使用AI功能。如果不设置，将使用默认密钥。
                </p>
                <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-700">
                  <p className="font-medium mb-1">API密钥说明：</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>API密钥用于访问AI服务</li>
                    <li>密钥将安全地存储在您的浏览器中</li>
                    <li>您可以随时更改或删除密钥</li>
                    <li>如果您没有自己的API密钥，可以使用默认密钥</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t pt-4 border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">高级选项</h3>
              <button
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                onClick={handleResetDatabases}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                    <span>重置中...</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2 text-sm">delete_forever</span>
                    <span>重置所有数据库</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                此操作将删除所有本地存储的数据并解决可能的数据库版本冲突问题。
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="btn-outline"
                onClick={() => setShowSettings(false)}
              >
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveApiKey}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
