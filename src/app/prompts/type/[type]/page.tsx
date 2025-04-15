'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import BackButton from '@/components/BackButton';
import { Prompt, getPromptsByType, deletePrompt, addPrompt, updatePrompt } from '@/lib/db';
import { PromptDetailContent, promptTypeMap as promptDetailTypeMap } from '@/components/prompts/PromptDetailContent';

// 提示词类型映射
const promptTypeMap = {
  'analysis': { label: '分析', color: 'bg-blue-100 text-blue-800', icon: 'analytics', group: 'novel', gradient: 'from-blue-500 to-blue-600' },
  'writing': { label: '写作', color: 'bg-green-100 text-green-800', icon: 'create', group: 'novel', gradient: 'from-green-500 to-green-600' },
  'worldbuilding': { label: '世界观', color: 'bg-purple-100 text-purple-800', icon: 'public', group: 'creative', gradient: 'from-purple-500 to-purple-600' },
  'character': { label: '角色', color: 'bg-amber-100 text-amber-800', icon: 'person', group: 'creative', gradient: 'from-amber-500 to-amber-600' },
  'plot': { label: '情节', color: 'bg-rose-100 text-rose-800', icon: 'timeline', group: 'creative', gradient: 'from-rose-500 to-rose-600' },
  'introduction': { label: '导语', color: 'bg-indigo-100 text-indigo-800', icon: 'format_quote', group: 'creative', gradient: 'from-indigo-500 to-indigo-600' },
  'outline': { label: '大纲', color: 'bg-blue-100 text-blue-800', icon: 'format_list_bulleted', group: 'creative', gradient: 'from-blue-500 to-blue-600' },
  'detailed_outline': { label: '细纲', color: 'bg-teal-100 text-teal-800', icon: 'subject', group: 'creative', gradient: 'from-teal-500 to-teal-600' }
} as const;

// 提示词类型
type PromptType = keyof typeof promptTypeMap;

// 验证提示词类型是否有效
const isValidPromptType = (type: any): type is PromptType => {
  return Object.keys(promptTypeMap).includes(type as string);
};

// 将类型颜色转换为胶带颜色
const getTypeColor = (type: string): string => {
  const colorText = promptTypeMap[type as keyof typeof promptTypeMap]?.color.split(' ')[1] || 'text-blue-800';
  // 从 text-blue-800 提取 blue
  const colorName = colorText.replace('text-', '').replace('-800', '');
  return `rgba(${colorName === 'blue' ? '125, 133, 204' : 
           colorName === 'green' ? '90, 157, 107' :
           colorName === 'purple' ? '156, 111, 224' :
           colorName === 'amber' ? '224, 151, 111' :
           colorName === 'rose' ? '224, 111, 156' :
           colorName === 'indigo' ? '125, 133, 204' :
           colorName === 'teal' ? '111, 224, 197' : '125, 133, 204'}, 0.7)`;
};

// 格式化日期显示
const formatDate = (date: Date | string | number) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 提示词模板
const promptTemplates = {
  'analysis': '分析[主题]的[方面]，指出其[特点]和[建议]。',
  'writing': '基于以下背景和要求，创作一段[类型]内容：\n\n背景：[背景信息]\n\n要求：[具体要求]',
  'worldbuilding': '设计一个[类型]的世界，包括其[历史/地理/文化/政治]等方面。重点描述[特点]。',
  'character': '创建一个[性格特点]的角色，包括其背景故事、动机、外貌特征和行为模式。',
  'plot': '设计一个关于[主题]的[类型]情节，包括起因、发展、高潮和结局。',
  'introduction': '为[类型]的故事创建一个引人入胜的开篇导语，设定[氛围]的基调，并引导读者关注[焦点]。',
  'outline': '为[主题]的[类型]故事创建一个大纲，包括主线规划、章节划分和核心情节点。',
  'detailed_outline': '基于大纲，为[章节名]创建详细的内容规划，包括场景描述、对话设计和情感氛围。'
};

// 定义Modal组件的参数类型
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

// 弹窗组件
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }: ModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-card-color rounded-2xl p-6 w-full max-w-4xl shadow-xl relative flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="w-6">
            {/* 左侧占位，保持布局平衡 */}
          </div>
          <h2 className="text-2xl font-bold text-text-dark font-ma-shan text-center">{title}</h2>
          <button
            className="text-gray-500 hover:text-gray-700 w-6 flex justify-center"
            onClick={onClose}
          >
            <span className="material-icons">close</span>
          </button>
        </div>
        
        {children}
      </div>
    </div>
  );
}

export default function PromptTypePage() {
  const router = useRouter();
  const params = useParams();
  const promptType = (params?.type as string) as PromptType;

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<{
    title: string;
    type: PromptType;
    content: string;
    description: string;
  }>({
    title: '',
    type: promptType,
    content: promptTemplates[promptType as keyof typeof promptTemplates] || '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<Prompt | null>(null);

  // 卡片描述文本
  const descriptions = {
    'introduction': '创建引人入胜的开篇导语，为你的故事设定基调和氛围',
    'outline': '快速生成故事的主要框架和结构，帮助你规划创作方向',
    'detailed_outline': '基于大纲深入展开，为每个章节创建详细的内容规划',
    'character': '创建丰富多彩的角色，赋予他们独特的个性和背景故事',
    'worldbuilding': '构建完整的世界观，包括历史、地理、文化和社会结构',
    'plot': '设计引人入胜的情节，包括冲突、转折和高潮',
    'analysis': '用于分析故事内容、角色和情节的提示词',
    'writing': '用于生成和改进故事内容的提示词'
  };

  // 加载提示词数据
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setIsLoading(true);
        if (!promptType || !promptTypeMap[promptType as keyof typeof promptTypeMap]) {
          router.push('/prompts');
          return;
        }

        const loadedPrompts = await getPromptsByType(promptType);
        setPrompts(loadedPrompts);
      } catch (error) {
        console.error('加载提示词失败:', error);
        setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompts();
  }, [promptType, router]);

  // 过滤提示词
  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // 处理类型变更
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as PromptType;
    setFormData({
      ...formData,
      type: newType,
      content: promptTemplates[newType] || ''
    });
  };

  // 处理输入变更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // 重置表单数据
  const resetFormData = () => {
    setFormData({
      title: '',
      type: promptType,
      content: promptTemplates[promptType as keyof typeof promptTemplates] || '',
      description: ''
    });
  };

  // 打开创建提示词弹窗
  const openCreateModal = () => {
    resetFormData();
    setShowCreateModal(true);
  };

  // 打开删除提示词弹窗
  const openDeleteModal = (prompt: Prompt, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedPrompt(prompt);
    setShowDeleteModal(true);
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      const promptData = {
        ...formData,
        createdAt: now,
        updatedAt: now,
        examples: [] // 保持兼容性，设为空数组
      };

      const newPrompt = await addPrompt(promptData);
      setPrompts(prev => [newPrompt, ...prev]);
      setShowCreateModal(false);

      // 刷新列表
      if (isValidPromptType(promptType)) {
        const updatedPrompts = await getPromptsByType(promptType);
        setPrompts(updatedPrompts);
      }
    } catch (error) {
      console.error('创建提示词失败:', error);
      alert('创建提示词失败，请重试');
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!selectedPrompt || !selectedPrompt.id) return;

    try {
      await deletePrompt(selectedPrompt.id);
      setPrompts(prev => prev.filter(p => p.id !== selectedPrompt.id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('删除提示词失败:', error);
      alert('删除提示词失败，请重试');
    }
  };

  // 打开详情弹窗
  const openDetailModal = (prompt: Prompt, isEditing: boolean = false) => {
    setSelectedPrompt(prompt);
    setShowDetailModal(true);
    setIsEditing(isEditing);
    setEditedPrompt(isEditing ? prompt : null);
  };

  // 高亮搜索关键词
  const highlightMatch = (text: string, term: string) => {
    if (!term || !text) return text;
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part: string, i: number) =>
      part.toLowerCase() === term.toLowerCase() ? <mark key={i} className="bg-yellow-100 px-1 rounded">{part}</mark> : part
    );
  };

  // 截断内容
  const truncateContent = (content: string, length: number = 120) => {
    if (!content) return '';
    if (content.length <= length) return content;
    return content.slice(0, length) + '...';
  };

  return (
    <div className="flex h-screen bg-bg-color animate-fadeIn">
      <Sidebar activeMenu="prompts" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title="提示词管理"
          showBackButton={true}
          actions={
            <button
              className="ghibli-button outline text-sm"
              onClick={openCreateModal}
            >
              <span className="material-icons mr-1 text-sm">add</span>
              创建提示词
            </button>
          }
        />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-full mx-auto px-0 sm:px-4 lg:container lg:mx-auto">
            {/* 提示词列表 */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md mr-4 bg-[${
                    promptTypeMap[promptType as keyof typeof promptTypeMap]?.color.split(' ')[1].replace('text-', '').replace(/\]/, '')
                  }]`}>
                    <span className="material-icons text-xl">{promptTypeMap[promptType as keyof typeof promptTypeMap]?.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-text-dark font-ma-shan">
                      {promptTypeMap[promptType as keyof typeof promptTypeMap]?.label}提示词
                      <span className="ml-2 text-sm font-normal text-text-medium">({filteredPrompts.length})</span>
                    </h3>
                    <p className="text-sm text-text-medium mt-1">
                      {descriptions[promptType as keyof typeof descriptions]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mb-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[240px] max-w-md">
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-icons text-text-light">search</span>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-[rgba(120,180,140,0.3)] rounded-xl bg-card-color focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] shadow-sm text-text-dark"
                      placeholder="搜索提示词..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-3 py-2 bg-card-color border border-[rgba(120,180,140,0.3)] rounded-xl text-text-medium flex items-center hover:bg-[rgba(120,180,140,0.1)] transition-colors shadow-sm"
                    onClick={() => router.push('/prompts')}
                  >
                    <span className="material-icons text-sm mr-2">arrow_back</span>
                    返回分类
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // 加载状态
                <div className="col-span-full flex justify-center p-12">
                  <div className="w-3 h-3 bg-[#7D85CC] rounded-full animate-pulse mr-1"></div>
                  <div className="w-3 h-3 bg-[#E0976F] rounded-full animate-pulse delay-150 mr-1"></div>
                  <div className="w-3 h-3 bg-[#9C6FE0] rounded-full animate-pulse delay-300"></div>
                </div>
              ) : filteredPrompts.length > 0 ? (
                // 显示提示词卡片
                <>
                  {/* 提示词列表 */}
                  {filteredPrompts.map(prompt => {
                    // 获取更新时间
                    const updatedAt = new Date(prompt.updatedAt);
                    const now = new Date();
                    const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

                    // 格式化时间显示
                    let timeDisplay;
                    if (diffDays === 0) {
                      timeDisplay = '今天';
                    } else if (diffDays === 1) {
                      timeDisplay = '昨天';
                    } else if (diffDays < 7) {
                      timeDisplay = `${diffDays}天前`;
                    } else {
                      timeDisplay = updatedAt.toLocaleDateString();
                    }

                    const typeConfig = promptTypeMap[prompt.type as keyof typeof promptTypeMap] || {
                      label: '未知',
                      icon: 'help_outline',
                      color: 'text-gray-500',
                      description: '未定义的提示词类型'
                    };
                    
                    // 获取对应的颜色
                    const colorText = typeConfig.color.split(' ')[1];
                    const bgColor = typeConfig.color.split(' ')[0];
                    
                    // 提取颜色代码用于胶带
                    const tapeColor = colorText.replace('text-', 'rgba(').replace(/\]/, ', 0.7)');

                    return (
                      <div
                        key={prompt.id}
                        className="ghibli-card h-80 text-center cursor-pointer"
                        onClick={() => openDetailModal(prompt)}
                      >
                        <div className="tape" style={{ backgroundColor: tapeColor }}>
                          <div className="tape-texture"></div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`w-14 h-14 mt-8 mb-6 rounded-full ${bgColor} flex items-center justify-center`}>
                            <span className={`material-icons text-2xl ${colorText}`}>{typeConfig.icon}</span>
                          </div>
                          
                          <h3 className="font-medium text-text-dark text-xl mb-4 font-ma-shan">
                            {highlightMatch(prompt.title, searchTerm)}
                          </h3>

                          <p className="text-text-medium text-sm mb-6 px-6 line-clamp-3">
                            {prompt.description ? highlightMatch(prompt.description, searchTerm) : '无描述'}
                          </p>

                          <div className="mt-auto border-t border-[rgba(120,180,140,0.2)] w-full pt-3 px-4 flex justify-between items-center">
                            <div className="flex items-center text-xs text-text-light">
                              <span className="material-icons text-text-light text-sm mr-1">schedule</span>
                              <span>{timeDisplay}</span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                className="p-1.5 rounded-full text-text-light hover:text-primary-green hover:bg-[rgba(120,180,140,0.1)] transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailModal(prompt, true);
                                }}
                              >
                                <span className="material-icons text-sm">edit</span>
                              </button>
                              <button
                                className="p-1.5 rounded-full text-text-light hover:text-red-500 hover:bg-red-50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(prompt, e);
                                }}
                              >
                                <span className="material-icons text-sm">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="page-curl"></div>
                      </div>
                    );
                  })}
                </>
              ) : (
                // 无提示词提示
                <div className="col-span-full ghibli-card p-12 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-[rgba(120,180,140,0.1)] rounded-full flex items-center justify-center mb-4 text-text-light">
                    <span className="material-icons text-4xl">search_off</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-dark mb-2 font-ma-shan">暂无提示词</h3>
                  <p className="text-text-medium text-center max-w-md mb-6">
                    {searchTerm
                      ? `没有找到包含"${searchTerm}"的提示词`
                      : `你尚未创建任何${promptTypeMap[promptType as keyof typeof promptTypeMap]?.label}提示词，点击下方按钮创建第一个提示词。`}
                  </p>
                  <button
                    className="ghibli-button"
                    onClick={() => searchTerm ? setSearchTerm('') : openCreateModal()}
                  >
                    <span className="material-icons text-sm mr-2">{searchTerm ? 'clear' : 'add'}</span>
                    {searchTerm ? '清除搜索' : '创建提示词'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* 创建提示词弹窗 */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新提示词"
      >
        <div className="mb-6">
          <div className="ghibli-card p-6 animate-fadeIn relative">
            {/* 顶部胶带 */}
            <div className="tape" style={{ backgroundColor: "rgba(120, 180, 140, 0.7)" }}>
              <div className="tape-texture"></div>
            </div>
            
            <div className="mt-6 max-h-[60vh] overflow-y-auto px-4">
              <form id="createPromptForm" onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl mx-auto">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-text-dark font-medium mb-2">提示词标题</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    placeholder="输入提示词标题..."
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-[rgba(120,180,140,0.3)] bg-white bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="block text-text-dark font-medium mb-2">提示词类型</label>
                  <div className="py-2 px-4 rounded-xl bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)]">
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${promptTypeMap[promptType]?.color}`}>
                        <span className="material-icons text-xs mr-1 align-text-top">{promptTypeMap[promptType]?.icon}</span>
                        {promptTypeMap[promptType]?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="content" className="block text-text-dark font-medium mb-2">提示词内容</label>
                  <input
                    id="content"
                    name="content"
                    type="text"
                    required
                    placeholder="输入提示词内容..."
                    value={formData.content}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-xl border border-[rgba(120,180,140,0.3)] bg-white bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="block text-text-dark font-medium mb-2">提示词描述</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="描述这个提示词的用途和使用场景..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-[rgba(120,180,140,0.3)] bg-white bg-opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent min-h-[120px]"
                  ></textarea>
                </div>
              </form>
            </div>
            
            {/* 翻页效果 */}
            <div className="page-curl"></div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-[rgba(120,180,140,0.3)]">
          <button 
            type="submit"
            form="createPromptForm"
            className="ghibli-button text-sm py-2"
          >
            创建提示词
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            className="ghibli-button outline text-sm py-2"
          >
            取消
          </button>
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="删除提示词"
      >
        <div className="mb-6">
          <div className="ghibli-card p-6 animate-fadeIn relative">
            <div className="tape" style={{ backgroundColor: "rgba(224, 111, 111, 0.7)" }}>
              <div className="tape-texture"></div>
            </div>
            
            <div className="my-auto max-h-[60vh] overflow-y-auto px-4">
              <div className="bg-red-50 rounded-xl p-6 mb-6 text-center w-full max-w-lg mx-auto">
                <span className="material-icons text-red-500 text-4xl mb-4">warning</span>
                <p className="text-center text-red-700 text-lg font-medium mb-2">确定要删除这个提示词吗？</p>
                <p className="text-center text-red-600 text-sm">此操作无法撤销</p>
              </div>
            </div>
            
            <div className="page-curl"></div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-[rgba(120,180,140,0.3)]">
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
          >
            确认删除
          </button>
          <button
            onClick={() => setShowDeleteModal(false)}
            className="ghibli-button outline text-sm py-2"
          >
            取消
          </button>
        </div>
      </Modal>

      {/* 详情/编辑弹窗 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedPrompt?.title || '提示词详情'}
      >
        <div className="mb-6">
          <div className="ghibli-card p-6 animate-fadeIn relative">
            {/* 修改内容部分，使其滚动而不影响卡片 */}
            <div className="tape" style={{ backgroundColor: selectedPrompt ? getTypeColor(selectedPrompt.type) : "rgba(120, 180, 140, 0.7)" }}>
              <div className="tape-texture"></div>
            </div>
            
            <div className="mt-6 max-h-[60vh] overflow-y-auto px-4">
              {selectedPrompt && (
                <div className="w-full max-w-2xl mx-auto">
                  {isEditing ? (
                    <form id="editPromptForm" className="space-y-6">
                      <div>
                        <label className="block text-text-dark font-medium mb-2">标题</label>
                        <input 
                          type="text"
                          name="title"
                          className="w-full px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                          placeholder="输入提示词标题..."
                          value={editedPrompt?.title || ''}
                          onChange={(e) => {
                            const { name, value } = e.target;
                            setEditedPrompt(prev => prev ? { ...prev, [name]: value } : null);
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-text-dark font-medium mb-2">内容</label>
                        <input
                          type="text"
                          name="content"
                          className="w-full px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                          placeholder="输入提示词内容..."
                          value={editedPrompt?.content || ''}
                          onChange={(e) => {
                            const { name, value } = e.target;
                            setEditedPrompt(prev => prev ? { ...prev, [name]: value } : null);
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-text-dark font-medium mb-2">描述 <span className="text-text-light text-sm">(可选)</span></label>
                        <textarea
                          name="description"
                          className="w-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark min-h-[240px]"
                          placeholder="简短描述提示词的用途..."
                          value={editedPrompt?.description || ''}
                          onChange={(e) => {
                            const { name, value } = e.target;
                            setEditedPrompt(prev => prev ? { ...prev, [name]: value } : null);
                          }}
                        ></textarea>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* 标题和类型栏 */}
                      <div className="flex items-center justify-end mb-6">
                        <div className="flex items-center">
                          <span className={`flex items-center px-3 py-1 rounded-full text-sm ${promptTypeMap[selectedPrompt.type as keyof typeof promptTypeMap]?.color}`}>
                            <span className="material-icons mr-1 text-sm">{promptTypeMap[selectedPrompt.type as keyof typeof promptTypeMap]?.icon}</span>
                            {promptTypeMap[selectedPrompt.type as keyof typeof promptTypeMap]?.label}
                          </span>
                        </div>
                      </div>

                      {/* 提示词内容区 */}
                      <div className="mb-6">
                        {selectedPrompt.description ? (
                          <div>
                            <div className="p-5 bg-white bg-opacity-50 rounded-xl border border-[rgba(120,180,140,0.2)] min-h-[320px]">
                              <p className="whitespace-pre-wrap text-text-medium">{selectedPrompt.description}</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="p-5 bg-white bg-opacity-50 rounded-xl border border-[rgba(120,180,140,0.2)] text-center min-h-[320px] flex items-center justify-center">
                              <p className="text-text-light italic">暂无描述信息</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 底部元信息 */}
                      <div className="flex items-center justify-between text-text-light text-sm">
                        <div className="flex items-center">
                          <span className="material-icons text-xs mr-1">event</span>
                          创建于: {formatDate(selectedPrompt.createdAt)}
                        </div>
                        <div className="flex items-center">
                          <span className="material-icons text-xs mr-1">update</span>
                          更新于: {formatDate(selectedPrompt.updatedAt)}
                        </div>
                      </div>
                      
                      {/* 操作按钮区 */}
                      <div className="flex justify-end mt-6 space-x-3">            
                        <button 
                          onClick={() => {
                            setIsEditing(true);
                            setEditedPrompt(selectedPrompt);
                          }}
                          className="btn-outline flex items-center text-sm px-4 py-2"
                        >
                          <span className="material-icons mr-1 text-sm">edit</span>
                          编辑
                        </button>
                        
                        <button 
                          onClick={() => {
                            setShowDetailModal(false);
                            openDeleteModal(selectedPrompt);
                          }}
                          className="btn-outline flex items-center text-sm px-4 py-2 text-[#E06F6F] border-[#E06F6F]"
                        >
                          <span className="material-icons mr-1 text-sm">delete</span>
                          删除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="page-curl"></div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-[rgba(120,180,140,0.3)]">
          {isEditing ? (
            <>
              <button
                onClick={async () => {
                  if (!editedPrompt || !editedPrompt.id || !selectedPrompt) return;
                  try {
                    const updatedPrompt = {
                      ...editedPrompt,
                      type: selectedPrompt.type,
                      updatedAt: new Date()
                    };
                    await updatePrompt(updatedPrompt);
                    setSelectedPrompt(updatedPrompt);
                    setIsEditing(false);
                    
                    // 刷新提示词列表
                    if (isValidPromptType(promptType)) {
                      const updatedPrompts = await getPromptsByType(promptType);
                      setPrompts(updatedPrompts);
                    }
                  } catch (error) {
                    console.error('更新提示词失败:', error);
                    alert('更新提示词失败，请重试');
                  }
                }}
                className="ghibli-button text-sm py-2"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedPrompt(selectedPrompt);
                }}
                className="ghibli-button outline text-sm py-2"
              >
                取消
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowDetailModal(false)}
              className="ghibli-button outline text-sm py-2"
            >
              关闭
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}