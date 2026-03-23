import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { productQuerySchema, createProductSchema } from "@/lib/validators/product";
import { z } from "zod";

const prisma = new PrismaClient();

// GET - 获取商品列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 验证查询参数
    const queryParams = productQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      category: searchParams.get("category"),
      search: searchParams.get("search"),
      status: searchParams.get("status"),
      schoolId: searchParams.get("schoolId"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
    });

    const { page, limit, category, search, status, schoolId, minPrice, maxPrice } = queryParams;
    const skip = (page - 1) * limit;

    const where: {
      category?: string;
      status?: string;
      schoolId?: string;
      price?: { gte?: number; lte?: number };
      OR?: Array<{ title: { contains: string } } | { description: { contains: string } }>;
    } = {};

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (schoolId) {
      where.schoolId = schoolId;
    }

    // 价格范围筛选
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // 只获取可用的商品
    if (!status) {
      where.status = "available";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          images: {
            select: { id: true, url: true },
          },
          seller: {
            select: { id: true, name: true, logo: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = (error as z.ZodError).issues.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: messages || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 创建商品
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
    const validatedData = createProductSchema.parse(body);
    const { title, description, price, category, images, schoolId } = validatedData;

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: typeof price === 'string' ? parseFloat(price) : price,
        category,
        sellerId: session.user.id,
        schoolId: schoolId || null,
        images: images
          ? {
              create: images.map((url: string) => ({ url })),
            }
          : undefined,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        images: {
          select: { id: true, url: true },
        },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = (error as z.ZodError).issues.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: messages || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
