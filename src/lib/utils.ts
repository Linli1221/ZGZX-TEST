/**
 * 工具函数模块
 * 提供各种通用工具函数
 */

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;

  return function(...args: Parameters<T>): void {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * 格式化日期
 * @param date 日期对象或时间戳
 * @param format 格式字符串，默认为'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | number | string,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  const d = new Date(date);

  const replacements: Record<string, string> = {
    'YYYY': d.getFullYear().toString(),
    'MM': (d.getMonth() + 1).toString().padStart(2, '0'),
    'DD': d.getDate().toString().padStart(2, '0'),
    'HH': d.getHours().toString().padStart(2, '0'),
    'mm': d.getMinutes().toString().padStart(2, '0'),
    'ss': d.getSeconds().toString().padStart(2, '0')
  };

  let result = format;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(key, value);
  }

  return result;
}

/**
 * 生成唯一ID
 * @returns 唯一ID
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * 截断文本
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @param suffix 后缀，默认为'...'
 * @returns 截断后的文本
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + suffix;
}

/**
 * 深拷贝对象
 * @param obj 要拷贝的对象
 * @returns 拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }

  if (obj instanceof Object) {
    const copy: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        copy[key] = deepClone((obj as Record<string, any>)[key]);
      }
    }
    return copy as T;
  }

  throw new Error(`Unable to copy object: ${obj}`);
}

/**
 * 检查对象是否为空
 * @param obj 要检查的对象
 * @returns 是否为空
 */
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * 从对象中选择指定的属性
 * @param obj 源对象
 * @param keys 要选择的属性键
 * @returns 包含选定属性的新对象
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });

  return result;
}

/**
 * 从对象中排除指定的属性
 * @param obj 源对象
 * @param keys 要排除的属性键
 * @returns 不包含排除属性的新对象
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };

  keys.forEach(key => {
    delete result[key];
  });

  return result as Omit<T, K>;
}

/**
 * 检查是否在客户端环境
 * @returns 是否在客户端环境
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 检查是否在服务器环境
 * @returns 是否在服务器环境
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * 安全地解析JSON
 * @param json JSON字符串
 * @param fallback 解析失败时的返回值
 * @param logError 是否记录错误日志，默认为true
 * @returns 解析结果
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T, logError: boolean = true): T {
  if (!json) return fallback;

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    if (logError) {
      console.error('JSON解析失败:', error);
      console.debug('尝试解析的内容:', json.substring(0, 100) + (json.length > 100 ? '...' : ''));
    }
    return fallback;
  }
}

/**
 * 安全地将对象转换为JSON字符串
 * @param obj 要转换的对象
 * @param fallback 转换失败时的返回值
 * @param logError 是否记录错误日志，默认为true
 * @returns JSON字符串
 */
export function safeJsonStringify(obj: any, fallback: string = '{}', logError: boolean = true): string {
  if (obj === null || obj === undefined) return fallback;

  try {
    return JSON.stringify(obj);
  } catch (error) {
    if (logError) {
      console.error('JSON字符串化失败:', error);
      console.debug('尝试字符串化的对象类型:', typeof obj);
    }
    return fallback;
  }
}

/**
 * 处理作品内容的工具函数
 */
export const workContentUtils = {
  /**
   * 解析作品内容，处理章节数据
   * @param content 作品内容字符串
   * @returns 章节数组
   */
  parseContent: (content: string | null | undefined): Array<{title: string, content: string}> => {
    if (!content) return [{ title: '第一章', content: '' }];

    try {
      // 尝试解析JSON格式的章节数据
      const parsedChapters = JSON.parse(content);
      if (Array.isArray(parsedChapters) && parsedChapters.length > 0) {
        // 验证每个章节是否有title和content属性
        const validChapters = parsedChapters.map(chapter => ({
          title: chapter.title || '未命名章节',
          content: chapter.content || ''
        }));
        return validChapters;
      }
      // 如果解析成功但不是数组或数组为空，则使用原始内容作为第一章节
      return [{ title: '第一章', content }];
    } catch (error) {
      // 如果解析失败，将原始内容作为第一章节
      console.debug('解析作品内容失败，使用原始内容作为第一章节');
      return [{ title: '第一章', content: content || '' }];
    }
  },

  /**
   * 序列化章节数据为作品内容
   * @param chapters 章节数组
   * @returns 序列化后的字符串
   */
  stringifyChapters: (chapters: Array<{title: string, content: string}>): string => {
    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return JSON.stringify([{ title: '第一章', content: '' }]);
    }

    try {
      return JSON.stringify(chapters);
    } catch (error) {
      console.error('序列化章节数据失败:', error);
      return JSON.stringify([{ title: '第一章', content: '' }]);
    }
  }
}
