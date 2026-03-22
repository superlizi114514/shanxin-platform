"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

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
  notes: string | null;
  color: string | null;
}

const dayNames = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const timeSlots = [
  { start: "08:00", end: "08:45", label: "1" },
  { start: "08:55", end: "09:40", label: "2" },
  { start: "10:00", end: "10:45", label: "3" },
  { start: "10:55", end: "11:40", label: "4" },
  { start: "14:30", end: "15:15", label: "5" },
  { start: "15:25", end: "16:10", label: "6" },
  { start: "16:30", end: "17:15", label: "7" },
  { start: "17:25", end: "18:10", label: "8" },
  { start: "19:00", end: "19:45", label: "9" },
  { start: "19:55", end: "20:40", label: "10" },
  { start: "20:50", end: "21:35", label: "11" },
  { start: "21:45", end: "22:30", label: "12" },
];

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

export default function EditCoursePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    courseName: "",
    teacher: "",
    classroom: "",
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "08:45",
    period: "1 节",
    weekStart: 1,
    weekEnd: 16,
    weekPattern: "",
    notes: "",
    color: "",
  });

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${id}`);
      const data = await response.json();

      if (response.ok && data.course) {
        setCourse(data.course);
        setFormData({
          courseName: data.course.courseName,
          teacher: data.course.teacher || "",
          classroom: data.course.classroom,
          dayOfWeek: data.course.dayOfWeek,
          startTime: data.course.startTime,
          endTime: data.course.endTime,
          period: data.course.period || "1 节",
          weekStart: data.course.weekStart,
          weekEnd: data.course.weekEnd,
          weekPattern: data.course.weekPattern || "",
          notes: data.course.notes || "",
          color: data.course.color || "",
        });
      } else {
        setMessage({ type: "error", text: "课程不存在" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "获取课程失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.courseName.trim()) {
      setMessage({ type: "error", text: "请输入课程名称" });
      return;
    }

    if (!formData.classroom.trim()) {
      setMessage({ type: "error", text: "请输入教室" });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: formData.courseName,
          teacher: formData.teacher || null,
          classroom: formData.classroom,
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          period: formData.period || null,
          weekStart: formData.weekStart,
          weekEnd: formData.weekEnd,
          weekPattern: formData.weekPattern || null,
          notes: formData.notes || null,
          color: formData.color || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "保存成功" });
        setTimeout(() => router.push("/schedule"), 1000);
      } else {
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "保存失败：" + (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这门课程吗？")) return;

    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/schedule");
      } else {
        setMessage({ type: "error", text: "删除失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "删除失败：" + (error as Error).message });
    }
  };

  const handlePeriodChange = (periodNum: number) => {
    const slot = timeSlots[periodNum - 1];
    if (slot) {
      setFormData({
        ...formData,
        startTime: slot.start,
        endTime: slot.end,
        period: `${periodNum}节`,
      });
    }
  };

  const handlePeriodRangeChange = (startNum: number, endNum: number) => {
    const startSlot = timeSlots[startNum - 1];
    const endSlot = timeSlots[endNum - 1];
    if (startSlot && endSlot) {
      setFormData({
        ...formData,
        startTime: startSlot.start,
        endTime: endSlot.end,
        period: `${startNum}-${endNum}节`,
      });
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">请先登录</h1>
          <p className="mt-2 text-gray-600">您需要登录后才能编辑课程</p>
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
          <p className="mt-4 text-gray-600">加载课程信息...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">课程不存在</h1>
          <p className="mt-2 text-gray-600">该课程可能已被删除</p>
          <button
            onClick={() => router.push("/schedule")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回课表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">编辑课程</h1>
          <p className="mt-2 text-gray-600">修改课程信息</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-6">
            {/* Course Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                课程名称 *
              </label>
              <input
                type="text"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：高等数学"
              />
            </div>

            {/* Teacher */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                教师
              </label>
              <input
                type="text"
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：张三"
              />
            </div>

            {/* Classroom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                教室 *
              </label>
              <input
                type="text"
                value={formData.classroom}
                onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：教学楼 A101"
              />
            </div>

            {/* Day of Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                星期
              </label>
              <div className="flex gap-2 flex-wrap">
                {dayNames.slice(1).map((day, index) => (
                  <button
                    key={day}
                    onClick={() => setFormData({ ...formData, dayOfWeek: index + 1 })}
                    className={`px-4 py-2 rounded-md ${
                      formData.dayOfWeek === index + 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                节次
              </label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {timeSlots.map((slot, index) => (
                  <button
                    key={slot.label}
                    onClick={() => handlePeriodChange(index + 1)}
                    className={`px-2 py-2 rounded-md text-sm ${
                      formData.period === `${index + 1}节`
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    第{slot.label}节
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">或选择范围：</span>
                <select
                  value=""
                  onChange={(e) => {
                    const [start, end] = e.target.value.split("-").map(Number);
                    if (start && end) {
                      handlePeriodRangeChange(start, end);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">选择节次范围</option>
                  <option value="1-2">1-2 节</option>
                  <option value="3-4">3-4 节</option>
                  <option value="5-6">5-6 节</option>
                  <option value="7-8">7-8 节</option>
                  <option value="9-10">9-10 节</option>
                  <option value="11-12">11-12 节</option>
                  <option value="1-4">1-4 节</option>
                  <option value="5-8">5-8 节</option>
                </select>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                当前时间：{formData.startTime} - {formData.endTime}
              </div>
            </div>

            {/* Week Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                周次
              </label>
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-gray-600">第</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.weekStart}
                    onChange={(e) => setFormData({ ...formData, weekStart: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600"> 周至第</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.weekEnd}
                    onChange={(e) => setFormData({ ...formData, weekEnd: parseInt(e.target.value) || 16 })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600"> 周</span>
                </div>
              </div>
            </div>

            {/* Week Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                周类型
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="weekPattern"
                    checked={formData.weekPattern === ""}
                    onChange={() => setFormData({ ...formData, weekPattern: "" })}
                    className="mr-2"
                  />
                  <span>每周</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="weekPattern"
                    checked={formData.weekPattern === "odd"}
                    onChange={() => setFormData({ ...formData, weekPattern: "odd" })}
                    className="mr-2"
                  />
                  <span>单周</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="weekPattern"
                    checked={formData.weekPattern === "even"}
                    onChange={() => setFormData({ ...formData, weekPattern: "even" })}
                    className="mr-2"
                  />
                  <span>双周</span>
                </label>
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                颜色
              </label>
              <div className="flex gap-2 flex-wrap">
                {courseColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color: formData.color === color ? "" : color })}
                    className={`w-10 h-10 rounded-md ${color} ${
                      formData.color === color ? "ring-4 ring-offset-2 ring-blue-500" : ""
                    }`}
                  />
                ))}
                <button
                  onClick={() => setFormData({ ...formData, color: "" })}
                  className={`px-4 py-2 rounded-md border border-gray-300 ${
                    formData.color === "" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  默认
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="可选的备注信息"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              onClick={handleDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              删除课程
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => router.push("/schedule")}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
