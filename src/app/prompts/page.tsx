'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import BackButton from '@/components/BackButton';
import { Prompt, addPrompt, deletePrompt, getAllPrompts, getPromptsByType, updatePrompt } from '@/lib/db';
import { PromptDetailContent, promptTypeMap as promptDetailTypeMap } from '@/components/prompts/PromptDetailContent';

// 提示词类型映射
const promptTypeMap = {
  'analysis': { label: '分析', color: 'bg-[#7D85CC20] text-[#7D85CC]', icon: 'analytics', group: 'novel', gradient: 'from-[#7D85CC] to-[#6F9CE0]' },
  'writing': { label: '写作', color: 'bg-[#E0976F20] text-[#E0976F]', icon: 'create', group: 'novel', gradient: 'from-[#E0976F] to-[#E0C56F]' },
  'worldbuilding': { label: '世界观', color: 'bg-[#E06F9C20] text-[#E06F9C]', icon: 'public', group: 'creative', gradient: 'from-[#E06F9C] to-[#E0976F]' },
  'character': { label: '角色', color: 'bg-[#9C6FE020] text-[#9C6FE0]', icon: 'person', group: 'creative', gradient: 'from-[#9C6FE0] to-[#7D85CC]' },
  'plot': { label: '情节', color: 'bg-[#6F9CE020] text-[#6F9CE0]', icon: 'timeline', group: 'creative', gradient: 'from-[#6F9CE0] to-[#9C6FE0]' },
  'introduction': { label: '导语', color: 'bg-[#7D85CC20] text-[#7D85CC]', icon: 'format_quote', group: 'creative', gradient: 'from-[#7D85CC] to-[#6F9CE0]' },
  'outline': { label: '大纲', color: 'bg-[#E0976F20] text-[#E0976F]', icon: 'format_list_bulleted', group: 'creative', gradient: 'from-[#E0976F] to-[#E0C56F]' },
  'detailed_outline': { label: '细纲', color: 'bg-[#E0C56F20] text-[#E0C56F]', icon: 'subject', group: 'creative', gradient: 'from-[#E0C56F] to-[#E0976F]' }
} as const;

// 提示词类型
type PromptType = keyof typeof promptTypeMap;

// 分组定义
const promptGroups = {
  'novel': {
    label: '小说创作',
    color: 'from-[#7D85CC] to-[#E0976F]',
    icon: 'auto_stories',
    types: ['analysis', 'writing'] as PromptType[]
  },
  'creative': {
    label: '创意地图',
    color: 'from-[#9C6FE0] to-[#E06F9C]',
    icon: 'map',
    types: ['introduction', 'outline', 'detailed_outline', 'character', 'worldbuilding', 'plot'] as PromptType[]
  }
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

// 弹窗组件 - 吉卜力风格
const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        {/* 背景遮罩 */}
        <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        {/* 弹窗内容 */}
        <div className={`relative inline-block bg-card-color rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${maxWidth} w-full`}>
          <div className="grid-background absolute inset-0 opacity-30"></div>
          
          {/* 胶带装饰 */}
          <div className="tape" style={{ backgroundColor: 'rgba(90,157,107,0.7)', width: '120px', height: '40px', top: '-20px', left: '50%', transform: 'translateX(-50%) rotate(-2deg)' }}>
            <div className="tape-texture"></div>
          </div>
          
          {/* 弹窗标题 */}
          <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-[rgba(120,180,140,0.2)]">
            <h3 className="text-xl font-medium text-text-dark" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>
              {title}
            </h3>
            <button
              className="p-2 rounded-full hover:bg-[rgba(120,180,140,0.1)]"
              onClick={onClose}
            >
              <span className="material-icons text-text-medium">close</span>
            </button>
          </div>
          
          {/* 弹窗内容 */}
          <div className="px-6 py-4">
            {children}
          </div>
          
          {/* 翻页装饰 */}
          <div className="page-curl"></div>
          
          {/* 装饰元素 */}
          <div className="dot hidden md:block" style={{ bottom: "15px", right: "40%" }}></div>
        </div>
      </div>
    </div>
  );
};

export default function PromptsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typePrompts, setTypePrompts] = useState<{[key in PromptType]?: Prompt[]}>({});
  const [formData, setFormData] = useState({
    title: '',
    type: 'analysis' as Prompt['type'],
    content: promptTemplates['analysis'],
    description: '',
    examples: ['']
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<Prompt | null>(null);

  // 加载提示词数据
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setIsLoading(true);
        const loadedPrompts = await getAllPrompts();
        setPrompts(loadedPrompts);
      } catch (error) {
        console.error('加载提示词失败:', error);
        // 如果没有数据，设置为空数组
        setPrompts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPrompts();
  }, []);

  // 加载所有类型的提示词数量
  useEffect(() => {
    const loadAllTypePrompts = async () => {
      const types = Object.keys(promptTypeMap) as PromptType[];
      const typePromptsObj: {[key in PromptType]?: Prompt[]} = {};

      for (const type of types) {
        try {
          const typePrompts = await getPromptsByType(type);
          typePromptsObj[type] = typePrompts;
        } catch (error) {
          console.error(`加载${type}类型提示词失败:`, error);
          typePromptsObj[type] = [];
        }
      }

      setTypePrompts(typePromptsObj);
    };

    loadAllTypePrompts();
  }, []);

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
    const newType = e.target.value as Prompt['type'];
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

  // 处理示例变更
  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData({
      ...formData,
      examples: newExamples
    });
  };

  // 添加示例
  const addExample = () => {
    setFormData({
      ...formData,
      examples: [...formData.examples, '']
    });
  };

  // 移除示例
  const removeExample = (index: number) => {
    const newExamples = [...formData.examples];
    newExamples.splice(index, 1);
    setFormData({
      ...formData,
      examples: newExamples
    });
  };

  // 打开创建提示词弹窗
  const openCreateModal = () => {
    // 提示用户功能正在开发中
    alert('创建提示词功能正在开发中，敬请期待！');
    // 以下代码暂时保留但不执行
    /*
    setFormData({
      title: '',
      type: 'analysis',
      content: promptTemplates['analysis'],
      description: '',
      examples: ['']
    });
    setSelectedPrompt(null);
    setShowCreateModal(true);
    */
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
      const promptData: Omit<Prompt, 'id'> = {
        ...formData,
        createdAt: now,
        updatedAt: now
      };

      const newPrompt = await addPrompt(promptData);
      setPrompts(prev => [newPrompt, ...prev]);
      setShowCreateModal(false);

      // 刷新列表
      const updatedPrompts = await getAllPrompts();
      setPrompts(updatedPrompts);
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

      // 刷新提示词列表
      const updatedPrompts = await getAllPrompts();
      setPrompts(updatedPrompts);
    } catch (error) {
      console.error('删除提示词失败:', error);
      alert('删除提示词失败，请重试');
    }
  };

  // 打开提示词详情弹窗
  const openDetailModal = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditedPrompt(prompt);
    setIsEditing(false);
    setShowDetailModal(true);
  };

  // 处理卡片点击
  const handleCardClick = async (type: PromptType) => {
    router.push(`/prompts/type/${type}`);
  };

  return (
    <div className="flex h-screen bg-bg-color animate-fadeIn">
      <Sidebar activeMenu="prompts" />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <TopBar
          title="提示词管理"
          showBackButton={true}
          actions={
            <button
              className="round-button relative overflow-hidden group"
              onClick={openCreateModal}
            >
              <span className="material-icons text-white text-xl">add</span>
              <span className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm text-text-medium">
                新建提示词
              </span>
            </button>
          }
        />

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 pl-12 bg-card-color border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] shadow-sm text-text-dark"
                placeholder="搜索提示词..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="material-icons absolute left-4 top-1/2 transform -translate-y-1/2 text-text-light">search</span>
            </div>
          </div>

          {Object.entries(promptGroups).map(([groupId, group]) => (
            <div key={groupId} className="mb-12">
              <div className="flex items-center mb-6">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${group.color} flex items-center justify-center mr-3 text-white`}>
                  <span className="material-icons">{group.icon}</span>
                </div>
                <h2 className="text-2xl font-medium text-text-dark font-ma-shan">{group.label}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.types.map(type => {
                  const typeInfo = promptTypeMap[type];
                  const typePromptsCount = typePrompts[type]?.length || 0;

                  return (
                    <div
                      key={type}
                      className="ghibli-card p-6 cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                      onClick={() => handleCardClick(type)}
                      style={{
                        borderColor: typeInfo.color.split(' ')[1].replace('text-', 'rgba(').replace(/\]/, ', 0.4)')
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${typeInfo.color.split(' ')[0]}`}>
                          <span className={`material-icons ${typeInfo.color.split(' ')[1]}`}>{typeInfo.icon}</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-text-dark font-ma-shan">{typeInfo.label}提示词</h3>
                          <p className="text-text-medium text-sm">{typePromptsCount} 个提示词</p>
                        </div>
                      </div>

                      <p className="text-text-medium text-sm mb-4">
                        {type === 'analysis' && '用于对文章、角色、情节进行分析和评价的提示词'}
                        {type === 'writing' && '用于辅助创作、扩写、修改文章的提示词'}
                        {type === 'worldbuilding' && '用于设计和描述故事世界设定的提示词'}
                        {type === 'character' && '用于塑造和深化角色形象的提示词'}
                        {type === 'plot' && '用于构思和完善故事情节的提示词'}
                        {type === 'introduction' && '用于创作引人入胜的开篇导语的提示词'}
                        {type === 'outline' && '用于规划故事主线和章节的提示词'}
                        {type === 'detailed_outline' && '用于设计细节丰富的章节内容的提示词'}
                      </p>

                      <div className="mt-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${typeInfo.color}`}>
                          <span className="material-icons mr-1 text-sm">visibility</span>
                          查看全部
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {searchTerm ? (
            <div className="mb-12">
              <h2 className="text-2xl font-medium text-text-dark font-ma-shan mb-6">搜索结果</h2>

              {isLoading ? (
                <div className="text-center py-10">
                  <div className="flex justify-center mb-4">
                    <div className="w-3 h-3 bg-[#7D85CC] rounded-full animate-pulse mr-1"></div>
                    <div className="w-3 h-3 bg-[#E0976F] rounded-full animate-pulse delay-150 mr-1"></div>
                    <div className="w-3 h-3 bg-[#9C6FE0] rounded-full animate-pulse delay-300"></div>
                  </div>
                  <p className="text-text-medium">正在加载提示词...</p>
                </div>
              ) : filteredPrompts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {filteredPrompts.map(prompt => {
                    const typeInfo = promptTypeMap[prompt.type as PromptType];
                    
                    // 提取颜色代码用于胶带
                    const tapeColor = typeInfo.color.split(' ')[1].replace('text-', 'rgba(').replace(/\]/, ', 0.7)');

                    return (
                      <div
                        key={prompt.id}
                        className="ghibli-card p-4 cursor-pointer hover:shadow-md transition-all duration-300 relative"
                        onClick={() => openDetailModal(prompt)}
                        style={{
                          borderColor: typeInfo.color.split(' ')[1].replace('text-', 'rgba(').replace(/\]/, ', 0.4)')
                        }}
                      >
                        <div className="tape rotate-3 -right-2 -top-2" style={{ backgroundColor: tapeColor }}>
                          <div className="tape-texture"></div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mr-3 ${typeInfo.color.split(' ')[0]}`}>
                            <span className={`material-icons ${typeInfo.color.split(' ')[1]}`}>{typeInfo.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-text-dark font-medium truncate">{prompt.title}</h3>
                              <div className="flex items-center ml-4">
                                <span className={`badge ${typeInfo.color} text-xs px-2`}>{typeInfo.label}</span>
                                <button
                                  className="p-1 ml-2 hover:bg-[rgba(120,180,140,0.1)] rounded-full"
                                  onClick={(e) => openDeleteModal(prompt, e)}
                                >
                                  <span className="material-icons text-text-light text-sm">delete</span>
                                </button>
                              </div>
                            </div>
                            <p className="text-text-medium text-sm mt-1 line-clamp-2">{prompt.content}</p>
                          </div>
                        </div>
                        
                        <div className="page-curl"></div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-card-color rounded-2xl border border-[rgba(120,180,140,0.2)] shadow-sm">
                  <div className="flex justify-center mb-4">
                    <span className="material-icons text-4xl text-text-light">search_off</span>
                  </div>
                  <p className="text-text-medium mb-2">没有找到匹配的提示词</p>
                  <p className="text-text-light text-sm">尝试其他搜索词或创建新的提示词</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#E06F6F] to-[#E0976F] flex items-center justify-center mr-3 text-white">
              <span className="material-icons text-sm">delete_forever</span>
            </div>
            <span>删除提示词</span>
          </div>
        }
        maxWidth="max-w-md"
      >
        <div className="p-4">
          <div className="flex items-center mb-6">
            <span className="material-icons text-[#E06F6F] text-3xl mr-4">warning</span>
            <p className="text-text-dark">确定要删除提示词 <span className="font-semibold">{selectedPrompt?.title}</span> 吗？</p>
          </div>
          <p className="mb-6 text-text-medium text-sm bg-[rgba(224,111,111,0.1)] p-3 rounded-lg">此操作无法撤销，删除后将无法恢复此提示词。</p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-outline"
            >
              取消
            </button>
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 rounded-xl flex items-center justify-center text-sm font-medium transition-colors duration-200 bg-[#E06F6F] text-white hover:bg-[#c95f5f]"
            >
              <span className="material-icons mr-1 text-sm">delete</span>
              确认删除
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedPrompt?.title || '提示词详情'}
      >
        <div>
          {selectedPrompt && (
            <>
              <PromptDetailContent 
                prompt={selectedPrompt} 
                isEditing={isEditing}
                editedPrompt={editedPrompt || undefined}
                handleInputChange={(e) => {
                  const { name, value } = e.target;
                  // 忽略对type字段的修改
                  if (name === 'type') return;
                  setEditedPrompt(prev => prev ? { ...prev, [name]: value } : null);
                }}
                handleExampleChange={(index, value) => {
                  if (!editedPrompt) return;
                  const newExamples = [...(editedPrompt.examples || [])];
                  newExamples[index] = value;
                  setEditedPrompt({
                    ...editedPrompt,
                    examples: newExamples
                  });
                }}
                addExample={() => {
                  if (!editedPrompt) return;
                  setEditedPrompt({
                    ...editedPrompt,
                    examples: [...(editedPrompt.examples || []), '']
                  });
                }}
                removeExample={(index) => {
                  if (!editedPrompt) return;
                  const newExamples = [...(editedPrompt.examples || [])];
                  newExamples.splice(index, 1);
                  setEditedPrompt({
                    ...editedPrompt,
                    examples: newExamples
                  });
                }}
                onEdit={() => {
                  setIsEditing(true);
                  setEditedPrompt(selectedPrompt);
                }}
                onSave={async () => {
                  if (!editedPrompt || !editedPrompt.id || !selectedPrompt) return;
                  try {
                    const updatedPrompt = {
                      ...editedPrompt,
                      type: selectedPrompt.type,
                      updatedAt: new Date()
                    };
                    await updatePrompt(updatedPrompt);
                    // 更新本地数据
                    setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
                    setSelectedPrompt(updatedPrompt);
                    setIsEditing(false);
                    setShowDetailModal(true); // 重新打开详情模式
                  } catch (error) {
                    console.error('更新提示词失败:', error);
                  }
                }}
                onCancel={() => {
                  setIsEditing(false);
                  setEditedPrompt(null);
                }}
                onDelete={() => {
                  if (selectedPrompt) {
                    openDeleteModal(selectedPrompt);
                  }
                }}
                onCopy={() => {
                  if (selectedPrompt) {
                    navigator.clipboard.writeText(selectedPrompt.content);
                    alert('提示词已复制到剪贴板');
                  }
                }}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}