'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getWorkById, updateWork, Work, Prompt, getPromptsByType } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import BackButton from '@/components/BackButton';
import TopBar from '@/components/TopBar';
import { workContentUtils } from '@/lib/utils';
import { AIGenerator } from '@/lib/AIservice';

// 防抖函数
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): DebouncedFunction<T> => {
  let timeoutId: NodeJS.Timeout | null = null;

  // 创建一个包含函数主体和cancel方法的对象
  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  }) as DebouncedFunction<T>;

  // 显式添加cancel方法
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
};

// 防抖函数的类型定义
type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

interface Chapter {
  title: string;
  content: string;
}

// 章节管理侧边栏组件
const ChapterSidebar = ({
  chapters,
  activeChapter,
  onChapterClick,
  onAddChapter
}: {
  chapters: Chapter[];
  activeChapter: number;
  onChapterClick: (index: number) => void;
  onAddChapter: () => void;
}) => {
  // 创建一个颜色数组用于章节项
  const chapterColors = [
    'rgba(120,180,140,0.3)', // 绿色
    'rgba(133,150,230,0.3)', // 蓝色
    'rgba(224,149,117,0.3)', // 橙色
    'rgba(194,129,211,0.3)', // 紫色
    'rgba(231,169,85,0.3)',  // 黄色
  ];

  return (
    <div className="w-64 border-r border-[rgba(120,180,140,0.3)] bg-card-color shadow-sm flex flex-col rounded-tr-2xl rounded-br-2xl">
      <div className="p-5 border-b border-[rgba(120,180,140,0.3)] flex items-center">
        <div className="w-10 h-10 bg-primary-green rounded-xl flex items-center justify-center text-white font-bold mr-3 text-base shadow-sm">智</div>
        <span className="text-text-dark text-lg font-medium tracking-wide" style={{ fontFamily: "'Ma Shan Zheng', cursive" }}>逐光写作</span>
      </div>

      <div className="flex-1 py-6 px-2 overflow-auto">
        <div className="mb-4 px-3 flex justify-between items-center">
          <span className="text-text-dark font-medium text-lg font-ma-shan transform -translate-y-[2px]">章节管理</span>
          <button
            className="p-1 rounded-full hover:bg-[rgba(90,157,107,0.1)] transition-colors duration-200 transform translate-y-[2px]"
            onClick={onAddChapter}
            title="添加新章节"
          >
            <span className="material-icons text-primary-green">add_circle</span>
          </button>
        </div>
        {chapters.map((chapter, index) => {
          // 根据索引选择颜色
          const colorIndex = index % chapterColors.length;
          const borderColor = chapterColors[colorIndex];
          const iconColor = activeChapter === index ?
            `rgb(${90 + index * 15}, ${130 + (index % 3) * 20}, ${140 - (index % 5) * 10})` :
            'rgba(90, 90, 90, 0.7)';

          return (
            <div
              key={index}
              className={`menu-item ${activeChapter === index ? 'active shadow-md' : 'shadow-sm opacity-80'}`}
              onClick={() => onChapterClick(index)}
              style={{
                borderLeft: activeChapter === index ? `3px solid ${borderColor}` : 'none'
              }}
            >
              <div className="menu-icon">
                <span className="material-icons text-2xl" style={{ color: iconColor }}>article</span>
              </div>
              <span className="menu-text truncate">第 {index + 1} 章</span>
            </div>
          );
        })}
      </div>

      <div className="p-4 mt-auto"></div>
    </div>
  );
};

// 富文本编辑器组件
const RichTextEditor = ({
  content,
  onChange,
  title,
  onTitleChange,
  onSave,
  isSaving,
}: {
  content: string;
  onChange: (content: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  isSaving: boolean;
}) => {
  // 添加一个状态来控制是否使用A4宽度，默认为true
  const [isA4Width, setIsA4Width] = React.useState(true);
  
  // 添加一个状态来控制AI写作弹窗的显示与隐藏
  const [showAIWritingModal, setShowAIWritingModal] = React.useState(false);
  
  // 添加AI提示词状态
  const [aiPrompt, setAIPrompt] = React.useState('');
  
  // 添加模型选择状态，使用AIGenerator获取默认模型
  const [selectedModel, setSelectedModel] = React.useState(AIGenerator.getAvailableModels()[0].id);
  
  // 获取可用的模型列表
  const availableModels = React.useMemo(() => AIGenerator.getAvailableModels(), []);
  
  // 添加提示词库状态
  const [prompts, setPrompts] = React.useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = React.useState<number | null>(null);
  
  // 添加生成结果状态
  const [generatedContent, setGeneratedContent] = React.useState('');
  const [showResultModal, setShowResultModal] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generateError, setGenerateError] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  
  // 添加结果容器引用
  const resultContainerRef = React.useRef<HTMLDivElement>(null);
  
  // 添加自动滚动效果
  React.useEffect(() => {
    if (isStreaming && resultContainerRef.current) {
      resultContainerRef.current.scrollTop = resultContainerRef.current.scrollHeight;
    }
  }, [generatedContent, isStreaming]);
  
  // 在组件挂载时加载提示词
  React.useEffect(() => {
    const loadPrompts = async () => {
      try {
        // 只加载写作类型的提示词
        const writingPrompts = await getPromptsByType('writing');
        setPrompts(writingPrompts);
      } catch (error) {
        console.error('加载提示词失败:', error);
      }
    };
    
    loadPrompts();
  }, []);
  
  // 切换A4宽度模式
  const toggleA4Width = () => {
    setIsA4Width(!isA4Width);
  };
  
  // 打开AI写作弹窗
  const openAIWritingModal = () => {
    setShowAIWritingModal(true);
  };
  
  // 关闭AI写作弹窗
  const closeAIWritingModal = () => {
    setShowAIWritingModal(false);
    // 重置状态
    setAIPrompt('');
    setSelectedPrompt(null);
    setGenerateError('');
  };
  
  // 处理AI提示词输入变化
  const handleAIPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAIPrompt(e.target.value);
  };
  
  // 处理模型选择变化
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };
  
  // 处理提示词选择变化
  const handlePromptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const promptId = parseInt(e.target.value);
    if (promptId === -1) {
      setSelectedPrompt(null);
      setAIPrompt('');
    } else {
      setSelectedPrompt(promptId);
      // 找到选中的提示词并设置内容
      const selected = prompts.find(p => p.id === promptId);
      if (selected) {
        setAIPrompt(selected.content);
      }
    }
  };
  
  // 显示结果弹窗
  const showResultModalHandler = () => {
    setShowResultModal(true);
  };
  
  // 关闭结果弹窗
  const closeResultModal = () => {
    setShowResultModal(false);
  };
  
  // 应用生成的内容到编辑器
  const applyGeneratedContent = () => {
    onChange(content + '\n\n' + generatedContent);
    closeResultModal();
  };
  
  // 处理AI生成内容
  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setGenerateError('请输入写作提示');
      return;
    }
    
    setIsGenerating(true);
    setGenerateError('');
    setGeneratedContent('');
    
    try {
      // 构建提示内容
      const promptContent = aiPrompt;
      
      // 关闭写作弹窗，显示结果弹窗
      setShowAIWritingModal(false);
      showResultModalHandler();
      setIsStreaming(true);
      
      // 调用AIservice接口，使用流式模式
      const result = await AIGenerator.generate(promptContent, {
        model: selectedModel,
        temperature: 0.7,
        maxTokens: 64000,
        stream: true,
        onStream: (content) => {
          setGeneratedContent(content);
        }
      });
      
      // 设置最终生成结果
      setGeneratedContent(result);
    } catch (error) {
      console.error('AI生成失败:', error);
      setGenerateError(error instanceof Error ? error.message : '生成内容失败，请稍后重试');
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card-color rounded-xl overflow-hidden border border-[rgba(120,180,140,0.4)] shadow-md relative">
      <div className="p-4 border-b border-[rgba(120,180,140,0.3)] flex justify-between items-center">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="flex-1 text-3xl font-bold border-none focus:outline-none focus:ring-0 bg-transparent text-text-dark"
          placeholder="章节标题"
          style={{ fontFamily: "'Ma Shan Zheng', cursive" }}
        />
        <div className="flex items-center">
          <button
            onClick={openAIWritingModal}
            className="mr-2 p-2 rounded-lg hover:bg-[rgba(120,180,140,0.1)] transition-colors duration-200 flex items-center text-primary-green"
            title="AI写作助手"
          >
            <span className="material-icons">auto_awesome</span>
          </button>
          <button
            onClick={toggleA4Width}
            className="p-2 rounded-lg hover:bg-[rgba(120,180,140,0.1)] transition-colors duration-200 flex items-center text-primary-green"
            title={isA4Width ? "切换到全宽模式" : "切换到A4宽度模式"}
          >
            <span className="material-icons">{isA4Width ? "fullscreen" : "fit_screen"}</span>
          </button>
        </div>
      </div>
      
      {/* 文本编辑区域 */}
      <div className="flex-1 overflow-auto relative">
        <div className={`h-full ${isA4Width ? 'flex justify-center' : 'editor-grid-bg'}`}>
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className={`h-full border-none focus:outline-none focus:ring-0 resize-none text-text-dark p-6 ${isA4Width ? 'editor-grid-bg' : ''}`}
            style={{
              fontFamily: "'思源黑体', 'Noto Sans SC', sans-serif",
              fontSize: '16pt',
              fontWeight: 400,
              lineHeight: '2.0',
              color: 'var(--text-dark)',
              width: isA4Width ? '21cm' : '100%',
              maxWidth: isA4Width ? '21cm' : 'none',
              backgroundColor: 'transparent',
              position: isA4Width ? 'relative' : 'absolute',
              left: isA4Width ? 'auto' : 0,
              right: isA4Width ? 'auto' : 0,
              top: isA4Width ? 'auto' : 0,
              bottom: isA4Width ? 'auto' : 0,
            }}
            placeholder="开始创作你的故事..."
          ></textarea>
        </div>
      </div>
      
      <div className="p-3 border-t border-[rgba(120,180,140,0.3)] bg-card-color flex justify-between items-center text-sm text-text-dark">
        <div className="flex items-center">
          <span className="mr-4" style={{ color: 'rgba(224,149,117,0.9)' }}>字数: {content.length}</span>
          {isA4Width && (
            <span className="flex items-center text-primary-green">
              <span className="material-icons text-sm mr-1">description</span>
              <span>A4模式</span>
            </span>
          )}
        </div>
        <div>
          {isSaving && (
            <span className="text-primary-green flex items-center">
              <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
              <span>保存中...</span>
            </span>
          )}
        </div>
      </div>
      
      {/* AI写作弹窗 */}
      {showAIWritingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            {/* 背景遮罩 */}
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" aria-hidden="true" onClick={closeAIWritingModal}></div>
            
            {/* 弹窗内容 */}
            <div className="relative inline-block bg-card-color rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle max-w-2xl w-full">
              <div className="grid-background absolute inset-0 opacity-30"></div>
              
              {/* 胶带装饰 */}
              <div className="tape" style={{ backgroundColor: 'rgba(90,157,107,0.7)', width: '120px', height: '40px', top: '-20px', left: '50%', transform: 'translateX(-50%) rotate(-2deg)' }}>
                <div className="tape-texture"></div>
              </div>
              
              {/* 弹窗标题 */}
              <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-[rgba(120,180,140,0.2)]">
                <h3 className="text-xl font-medium text-text-dark" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>
                  AI写作助手
                </h3>
                <button
                  className="p-2 rounded-full hover:bg-[rgba(120,180,140,0.1)]"
                  onClick={closeAIWritingModal}
                >
                  <span className="material-icons text-text-medium">close</span>
                </button>
              </div>
              
              {/* 弹窗内容 */}
              <div className="px-6 py-4">
                {/* 模型选择 */}
                <div className="mb-4">
                  <label className="block text-text-dark font-medium mb-2">选择模型</label>
                  <select
                    value={selectedModel}
                    onChange={handleModelChange}
                    className="w-full px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                  >
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* 提示词选择 */}
                <div className="mb-4">
                  <label className="block text-text-dark font-medium mb-2">选择提示词模板</label>
                  <select
                    value={selectedPrompt || '-1'}
                    onChange={handlePromptChange}
                    className="w-full px-4 py-2 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark"
                  >
                    <option value="-1">不使用模板</option>
                    {prompts.map(prompt => (
                      <option key={prompt.id} value={prompt.id}>{prompt.title}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-6">
                  <label className="block text-text-dark font-medium mb-2">写作提示</label>
                  <textarea
                    value={aiPrompt}
                    onChange={handleAIPromptChange}
                    className="w-full px-4 py-3 bg-white bg-opacity-70 border border-[rgba(120,180,140,0.3)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(120,180,140,0.5)] text-text-dark min-h-[160px]"
                    placeholder="例如：描写一个宁静的森林早晨，充满了生机和神秘感..."
                  ></textarea>
                </div>
                
                {generateError && (
                  <div className="mb-4 p-3 bg-[rgba(224,111,111,0.1)] rounded-lg">
                    <p className="text-[#E06F6F] text-sm">{generateError}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-text-light text-sm mb-4">
                  <div className="flex items-center">
                    <span className="material-icons text-xs mr-1">info</span>
                    <span>尝试详细描述你想要的场景、角色或情节</span>
                  </div>
                </div>
                
                <div className="flex space-x-4 justify-end mt-4">
                  <button
                    className="btn-outline"
                    onClick={closeAIWritingModal}
                  >
                    取消
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleAIGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <span className="material-icons animate-spin mr-2">refresh</span>
                        生成中...
                      </>
                    ) : (
                      <>
                        <span className="material-icons mr-2">auto_awesome</span>
                        生成内容
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* 翻页装饰 */}
              <div className="page-curl"></div>
              
              {/* 装饰元素 */}
              <div className="dot hidden md:block" style={{ bottom: "15px", right: "40%" }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI生成结果弹窗 */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
            {/* 背景遮罩 */}
            <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" aria-hidden="true" onClick={closeResultModal}></div>
            
            {/* 弹窗内容 */}
            <div className="relative inline-block bg-card-color rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle max-w-2xl w-full">
              <div className="grid-background absolute inset-0 opacity-30"></div>
              
              {/* 胶带装饰 */}
              <div className="tape" style={{ backgroundColor: 'rgba(224,149,117,0.7)', width: '120px', height: '40px', top: '-20px', left: '50%', transform: 'translateX(-50%) rotate(-2deg)' }}>
                <div className="tape-texture"></div>
              </div>
              
              {/* 弹窗标题 */}
              <div className="px-6 pt-8 pb-4 flex items-center justify-between border-b border-[rgba(120,180,140,0.2)]">
                <h3 className="text-xl font-medium text-text-dark" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>
                  AI创作结果
                </h3>
                <button
                  className="p-2 rounded-full hover:bg-[rgba(120,180,140,0.1)]"
                  onClick={closeResultModal}
                >
                  <span className="material-icons text-text-medium">close</span>
                </button>
              </div>
              
              {/* 弹窗内容 */}
              <div className="px-6 py-4">
                <div className="mb-6 max-h-[400px] overflow-y-auto" ref={resultContainerRef}>
                  <div className="p-5 bg-white bg-opacity-50 rounded-xl border border-[rgba(120,180,140,0.2)]">
                    {isStreaming ? (
                      <p className="whitespace-pre-wrap text-text-medium">
                        {generatedContent}
                        <span className="inline-block ml-1 animate-pulse">▌</span>
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap text-text-medium">{generatedContent}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-4 justify-end mt-4">
                  <button
                    className="btn-outline"
                    onClick={closeResultModal}
                    disabled={isStreaming}
                  >
                    取消
                  </button>
                  <button
                    className="btn-primary"
                    onClick={applyGeneratedContent}
                    disabled={isStreaming || !generatedContent}
                  >
                    <span className="material-icons mr-2">add</span>
                    应用到文章
                  </button>
                </div>
              </div>
              
              {/* 翻页装饰 */}
              <div className="page-curl"></div>
              
              {/* 装饰元素 */}
              <div className="dot hidden md:block" style={{ bottom: "15px", right: "40%" }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function WorkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workId = params?.id ? Number(params.id) : 0;

  // 所有状态定义
  const [work, setWork] = useState<Work | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [chapters, setChapters] = useState([{ title: '', content: '' }]);
  const [activeChapter, setActiveChapter] = useState(0);

  // 所有refs和memos应该在状态定义之后
  const debouncedWritingScroll = useMemo(() =>
    debounce(() => {}, 200),
    []
  );

  // 重构autoSave以避免依赖问题
  const autoSave = useMemo(() => {
    return debounce(async (currentWork: Work, currentChapters: Chapter[]) => {
      setIsSaving(true);
      try {
        const updatedWork = {
          ...currentWork,
          content: workContentUtils.stringifyChapters(currentChapters),
          updatedAt: new Date()
        };

        await updateWork(updatedWork);
        setWork(updatedWork);
        console.log('自动保存成功', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('自动保存失败:', error);
        setError('自动保存失败');
      } finally {
        setIsSaving(false);
      }
    }, 2000);
  }, []);

  // 在章节内容变化时触发保存，显式传递当前值而非依赖于闭包
  useEffect(() => {
    if (work && chapters.length > 0) {
      autoSave(work, chapters);
    }
  }, [chapters, autoSave, work]);

  // 监听写作结果变化，自动滚动到底部
  useEffect(() => {
    // 移除对不再存在的状态的依赖
  }, [debouncedWritingScroll]);

  // 组件卸载时的清理
  useEffect(() => {
    // 返回清理函数
    return () => {
      if (autoSave && typeof autoSave.cancel === 'function') {
        autoSave.cancel();
      }
      if (debouncedWritingScroll && typeof debouncedWritingScroll.cancel === 'function') {
        debouncedWritingScroll.cancel();
      }
    };
  }, [autoSave, debouncedWritingScroll]);

  // 获取作品数据
  useEffect(() => {
    // 初始化工作
    const fetchWork = async () => {
      if (!workId) return;

      try {
        const workData = await getWorkById(workId);
        if (!workData) {
          router.push('/works');
          return;
        }

        setWork(workData);
        const parsedChapters = workContentUtils.parseContent(workData.content);
        setChapters(parsedChapters);
      } catch (error) {
        console.error('获取作品失败:', error);
        setError('获取作品失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWork();
  }, [workId, router]);

  // 如果处于加载状态，渲染加载组件
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 w-24 bg-blue-200 rounded"></div>
        </div>
      </div>
    );
  }

  // 如果作品不存在，渲染错误组件
  if (!work) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <span className="material-icons text-4xl text-gray-300 mb-3">error</span>
          <p className="text-gray-500">作品不存在或已被删除</p>
          <button
            className="btn-primary mt-4"
            onClick={() => router.push('/works')}
          >
            返回作品列表
          </button>
        </div>
      </div>
    );
  }

  // 处理章节点击事件
  const handleChapterClick = (index: number) => {
    // 只切换章节，不保存滚动位置
    setActiveChapter(index);
    
    // 在切换章节后重置滚动位置
    setTimeout(() => {
      const editorTextarea = document.querySelector('.flex-1.overflow-auto textarea') as HTMLTextAreaElement;
      if (editorTextarea) {
        editorTextarea.scrollTop = 0;
      }
    }, 0);
  };

  // 处理章节内容变更
  const handleChange = (content: string) => {
    if (activeChapter >= 0 && activeChapter < chapters.length) {
      const newChapters = [...chapters];
      newChapters[activeChapter] = {
        ...newChapters[activeChapter],
        content: content
      };
      setChapters(newChapters);
    }
  };

  // 处理章节标题变更
  const handleTitleChange = (title: string) => {
    if (activeChapter >= 0 && activeChapter < chapters.length) {
      const newChapters = [...chapters];
      newChapters[activeChapter] = {
        ...newChapters[activeChapter],
        title: title
      };
      setChapters(newChapters);
    }
  };

  const handleAddChapter = () => {
    const newChapter = { title: '', content: '' };
    const newChapters = [...chapters, newChapter];

    // 先更新章节列表
    setChapters(newChapters);
    // 设置激活章节为新添加的章节
    setActiveChapter(chapters.length);

    // 使用新的章节数组直接保存，而不是依赖于状态更新
    if (work) {
      setIsSaving(true);
      try {
        const updatedWork = {
          ...work,
          content: workContentUtils.stringifyChapters(newChapters),
          updatedAt: new Date()
        };

        updateWork(updatedWork)
          .then(() => {
            setWork(updatedWork);
            console.log('新章节保存成功', new Date().toLocaleTimeString());
          })
          .catch(err => {
            console.error('保存新章节失败:', err);
            setError('保存新章节失败');
          })
          .finally(() => {
            setIsSaving(false);
          });
      } catch (error) {
        console.error('保存新章节失败:', error);
        setError('保存新章节失败');
        setIsSaving(false);
      }
    }
  };

  const handleSave = async () => {
    if (!work) return;

    setIsSaving(true);
    try {
      // 使用工具函数序列化章节数据
      const updatedWork = {
        ...work,
        content: workContentUtils.stringifyChapters(chapters),
        updatedAt: new Date()
      };

      await updateWork(updatedWork);
      setWork(updatedWork);
    } catch (error) {
      console.error('保存作品失败:', error);
      setError('保存作品失败');
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* 左侧章节管理 */}
      <ChapterSidebar
        chapters={chapters}
        activeChapter={activeChapter}
        onChapterClick={handleChapterClick}
        onAddChapter={handleAddChapter}
      />

      {/* 中间内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 使用通用顶边栏组件 */}
        <TopBar
          title={work.title}
          showBackButton={true}
          actions={
            <>
              <span className={`badge ${
                work.type === 'novel' ? 'badge-blue' :
                work.type === 'character' ? 'badge-purple' :
                work.type === 'worldbuilding' ? 'badge-green' :
                'badge-yellow'
              }`}>
                {work.type === 'novel' ? '小说' :
                work.type === 'character' ? '角色' :
                work.type === 'worldbuilding' ? '世界' :
                '情节'}
              </span>
            </>
          }
        />

        {/* 富文本编辑器 */}
        <div className="flex-1 flex overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="flex-1 flex rounded-xl overflow-hidden shadow-lg bg-card-color border border-[rgba(120,180,140,0.2)]">
            <RichTextEditor
              content={chapters[activeChapter]?.content || ''}
              onChange={handleChange}
              title={chapters[activeChapter]?.title || ''}
              onTitleChange={handleTitleChange}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-card-color border border-[rgba(224,149,117,0.5)] rounded-xl p-4 shadow-md animate-fadeIn">
          <div className="flex items-center">
            <span className="material-icons text-[#E0976F] mr-2">error</span>
            <span className="text-text-dark">{error}</span>
            <button
              className="ml-4 text-text-dark hover:text-[#E0976F]"
              onClick={() => setError('')}
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}