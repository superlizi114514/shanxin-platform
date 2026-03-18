import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取单个商品详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
            images: {
              select: { id: true, url: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // 增加浏览量
    await prisma.product.update({
      where: { id },
      data: { views: product.views + 1 },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // 检查商品是否存在且属于当前用户
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (existingProduct.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own products" },
        { status: 403 }
      );
    }

    // 获取当前商品的图片
    const currentImages = await prisma.productImage.findMany({
      where: { productId: id },
    });

    // 处理图片：删除已移除的图片，添加新图片
    const currentUrls = currentImages.map((img) => img.url);
    const newUrls = body.images || [];
    const removedImageIds = body.removedImageIds || [];

    // 构建更新数据的图片操作
    const imagesUpdate: any = {};

    // 删除被移除的图片
    if (removedImageIds.length > 0) {
      imagesUpdate.deleteMany = {
        where: {
          id: { in: removedImageIds },
        },
      };
    }

    // 添加新图片（不在当前列表中的）
    const urlsToDelete = newUrls.filter((url: string) => !currentUrls.includes(url));
    if (urlsToDelete.length > 0) {
      imagesUpdate.createMany = {
        data: urlsToDelete.map((url: string) => ({ url })),
      };
    }

    const updateData: any = {
      title: body.title,
      description: body.description,
      price: body.price ? parseFloat(body.price) : undefined,
      category: body.category,
      status: body.status,
      schoolId: body.schoolId,
    };

    // 如果有图片更新，添加图片操作
    if (removedImageIds.length > 0 || urlsToDelete.length > 0) {
      updateData.images = imagesUpdate;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        images: {
          select: { id: true, url: true },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 检查商品是否存在且属于当前用户
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (existingProduct.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own products" },
        { status: 403 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
