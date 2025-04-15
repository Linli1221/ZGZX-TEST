'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllWorks, addWork, updateWork, deleteWork, Work } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Encoding from 'encoding-japanese';
import { TextDecoder as TextDecoderPolyfill } from 'text-encoding';

// 添加GBK/GB18030转UTF-8的函数
function convertChineseEncoding(buffer: ArrayBuffer): string {
  try {
    // 转换为Uint8Array以便处理
    const uint8Array = new Uint8Array(buffer);
    
    // 首先检查是否是UTF-8 BOM
    if (uint8Array.length >= 3 && 
        uint8Array[0] === 0xEF && 
        uint8Array[1] === 0xBB && 
        uint8Array[2] === 0xBF) {
      // UTF-8带BOM
      console.log('检测到UTF-8 BOM');
      return new TextDecoder('utf-8').decode(uint8Array.slice(3));
    }
    
    // 尝试使用浏览器原生TextDecoder解码UTF-8
    let utf8Text = '';
    try {
      utf8Text = new TextDecoder('utf-8').decode(uint8Array);
      // 如果UTF-8解码没有明显乱码，直接返回
      if (!utf8Text.includes('\uFFFD') && !utf8Text.includes('锟斤拷')) {
        console.log('UTF-8解码成功，无明显乱码');
        return utf8Text;
      }
    } catch (e) {
      console.warn('UTF-8解码失败', e);
    }

    // 尝试检测编码
    const detected = Encoding.detect(uint8Array);
    console.log('Encoding-Japanese检测到的编码:', detected);
    
    // 尝试GBK解码 - 使用text-encoding库的polyfill
    try {
      console.log('尝试GBK解码');
      // 注意：浏览器原生不支持GBK，使用polyfill
      const gbkText = new TextDecoderPolyfill('gbk').decode(uint8Array);
      
      // 检查是否有明显乱码
      const gbkFffdCount = (gbkText.match(/\uFFFD/g) || []).length;
      const utf8FffdCount = (utf8Text.match(/\uFFFD/g) || []).length;
      
      console.log('GBK解码乱码数:', gbkFffdCount, 'UTF-8解码乱码数:', utf8FffdCount);
      
      // 如果GBK解码的乱码更少，使用GBK解码结果
      if (gbkFffdCount < utf8FffdCount) {
        console.log('使用GBK解码结果');
        return gbkText;
      }
    } catch (gbkError) {
      console.warn('GBK polyfill解码失败', gbkError);
    }

    // 使用Encoding-Japanese库进行转换尝试
    try {
      console.log('尝试使用Encoding-Japanese转换');
      // 尝试使用检测到的编码，如果是BINARY（无法检测）则尝试GBK
      const fromEncoding = detected === 'BINARY' ? 'GBK' : detected;
      
      const unicodeArray = Encoding.convert(uint8Array, {
        to: 'UNICODE',
        from: fromEncoding
      });
      
      const convertedText = Encoding.codeToString(unicodeArray);
      
      // 检查转换结果中的乱码
      const convertedFffdCount = (convertedText.match(/\uFFFD/g) || []).length;
      const utf8FffdCount = (utf8Text.match(/\uFFFD/g) || []).length;
      
      console.log('Encoding-Japanese转换乱码数:', convertedFffdCount, 'UTF-8解码乱码数:', utf8FffdCount);
      
      // 如果是中文相关编码或转换后乱码更少，使用转换结果
      if (['GBK', 'GB18030', 'GB2312', 'BIG5', 'CHINESE'].includes(detected) || 
          convertedFffdCount < utf8FffdCount) {
        console.log('使用Encoding-Japanese转换结果');
        return convertedText;
      }
    } catch (encError) {
      console.warn('Encoding-Japanese转换失败', encError);
    }
    
    // 如果上述所有方法都失败或效果不理想，回退到UTF-8
    console.log('所有方法效果不佳，回退到UTF-8解码结果');
    return utf8Text;
  } catch (error) {
    console.error('编码转换总体错误:', error);
    // 最终兜底方案
    return new TextDecoder('utf-8').decode(buffer);
  }
}

export default function WorksPage() {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentWorkId, setCurrentWorkId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  // 添加删除确认弹窗状态
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<number | null>(null);

  // 添加导入TXT相关状态
  const [fileUploadMode, setFileUploadMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [chapterPreview, setChapterPreview] = useState<{ title: string; content: string }[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // 添加过滤和排序相关状态
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');
  const [searchQuery, setSearchQuery] = useState('');

  // 添加弹窗状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const allWorks = await getAllWorks();
        setWorks(allWorks);
      } catch (error) {
        console.error('获取作品失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorks();
  }, []);

  const handleCreateWork = () => {
    setIsEditMode(false);
    setCurrentWorkId(null);
    setFormData({
      title: '',
    });
    setFileUploadMode(false);
    setUploadedFile(null);
    setChapterPreview([]);
    setShowPreview(false);
    setIsModalOpen(true);
  };

  const handleEditWork = (work: Work) => {
    setIsEditMode(true);
    setCurrentWorkId(work.id ?? null);
    setFormData({
      title: work.title,
    });
    setIsModalOpen(true);
  };

  const handleDeleteWork = async (id: number) => {
    setWorkToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!workToDelete) return;

    setIsDeleting(true);
    try {
      await deleteWork(workToDelete);
      // 更新作品列表
      const allWorks = await getAllWorks();
      setWorks(allWorks);
    } catch (error) {
      console.error('删除作品失败:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setWorkToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setWorkToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setError('');
    setFormData({
      title: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.title.trim()) {
        throw new Error('标题不能为空');
      }

      const now = new Date();

      // Prepare data, adding back empty/default values for removed fields for DB compatibility
      const workData = {
        title: formData.title,
        description: '', // Default empty string
        type: 'novel' as 'novel' | 'character' | 'worldbuilding' | 'plot', // Default type
        content: '', // Default empty string
      };

      if (isEditMode && currentWorkId) {
        // 更新现有作品
        // Note: Editing might need a different approach if fields are truly removed later
        await updateWork({
          ...workData,
          id: currentWorkId,
          updatedAt: now,
          createdAt: works.find(w => w.id === currentWorkId)?.createdAt || now
        });
      } else {
        // 创建新作品
        const newWork = await addWork({
          ...workData,
          createdAt: now,
          updatedAt: now
        });

        // 如果是导入TXT模式且有章节，则直接跳转到作品详情页
        if (fileUploadMode && chapterPreview.length > 0) {
          // 保存作品内容（包含章节信息）
          await updateWork({
            ...newWork,
            content: JSON.stringify(chapterPreview),
            updatedAt: new Date()
          });

          router.push(`/works/${newWork.id}`);
          return;
        }
      }

      // 重新获取作品列表
      const allWorks = await getAllWorks();
      setWorks(allWorks);

      // 重置表单并关闭创建界面
      setFormData({
        title: '',
      });
      setIsModalOpen(false);
      setFileUploadMode(false);
      setUploadedFile(null);
      setChapterPreview([]);
      setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : isEditMode ? '更新作品失败' : '创建作品失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理TXT文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    console.log('文件信息:', file.name, file.size, file.type);

    if (file.type !== 'text/plain' && !file.name.toLowerCase().endsWith('.txt')) {
      setError('请上传TXT文本文件');
      return;
    }

    setUploading(true);
    setUploadedFile(file);
    setError('');

    try {
      // 设置作品标题为文件名（去除.txt后缀）
      const fileName = file.name.replace(/\.txt$/i, '');
      setFormData({
        title: fileName
      });

      // 读取文件内容
      let fileBuffer = await file.arrayBuffer();
      console.log('文件大小:', fileBuffer.byteLength, '字节');
      
      // 检查文件的前几个字节，帮助判断编码
      const dataView = new DataView(fileBuffer);
      let hexHeader = '';
      for (let i = 0; i < Math.min(fileBuffer.byteLength, 8); i++) {
        hexHeader += dataView.getUint8(i).toString(16).padStart(2, '0') + ' ';
      }
      console.log('文件头部字节:', hexHeader);
      
      let text = '';
      
      // 尝试处理不同的编码
      try {
        // 使用改进的编码检测和转换
        console.log('开始尝试解码文件');
        text = convertChineseEncoding(fileBuffer);
        console.log('解码完成，结果长度:', text.length);
        
        // 检查解码结果中的乱码数量
        const fffdCount = (text.match(/\uFFFD/g) || []).length;
        if (fffdCount > 0) {
          console.warn(`解码后仍有 ${fffdCount} 个乱码字符`);
        }
        
        // 如果文本中仍包含明显的乱码特征，记录警告
        if (text.includes('\uFFFD') || text.includes('锟斤拷')) {
          console.warn('文本中可能存在编码问题，尝试手动转换');
          // 尝试处理常见的乱码字符
          text = text.replace(/锟斤拷/g, '').replace(/\uFFFD/g, '');
        }
      } catch (err) {
        console.error('编码转换失败:', err);
        // 兜底使用UTF-8
        text = new TextDecoder('utf-8').decode(fileBuffer);
      }

      // 过滤掉常见的电子书水印和版权声明
      const cleanText = text.replace(/☆[^☆]*?看帮网[^☆]*?☆/g, '').replace(/☆本文由.*?所有☆/g, '').replace(/☆请勿用于商业.*?自负☆/g, '').replace(/☆https?:\/\/www\.kanbang\.cc☆/g, '');
      
      // 提取文本中的一小部分用于检查
      const textSample = text.substring(0, 200);
      console.log('文本样本:', textSample);
      
      // 解析章节
      console.log('开始解析章节');
      const chapters = parseChapters(cleanText);
      console.log('章节解析完成，识别到', chapters.length, '个章节');

      if (chapters.length === 0) {
        // 如果未识别到章节，创建单个章节
        console.log('未识别到章节，使用整个文本作为单章节');
        setChapterPreview([
          {
            title: '第一章',
            content: text
          }
        ]);
      } else {
        console.log('章节标题示例:', chapters.slice(0, 3).map(ch => ch.title));
        setChapterPreview(chapters);
      }

      setShowPreview(true);
    } catch (err) {
      setError('文件解析失败，请重试');
      console.error('文件解析错误:', err);
    } finally {
      setUploading(false);
    }
  };

  // 解析章节函数
  const parseChapters = (text: string): { title: string; content: string }[] => {
    // 过滤掉常见的电子书水印和版权声明
    const cleanText = text.replace(/☆[^☆]*?看帮网[^☆]*?☆/g, '').replace(/☆本文由.*?所有☆/g, '').replace(/☆请勿用于商业.*?自负☆/g, '').replace(/☆https?:\/\/www\.kanbang\.cc☆/g, '');
    
    // 章节识别的正则表达式
    // 1. 章节格式
    const chapterRegex = /(第[零一二三四五六七八九十百千0-9]+章(\s+[^\n]+)?|第[0-9]{1,4}章(\s+[^\n]+)?|Chapter\s+[0-9]+(\s+[^\n]+)?|CHAPTER\s+[0-9]+(\s+[^\n]+)?)/gi;
    
    // 2. 卷/册/部等结构，这些不直接作为分章依据，但是可以记录
    const volumeRegex = /(第[零一二三四五六七八九十百千0-9]+[卷册部篇集](\s+[^\n]+)?)/gi;
    
    // 查找所有章节标记及其位置
    let chapterMatches: { title: string, index: number }[] = [];
    let match;
    
    // 查找正式章节
    while ((match = chapterRegex.exec(cleanText)) !== null) {
      // 防止重复匹配相同位置的章节
      let isDuplicate = false;
      for (const existingMatch of chapterMatches) {
        // 检查是否有重叠：如果新匹配的起始位置在某个现有匹配的范围内
        if (Math.abs(existingMatch.index - match.index) < 10) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        console.log(`找到章节: "${match[0]}" 在位置: ${match.index}`);
        chapterMatches.push({
          title: match[0].trim(),
          index: match.index
        });
      }
    }

    // 如果没有找到任何章节标题
    if (chapterMatches.length === 0) {
      console.log("未找到标准章节格式，尝试通过卷/册/部来分章");
      
      // 尝试使用卷/册/部等结构分章
      while ((match = volumeRegex.exec(cleanText)) !== null) {
        // 防止重复匹配
        let isDuplicate = false;
        for (const existingMatch of chapterMatches) {
          if (Math.abs(existingMatch.index - match.index) < 10) {
            isDuplicate = true;
            break;
          }
        }

        if (!isDuplicate) {
          console.log(`找到卷/册/部: "${match[0]}" 在位置: ${match.index}`);
          chapterMatches.push({
            title: match[0].trim(),
            index: match.index
          });
        }
      }
    }

    // 按位置排序章节标题
    chapterMatches.sort((a, b) => a.index - b.index);

    // 如果仍然没有找到任何章节或卷结构
    if (chapterMatches.length === 0) {
      return [];
    }

    // 提取章节内容
    const chapters: { title: string; content: string }[] = [];

    for (let i = 0; i < chapterMatches.length; i++) {
      const current = chapterMatches[i];
      const next = chapterMatches[i + 1];

      const chapterContent = next
        ? cleanText.substring(current.index, next.index).trim()
        : cleanText.substring(current.index).trim();

      chapters.push({
        title: current.title,
        content: chapterContent
      });
    }

    return chapters;
  };

  // 切换到文件上传模式
  const toggleFileUploadMode = () => {
    setFileUploadMode(!fileUploadMode);
    if (fileUploadMode) {
      // 切换回普通模式时清理文件相关状态
      setUploadedFile(null);
      setChapterPreview([]);
      setShowPreview(false);
    }
  };

  // 过滤作品
  const filteredWorks = works.filter((work) => {
    if (filter === 'all') return true;
    return work.type === filter;
  });

  // 排序作品
  const sortedWorks = filteredWorks.sort((a, b) => {
    if (sortBy === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sortBy === 'created') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  // 搜索作品
  const searchedWorks = sortedWorks.filter((work) =>
    work.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 作品卡片组件
  const WorkCard = ({ work, onDelete }: { work: Work; onDelete: (id: number) => Promise<void> }) => {
    // 根据作品类型获取颜色类
    const getColorClass = (type: string) => {
      switch (type) {
        case 'novel':
          return {
            text: 'text-[#7D85CC]',
            border: 'border-[#7D85CC]',
            hover: 'hover:bg-[rgba(125,133,204,0.1)]',
            badge: 'badge-blue',
            icon: 'M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5A2,2 0 0,0 17,3M7,5H17V16L12,14.25L7,16V5Z'
          };
        case 'character':
          return {
            text: 'text-[#C281D3]',
            border: 'border-[#C281D3]',
            hover: 'hover:bg-[rgba(194,129,211,0.1)]',
            badge: 'badge-purple',
            icon: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z'
          };
        case 'worldbuilding':
          return {
            text: 'text-[#78B48C]',
            border: 'border-[#78B48C]',
            hover: 'hover:bg-[rgba(120,180,140,0.1)]',
            badge: 'badge-green',
            icon: 'M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z'
          };
        case 'plot':
          return {
            text: 'text-[#E0976F]',
            border: 'border-[#E0976F]',
            hover: 'hover:bg-[rgba(224,149,117,0.1)]',
            badge: 'badge-yellow',
            icon: 'M19,3H14V5H19V18L14,12L19,18V20H5V18L10,12L5,18V5H10V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z'
          };
        case 'short_story':
          return {
            text: 'text-[#E06F51]',
            border: 'border-[#E06F51]',
            hover: 'hover:bg-[rgba(224,111,81,0.1)]',
            badge: 'badge-orange',
            icon: 'M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z'
          };
        case 'script':
          return {
            text: 'text-[#6F9CE0]',
            border: 'border-[#6F9CE0]',
            hover: 'hover:bg-[rgba(111,156,224,0.1)]',
            badge: 'badge-indigo',
            icon: 'M15,20A1,1 0 0,0 16,19V4H8A1,1 0 0,0 7,5V16H5V5A3,3 0 0,1 8,2H19A3,3 0 0,1 22,5V19A3,3 0 0,1 19,22H15V20M3,16H5V22H3V16Z'
          };
        default:
          return {
            text: 'text-[#7D85CC]',
            border: 'border-[#7D85CC]',
            hover: 'hover:bg-[rgba(125,133,204,0.1)]',
            badge: 'badge-blue',
            icon: 'M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5A2,2 0 0,0 17,3M7,5H17V16L12,14.25L7,16V5Z'
          };
      }
    };

    const colors = getColorClass(work.type);

    const getTypeName = (type: string) => {
      switch (type) {
        case 'novel': return '小说';
        case 'character': return '角色';
        case 'worldbuilding': return '世界';
        case 'plot': return '情节';
        case 'short_story': return '短篇';
        case 'script': return '剧本';
        default: return '作品';
      }
    };

    return (
      <div
        className="ghibli-card h-72 text-center cursor-pointer"
        onClick={() => router.push(`/works/${work.id}`)}
      >
        <div className="tape" style={{ backgroundColor: `rgba(${colors.text.substring(6, colors.text.length - 1)}, 0.7)` }}>
          <div className="tape-texture"></div>
        </div>
        <div className="flex flex-col items-center h-full">
          <svg className={`w-10 h-10 mt-6 mb-4 fill-current ${colors.text}`} viewBox="0 0 24 24">
            <path d={colors.icon} />
          </svg>
          <h3 className="font-medium text-text-dark text-lg mb-2" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>{work.title}</h3>
          <p className="text-text-medium text-xs mb-2 px-4 line-clamp-2">{work.description || "暂无描述"}</p>
          <div className="flex justify-center space-x-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.text} bg-white border ${colors.border}`}>
              {getTypeName(work.type)}
            </span>
            <span className="text-text-medium text-xs flex items-center">
              <span className="material-icons text-xs mr-1">calendar_today</span>
              {new Date(work.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex space-x-2 mt-auto mb-4">
            <button
              className={`px-2 py-1 rounded-full text-xs ${colors.text} border ${colors.border} ${colors.hover} transition-colors duration-200 flex items-center`}
              onClick={(e) => {
                e.stopPropagation();
                handleEditWork(work);
              }}
            >
              <span className="material-icons text-xs mr-1">edit</span>
              编辑
            </button>
            <button
              className="px-2 py-1 rounded-full text-xs text-[#E06F6F] border border-[#E06F6F] hover:bg-[rgba(224,111,111,0.1)] transition-colors duration-200 flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(work.id!);
              }}
              disabled={isDeleting}
            >
              <span className="material-icons text-xs mr-1">delete</span>
              删除
            </button>
          </div>
        </div>
        <div className="page-curl"></div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-bg-color animate-fadeIn overflow-hidden">
      {/* 左侧导航栏 */}
      <Sidebar activeMenu="works" />

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 使用通用顶边栏组件 */}
        <TopBar
          title="我的作品集"
          showBackButton={true}
          actions={
            <>
              <button
                className="hidden md:flex ghibli-button text-sm"
                onClick={handleCreateWork}
              >
                <span className="material-icons mr-1 text-sm">add</span>
                创建新作品
              </button>
              <button
                className="md:hidden round-button"
                onClick={handleCreateWork}
                aria-label="创建新作品"
              >
                <span className="material-icons">add</span>
              </button>
            </>
          }
        />

        {/* 主要内容 */}
        <div className="flex-1 p-3 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* 过滤和排序 */}
            <div className="flex flex-wrap items-center justify-between mb-4 md:mb-6 gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <select
                    className="pl-9 pr-4 py-1.5 text-xs md:text-sm text-text-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green appearance-none"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">全部作品</option>
                    <option value="novel">小说</option>
                    <option value="short_story">短篇</option>
                    <option value="script">剧本</option>
                  </select>
                  <span className="material-icons absolute left-2 top-1/2 -translate-y-1/2 text-text-light text-lg">filter_list</span>
                </div>
                <div className="relative">
                  <select
                    className="pl-9 pr-4 py-1.5 text-xs md:text-sm text-text-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green appearance-none"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="updated">最近更新</option>
                    <option value="created">创建时间</option>
                    <option value="title">标题</option>
                  </select>
                  <span className="material-icons absolute left-2 top-1/2 -translate-y-1/2 text-text-light text-lg">sort</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索作品..."
                  className="pl-9 pr-4 py-1.5 text-xs md:text-sm w-full md:w-64 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-green"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="material-icons absolute left-2 top-1/2 -translate-y-1/2 text-text-light text-lg">search</span>
                {searchQuery && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-light hover:text-text-medium"
                    onClick={() => setSearchQuery('')}
                  >
                    <span className="material-icons text-lg">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* 作品卡片网格 */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-green"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {/* 创建新作品的专属卡片 */}
                <div 
                  className="ghibli-card h-72 text-center cursor-pointer bg-gradient-to-br from-[rgba(120,180,140,0.05)] to-[rgba(125,133,204,0.1)] hover:from-[rgba(120,180,140,0.1)] hover:to-[rgba(125,133,204,0.15)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1" 
                  onClick={() => handleCreateWork()}
                >
                  <div className="tape bg-gradient-to-r from-[rgba(120,180,140,0.7)] to-[rgba(125,133,204,0.7)]">
                    <div className="tape-texture"></div>
                  </div>
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-gradient-to-r from-[rgba(120,180,140,0.2)] to-[rgba(125,133,204,0.2)] rounded-full flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-all duration-300 hover:scale-110">
                      <span className="material-icons text-[#78B48C] text-3xl transform transition-transform duration-300 hover:rotate-12">edit</span>
                    </div>
                    <h3 className="font-medium text-text-dark text-xl mb-3" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>创建新作品</h3>
                    <p className="text-text-medium text-sm mb-6 px-6">开始你的创作之旅，记录灵感与故事</p>
                    <div className="flex justify-center space-x-3">
                      <button 
                        className="px-3 py-1.5 rounded-full text-white bg-[#78B48C] hover:bg-[#6AA47C] transition-all duration-200 text-xs flex items-center shadow-sm hover:shadow hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileUploadMode(false);
                          handleCreateWork();
                        }}
                      >
                        <span className="material-icons text-xs mr-1">edit</span>
                        新建
                      </button>
                      <button 
                        className="px-3 py-1.5 rounded-full text-white bg-[#9C6FE0] hover:bg-[#8D60D1] transition-all duration-200 text-xs flex items-center shadow-sm hover:shadow hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFileUploadMode(true);
                          handleCreateWork();
                        }}
                      >
                        <span className="material-icons text-xs mr-1">upload_file</span>
                        导入TXT
                      </button>
                    </div>
                  </div>
                  <div className="page-curl"></div>
                </div>

                {/* 现有作品列表 */}
                {searchedWorks.map((work) => (
                  <WorkCard key={work.id} work={work} onDelete={handleDeleteWork} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 创建/编辑作品弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-card-color rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto border border-[rgba(120,180,140,0.4)]">
            <div className="sticky top-0 bg-card-color p-6 border-b border-[rgba(120,180,140,0.3)] flex justify-between items-center rounded-t-2xl z-10">
              <h2 className="text-xl font-ma-shan text-text-dark">{isEditMode ? '编辑作品' : '创建新作品'}</h2>
              <button
                className="p-2 hover:bg-[rgba(120,180,140,0.1)] rounded-full transition-colors duration-200 text-text-medium"
                onClick={handleCloseModal}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="p-6">
              {!isEditMode && (
                <div className="mb-6 flex border-b border-[rgba(120,180,140,0.2)]">
                  <button
                    className={`px-4 py-2 font-medium text-sm ${!fileUploadMode ? 'text-[#7D85CC] border-b-2 border-[#7D85CC]' : 'text-text-medium hover:text-text-dark'}`}
                    onClick={() => setFileUploadMode(false)}
                  >
                    <span className="material-icons text-sm mr-1 align-text-bottom">edit</span>
                    手动创建
                  </button>
                  <button
                    className={`px-4 py-2 font-medium text-sm ${fileUploadMode ? 'text-[#7D85CC] border-b-2 border-[#7D85CC]' : 'text-text-medium hover:text-text-dark'}`}
                    onClick={() => setFileUploadMode(true)}
                  >
                    <span className="material-icons text-sm mr-1 align-text-bottom">upload_file</span>
                    导入TXT
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-[rgba(224,111,111,0.1)] border border-[rgba(224,111,111,0.3)] rounded-xl text-[#E06F6F]">
                  <div className="flex items-center">
                    <span className="material-icons mr-2 text-[#E06F6F]">error</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {fileUploadMode && !isEditMode ? (
                <div>
                  {!showPreview ? (
                    <div className="border-2 border-dashed border-[rgba(120,180,140,0.4)] rounded-xl p-6 flex flex-col items-center justify-center mb-6 bg-[rgba(120,180,140,0.05)]">
                      <span className="material-icons text-4xl text-[#9C6FE0] mb-2">upload_file</span>
                      <p className="text-text-medium mb-4">选择或拖放TXT文件</p>
                      <input
                        type="file"
                        accept=".txt"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="file-upload"
                        className="px-5 py-2 rounded-full bg-[#9C6FE0] text-white hover:bg-[#8D60D1] transition-colors duration-200 flex items-center cursor-pointer"
                      >
                        {uploading ? (
                          <>
                            <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                            <span>处理中...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-icons mr-2 text-sm">file_upload</span>
                            <span>选择文件</span>
                          </>
                        )}
                      </label>
                      <p className="text-text-light text-xs mt-4">支持TXT格式，自动识别章节结构</p>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-text-dark font-ma-shan">已识别 {chapterPreview.length} 个章节</h3>
                        <button
                          className="text-[#7D85CC] text-sm flex items-center hover:text-[#6970B9] transition-colors duration-200"
                          onClick={() => setShowPreview(false)}
                        >
                          <span className="material-icons text-sm mr-1">arrow_back</span>
                          重新选择
                        </button>
                      </div>

                      <div className="border border-[rgba(120,180,140,0.3)] rounded-xl overflow-hidden mb-4 bg-card-color">
                        <div className="bg-[rgba(120,180,140,0.1)] px-4 py-2 border-b border-[rgba(120,180,140,0.2)]">
                          <p className="text-sm text-text-medium">章节预览</p>
                        </div>
                        <div className="max-h-64 overflow-auto p-2">
                          {chapterPreview.map((chapter, index) => (
                            <div key={index} className="border-b border-[rgba(120,180,140,0.1)] last:border-b-0 py-2">
                              <p className="font-medium text-text-dark">{chapter.title}</p>
                              <p className="text-text-medium text-sm truncate">{chapter.content.substring(chapter.title.length, chapter.title.length + 100)}...</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <label htmlFor="title" className="block text-text-dark font-medium mb-2 font-ma-shan">作品标题</label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-[rgba(120,180,140,0.4)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7D85CC] focus:border-transparent bg-card-color text-text-dark"
                          placeholder="请输入作品标题"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="title" className="block text-text-dark font-medium mb-2 font-ma-shan">作品标题</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-[rgba(120,180,140,0.4)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7D85CC] focus:border-transparent bg-card-color text-text-dark"
                      placeholder="请输入作品标题"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-4 sticky bottom-0 pt-4 bg-card-color border-t border-[rgba(120,180,140,0.2)] mt-6">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-[#7D85CC] text-white hover:bg-[#6970B9] transition-colors duration-200 flex items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                          <span>{isEditMode ? '保存中...' : '创建中...'}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-icons mr-2 text-sm">save</span>
                          <span>{isEditMode ? '保存修改' : '创建作品'}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2 rounded-full border border-[#7D85CC] text-[#7D85CC] hover:bg-[rgba(125,133,204,0.1)] transition-colors duration-200"
                      onClick={handleCloseModal}
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}

              {fileUploadMode && showPreview && (
                <div className="flex justify-end space-x-4 sticky bottom-0 pt-4 bg-card-color border-t border-[rgba(120,180,140,0.2)] mt-6">
                  <button
                    type="button"
                    className="px-5 py-2 rounded-full bg-[#9C6FE0] text-white hover:bg-[#8D60D1] transition-colors duration-200 flex items-center"
                    onClick={handleSubmit}
                    disabled={isLoading || chapterPreview.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                        <span>导入中...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-icons mr-2 text-sm">file_download_done</span>
                        <span>导入作品</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="px-5 py-2 rounded-full border border-[#7D85CC] text-[#7D85CC] hover:bg-[rgba(125,133,204,0.1)] transition-colors duration-200"
                    onClick={handleCloseModal}
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-card-color rounded-2xl shadow-xl w-[420px] overflow-hidden border border-[rgba(224,111,81,0.4)]">
            <div className="sticky top-0 bg-[rgba(224,111,81,0.1)] p-6 border-b border-[rgba(224,111,81,0.3)] flex justify-between items-center rounded-t-2xl z-10">
              <h2 className="text-xl font-ma-shan text-[#E06F51]">确认删除作品</h2>
              <button
                className="p-2 hover:bg-[rgba(224,111,81,0.1)] rounded-full transition-colors duration-200 text-text-medium"
                onClick={cancelDelete}
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-[rgba(224,111,81,0.1)] flex items-center justify-center mr-4">
                  <span className="material-icons text-[#E06F51] text-2xl">warning</span>
                </div>
                <div>
                  <p className="text-text-dark font-medium mb-1">此操作不可恢复</p>
                  <p className="text-text-medium text-sm">确定要删除这个作品吗？所有相关的章节内容将永久丢失。</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-[rgba(224,111,81,0.2)]">
                <button
                  type="button"
                  className="px-5 py-2 rounded-full bg-[#E06F51] text-white hover:bg-[#D05E40] transition-colors duration-200 flex items-center"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                      <span>删除中...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-icons mr-2 text-sm">delete</span>
                      <span>确认删除</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="px-5 py-2 rounded-full border border-[#7D85CC] text-[#7D85CC] hover:bg-[rgba(125,133,204,0.1)] transition-colors duration-200"
                  onClick={cancelDelete}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}