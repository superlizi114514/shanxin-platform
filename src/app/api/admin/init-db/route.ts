import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * 初始化数据库 API
 * 仅用于首次部署时创建基础数据
 */
export async function POST() {
  try {
    // 检查是否已经初始化
    const existingSchool = await prisma.school.findFirst({
      where: { code: "sdxx" },
    });

    if (existingSchool) {
      return NextResponse.json({
        success: true,
        message: "数据库已初始化",
      });
    }

    console.log("开始初始化数据库...");

    // 创建学校
    const school = await prisma.school.create({
      data: {
        name: "山东信息职业技术学院",
        code: "sdxx",
        address: "山东省潍坊市",
      },
    });

    console.log("✅ 学校创建成功:", school.name);

    // 创建管理员账号
    const hashedPassword = await bcrypt.hash("lzlz58205820", 12);

    const admin = await prisma.user.create({
      data: {
        email: "3471023785@qq.com",
        name: "管理员",
        password: hashedPassword,
        role: "admin",
        schoolId: school.id,
        emailVerified: new Date(),
      },
    });

    console.log("✅ 管理员账号创建成功:", admin.email);

    // 创建商家分类
    const categories = await prisma.merchantCategory.createMany({
      data: [
        { name: "餐饮美食", icon: "🍔" },
        { name: "购物消费", icon: "🛍️" },
        { name: "生活服务", icon: "🏪" },
        { name: "教育培训", icon: "📚" },
        { name: "娱乐休闲", icon: "🎮" },
      ],
    });

    console.log("✅ 商家分类创建成功");

    // 创建学期
    const now = new Date();
    const semester = await prisma.semester.create({
      data: {
        name: `${now.getFullYear()}-${now.getFullYear() + 1}学年第 2 学期`,
        startDate: new Date(now.getFullYear(), 1, 1), // 2 月 1 日
        endDate: new Date(now.getFullYear(), 6, 31), // 7 月 31 日
        totalWeeks: 20,
        isCurrent: true,
      },
    });

    console.log("✅ 学期创建成功:", semester.name);

    return NextResponse.json({
      success: true,
      message: "数据库初始化成功",
      data: {
        school: school.name,
        admin: admin.email,
        categories: categories.count,
        semester: semester.name,
      },
    });
  } catch (error) {
    console.error("数据库初始化失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "初始化失败",
      },
      { status: 500 }
    );
  }
}
