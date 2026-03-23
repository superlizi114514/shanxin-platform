'use client';

import { cn } from '@/lib/utils';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  XIcon,
  WifiOffIcon,
  ServerIcon,
  RefreshCwIcon,
} from 'lucide-react';

interface ErrorStateProps {
  /**
   * 错误类型
   * - default: 通用错误
   * - network: 网络错误
   * - server: 服务器错误
   * - permission: 权限错误
   * - notFound: 资源不存在
   */
  type?: 'default' | 'network' | 'server' | 'permission' | 'notFound';
  /**
   * 错误标题
   */
  title?: string;
  /**
   * 错误描述
   */
  description?: string;
  /**
   * 重试操作
   */
  onRetry?: () => void;
  /**
   * 自定义操作按钮
   */
  action?: React.ReactNode;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 错误状态组件
 *
 * 使用场景:
 * - 网络错误
 * - 服务器错误
 * - 加载失败
 * - 权限不足
 * - 资源不存在
 *
 * @example
 * // 基础用法
 * <ErrorState />
 *
 * @example
 * // 网络错误
 * <ErrorState type="network" onRetry={() => window.location.reload()} />
 *
 * @example
 * // 自定义内容
 * <ErrorState
 *   title="加载失败"
 *   description="请稍后再试"
 *   onRetry={handleRetry}
 * />
 */
export function ErrorState({
  type = 'default',
  title,
  description,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  // 预设类型的默认内容
  const presets: Record<
    NonNullable<ErrorStateProps['type']>,
    {
      icon: React.ReactNode;
      title: string;
      description: string;
      actionLabel?: string;
    }
  > = {
    default: {
      icon: <AlertCircleIcon className="w-16 h-16" />,
      title: '出错了',
      description: '发生了一些错误，请稍后再试',
      actionLabel: '重试',
    },
    network: {
      icon: <WifiOffIcon className="w-16 h-16" />,
      title: '网络连接失败',
      description: '请检查网络连接后重试',
      actionLabel: '重新连接',
    },
    server: {
      icon: <ServerIcon className="w-16 h-16" />,
      title: '服务器错误',
      description: '服务器开小差了，请稍后再试',
      actionLabel: '重试',
    },
    permission: {
      icon: <AlertTriangleIcon className="w-16 h-16" />,
      title: '权限不足',
      description: '您没有访问此内容的权限',
      actionLabel: '申请权限',
    },
    notFound: {
      icon: <InfoIcon className="w-16 h-16" />,
      title: '资源不存在',
      description: '您要访问的内容不存在或已被删除',
      actionLabel: '返回首页',
    },
  };

  const preset = presets[type];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {/* 图标 */}
      <div className="text-red-300 mb-4">{preset.icon}</div>

      {/* 标题 */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title || preset.title}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {description || preset.description}
      </p>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            {preset.actionLabel || '重试'}
          </button>
        )}
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

/**
 * _inline_ 错误提示（小尺寸）
 */
export function InlineError({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg',
        className
      )}
    >
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircleIcon className="w-5 h-5" />
        <p className="text-sm">{message || '加载失败'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          重试
        </button>
      )}
    </div>
  );
}

/**
 * 网络错误提示
 */
export function NetworkError({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      type="network"
      onRetry={onRetry}
      className={className}
    />
  );
}

/**
 * 服务器错误提示
 */
export function ServerError({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      type="server"
      onRetry={onRetry}
      className={className}
    />
  );
}
