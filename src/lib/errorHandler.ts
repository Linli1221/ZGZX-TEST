/**
 * 错误处理模块
 * 提供统一的错误处理机制
 */

// 错误类型
export enum ErrorType {
  DATABASE = 'database',
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

// 错误严重程度
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 错误接口
export interface AppError {
  type: ErrorType;
  message: string;
  severity: ErrorSeverity;
  originalError?: any;
  context?: Record<string, any>;
}

/**
 * 创建应用错误
 * @param type 错误类型
 * @param message 错误消息
 * @param severity 错误严重程度
 * @param originalError 原始错误
 * @param context 错误上下文
 * @returns 应用错误对象
 */
export const createError = (
  type: ErrorType,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  originalError?: any,
  context?: Record<string, any>
): AppError => {
  return {
    type,
    message,
    severity,
    originalError,
    context
  };
};

/**
 * 处理数据库错误
 * @param error 原始错误
 * @param operation 操作名称
 * @param context 错误上下文
 * @returns 应用错误对象
 */
export const handleDatabaseError = (
  error: any,
  operation: string,
  context?: Record<string, any>
): AppError => {
  console.error(`数据库操作失败 (${operation}):`, error);
  
  return createError(
    ErrorType.DATABASE,
    `数据库操作失败: ${operation}`,
    ErrorSeverity.ERROR,
    error,
    context
  );
};

/**
 * 处理API错误
 * @param error 原始错误
 * @param endpoint API端点
 * @param context 错误上下文
 * @returns 应用错误对象
 */
export const handleApiError = (
  error: any,
  endpoint: string,
  context?: Record<string, any>
): AppError => {
  console.error(`API请求失败 (${endpoint}):`, error);
  
  return createError(
    ErrorType.API,
    `API请求失败: ${endpoint}`,
    ErrorSeverity.ERROR,
    error,
    context
  );
};

/**
 * 处理网络错误
 * @param error 原始错误
 * @param url 请求URL
 * @param context 错误上下文
 * @returns 应用错误对象
 */
export const handleNetworkError = (
  error: any,
  url: string,
  context?: Record<string, any>
): AppError => {
  console.error(`网络请求失败 (${url}):`, error);
  
  return createError(
    ErrorType.NETWORK,
    `网络请求失败: ${url}`,
    ErrorSeverity.ERROR,
    error,
    context
  );
};

/**
 * 处理验证错误
 * @param message 错误消息
 * @param field 字段名称
 * @param context 错误上下文
 * @returns 应用错误对象
 */
export const handleValidationError = (
  message: string,
  field?: string,
  context?: Record<string, any>
): AppError => {
  const errorMessage = field ? `${field}: ${message}` : message;
  console.error(`验证失败: ${errorMessage}`);
  
  return createError(
    ErrorType.VALIDATION,
    `验证失败: ${errorMessage}`,
    ErrorSeverity.WARNING,
    null,
    context
  );
};

/**
 * 显示用户友好的错误消息
 * @param error 应用错误对象
 * @returns 用户友好的错误消息
 */
export const getUserFriendlyErrorMessage = (error: AppError): string => {
  switch (error.type) {
    case ErrorType.DATABASE:
      return '数据存储操作失败，请刷新页面后重试。';
    case ErrorType.API:
      return 'AI服务请求失败，请检查API密钥或稍后重试。';
    case ErrorType.NETWORK:
      return '网络连接失败，请检查您的网络连接后重试。';
    case ErrorType.VALIDATION:
      return error.message;
    default:
      return '发生未知错误，请刷新页面后重试。';
  }
};

/**
 * 显示错误通知
 * @param error 应用错误对象
 */
export const showErrorNotification = (error: AppError): void => {
  const message = getUserFriendlyErrorMessage(error);
  
  // 根据严重程度显示不同类型的通知
  switch (error.severity) {
    case ErrorSeverity.INFO:
      console.info(message);
      // 可以使用toast或其他通知组件
      if (typeof window !== 'undefined') {
        alert(message);
      }
      break;
    case ErrorSeverity.WARNING:
      console.warn(message);
      if (typeof window !== 'undefined') {
        alert(message);
      }
      break;
    case ErrorSeverity.ERROR:
    case ErrorSeverity.CRITICAL:
      console.error(message);
      if (typeof window !== 'undefined') {
        alert(message);
      }
      break;
  }
};

/**
 * 错误处理器
 * @param error 原始错误
 * @param operation 操作名称
 * @param errorType 错误类型
 * @param context 错误上下文
 * @returns 应用错误对象
 */
export const errorHandler = (
  error: any,
  operation: string,
  errorType: ErrorType = ErrorType.UNKNOWN,
  context?: Record<string, any>
): AppError => {
  let appError: AppError;
  
  switch (errorType) {
    case ErrorType.DATABASE:
      appError = handleDatabaseError(error, operation, context);
      break;
    case ErrorType.API:
      appError = handleApiError(error, operation, context);
      break;
    case ErrorType.NETWORK:
      appError = handleNetworkError(error, operation, context);
      break;
    case ErrorType.VALIDATION:
      appError = handleValidationError(operation, undefined, context);
      break;
    default:
      console.error(`未知错误 (${operation}):`, error);
      appError = createError(
        ErrorType.UNKNOWN,
        `未知错误: ${operation}`,
        ErrorSeverity.ERROR,
        error,
        context
      );
  }
  
  return appError;
};

/**
 * 捕获并处理错误
 * @param fn 要执行的函数
 * @param operation 操作名称
 * @param errorType 错误类型
 * @param context 错误上下文
 * @returns 函数执行结果或undefined
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  operation: string,
  errorType: ErrorType = ErrorType.UNKNOWN,
  context?: Record<string, any>
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    const appError = errorHandler(error, operation, errorType, context);
    showErrorNotification(appError);
    return undefined;
  }
}
