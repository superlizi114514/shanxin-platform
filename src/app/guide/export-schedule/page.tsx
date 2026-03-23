"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Upload, FileText, CheckCircle, ExternalLink } from "lucide-react";

export default function ExportScheduleGuidePage() {
  const router = useRouter();

  const steps = [
    {
      icon: ExternalLink,
      title: "登录教务系统",
      description: "访问山东信息职业技术学院教务系统",
      link: "http://jw.sdcit.edu.cn/jwglxt/xtgl/login_slogin.html",
      linkText: "点击登录教务系统",
    },
    {
      icon: FileText,
      title: "进入课表查询",
      description: "登录成功后，在左侧菜单栏找到并点击「个人课表查询」",
    },
    {
      icon: Download,
      title: "选择学年学期",
      description: "在课表查询页面，选择当前所在的学年和学期（如 2025-2026 学年 第 2 学期）",
    },
    {
      icon: FileText,
      title: "导出 PDF 课表",
      description: "点击「输出 PDF」或「打印」按钮，将课表保存为 PDF 文件到本地",
    },
    {
      icon: Upload,
      title: "返回平台导入",
      description: "回到山信黑红榜平台，在课表导入页面上传刚才导出的 PDF 文件",
      action: (
        <Link
          href="/schedule/import"
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Upload className="w-4 h-4" />
          去导入课表
        </Link>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题区 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 mb-4">
            <Download className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">课表导出教程</h1>
          <p className="text-gray-600">
            按照以下步骤从教务系统导出课表，然后导入到平台
          </p>
        </div>

        {/* 快速跳转 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">直接从教务系统导出</h2>
              <p className="text-blue-100 text-sm">已有 PDF 课表文件？直接导入</p>
            </div>
            <div className="flex gap-3">
              <a
                href="http://jw.sdcit.edu.cn/jwglxt/xtgl/login_slogin.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                教务系统
              </a>
              <Link
                href="/schedule/import"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                导入课表
              </Link>
            </div>
          </div>
        </div>

        {/* 步骤列表 */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <step.icon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-3">{step.description}</p>

                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {step.linkText}
                    </a>
                  )}

                  {step.action && step.action}
                </div>

                <div className="flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-500 opacity-50" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm font-bold">!</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">温馨提示</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• PDF 课表文件请保持清晰，避免模糊影响识别</li>
                <li>• 如果识别失败，可以尝试手动输入课表信息</li>
                <li>• 支持导入多个学期的课表数据</li>
                <li>• 遇到问题可在「我的 - 反馈建议」中联系我们</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 回到课表页 */}
        <div className="mt-6 text-center">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            返回课表页面
          </Link>
        </div>
      </div>
    </div>
  );
}
