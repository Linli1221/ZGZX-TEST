'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getWorkById, updateWork, Work } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import BackButton from '@/components/BackButton';
import TopBar from '@/components/TopBar';
import { workContentUtils } from '@/lib/utils';

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
  
  // 切换A4宽度模式
  const toggleA4Width = () => {
    setIsA4Width(!isA4Width);
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
        <button
          onClick={toggleA4Width}
          className="ml-4 p-2 rounded-lg hover:bg-[rgba(120,180,140,0.1)] transition-colors duration-200 flex items-center text-primary-green"
          title={isA4Width ? "切换到全宽模式" : "切换到A4宽度模式"}
        >
          <span className="material-icons">{isA4Width ? "fullscreen" : "fit_screen"}</span>
        </button>
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