"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ScheduleImportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [courseData, setCourseData] = useState("");
  const [showExample, setShowExample] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/courses/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `成功导入 ${data.count} 门课程！`,
        });
        router.push("/schedule");
      } else {
        setMessage({
          type: "error",
          text: data.error || "导入失败",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "导入失败：" + (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextImport = async () => {
    if (!courseData.trim()) {
      setMessage({
        type: "error",
        text: "请输入课表数据",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("text", courseData);

      const response = await fetch("/api/courses/parse-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `成功导入 ${data.count} 门课程！${data.metadata?.studentName ? `(学生：${data.metadata.studentName})` : ''}`,
        });
        setCourseData("");
        router.push("/schedule");
      } else {
        setMessage({
          type: "error",
          text: data.error || "导入失败",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "导入失败：" + (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">请先登录</h1>
          <p className="mt-2 text-gray-600">您需要登录后才能导入课表</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">导入课表</h1>
          <p className="mt-2 text-gray-600">
            从教务系统导出课表，支持 Excel、PDF 文件或文本格式导入
          </p>
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

        {/* Method 1: File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            方法一：上传 Excel 或 PDF 文件
          </h2>
          <p className="text-gray-600 mb-4">
            从山东信息职业技术学院教务系统导出课表 Excel 或 PDF 文件，然后上传
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "处理中..." : "选择 Excel 或 PDF 文件"}
            </label>
            <p className="mt-2 text-sm text-gray-500">
              支持格式：.xlsx, .xls, .pdf
            </p>
          </div>
        </div>

        {/* Method 2: Text Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            方法二：粘贴课表数据
          </h2>
          <p className="text-gray-600 mb-4">
            直接从教务系统复制课表数据，或使用以下格式粘贴：
          </p>
          <textarea
            value={courseData}
            onChange={(e) => setCourseData(e.target.value)}
            placeholder="课程名称	教师	教室	星期	节次	周次
高等数学	张三	教学楼 A101	周一	1-2 节	1-16 周
大学英语	李四	教学楼 B202	周三	3-4 节	1-16 周"
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            disabled={loading}
          />
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleTextImport}
              disabled={loading || !courseData.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "处理中..." : "导入课表"}
            </button>
            <button
              onClick={() => setShowExample(!showExample)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {showExample ? "隐藏" : "查看"}示例
            </button>
          </div>

          {/* Example */}
          {showExample && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">JSON 格式示例：</h3>
              <pre className="text-xs text-gray-600 overflow-auto">
{`[
  {
    "courseName": "高等数学",
    "teacher": "张三",
    "classroom": "教学楼 A101",
    "dayOfWeek": 1,
    "startTime": "08:00",
    "endTime": "09:40",
    "period": "1-2 节",
    "weekStart": 1,
    "weekEnd": 16,
    "weekPattern": null,
    "notes": "必修"
  }
]`}
              </pre>
              <h3 className="font-semibold text-gray-900 mt-4 mb-2">表格格式示例：</h3>
              <pre className="text-xs text-gray-600 overflow-auto">
{`高等数学	张三	教学楼 A101	周一	1-2 节	1-16 周	必修
大学英语	李四	教学楼 B202	周三	3-4 节	1-16 周	必修`}
              </pre>
            </div>
          )}
        </div>

        {/* Help */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 使用提示</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• 📌 <strong>推荐使用 Excel 格式</strong> - 从教务系统导出 Excel 文件，识别最准确</li>
            <li>• 📋 <strong>复制粘贴课表文本</strong> - 直接从教务系统复制课表数据粘贴到文本框</li>
            <li>• PDF 格式：仅支持文字型 PDF（可以用鼠标选中文字的）</li>
            <li>• 支持 JSON 格式，方便批量导入</li>
            <li>• 导入后可以在课表页面查看和管理</li>
          </ul>
          <div className="mt-4 p-4 bg-yellow-50 rounded-md border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2 text-xs">⚠️ PDF 导入失败？</h4>
            <ul className="text-yellow-800 text-xs space-y-1">
              <li>• 如果 PDF 是截图、扫描件或图像型的，无法识别（无法用鼠标选中文字）</li>
              <li>• <strong>解决方案 1：</strong>从教务系统导出 Excel 格式（.xlsx）</li>
              <li>• <strong>解决方案 2：</strong>直接复制课表数据粘贴到文本框</li>
              <li>• 文字型 PDF 可以用鼠标选中文字，图像型 PDF 不能</li>
            </ul>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6">
          <button
            onClick={() => router.push("/schedule")}
            className="text-blue-600 hover:text-blue-800"
          >
            ← 返回课表
          </button>
        </div>
      </div>
    </div>
  );
}
