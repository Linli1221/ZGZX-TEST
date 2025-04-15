'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';

interface TopBarProps {
  /**
   * 页面标题
   */
  title: string;

  /**
   * 是否显示返回按钮
   */
  showBackButton?: boolean;

  /**
   * 返回按钮点击回调
   */
  onBackButtonClick?: () => void;

  /**
   * 右侧操作按钮
   */
  actions?: React.ReactNode;

  /**
   * 是否使用首页样式（更大的标题和描述）
   */
  isHomePage?: boolean;
}

/**
 * 通用顶边栏组件
 * 提供统一的页面顶部导航栏
 */
const TopBar: React.FC<TopBarProps> = ({
  title,
  showBackButton = false,
  onBackButtonClick,
  actions,
  isHomePage = false
}) => {
  const router = useRouter();

  return (
    <div className="rounded-bl-2xl relative bg-transparent flex-shrink-0">
      <div className={`${isHomePage ? 'py-6' : 'py-4 md:py-6'} px-4 md:px-8 relative z-10`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              {showBackButton && (
                onBackButtonClick ? (
                  <button
                    onClick={onBackButtonClick}
                    className="mr-3 bg-card-color hover:bg-gray-100 text-gray-700 p-2 rounded-full shadow-sm transition-all duration-200 flex items-center justify-center hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-opacity-50"
                    aria-label="返回"
                  >
                    <span className="material-icons text-lg">arrow_back</span>
                  </button>
                ) : (
                  <BackButton />
                )
              )}
              <h1
                className={`${isHomePage ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl lg:text-3xl'} mb-2 text-text-dark font-ma-shan`}
              >
                {title}
              </h1>
              {/* 可以在这里添加标签，如Beta标签等 */}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
