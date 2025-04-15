'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isFirstVisit as checkFirstVisit, markVisited } from '@/lib/settingsManager';

// 定义上下文类型
interface NavigationContextType {
  isFirstVisit: boolean;
  setIsFirstVisit: (value: boolean) => void;
}

// 创建上下文
const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// 提供上下文的组件
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 检查是否是首次访问
    const checkVisitStatus = async () => {
      try {
        // 确保只在浏览器环境中执行
        if (typeof window === 'undefined') {
          setIsFirstVisit(false);
          return;
        }

        // 使用settingsManager检查是否是首次访问
        const firstVisit = await checkFirstVisit();

        if (firstVisit) {
          // 首次访问，设置标记并导航到首页
          await markVisited();
          setIsFirstVisit(true);

          // 如果当前不在首页，则导航到首页
          if (pathname !== '/') {
            router.push('/');
          }
        } else {
          // 非首次访问，保持当前页面
          setIsFirstVisit(false);
        }
      } catch (error) {
        console.error('检查首次访问状态失败:', error);
        // 出错时默认为非首次访问
        setIsFirstVisit(false);
      }
    };

    checkVisitStatus();
  }, [pathname, router]);

  return (
    <NavigationContext.Provider value={{ isFirstVisit, setIsFirstVisit }}>
      {children}
    </NavigationContext.Provider>
  );
}

// 使用上下文的钩子
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}