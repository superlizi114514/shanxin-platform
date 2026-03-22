import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/../prisma";

/**
 * 获取当前用户的课程提醒
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id as string;
    if (!userId) {
      return NextResponse.json({ error: "用户 ID 不存在" }, { status: 401 });
    }

    // 获取当前日期和时间信息
    const now = new Date();
    const currentDay = now.getDay(); // 0 = 周日，1 = 周一，... 6 = 周六
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutesTotal = currentHour * 60 + currentMinute;

    // 转换为我们的格式 (1 = 周一，7 = 周日)
    const adjustedCurrentDay = currentDay === 0 ? 7 : currentDay;

    // 获取所有启用了提醒的课程
    const courses = await prisma.course.findMany({
      where: {
        userId,
        reminderEnabled: true,
      },
      include: {
        location: true,
      },
    });

    // 过滤出今天和明天需要提醒的课程
    const upcomingReminders: Array<{
      course: typeof courses[0];
      dayType: "today" | "tomorrow";
      minutesUntilStart: number;
    }> = [];

    for (const course of courses) {
      // 解析课程开始时间
      const [hour, minute] = course.startTime.split(":").map(Number);
      const courseMinutesTotal = hour * 60 + minute;

      // 检查是否是今天的课程
      if (course.dayOfWeek === adjustedCurrentDay) {
        const minutesUntilStart = courseMinutesTotal - currentMinutesTotal;
        // 如果课程还没开始，且时间在提醒范围内
        if (minutesUntilStart > 0 && course.reminderMinutes) {
          if (minutesUntilStart <= course.reminderMinutes) {
            upcomingReminders.push({
              course,
              dayType: "today",
              minutesUntilStart,
            });
          }
        }
      }

      // 检查是否是明天的课程
      const tomorrowDay = adjustedCurrentDay === 7 ? 1 : adjustedCurrentDay + 1;
      if (course.dayOfWeek === tomorrowDay && course.reminderMinutes) {
        // 明天的课程，计算剩余时间
        const minutesUntilTomorrow = (24 * 60 - currentMinutesTotal) + courseMinutesTotal;
        if (minutesUntilTomorrow <= course.reminderMinutes && minutesUntilTomorrow > 0) {
          upcomingReminders.push({
            course,
            dayType: "tomorrow",
            minutesUntilStart: minutesUntilTomorrow,
          });
        }
      }
    }

    // 按提醒时间排序
    upcomingReminders.sort((a, b) => a.minutesUntilStart - b.minutesUntilStart);

    // 格式化提醒信息
    const formattedReminders = upcomingReminders.map(({ course, dayType, minutesUntilStart }) => {
      let timeUntilStart = "";
      if (minutesUntilStart < 60) {
        timeUntilStart = `${minutesUntilStart} 分钟后`;
      } else {
        const hours = Math.floor(minutesUntilStart / 60);
        const mins = minutesUntilStart % 60;
        timeUntilStart = mins > 0 ? `${hours}小时${mins}分钟后` : `${hours}小时后`;
      }

      return {
        id: course.id,
        courseName: course.courseName,
        classroom: course.classroom,
        startTime: course.startTime,
        teacher: course.teacher,
        dayType,
        dayName: dayType === "today" ? "今天" : "明天",
        timeUntilStart,
        reminderMinutes: course.reminderMinutes,
        location: course.location ? {
          building: course.location.building,
          floor: course.location.floor,
          roomNumber: course.location.roomNumber,
          roomName: course.location.roomName,
        } : null,
      };
    });

    return NextResponse.json({
      success: true,
      reminders: formattedReminders,
    });
  } catch (error) {
    console.error("获取课程提醒失败:", error);
    return NextResponse.json(
      { error: "获取课程提醒失败" },
      { status: 500 }
    );
  }
}
