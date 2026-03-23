"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  color: string | null;
  reminderEnabled?: boolean;
  reminderMinutes?: number;
}

const dayNames = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export default function MySchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [totalWeeks, setTotalWeeks] = useState(20);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchSchedule();
    }
  }, [status]);

  const fetchSchedule = async () => {
    try {
      const response = await fetch("/api/schedule");
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses);
        // 计算当前周次
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const diff = now.getTime() - startOfYear.getTime();
        const week = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
        setCurrentWeek(Math.min(week, 20));
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCoursesForDay = (day: number) => {
    return courses.filter(
      (course) =>
        course.dayOfWeek === day &&
        currentWeek >= course.weekStart &&
        currentWeek <= course.weekEnd
    );
  };

  const getCourseColor = (color: string | null) => {
    const colorMap: Record<string, string> = {
      red: "from-red-500 to-pink-500",
      orange: "from-orange-500 to-amber-500",
      yellow: "from-yellow-500 to-lime-500",
      green: "from-green-500 to-emerald-500",
      cyan: "from-cyan-500 to-blue-500",
      blue: "from-blue-500 to-indigo-500",
      purple: "from-purple-500 to-violet-500",
      pink: "from-pink-500 to-rose-500",
    };
    return colorMap[color || "blue"] || "from-blue-500 to-indigo-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link
              href="/profile"
              className="flex items-center space-x-2 group"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-gray-700 font-medium">返回个人主页</span>
            </Link>
            <div className="flex gap-2">
              <Link
                href="/schedule/import"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                导入课表
              </Link>
              <Link
                href="/schedule"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                完整课表
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的课表</h1>
          <p className="text-gray-600 mt-1">查看和管理您的课程安排</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{courses.length}</div>
                <div className="text-gray-600 text-sm mt-1">总课程数</div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">第{currentWeek}周</div>
                <div className="text-gray-600 text-sm mt-1">当前周次</div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {courses.filter((c) => c.reminderEnabled).length}
                </div>
                <div className="text-gray-600 text-sm mt-1">已启用提醒</div>
              </div>
            </div>
          </div>
        </div>

        {/* Week Selector */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">当前周次</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <select
                value={currentWeek}
                onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    第{week}周
                  </option>
                ))}
              </select>
              <button
                onClick={() => setCurrentWeek(Math.min(totalWeeks, currentWeek + 1))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-4">
              还没有导入课表
            </p>
            <Link
              href="/schedule/import"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
            >
              导入课表
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dayNames.slice(1).map((day, index) => {
              const dayCourses = getCoursesForDay(index + 1);
              return (
                <div
                  key={day}
                  className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3">
                    <h3 className="text-white font-bold text-center">{day}</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    {dayCourses.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        无课程
                      </p>
                    ) : (
                      dayCourses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/schedule/edit/${course.id}`}
                          className={`block p-3 rounded-lg bg-gradient-to-r ${getCourseColor(course.color)} text-white hover:shadow-lg transition-all`}
                        >
                          <h4 className="font-bold text-sm truncate">
                            {course.courseName}
                          </h4>
                          <p className="text-xs opacity-90 mt-1">
                            {course.period || `${course.startTime}-${course.endTime}`}
                          </p>
                          <p className="text-xs opacity-80 mt-0.5">
                            📍 {course.classroom}
                          </p>
                          {course.teacher && (
                            <p className="text-xs opacity-80 mt-0.5">
                              👨‍🏫 {course.teacher}
                            </p>
                          )}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
