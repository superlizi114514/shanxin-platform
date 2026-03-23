"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface ImportResult {
  success: boolean;
  count: number;
  courses?: Array<{
    id: string;
    courseName: string;
    teacher: string | null;
    classroom: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  metadata?: {
    studentName?: string;
  };
  error?: string;
}

export default function ScheduleImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [courseData, setCourseData] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 等待 session 验证
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    const validExtensions = [".pdf", ".xlsx", ".xls"];
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      setErrorMessage("不支持的文件格式，请上传 PDF 或 Excel 文件 (.pdf, .xlsx, .xls)");
      setUploadStatus("error");
      setImportResult(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("文件大小超过限制 (最大 10MB)");
      setUploadStatus("error");
      setImportResult(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
    setUploadStatus("idle");
    setImportResult(null);
  };

  const handleFileUpload = async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload) return;

    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/courses/import", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        setUploadStatus("success");
        setImportResult(data);
      } else {
        setUploadStatus("error");
        setErrorMessage(data.error || "导入失败");
      }
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "网络错误，请稍后重试");
    }
  };

  const handleTextImport = async () => {
    if (!courseData.trim()) {
      setErrorMessage("请输入课表数据");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("text", courseData);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/courses/parse-text", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (response.ok) {
        setUploadStatus("success");
        setImportResult(data);
        setCourseData("");
      } else {
        setUploadStatus("error");
        setErrorMessage(data.error || "导入失败");
      }
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "网络错误，请稍后重试");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setImportResult(null);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回课表
          </button>
          <h1 className="text-3xl font-bold text-gray-900">📥 导入课表</h1>
          <p className="mt-2 text-gray-600">
            支持从教务系统导出的 PDF 或 Excel 文件导入课程
          </p>
          <Link
            href="/guide/export-schedule"
            className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            如何从教务系统导出课表？
          </Link>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            上传 Excel 或 PDF 文件
          </h2>
          <p className="text-gray-600 mb-4">
            从山东信息职业技术学院教务系统导出课表 Excel 或 PDF 文件，然后上传
          </p>

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-blue-500 bg-blue-50 scale-[1.02]"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
              role="button"
              tabIndex={0}
              aria-label="上传文件区域，点击或拖拽文件到此处"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  dragOver ? "bg-blue-100" : "bg-gray-100"
                }`}>
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  {dragOver ? "释放以上传文件" : "点击或拖拽文件到此处"}
                </p>
                <p className="text-sm text-gray-500">
                  支持 PDF、Excel 格式，最大 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="移除文件"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {uploadStatus === "uploading" && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">正在导入...</span>
                    <span className="text-blue-600 font-medium">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadStatus === "idle" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFileUpload()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      开始导入
                    </span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {uploadStatus === "error" && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-red-900">导入失败</h4>
                  <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadStatus === "success" && importResult && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">导入成功!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    成功导入 <span className="font-bold">{importResult.count}</span> 门课程
                  </p>
                  {importResult.courses && importResult.courses.length > 0 && (
                    <div className="mt-3 max-h-48 overflow-y-auto">
                      <p className="text-xs text-green-600 mb-2">课程列表:</p>
                      <ul className="space-y-1">
                        {importResult.courses.slice(0, 10).map((course) => (
                          <li key={course.id} className="text-sm text-green-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            <span className="truncate">{course.courseName}</span>
                            <span className="text-green-600 text-xs">
                              ({course.startTime}-{course.endTime})
                            </span>
                          </li>
                        ))}
                        {importResult.courses.length > 10 && (
                          <li className="text-xs text-green-600 italic">
                            还有 {importResult.courses.length - 10} 门课程...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => router.push("/schedule")}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        完成
                      </span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-white text-green-700 border border-green-300 font-medium rounded-lg hover:bg-green-50 transition-colors"
                    >
                      继续导入
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Text Input Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            粘贴课表数据
          </h2>
          <p className="text-gray-600 mb-4">
            直接从教务系统复制课表数据，或使用以下格式粘贴
          </p>
          <textarea
            value={courseData}
            onChange={(e) => setCourseData(e.target.value)}
            placeholder="课程名称	教师	教室	星期	节次	周次
高等数学	张三	教学楼 A101	周一	1-2 节	1-16 周
大学英语	李四	教学楼 B202	周三	3-4 节	1-16 周"
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-shadow"
            disabled={uploadStatus === "uploading"}
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleTextImport}
              disabled={uploadStatus === "uploading" || !courseData.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {uploadStatus === "uploading" ? "处理中..." : "导入课表"}
            </button>
            <button
              onClick={() => setShowExample(!showExample)}
              className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              {showExample ? "隐藏" : "查看"}示例
            </button>
          </div>

          {showExample && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">JSON 格式示例：</h3>
              <pre className="text-xs text-gray-600 overflow-auto bg-white p-3 rounded border">
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
              <pre className="text-xs text-gray-600 overflow-auto bg-white p-3 rounded border">
{`高等数学	张三	教学楼 A101	周一	1-2 节	1-16 周	必修
大学英语	李四	教学楼 B202	周三	3-4 节	1-16 周	必修`}
              </pre>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            使用提示
          </h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span><strong>推荐使用 Excel 格式</strong> - 从教务系统导出 Excel 文件，识别最准确</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span><strong>复制粘贴课表文本</strong> - 直接从教务系统复制课表数据粘贴到文本框</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>PDF 格式：仅支持文字型 PDF（可以用鼠标选中文字的）</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>支持 JSON 格式，方便批量导入</span>
            </li>
          </ul>
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2 text-xs flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              PDF 导入失败？
            </h4>
            <ul className="text-yellow-800 text-xs space-y-1">
              <li>• 如果 PDF 是截图、扫描件或图像型的，无法识别（无法用鼠标选中文字）</li>
              <li>• <strong>解决方案 1：</strong>从教务系统导出 Excel 格式（.xlsx）</li>
              <li>• <strong>解决方案 2：</strong>直接复制课表数据粘贴到文本框</li>
            </ul>
          </div>
        </div>

        {/* Back link */}
        <div>
          <button
            onClick={() => router.push("/schedule")}
            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回课表
          </button>
        </div>
      </div>
    </div>
  );
}
