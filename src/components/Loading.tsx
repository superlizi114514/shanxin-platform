'use client';

import { cn } from '@/lib/utils';

interface LoadingProps {
  /**
   * 尺寸：sm (20px), md (32px), lg (48px)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 是否全屏显示
   */
  fullscreen?: boolean;
  /**
   * 显示的文字提示
   */
  text?: string;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * Loading 加载组件
 *
 * 使用场景:
 * - 页面加载
 * - 数据获取中
 * - 表单提交中
 * - 骨架屏加载
 *
 * @example
 * // 基础用法
 * <Loading />
 *
 * @example
 * // 带文字提示
 * <Loading text="加载中..." />
 *
 * @example
 * // 全屏模式
 * <Loading fullscreen />
 *
 * @example
 * // 小尺寸
 * <Loading size="sm" />
 */
export function Loading({
  size = 'md',
  fullscreen = false,
  text,
  className,
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-4 border-gray-200 border-t-blue-600',
        sizeClasses[size]
      )}
      role="status"
      aria-label="加载中"
    >
      <span className="sr-only">加载中</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm',
          className
        )}
      >
        {spinner}
        {text && (
          <p className="mt-4 text-sm text-gray-600 animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        text ? 'flex-col' : '',
        className
      )}
    >
      {spinner}
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
}

/**
 * 骨架屏加载组件
 *
 * @example
 * <SkeletonLoader type="card" count={3} />
 */
interface SkeletonLoaderProps {
  type?: 'card' | 'list' | 'text' | 'image' | 'avatar';
  count?: number;
  className?: string;
}

export function SkeletonLoader({
  type = 'list',
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className={cn('animate-pulse', className)}>
      {type === 'card' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-8 bg-gray-200 rounded w-8" />
            </div>
          </div>
        </div>
      )}

      {type === 'list' && (
        <div className="flex items-center space-x-4 p-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      )}

      {type === 'text' && (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
        </div>
      )}

      {type === 'image' && (
        <div className="w-full h-64 bg-gray-200 rounded-lg" />
      )}

      {type === 'avatar' && (
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
      )}
    </div>
  ));

  return <>{skeletons}</>;
}

/**
 * 页面加载组件（全屏 Loading）
 */
export function PageLoading({ text = '加载中...' }: { text?: string }) {
  return <Loading fullscreen size="lg" text={text} />;
}

/**
 * 按钮内小 Loading
 */
export function ButtonLoading({ className }: { className?: string }) {
  return (
    <Loading
      size="sm"
      className={cn('inline-flex', className)}
    />
  );
}
