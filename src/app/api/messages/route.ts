import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { messageQuerySchema, sendMessageSchema } from "@/lib/validators/message";
import { z } from "zod";

const prisma = new PrismaClient();

// GET - 获取用户的消息列表（对话列表）
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // 验证查询参数
    const queryParams = messageQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      userId: searchParams.get("userId"),
    });

    const { page, limit, userId: otherUserId } = queryParams;
    const skip = (page - 1) * limit;
    if (otherUserId) {
      // 获取与特定用户的所有消息
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: session.user.id },
          ],
        },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          receiver: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // 标记为已读
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        messages,
        pagination: {
          page,
          limit,
          total: messages.length,
          totalPages: Math.ceil(messages.length / limit),
        },
      });
    } else {
      // 获取对话列表（按用户分组）
      const conversations: Array<{
        otherUserId: string;
        otherUserName: string | null;
        otherUserAvatar: string | null;
        otherUserEmail: string | null;
        unreadCount: number;
        lastMessageAt: Date | null;
      }> = await prisma.$queryRaw`
        SELECT DISTINCT
          CASE
            WHEN m.senderId = ${session.user.id} THEN m.receiverId
            ELSE m.senderId
          END as otherUserId,
          (SELECT u.name FROM User u WHERE u.id = otherUserId) as otherUserName,
          (SELECT u.avatar FROM User u WHERE u.id = otherUserId) as otherUserAvatar,
          (SELECT u.email FROM User u WHERE u.id = otherUserId) as otherUserEmail,
          (SELECT COUNT(*) FROM Message WHERE senderId = otherUserId AND receiverId = ${session.user.id} AND isRead = false) as unreadCount,
          (SELECT MAX(createdAt) FROM Message WHERE (senderId = ${session.user.id} OR receiverId = ${session.user.id}) AND (senderId = otherUserId OR receiverId = otherUserId)) as lastMessageAt
        FROM Message m
        WHERE senderId = ${session.user.id} OR receiverId = ${session.user.id}
        ORDER BY lastMessageAt DESC
        LIMIT ${limit} OFFSET ${skip}
      `;

      // 获取未读消息总数
      const totalUnread = await prisma.message.count({
        where: {
          receiverId: session.user.id,
          isRead: false,
        },
      });

      return NextResponse.json({
        conversations,
        pagination: {
          page,
          limit,
          total: conversations.length,
          totalPages: Math.ceil(conversations.length / limit),
          totalUnread,
        },
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = (error as z.ZodError).issues.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: messages || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 发送消息
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 验证请求体
    const validatedData = sendMessageSchema.parse(body);
    const { receiverId, content } = validatedData;

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400 }
      );
    }

    // 验证接收者是否存在
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 404 }
      );
    }

    // 创建消息
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // 为接收者创建通知
    await createNotification({
      userId: receiverId,
      type: "message",
      title: `收到来自 ${session.user.name || "用户"} 的消息`,
      content: content.length > 50 ? content.substring(0, 50) + "..." : content,
      link: `/messages`,
      metadata: {
        senderId: session.user.id,
        senderName: session.user.name,
        messageId: message.id,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = (error as z.ZodError).issues.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: messages || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
