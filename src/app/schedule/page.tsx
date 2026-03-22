"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Course {
  id: string;
  courseName: string;
  teacher: string | null;
  classroom: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  period: string | null;
  weekStart: number;
  weekEnd: number;
  weekPattern: string | null;
  weekList?: number[]; // 周次列表
  notes: string | null;
  color: string | null;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
  location?: {
    building: string;
    floor: number;
    roomNumber: string;
    roomName?: string;
    coordinates: string | null;
  };
}

const dayNames = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
// 冬春季作息时间（10 月 - 次年 6 月）
const winterSpringSlots = [
  { start: "08:00", end: "08:45", label: "1" },
  { start: "08:55", end: "09:40", label: "2" },
  { start: "10:00", end: "10:45", label: "3" },
  { start: "10:50", end: "11:35", label: "4" },
  { start: "14:00", end: "14:45", label: "5" },
  { start: "14:55", end: "15:40", label: "6" },
  { start: "15:50", end: "16:35", label: "7" },
  { start: "16:45", end: "17:30", label: "8" },
  { start: "19:00", end: "19:45", label: "9" },
  { start: "19:55", end: "20:40", label: "10" },
];

// 夏秋季作息时间（7 月 -9 月）
const summerFallSlots = [
  { start: "08:00", end: "08:45", label: "1" },
  { start: "08:55", end: "09:40", label: "2" },
  { start: "10:10", end: "10:55", label: "3" },
  { start: "11:05", end: "11:50", label: "4" },
  { start: "14:30", end: "15:15", label: "5" },
  { start: "15:25", end: "16:10", label: "6" },
  { start: "16:20", end: "17:05", label: "7" },
  { start: "17:15", end: "18:00", label: "8" },
  { start: "19:00", end: "19:45", label: "9" },
  { start: "19:55", end: "20:40", label: "10" },
];

// 根据当前月份判断使用冬春季还是夏秋季时间表（10 月 - 次年 6 月=冬春季，7-9 月=夏秋季）
const getCurrentSeason = (): "winter-spring" | "summer-fall" => {
  const month = new Date().getMonth() + 1; // 1-12
  return (month >= 10 || month <= 6) ? "winter-spring" : "summer-fall";
};

const courseColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
];

const currentSeason = getCurrentSeason();
const timeSlots = currentSeason === "winter-spring" ? winterSpringSlots : summerFallSlots;

export default function SchedulePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number>(10);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);

  // 周次相关状态
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [totalWeeks, setTotalWeeks] = useState<number>(20);
  const [semesterName, setSemesterName] = useState<string>("");
  const [todayDate, setTodayDate] = useState<string>("");
  const [todayCourses, setTodayCourses] = useState<Course[]>([]);
  const [semesterStartDate, setSemesterStartDate] = useState<string>("");

  useEffect(() => {
    if (session?.user) {
      setIsAdmin(session.user.role === "admin");
    }
    fetchCourses();
    fetchSemesterInfo();
  }, [session]);

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      const data = await response.json();

      if (response.ok) {
        setCourses(data.courses);
      }
    } catch (error) {
      console.error("获取课表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesterInfo = async () => {
    try {
      const [semesterRes, coursesRes] = await Promise.all([
        fetch("/api/semesters/current-week"),
        fetch("/api/courses")
      ]);

      const semesterData = await semesterRes.json();
      const coursesData = await coursesRes.json();

      if (semesterRes.ok) {
        setCurrentWeek(semesterData.current.week);
        setTotalWeeks(semesterData.semester.totalWeeks);
        setSemesterName(semesterData.semester.name);
        setSemesterStartDate(semesterData.semester.startDate);

        // 使用客户端本地日期计算今天
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        setTodayDate(todayStr);
        const dayOfWeek = today.getDay() || 7; // 转换为 1-7（周日为 7）

        if (coursesData.courses && Array.isArray(coursesData.courses)) {
          const filtered = coursesData.courses.filter((c: Course) => {
            if (c.dayOfWeek !== dayOfWeek) return false;
            // 使用 weekList 过滤
            if (c.weekList && c.weekList.length > 0) {
              return c.weekList.includes(semesterData.current.week);
            }
            return semesterData.current.week >= c.weekStart && semesterData.current.week <= c.weekEnd;
          });
          setTodayCourses(filtered);
        }
      }
    } catch (error) {
      console.error("获取学期信息失败:", error);
      // 默认值
      setCurrentWeek(1);
      setTotalWeeks(20);
      const today = new Date().toISOString().split("T")[0];
      setTodayDate(today);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("确定要删除这门课程吗？")) return;

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCourses(courses.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("删除课程失败:", error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("确定要清空所有课程吗？此操作不可恢复！")) return;

    try {
      const response = await fetch("/api/courses", {
        method: "DELETE",
      });

      if (response.ok) {
        setCourses([]);
      }
    } catch (error) {
      console.error("清空课表失败:", error);
    }
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    if (course.location || course.classroom) {
      setShowLocationModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowLocationModal(false);
    setShowReminderModal(false);
    setSelectedCourse(null);
  };

  const handleOpenReminderModal = (course: Course) => {
    setSelectedCourse(course);
    setReminderEnabled(course.reminderEnabled ?? false);
    setReminderMinutes(course.reminderMinutes ?? 10);
    setShowReminderModal(true);
  };

  const handleSaveReminder = async () => {
    if (!selectedCourse) return;

    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}/reminder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reminderEnabled,
          reminderMinutes,
        }),
      });

      if (response.ok) {
        // 更新本地状态
        setCourses(courses.map((c) =>
          c.id === selectedCourse.id
            ? { ...c, reminderEnabled, reminderMinutes }
            : c
        ));
        setShowReminderModal(false);
        setSelectedCourse(null);
      }
    } catch (error) {
      console.error("保存提醒设置失败:", error);
    }
  };

  const getCourseColor = (course: Course, index: number) => {
    if (course.color) return course.color;
    return courseColors[index % courseColors.length];
  };

  // 格式化日期显示
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayName = (day: number): string => {
    const names = ["", "周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return names[day] || "";
  };

  // 格式化周次显示
  const formatWeekRange = (course: Course): string => {
    if (course.weekList && course.weekList.length > 0) {
      // 将连续周次合并显示，如 [1,2,3,5,6,8,9,10] → "1-3,5-6,8-10 周"
      const weeks = course.weekList.sort((a, b) => a - b);
      const ranges: string[] = [];
      let start = weeks[0];
      let end = weeks[0];

      for (let i = 1; i < weeks.length; i++) {
        if (weeks[i] === end + 1) {
          end = weeks[i];
        } else {
          ranges.push(start === end ? `${start}` : `${start}-${end}`);
          start = weeks[i];
          end = weeks[i];
        }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      return ranges.join(',') + '周';
    }
    // 回退到 weekStart/weekEnd
    return `${course.weekStart}-${course.weekEnd}周${course.weekPattern === 'odd' ? '(单)' : course.weekPattern === 'even' ? '(双)' : ''}`;
  };

  const getCoursesByDayAndSlot = (day: number, slotIndex: number) => {
    return courses.filter((course) => {
      if (course.dayOfWeek !== day) return false;

      // 周次过滤：优先使用 weekList 精确匹配
      if (course.weekList && course.weekList.length > 0) {
        if (!course.weekList.includes(currentWeek)) return false;
      } else {
        // 回退到范围检查
        const isInWeekRange = currentWeek >= course.weekStart && currentWeek <= course.weekEnd;
        if (!isInWeekRange) return false;

        // 检查单双周
        if (course.weekPattern === 'odd' && currentWeek % 2 === 0) return false;
        if (course.weekPattern === 'even' && currentWeek % 2 === 1) return false;
      }

      const period = course.period || "";
      const match = period.match(/(\d+)[-,](\d+)/);
      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        return slotIndex + 1 >= start && slotIndex + 1 <= end;
      }
      const singleMatch = period.match(/(\d+)/);
      if (singleMatch) {
        return parseInt(singleMatch[1]) === slotIndex + 1;
      }
      return false;
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">请先登录</h1>
          <p className="mt-2 text-gray-600">您需要登录后才能查看课表</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载课表中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的课表</h1>
            <p className="mt-2 text-gray-600">
              共 {courses.length} 门课程
            </p>
            {todayDate && (
              <p className="mt-1 text-sm text-blue-600 font-medium">
                📅 今天：{formatDate(todayDate)}（{getDayName(new Date(todayDate).getDay() || 7)}）
                {todayCourses.length > 0 && <span className="ml-2 text-green-600">· 今天有 {todayCourses.length} 节课</span>}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowSemesterModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                title="设置开学日期"
              >
                ⚙️ 学期设置
              </button>
            )}
            <Link
              href="/reminders"
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              title="查看课程提醒"
            >
              🔔 提醒
            </Link>
            <Link
              href="/schedule/import"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              导入课表
            </Link>
            {courses.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                清空课表
              </button>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-gray-300">
            <span className="text-sm font-medium text-gray-700">
              {currentSeason === "winter-spring" ? "❄️ 冬春季作息" : "🍀 夏秋季作息"}
            </span>
          </div>

          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-2 rounded-md ${
              viewMode === "week"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            周视图
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-4 py-2 rounded-md ${
              viewMode === "day"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            日视图
          </button>

          {/* 周次选择 */}
          <div className="ml-4 flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-gray-300">
            <span className="text-sm text-gray-600">📅 第</span>
            <select
              value={currentWeek}
              onChange={(e) => setCurrentWeek(Number(e.target.value))}
              className="text-sm border-none focus:ring-2 focus:ring-blue-500 bg-transparent font-medium"
            >
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                <option key={week} value={week}>
                  {week}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">周</span>
            <span className="text-xs text-gray-400 ml-2">({semesterName})</span>
          </div>

          {/* 快捷周次按钮 */}
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setCurrentWeek(1)}
              className={`px-2 py-1 rounded text-xs ${
                currentWeek === 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              第 1 周
            </button>
            <button
              onClick={() => setCurrentWeek(currentWeek > 1 ? currentWeek - 1 : 1)}
              className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
              disabled={currentWeek <= 1}
            >
              ◀
            </button>
            <button
              onClick={() => setCurrentWeek(currentWeek < totalWeeks ? currentWeek + 1 : totalWeeks)}
              className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
              disabled={currentWeek >= totalWeeks}
            >
              ▶
            </button>
          </div>

          {viewMode === "day" && (
            <div className="flex gap-1 ml-4">
              {dayNames.slice(1, 8).map((day, index) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(index + 1)}
                  className={`px-3 py-2 rounded-md text-sm ${
                    selectedDay === index + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 今日课程卡片 */}
        {todayCourses.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              📌 今日课程
              <span className="text-sm text-gray-500 font-normal">
                {formatDate(todayDate)}（{getDayName(new Date(todayDate).getDay() || 7)}）· 第 {currentWeek} 周
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayCourses.map((course, index) => (
                <div
                  key={course.id}
                  className={`${getCourseColor(course, index)} bg-opacity-10 rounded-lg p-3 border border-gray-200`}
                >
                  <div className="font-medium text-gray-900">{course.courseName}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {course.period} · {formatWeekRange(course)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">📍 {course.classroom}</div>
                  {course.teacher && (
                    <div className="text-xs text-gray-500 mt-1">👨‍🏫 {course.teacher}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              暂无课表数据
            </h2>
            <p className="text-gray-600 mb-6">
              从教务系统导入或手动添加课程
            </p>
            <Link
              href="/schedule/import"
              className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              导入课表
            </Link>
          </div>
        )}

        {/* Week View */}
        {viewMode === "week" && courses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 border-b">
                      节次
                    </th>
                    {dayNames.slice(1).map((day, index) => {
                      const dayNum = index + 1;
                      const today = new Date();
                      const todayDayOfWeek = today.getDay() || 7;
                      const isToday = dayNum === todayDayOfWeek;
                      return (
                        <th
                          key={day}
                          className={`px-4 py-3 text-sm font-medium border-b min-w-[150px] ${
                            isToday ? "text-blue-600 bg-blue-50" : "text-gray-500"
                          }`}
                        >
                          {day}{isToday && " (今天)"}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot, slotIndex) => (
                    <tr key={slot.label} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-500 border-r bg-gray-50 text-center align-top">
                        <div>{slot.label}</div>
                        <div className="text-xs">{slot.start}</div>
                        <div className="text-xs">{slot.end}</div>
                      </td>
                      {dayNames.slice(1).map((_, dayIndex) => {
                        const dayNum = dayIndex + 1;
                        const today = new Date();
                        const todayDayOfWeek = today.getDay() || 7;
                        const isTodayColumn = dayNum === todayDayOfWeek;
                        const dayCourses = getCoursesByDayAndSlot(
                          dayIndex + 1,
                          slotIndex
                        );

                        // 找到在当前节次开始显示的课程
                        const course = dayCourses.find((c) => {
                          const periodMatch = c.period?.match(/(\d+)/);
                          if (periodMatch) {
                            const startSlot = parseInt(periodMatch[1]);
                            return startSlot === slotIndex + 1;
                          }
                          return false;
                        });

                        if (!course) {
                          // 检查是否是跨节课程的延续部分
                          const continuingCourse = courses.find((c) => {
                            if (c.dayOfWeek !== dayIndex + 1) return false;

                            // 周次过滤
                            const isInWeekRange = currentWeek >= c.weekStart && currentWeek <= c.weekEnd;
                            if (!isInWeekRange) return false;
                            if (c.weekPattern === 'odd' && currentWeek % 2 === 0) return false;
                            if (c.weekPattern === 'even' && currentWeek % 2 === 1) return false;

                            const periodMatch = c.period?.match(/(\d+)[-,](\d+)/);
                            if (periodMatch) {
                              const start = parseInt(periodMatch[1]);
                              const end = parseInt(periodMatch[2]);
                              return slotIndex + 1 > start && slotIndex + 1 <= end;
                            }
                            return false;
                          });

                          if (continuingCourse) {
                            return null; // 延续部分不显示，由起始节次显示
                          }

                          return (
                            <td
                              key={dayIndex}
                              className={`px-2 py-2 border-r border-b min-h-[80px] ${
                                isTodayColumn ? "bg-blue-50" : ""
                              }`}
                            ></td>
                          );
                        }

                        // 计算课程跨度的 rowSpan
                        const periodMatch = course.period?.match(/(\d+)[-,](\d+)/);
                        let rowSpan = 1;
                        if (periodMatch) {
                          const start = parseInt(periodMatch[1]);
                          const end = parseInt(periodMatch[2]);
                          rowSpan = end - start + 1;
                        }

                        return (
                          <td
                            key={dayIndex}
                            className={`px-2 py-2 border-r border-b align-top ${
                              isTodayColumn ? "bg-blue-50" : ""
                            }`}
                            rowSpan={rowSpan > 1 ? rowSpan : undefined}
                          >
                            <div
                              className={`${getCourseColor(course, courses.indexOf(course))} text-white rounded p-2 text-xs cursor-pointer hover:opacity-90`}
                              style={{ minHeight: rowSpan > 1 ? `${rowSpan * 80 - 8}px` : '80px' }}
                              title={`${course.courseName}\n${course.teacher}\n${course.classroom}`}
                              onClick={() => handleCourseClick(course)}
                            >
                              <div className="font-semibold">
                                {course.courseName}
                              </div>
                              <div className="mt-1">{course.classroom}</div>
                              <div className="mt-1 opacity-80">
                                {course.teacher}
                              </div>
                              <div className="mt-1 text-xs opacity-75">
                                {course.period} | {formatWeekRange(course)}
                              </div>
                              <div className="mt-1 flex gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/schedule/edit?id=${course.id}`
                                    );
                                  }}
                                  className="opacity-75 hover:opacity-100"
                                  title="编辑课程"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenReminderModal(course);
                                  }}
                                  className="opacity-75 hover:opacity-100"
                                  title="设置提醒"
                                >
                                  🔔
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCourse(course.id);
                                  }}
                                  className="opacity-75 hover:opacity-100"
                                  title="删除课程"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === "day" && courses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {dayNames[selectedDay]}
                {selectedDay === (new Date().getDay() || 7) && (
                  <span className="ml-2 text-sm font-normal text-blue-600">（今天）</span>
                )}
              </h2>
              <span className="text-sm text-gray-500">
                第 {currentWeek} 周 / 共 {totalWeeks} 周
              </span>
            </div>
            <div className="space-y-3">
              {courses
                .filter((c) => {
                  if (c.dayOfWeek !== selectedDay) return false;
                  // 周次过滤
                  const isInWeekRange = currentWeek >= c.weekStart && currentWeek <= c.weekEnd;
                  if (!isInWeekRange) return false;
                  if (c.weekPattern === 'odd' && currentWeek % 2 === 0) return false;
                  if (c.weekPattern === 'even' && currentWeek % 2 === 1) return false;
                  return true;
                })
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((course, index) => (
                  <div
                    key={course.id}
                    className={`${getCourseColor(course, index)} text-white rounded-lg p-4 cursor-pointer hover:opacity-90`}
                    onClick={() => handleCourseClick(course)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {course.courseName}
                        </h3>
                        <p className="text-sm opacity-90 mt-1">
                          {course.startTime} - {course.endTime} | {course.classroom}
                        </p>
                        {course.teacher && (
                          <p className="text-sm opacity-75 mt-1">
                            教师：{course.teacher}
                          </p>
                        )}
                        <p className="text-xs opacity-75 mt-1">
                          周次：{formatWeekRange(course)}
                        </p>
                        {course.notes && (
                          <p className="text-sm opacity-75 mt-1">
                            备注：{course.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/schedule/edit?id=${course.id}`);
                          }}
                          className="opacity-75 hover:opacity-100"
                          title="编辑课程"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReminderModal(course);
                          }}
                          className="opacity-75 hover:opacity-100"
                          title="设置提醒"
                        >
                          🔔
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="opacity-75 hover:opacity-100"
                          title="删除课程"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Location Modal */}
      {showLocationModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                课程位置
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedCourse.courseName}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>教室：</span>
                    <span className="font-medium">{selectedCourse.classroom}</span>
                  </div>
                  {selectedCourse.location && (
                    <>
                      <div className="flex justify-between">
                        <span>教学楼：</span>
                        <span className="font-medium">{selectedCourse.location.building}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>楼层：</span>
                        <span className="font-medium">{selectedCourse.location.floor}楼</span>
                      </div>
                      <div className="flex justify-between">
                        <span>教室号：</span>
                        <span className="font-medium">{selectedCourse.location.roomNumber}</span>
                      </div>
                      {selectedCourse.location.roomName && (
                        <div className="flex justify-between">
                          <span>教室名：</span>
                          <span className="font-medium">{selectedCourse.location.roomName}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/map?building=${encodeURIComponent(selectedCourse.location?.building || "")}`}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-center rounded-md hover:bg-green-700 text-sm"
                >
                  🗺️ 查看地图
                </Link>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showReminderModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                课程提醒设置
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {selectedCourse.courseName}
                </h4>
                <p className="text-sm text-gray-600">
                  {dayNames[selectedCourse.dayOfWeek]} {selectedCourse.startTime} - {selectedCourse.endTime}
                </p>
              </div>

              <div className="mb-6">
                <label className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg cursor-pointer">
                  <span className="font-medium text-gray-900">启用提醒</span>
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>

                {reminderEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提前提醒时间
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[5, 10, 15, 30].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setReminderMinutes(mins)}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            reminderMinutes === mins
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {mins}分钟
                        </button>
                      ))}
                      {[60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setReminderMinutes(mins)}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            reminderMinutes === mins
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {mins >= 60 ? `${mins / 60}小时` : `${mins}分钟`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveReminder}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  保存设置
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 学期设置模态框 */}
      {showSemesterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">⚙️ 学期设置</h2>
            <p className="text-sm text-gray-600 mb-4">
              设置开学日期，系统将自动计算当前周次。开学第一天为第一周。
            </p>
            <SemesterSettingsForm
              onClose={() => setShowSemesterModal(false)}
              onSuccess={() => {
                fetchSemesterInfo();
                setShowSemesterModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 学期设置表单组件
 */
function SemesterSettingsForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [semesterName, setSemesterName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [totalWeeks, setTotalWeeks] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 获取当前日期，自动填充学期名称
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;

    // 自动填充学期名称（根据月份判断第几学期）
    // 2-7 月 = 第 2 学期，8-12 月 = 第 1 学期
    const semesterTerm = (month >= 2 && month <= 7) ? "第 2 学期" : "第 1 学期";
    const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    setSemesterName(`${academicYear}学年${semesterTerm}`);

    // 自动设置开学日期为今天
    const todayStr = today.toISOString().split("T")[0];
    setStartDate(todayStr);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterName || !startDate) {
      setError("学期名称和开始日期为必填项");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: semesterName,
          startDate,
          totalWeeks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setError(data.error || "设置失败");
      }
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleSetToday = () => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const semesterTerm = (month >= 2 && month <= 7) ? "第 2 学期" : "第 1 学期";
    const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

    setStartDate(todayStr);
    setSemesterName(`${academicYear}学年${semesterTerm}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学期名称
          </label>
          <button
            type="button"
            onClick={handleSetToday}
            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📅 设为今天
          </button>
        </div>
        <input
          type="text"
          value={semesterName}
          onChange={(e) => setSemesterName(e.target.value)}
          placeholder="例如：2025-2026 学年第 2 学期"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            开学日期（第一天）
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            📍 开学第一天算作第一周的开始 ·
            <span className="text-blue-600 font-medium"> 今天：{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            总周数
          </label>
          <input
            type="number"
            value={totalWeeks}
            onChange={(e) => setTotalWeeks(parseInt(e.target.value) || 20)}
            min="1"
            max="30"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          取消
        </button>
      </div>
    </form>
  );
}
