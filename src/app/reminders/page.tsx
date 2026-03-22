"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Reminder {
  id: string;
  courseName: string;
  classroom: string;
  startTime: string;
  teacher: string | null;
  dayType: "today" | "tomorrow";
  dayName: string;
  timeUntilStart: string;
  reminderMinutes: number | null;
  location: {
    building: string;
    floor: number;
    roomNumber: string;
    roomName: string | null;
  } | null;
}

export default function RemindersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await fetch("/api/reminders");
      const data = await response.json();

      if (response.ok) {
        setReminders(data.reminders || []);
        setError(null);
      } else {
        setError(data.error || "获取提醒失败");
      }
    } catch (err) {
      setError("获取提醒失败，请重试");
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">请先登录</h1>
          <p className="mt-2 text-gray-600">您需要登录后才能查看课程提醒</p>
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
          <p className="mt-4 text-gray-600">加载提醒中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">课程提醒</h1>
            <p className="mt-1 text-gray-600">
              {reminders.length > 0
                ? `您有 ${reminders.length} 个即将到来的课程提醒`
                : "暂无即将到来的课程提醒"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/schedule"
              className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              查看课表
            </Link>
            <Link
              href="/map"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              校园地图
            </Link>
          </div>
        </div>

        {/* Empty State */}
        {reminders.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              暂无课程提醒
            </h2>
            <p className="text-gray-600 mb-6">
              在课表中为课程设置提醒时间，上课前会收到提醒
            </p>
            <Link
              href="/schedule"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              去设置提醒
            </Link>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">❌</div>
            <h3 className="text-lg font-medium text-red-900 mb-2">加载失败</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchReminders}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              重新加载
            </button>
          </div>
        )}

        {/* Reminders List */}
        {reminders.length > 0 && (
          <div className="space-y-4">
            {/* Today's Reminders */}
            {reminders.filter((r) => r.dayType === "today").length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                  <h2 className="text-lg font-bold text-blue-900">📅 今天</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {reminders
                    .filter((r) => r.dayType === "today")
                    .map((reminder) => (
                      <ReminderCard key={reminder.id} reminder={reminder} />
                    ))}
                </div>
              </div>
            )}

            {/* Tomorrow's Reminders */}
            {reminders.filter((r) => r.dayType === "tomorrow").length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                  <h2 className="text-lg font-bold text-green-900">📅 明天</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {reminders
                    .filter((r) => r.dayType === "tomorrow")
                    .map((reminder) => (
                      <ReminderCard key={reminder.id} reminder={reminder} />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 提醒设置小贴士</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 在课表页面点击课程上的 🔔 按钮可以设置提醒</li>
            <li>• 可选择提前 5 分钟到 2 小时不等的提醒时间</li>
            <li>• 系统会自动显示今天和明天需要提醒的课程</li>
            <li>• 结合校园地图功能，可以提前规划路线</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const isUrgent = reminder.timeUntilStart.includes("分钟") &&
    !reminder.timeUntilStart.includes("小时");

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${
      isUrgent ? "bg-orange-50" : ""
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              reminder.dayType === "today"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}>
              {reminder.dayName}
            </span>
            {isUrgent && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                ⏰ 即将开始
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {reminder.courseName}
          </h3>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
            <div>
              <span className="text-gray-500">上课时间：</span>
              <span className="font-medium">{reminder.startTime}</span>
            </div>
            <div>
              <span className="text-gray-500">提醒时间：</span>
              <span className="font-medium">{reminder.timeUntilStart}</span>
            </div>
            <div>
              <span className="text-gray-500">教室：</span>
              <span className="font-medium">{reminder.classroom}</span>
            </div>
            {reminder.teacher && (
              <div>
                <span className="text-gray-500">教师：</span>
                <span className="font-medium">{reminder.teacher}</span>
              </div>
            )}
          </div>

          {reminder.location && (
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-gray-500">📍</span>
                <span>{reminder.location.building}</span>
                <span className="text-gray-400">|</span>
                <span>{reminder.location.floor}楼</span>
                {reminder.location.roomName && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span>{reminder.location.roomName}</span>
                  </>
                )}
              </div>
              <Link
                href={`/map?building=${encodeURIComponent(reminder.location.building)}`}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                查看地图 →
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`text-2xl font-bold ${
            isUrgent ? "text-orange-600" : "text-blue-600"
          }`}>
            {reminder.timeUntilStart}
          </div>
          <Link
            href={`/schedule`}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            管理提醒
          </Link>
        </div>
      </div>
    </div>
  );
}
