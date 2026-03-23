import { auth } from '../lib/auth';
import { redirect } from 'next/navigation';

/**
 * 验证管理员权限
 * 在非页面组件中使用时，需要配合 await 使用
 * @returns Promise<Session> 返回管理员会话
 * @throws 重定向到登录页或首页
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return session;
}

/**
 * 检查是否为管理员（不重定向，只返回布尔值）
 * 适用于客户端组件或不需要重定向的场景
 * @returns Promise<boolean>
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === 'admin';
}
