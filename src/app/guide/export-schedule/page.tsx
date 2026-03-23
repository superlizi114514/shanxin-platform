"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ScheduleExportGuidePage() {
  const router = useRouter();

  const steps = [
    {
      title: "登录教务系统",
      description: "访问山东信息职业技术学院教务系统",
      link: "http://jw.sdcit.edu.cn/jwglxt/xtgl/login_slogin.html",
      linkText: "点击进入教务系统",
    },
    {
      title: "进入个人课表",
      description: "登录后，点击左侧菜单「课表查询」->「个人课表查询」",
    },
    {
      title: "选择学年学期",
      description: "在页面上方选择当前学年和学期，然后点击「查询」",
    },
    {
      title: "导出 PDF 或 Excel",
      description: "点击页面上的「导出」按钮，选择 PDF 或 Excel 格式保存文件",
    },
    {
      title: "返回平台导入",
      description: "回到本平台，在课表导入页面上传刚才导出的文件",
      link: "/schedule/import",
      linkText: "前往导入课表",
    },
  ];

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
            返回
          </button>
          <h1 className="text-3xl font-bold text-gray-900">📚 课表导出教程</h1>
          <p className="mt-2 text-gray-600">
            从教务系统导出课表，然后在平台导入
          </p>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            导出流程（5 步）
          </h2>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold flex items-center justify-center text-lg shadow-md">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-blue-100 mx-auto mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <h3 className="font-semibold text-gray-900 text-lg">{step.title}</h3>
                  <p className="text-gray-600 mt-1">{step.description}</p>
                  {step.link && (
                    <Link
                      href={step.link}
                      className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      target={step.link.startsWith("http") ? "_blank" : undefined}
                      rel={step.link.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {step.linkText}
                      {step.link.startsWith("http") && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Link
            href="/schedule/import"
            className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <h3 className="font-semibold text-lg mb-2">📥 导入课表</h3>
            <p className="text-blue-100 text-sm">上传导出的 PDF 或 Excel 文件</p>
          </Link>
          <Link
            href="/schedule"
            className="p-6 bg-white text-gray-900 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all"
          >
            <h3 className="font-semibold text-lg mb-2">📅 查看课表</h3>
            <p className="text-gray-600 text-sm">查看已导入的课程安排</p>
          </Link>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            温馨提示
          </h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>建议使用 <strong>Excel 格式</strong> 导出，识别更准确</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>如果教务系统无法导出，可以截图后使用文字识别工具</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>遇到问题可在导入页使用「粘贴课表数据」功能</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
