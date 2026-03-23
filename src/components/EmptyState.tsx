'use client';

import { cn } from '@/lib/utils';
import {
  InboxIcon,
  FileSearchIcon,
  ShoppingCartIcon,
  MailIcon,
  CalendarIcon,
  HeartIcon,
  BanIcon,
} from 'lucide-react';

interface EmptyStateProps {
  /**
   * 预设类型
   * - default: 通用空状态
   * - inbox: 消息为空
   * - search: 搜索无结果
   * - cart: 购物车为空
   * - favorites: 收藏为空
   * - calendar: 日程为空
   * - data: 数据为空
   */
  type?:
    | 'default'
    | 'inbox'
    | 'search'
    | 'cart'
    | 'favorites'
    | 'calendar'
    | 'data';
  /**
   * 自定义图标
   */
  icon?: React.ReactNode;
  /**
   * 标题
   */
  title?: string;
  /**
   * 描述文字
   */
  description?: string;
  /**
   * 操作按钮
   */
  action?: React.ReactNode;
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * 空状态组件
 *
 * 使用场景:
 * - 列表无数据
 * - 搜索无结果
 * - 购物车为空
 * - 消息列表为空
 * - 收藏列表为空
 *
 * @example
 * // 基础用法
 * <EmptyState />
 *
 * @example
 * // 消息为空
 * <EmptyState type="inbox" />
 *
 * @example
 * // 自定义内容
 * <EmptyState
 *   title="暂无数据"
 *   description="先添加一些数据吧"
 *   action={<Button>添加数据</Button>}
 * />
 */
export function EmptyState({
  type = 'default',
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  // 预设类型的默认内容
  const presets: Record<
    NonNullable<EmptyStateProps['type']>,
    { icon: React.ReactNode; title: string; description: string }
  > = {
    default: {
      icon: <InboxIcon className="w-16 h-16" />,
      title: '暂无数据',
      description: '这里还没有任何内容',
    },
    inbox: {
      icon: <MailIcon className="w-16 h-16" />,
      title: '暂无消息',
      description: '有新的消息时会在这里显示',
    },
    search: {
      icon: <FileSearchIcon className="w-16 h-16" />,
      title: '未找到结果',
      description: '尝试更换搜索关键词或减少筛选条件',
    },
    cart: {
      icon: <ShoppingCartIcon className="w-16 h-16" />,
      title: '购物车为空',
      description: '去逛逛，添加喜欢的商品吧',
    },
    favorites: {
      icon: <HeartIcon className="w-16 h-16" />,
      title: '暂无收藏',
      description: '收藏的商品会在这里显示',
    },
    calendar: {
      icon: <CalendarIcon className="w-16 h-16" />,
      title: '暂无日程',
      description: '添加课程或提醒后会在这里显示',
    },
    data: {
      icon: <BanIcon className="w-16 h-16" />,
      title: '无数据',
      description: '暂无可用数据',
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
      <div
        className={cn(
          'text-gray-300 mb-4',
          icon ? '' : 'grayscale'
        )}
      >
        {icon || preset.icon}
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title || preset.title}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        {description || preset.description}
      </p>

      {/* 操作按钮 */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * 列表空状态（简化版）
 */
export function EmptyList({
  message = '暂无数据',
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 text-gray-500',
        className
      )}
    >
      <InboxIcon className="w-12 h-12 mb-2 text-gray-300" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/**
 * 搜索空状态
 */
export function EmptySearch({
  keyword,
  className,
}: {
  keyword?: string;
  className?: string;
}) {
  return (
    <EmptyState
      type="search"
      title="未找到结果"
      description={
        keyword
          ? `没有找到与"${keyword}"相关的内容`
          : '尝试更换搜索关键词或减少筛选条件'
      }
      className={className}
    />
  );
}
