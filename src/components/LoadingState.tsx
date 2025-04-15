'use client';

import React from 'react';

interface LoadingStateProps {
  /**
   * 加载状态文本
   */
  text?: string;
  
  /**
   * 加载状态类型
   */
  type?: 'spinner' | 'dots' | 'skeleton';
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 是否全屏显示
   */
  fullScreen?: boolean;
  
  /**
   * 加载状态颜色
   */
  color?: string;
}

/**
 * 加载状态组件
 * 提供多种加载状态样式
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  text = '加载中...',
  type = 'spinner',
  className = '',
  fullScreen = false,
  color = 'var(--primary-green, #5A9D6B)'
}) => {
  // 全屏样式
  const fullScreenClass = fullScreen
    ? 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    : 'flex items-center justify-center';
  
  // 基础样式
  const baseClass = `${fullScreenClass} ${className}`;
  
  // 根据类型渲染不同的加载状态
  const renderLoadingIndicator = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2" style={{ borderColor: color }}></div>
            {text && <p className="mt-3 text-sm" style={{ color }}>{text}</p>}
          </div>
        );
      
      case 'dots':
        return (
          <div className="flex flex-col items-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '300ms' }}></div>
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '600ms' }}></div>
            </div>
            {text && <p className="mt-3 text-sm" style={{ color }}>{text}</p>}
          </div>
        );
      
      case 'skeleton':
        return (
          <div className="w-full max-w-md">
            <div className="animate-pulse flex flex-col space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            {text && <p className="mt-3 text-sm text-center" style={{ color }}>{text}</p>}
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2" style={{ borderColor: color }}></div>
            {text && <p className="mt-3 text-sm" style={{ color }}>{text}</p>}
          </div>
        );
    }
  };
  
  return (
    <div className={baseClass}>
      <div className={fullScreen ? 'bg-white p-6 rounded-lg shadow-lg' : ''}>
        {renderLoadingIndicator()}
      </div>
    </div>
  );
};

export default LoadingState;
