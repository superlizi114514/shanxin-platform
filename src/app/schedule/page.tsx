"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MapPin, HelpCircle } from "lucide-react";
import { ScheduleExportCard } from "@/components/guide/ScheduleExportCard";

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
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-violet-500 to-violet-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-fuchsia-500 to-fuchsia-600",
  "from-indigo-500 to-indigo-600",
  "from-teal-500 to-teal-600",
];

const currentSeason = getCurrentSeason();
const timeSlots = currentSeason === "winter-spring" ? winterSpringSlots : summerFallSlots;

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toast 自动关闭
  useEffect(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    if (toast.show) {
      toastTimeoutRef.current = setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);
    }
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [toast.show]);

  // 周次相关状态
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [totalWeeks, setTotalWeeks] = useState<number>(20);
  const [semesterName, setSemesterName] = useState<string>("");
  const [todayDate, setTodayDate] = useState<string>("");
  const [todayCourses, setTodayCourses] = useState<Course[]>([]);
  const [semesterStartDate, setSemesterStartDate] = useState<string>("");

  // 加载状态 - 等待 session 验证
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

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

  const handleCourseClick = useCallback((course: Course) => {
    // 解析教室编号，提取建筑信息
    // 格式：k1-101, k1101, k2-201 等，k 后面的数字表示几号教学楼
    const parseClassroom = (classroom: string) => {
      const match = classroom.match(/^k(\d+)(?:-(\d+))?$/i);
      if (match) {
        const buildingNum = match[1];
        const roomNum = match[2] || '';
        return {
          building: `${buildingNum}号教学楼`,
          roomNumber: roomNum || classroom,
        };
      }
      return null;
    };

    // 检查是否有位置信息
    const hasLocation = course.location?.coordinates || course.classroom;

    if (!hasLocation) {
      // 显示提示：该课程暂无位置信息
      setToast({ show: true, message: "该课程暂无位置信息" });
      return;
    }

    // 解析教室编号获取建筑信息
    const parsedLocation = course.classroom ? parseClassroom(course.classroom) : null;

    // 构建 URL 参数
    const params = new URLSearchParams({
      building: course.location?.building || parsedLocation?.building || course.classroom,
      roomNumber: course.location?.roomNumber || parsedLocation?.roomNumber || "",
      coordinates: course.location?.coordinates || "",
      floor: course.location?.floor?.toString() || "",
      from: "schedule", // 标记来源，用于地图页面判断是否显示导航确认
    });

    // 跳转到地图页面
    router.push(`/map?${params.toString()}`);
  }, [router]);

  const handleCloseModal = () => {
    setShowLocationModal(false);
    setSelectedCourse(null);
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
    router.push("/login");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">正在跳转登录...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Control Bar Skeleton */}
          <div className="mb-6 flex gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse ml-auto"></div>
          </div>

          {/* Today's Courses Skeleton */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-200">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Week View Skeleton */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="h-10 bg-gray-100 border-b animate-pulse"></div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="h-16 bg-gray-50 animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📚 我的课表</h1>
            <p className="mt-2 text-gray-600">
              共 <span className="font-semibold text-blue-600">{courses.length}</span> 门课程
            </p>
            {todayDate && (
              <p className="mt-1 text-sm text-blue-600 font-medium flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(todayDate)}（{getDayName(new Date(todayDate).getDay() || 7)}）
                </span>
                {todayCourses.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {todayCourses.length} 节课
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowSemesterModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors cursor-pointer shadow-sm hover:shadow"
                title="设置开学日期"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                学期设置
              </button>
            )}
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors cursor-pointer border border-green-200"
              title="查看校园地图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="hidden sm:inline">地图</span>
            </Link>
            <Link
              href="/guide/export-schedule"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200"
              title="课表导出教程"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="hidden sm:inline">导出教程</span>
            </Link>
            <Link
              href="/schedule/import"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm hover:shadow"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              导入课表
            </Link>
            {courses.length > 0 && isAdmin && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors cursor-pointer border border-red-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 4v3M4 7h16" />
                </svg>
                清空课表
              </button>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-700">
              {currentSeason === "winter-spring" ? "❄️ 冬春季作息" : "🍀 夏秋季作息"}
            </span>
          </div>

          {/* 视图切换 - 分段控制器样式 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="视图切换">
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "week"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              aria-pressed={viewMode === "week"}
            >
              周视图
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "day"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              aria-pressed={viewMode === "day"}
            >
              日视图
            </button>
          </div>

          {viewMode === "day" && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1" role="group" aria-label="选择星期">
              {dayNames.slice(1, 8).map((day, index) => {
                const dayNum = index + 1;
                const today = new Date();
                const todayDayOfWeek = today.getDay() || 7;
                const isToday = dayNum === todayDayOfWeek;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedDay === dayNum
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                    } ${isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
                    aria-pressed={selectedDay === dayNum}
                  >
                    {day.replace("周", "")}
                  </button>
                );
              })}
            </div>
          )}

          {/* 周次选择器 */}
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
            <button
              onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              disabled={currentWeek <= 1}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="上一周"
              title={currentWeek <= 1 ? "已是第一周" : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <select
              value={currentWeek}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= totalWeeks) {
                  setCurrentWeek(value);
                }
              }}
              className="border-0 bg-transparent text-center font-medium focus:ring-0 text-gray-900 cursor-pointer"
              aria-label="选择周次"
            >
              {Array.from({ length: totalWeeks || 20 }, (_, i) => i + 1).map((week) => (
                <option key={week} value={week}>第 {week} 周</option>
              ))}
            </select>
            <button
              onClick={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
              disabled={currentWeek >= totalWeeks}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="下一周"
              title={currentWeek >= totalWeeks ? `已是最后一周（共 ${totalWeeks} 周）` : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="ml-auto" />
        </div>

        {/* 今日课程卡片 */}
        {todayCourses.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl border border-blue-200 p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-xl">📌</span>
              <span>今日课程</span>
              <span className="text-sm text-gray-500 font-normal">
                {formatDate(todayDate)}（{getDayName(new Date(todayDate).getDay() || 7)}）· 第 {currentWeek} 周
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayCourses.map((course, index) => (
                <div
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCourseClick(course);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看${course.courseName}详情`}
                  className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${getCourseColor(course, index)} p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                  <div className="relative">
                    <div className="font-semibold text-white text-base">{course.courseName}</div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-white/90">
                      <span className="flex items-center gap-1">
                        <span className="text-white/70">🕐</span>
                        {course.period}节
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-white/70">📍</span>
                        {course.classroom}
                        {course.location?.coordinates && (
                          <MapPin className="w-3 h-3 text-white/90" />
                        )}
                      </span>
                    </div>
                    {course.teacher && (
                      <div className="text-xs text-white/80 mt-2 flex items-center gap-1">
                        <span>👨‍🏫</span>
                        {course.teacher}
                      </div>
                    )}
                    <div className="text-xs text-white/70 mt-2">
                      {formatWeekRange(course)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {courses.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center mb-6">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              暂无课表数据
            </h2>
            <p className="text-gray-600 mb-6">
              从教务系统导出课表 PDF 或手动添加课程
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Link
                href="/schedule/import"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                导入课表
              </Link>
              <Link
                href="/guide/export-schedule"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium"
              >
                查看导出教程
              </Link>
            </div>
          </div>
        )}

        {/* 帮助卡片 - 在有课程时显示 */}
        {courses.length > 0 && (
          <div className="mb-6">
            <ScheduleExportCard variant="compact" />
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
                              isTodayColumn ? "bg-blue-50/50" : ""
                            }`}
                            rowSpan={rowSpan > 1 ? rowSpan : undefined}
                          >
                            <div
                              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${getCourseColor(course, courses.indexOf(course))} text-white p-3 text-xs cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                              style={{ minHeight: rowSpan > 1 ? `${rowSpan * 80 - 8}px` : '80px' }}
                              title={`${course.courseName}\n${course.teacher}\n${course.classroom}`}
                              onClick={() => handleCourseClick(course)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleCourseClick(course);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`查看${course.courseName}详情`}
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110" />
                              <div className="relative">
                                <div className="font-semibold text-sm leading-tight mb-2">
                                  {course.courseName}
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 opacity-90">
                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 011.414-11.316l4.244 4.243a1.998 1.998 0 002.827 0l4.244-4.243a8 8 0 011.414 11.316z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="truncate">{course.classroom}</span>
                                    {course.location?.coordinates && (
                                      <MapPin className="w-3 h-3 flex-shrink-0 opacity-90" />
                                    )}
                                  </div>
                                  {course.teacher && (
                                    <div className="flex items-center gap-1.5 opacity-80">
                                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="truncate">{course.teacher}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 opacity-70 text-xs mt-2 pt-2 border-t border-white/20">
                                    <span>🕐 {course.period}节</span>
                                    <span className="truncate">{formatWeekRange(course)}</span>
                                  </div>
                                </div>
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
                          {course.location?.coordinates && (
                            <MapPin className="w-4 h-4 inline ml-1 opacity-90" />
                          )}
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

      {/* Toast 提示 */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-down">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{toast.message}</span>
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
