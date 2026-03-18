import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const otherUserId = searchParams.get("userId"); // 获取与特定用户的对话

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
      const conversations: any[] = await prisma.$queryRaw`
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
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: "Receiver ID and content are required" },
        { status: 400 }
      );
    }

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

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
