import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type NotificationType = "message" | "order" | "system" | "review" | "collection";

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 创建系统通知
 */
export async function createNotification({
  userId,
  type,
  title,
  content,
  link,
  metadata,
}: CreateNotificationOptions) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        link: link || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * 批量创建通知
 */
export async function createNotifications(
  notifications: CreateNotificationOptions[]
) {
  try {
    return await Promise.all(
      notifications.map((notif) => createNotification(notif))
    );
  } catch (error) {
    console.error("Error creating batch notifications:", error);
    throw error;
  }
}

/**
 * 获取用户的未读通知数量
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    return 0;
  }
}
