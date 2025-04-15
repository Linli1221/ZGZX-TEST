import { openDB, IDBPDatabase, deleteDB } from 'idb';

// 数据库配置常量
export const DB_CONFIG = {
  // 数据库名称
  NAMES: {
    MAIN: 'zhixia_writing_app',
    SETTINGS: 'zhixia_settings',
    NAVIGATION: 'zhixia_navigation',
    CREATIVEMAP: 'zhixia_creativemap'
  },
  // 数据库版本
  VERSIONS: {
    MAIN: 7,
    SETTINGS: 7,
    NAVIGATION: 7,
    CREATIVEMAP: 1
  },
  // 存储对象名称
  STORES: {
    // 主数据库存储
    MAIN: {
      TODOS: 'todos',
      WORKS: 'works',
      PROMPTS: 'prompts'
    },
    // 设置数据库存储
    SETTINGS: {
      SETTINGS: 'settings'
    },
    // 导航数据库存储
    NAVIGATION: {
      STATE: 'state'
    },
    // 创意地图数据库存储
    CREATIVEMAP: {
      ITEMS: 'items'
    }
  },
  // 存储键
  KEYS: {
    API_KEY: 'zhixia_api_key',
    FIRST_VISIT: 'zhixia_first_visit'
  }
};

// 数据库连接缓存
interface DBCache {
  [key: string]: Promise<IDBPDatabase> | null;
}

const dbCache: DBCache = {
  [DB_CONFIG.NAMES.MAIN]: null,
  [DB_CONFIG.NAMES.SETTINGS]: null,
  [DB_CONFIG.NAMES.NAVIGATION]: null,
  [DB_CONFIG.NAMES.CREATIVEMAP]: null
};

/**
 * 获取数据库连接
 * @param dbName 数据库名称
 * @returns 数据库连接Promise
 */
export const getDatabase = (dbName: string): Promise<IDBPDatabase> => {
  // 服务端渲染检查
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB cannot be accessed on the server.'));
  }

  // 检查缓存中是否已有连接
  if (!dbCache[dbName]) {
    console.log(`Opening database ${dbName}`);
    
    // 根据数据库名称获取对应的版本和升级函数
    let version: number;
    let upgradeCallback: (db: IDBPDatabase, oldVersion: number, newVersion: number | null) => void;
    
    switch (dbName) {
      case DB_CONFIG.NAMES.MAIN:
        version = DB_CONFIG.VERSIONS.MAIN;
        upgradeCallback = upgradeMainDB;
        break;
      case DB_CONFIG.NAMES.SETTINGS:
        version = DB_CONFIG.VERSIONS.SETTINGS;
        upgradeCallback = upgradeSettingsDB;
        break;
      case DB_CONFIG.NAMES.NAVIGATION:
        version = DB_CONFIG.VERSIONS.NAVIGATION;
        upgradeCallback = upgradeNavigationDB;
        break;
      case DB_CONFIG.NAMES.CREATIVEMAP:
        version = DB_CONFIG.VERSIONS.CREATIVEMAP;
        upgradeCallback = upgradeCreativeMapDB;
        break;
      default:
        return Promise.reject(new Error(`Unknown database: ${dbName}`));
    }

    // 创建数据库连接
    dbCache[dbName] = openDB(dbName, version, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database ${dbName} from version ${oldVersion} to ${newVersion}`);
        upgradeCallback(db, oldVersion, newVersion);
      },
      blocked() {
        console.error(`Database ${dbName} is blocked. Please close other tabs using this database.`);
        alert(`数据库 "${dbName}" 被其他页面阻止打开。请关闭使用此数据库的其他标签页，然后刷新。`);
      },
      blocking() {
        console.warn(`Database ${dbName} is blocking an upgrade. Closing connection.`);
        // 关闭连接以允许其他标签页升级
        getDatabase(dbName).then(db => db.close());
        alert(`此页面正在阻止数据库更新。将尝试关闭连接，您可能需要刷新页面。`);
      },
      terminated() {
        console.warn(`Database ${dbName} connection terminated unexpectedly. Resetting instance.`);
        dbCache[dbName] = null; // 允许下次访问时重新初始化
      }
    });
  }

  return dbCache[dbName]!;
};

/**
 * 主数据库升级函数
 */
function upgradeMainDB(db: IDBPDatabase, oldVersion: number, newVersion: number | null) {
  const { TODOS, WORKS, PROMPTS } = DB_CONFIG.STORES.MAIN;
  
  // 删除旧存储
  if (db.objectStoreNames.contains(TODOS)) {
    db.deleteObjectStore(TODOS);
  }
  if (db.objectStoreNames.contains(WORKS)) {
    db.deleteObjectStore(WORKS);
  }
  if (db.objectStoreNames.contains(PROMPTS)) {
    db.deleteObjectStore(PROMPTS);
  }
  
  // 创建待办事项存储
  const todoStore = db.createObjectStore(TODOS, { keyPath: 'id' });
  todoStore.createIndex('createdAt', 'createdAt');
  
  // 创建作品存储
  const workStore = db.createObjectStore(WORKS, { keyPath: 'id' });
  workStore.createIndex('updatedAt', 'updatedAt');
  workStore.createIndex('type', 'type');
  
  // 创建提示词存储
  const promptStore = db.createObjectStore(PROMPTS, { keyPath: 'id' });
  promptStore.createIndex('updatedAt', 'updatedAt');
  promptStore.createIndex('type', 'type');
}

/**
 * 设置数据库升级函数
 */
function upgradeSettingsDB(db: IDBPDatabase, oldVersion: number, newVersion: number | null) {
  const { SETTINGS } = DB_CONFIG.STORES.SETTINGS;
  
  // 删除旧存储
  if (db.objectStoreNames.contains(SETTINGS)) {
    db.deleteObjectStore(SETTINGS);
  }
  
  // 创建设置存储
  db.createObjectStore(SETTINGS);
}

/**
 * 导航数据库升级函数
 */
function upgradeNavigationDB(db: IDBPDatabase, oldVersion: number, newVersion: number | null) {
  const { STATE } = DB_CONFIG.STORES.NAVIGATION;
  
  // 删除旧存储
  if (db.objectStoreNames.contains(STATE)) {
    db.deleteObjectStore(STATE);
  }
  
  // 创建状态存储
  db.createObjectStore(STATE);
}

/**
 * 创意地图数据库升级函数
 */
function upgradeCreativeMapDB(db: IDBPDatabase, oldVersion: number, newVersion: number | null) {
  const { ITEMS } = DB_CONFIG.STORES.CREATIVEMAP;
  
  // 删除旧存储
  if (db.objectStoreNames.contains(ITEMS)) {
    db.deleteObjectStore(ITEMS);
  }
  
  // 创建项目存储
  db.createObjectStore(ITEMS, { keyPath: 'id' });
}

/**
 * 重置所有数据库
 */
export const resetAllDatabases = async (): Promise<void> => {
  // 服务端渲染检查
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Cannot reset databases on the server.'));
  }
  
  try {
    // 关闭所有数据库连接
    for (const dbName of Object.values(DB_CONFIG.NAMES)) {
      if (dbCache[dbName]) {
        const db = await dbCache[dbName];
        if (db) {
          db.close();
          dbCache[dbName] = null;
        }
      }
    }
    
    // 删除所有数据库
    for (const dbName of Object.values(DB_CONFIG.NAMES)) {
      await deleteDB(dbName);
      console.log(`数据库 ${dbName} 已删除`);
    }
    
    console.log('所有数据库已重置，请刷新页面');
    return Promise.resolve();
  } catch (error) {
    console.error('重置数据库失败:', error);
    return Promise.reject(error);
  }
};

/**
 * 生成唯一ID
 */
export const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

/**
 * 通用数据库操作函数
 */
export const dbOperations = {
  /**
   * 获取所有数据
   */
  getAll: async <T>(dbName: string, storeName: string): Promise<T[]> => {
    try {
      const db = await getDatabase(dbName);
      return db.getAll(storeName);
    } catch (error) {
      console.error(`获取所有${storeName}数据失败:`, error);
      return [];
    }
  },
  
  /**
   * 根据ID获取数据
   */
  getById: async <T>(dbName: string, storeName: string, id: number | string): Promise<T | undefined> => {
    try {
      const db = await getDatabase(dbName);
      return db.get(storeName, id);
    } catch (error) {
      console.error(`获取ID为${id}的${storeName}数据失败:`, error);
      return undefined;
    }
  },
  
  /**
   * 添加数据
   */
  add: async <T extends { id?: number | string }>(
    dbName: string, 
    storeName: string, 
    item: Omit<T, 'id'>, 
    generateIdFn = generateId
  ): Promise<T> => {
    try {
      const db = await getDatabase(dbName);
      const id = generateIdFn();
      const newItem = { ...item, id } as T;
      
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.add(newItem);
      await tx.done;
      
      return newItem;
    } catch (error) {
      console.error(`添加${storeName}数据失败:`, error);
      throw error;
    }
  },
  
  /**
   * 更新数据
   */
  update: async <T extends { id: number | string }>(dbName: string, storeName: string, item: T): Promise<T> => {
    try {
      const db = await getDatabase(dbName);
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.put(item);
      await tx.done;
      
      return item;
    } catch (error) {
      console.error(`更新${storeName}数据失败:`, error);
      throw error;
    }
  },
  
  /**
   * 删除数据
   */
  remove: async (dbName: string, storeName: string, id: number | string): Promise<void> => {
    try {
      const db = await getDatabase(dbName);
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.delete(id);
      await tx.done;
    } catch (error) {
      console.error(`删除ID为${id}的${storeName}数据失败:`, error);
      throw error;
    }
  },
  
  /**
   * 清空存储
   */
  clear: async (dbName: string, storeName: string): Promise<void> => {
    try {
      const db = await getDatabase(dbName);
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await store.clear();
      await tx.done;
    } catch (error) {
      console.error(`清空${storeName}数据失败:`, error);
      throw error;
    }
  },
  
  /**
   * 获取设置值
   */
  getSetting: async <T>(key: string): Promise<T | null> => {
    try {
      const db = await getDatabase(DB_CONFIG.NAMES.SETTINGS);
      const value = await db.get(DB_CONFIG.STORES.SETTINGS.SETTINGS, key);
      return value as T || null;
    } catch (error) {
      console.error(`获取设置${key}失败:`, error);
      return null;
    }
  },
  
  /**
   * 保存设置值
   */
  saveSetting: async <T>(key: string, value: T): Promise<void> => {
    try {
      const db = await getDatabase(DB_CONFIG.NAMES.SETTINGS);
      await db.put(DB_CONFIG.STORES.SETTINGS.SETTINGS, value, key);
    } catch (error) {
      console.error(`保存设置${key}失败:`, error);
      throw error;
    }
  }
};
