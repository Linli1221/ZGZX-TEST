'use client';

import React from 'react';

interface ErrorMessageProps {
  /**
   * 错误消息
   */
  message: string;
  
  /**
   * 错误类型
   */
  type?: 'error' | 'warning' | 'info';
  
  /**
   * 自定义类名
   */
  className?: string;
  
  /**
   * 是否可关闭
   */
  closable?: boolean;
  
  /**
   * 关闭回调
   */
  onClose?: () => void;
  
  /**
   * 重试回调
   */
  onRetry?: () => void;
}

/**
 * 错误消息组件
 * 显示错误、警告或信息提示
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'error',
  className = '',
  closable = true,
  onClose,
  onRetry
}) => {
  // 根据类型设置样式
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          containerClass: 'bg-red-50 border-red-200 text-red-700',
          iconName: 'error',
          iconClass: 'text-red-500'
        };
      case 'warning':
        return {
          containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-700',
          iconName: 'warning',
          iconClass: 'text-yellow-500'
        };
      case 'info':
        return {
          containerClass: 'bg-blue-50 border-blue-200 text-blue-700',
          iconName: 'info',
          iconClass: 'text-blue-500'
        };
      default:
        return {
          containerClass: 'bg-red-50 border-red-200 text-red-700',
          iconName: 'error',
          iconClass: 'text-red-500'
        };
    }
  };
  
  const { containerClass, iconName, iconClass } = getTypeStyles();
  
  return (
    <div className={`rounded-lg border p-4 flex items-start ${containerClass} ${className}`}>
      <span className={`material-icons mr-3 ${iconClass}`}>{iconName}</span>
      <div className="flex-1">
        <p className="text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm font-medium underline focus:outline-none"
          >
            重试
          </button>
        )}
      </div>
      {closable && onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <span className="material-icons text-sm">close</span>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
