import { dbOperations, DB_CONFIG } from './dbManager';

/**
 * 设置管理模块
 * 统一管理应用的各种设置，包括API密钥等
 */

// API密钥相关
const API_KEY = DB_CONFIG.KEYS.API_KEY;

/**
 * 获取API密钥
 * @returns API密钥或null
 */
export const getApiKey = async (): Promise<string | null> => {
  return dbOperations.getSetting<string>(API_KEY);
};

/**
 * 保存API密钥
 * @param apiKey API密钥
 */
export const saveApiKey = async (apiKey: string): Promise<void> => {
  return dbOperations.saveSetting(API_KEY, apiKey);
};

/**
 * 删除API密钥
 */
export const removeApiKey = async (): Promise<void> => {
  return dbOperations.saveSetting(API_KEY, null);
};

// 首次访问相关
const FIRST_VISIT = DB_CONFIG.KEYS.FIRST_VISIT;

/**
 * 检查是否是首次访问
 * @returns 是否是首次访问
 */
export const isFirstVisit = async (): Promise<boolean> => {
  const visited = await dbOperations.getSetting<string>(FIRST_VISIT);
  return !visited;
};

/**
 * 标记已访问
 */
export const markVisited = async (): Promise<void> => {
  return dbOperations.saveSetting(FIRST_VISIT, 'visited');
};

/**
 * 通用设置管理
 */
export const settings = {
  /**
   * 获取设置值
   * @param key 设置键
   * @param defaultValue 默认值
   * @returns 设置值
   */
  get: async <T>(key: string, defaultValue: T): Promise<T> => {
    const value = await dbOperations.getSetting<T>(key);
    return value !== null ? value : defaultValue;
  },

  /**
   * 保存设置值
   * @param key 设置键
   * @param value 设置值
   */
  set: async <T>(key: string, value: T): Promise<void> => {
    return dbOperations.saveSetting(key, value);
  },

  /**
   * 删除设置
   * @param key 设置键
   */
  remove: async (key: string): Promise<void> => {
    return dbOperations.saveSetting(key, null);
  }
};
