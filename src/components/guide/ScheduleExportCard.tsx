import Link from "next/link";
import { Download, Upload, ArrowRight } from "lucide-react";

export interface ScheduleExportCardProps {
  variant?: "default" | "compact";
}

export function ScheduleExportCard({ variant = "default" }: ScheduleExportCardProps) {
  if (variant === "compact") {
    return (
      <Link
        href="/guide/export-schedule"
        className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:shadow-md transition-all"
      >
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">如何导出课表？</h4>
          <p className="text-xs text-gray-600 truncate">查看教务系统课表导出教程</p>
        </div>
        <ArrowRight className="w-4 h-4 text-blue-600" />
      </Link>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-500/25">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <Download className="w-6 h-6 text-white" />
        </div>
        <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
          教程
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-2">如何导出课表？</h3>
      <p className="text-blue-100 text-sm mb-4">
        从教务系统导出 PDF 课表，然后导入到平台
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-blue-50">
          <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-medium">
            1
          </span>
          <span>登录教务系统</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-50">
          <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-medium">
            2
          </span>
          <span>点击个人课表查询</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-50">
          <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-medium">
            3
          </span>
          <span>选择学期并导出 PDF</span>
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href="http://jw.sdcit.edu.cn/jwglxt/xtgl/login_slogin.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          教务系统
        </a>
        <Link
          href="/schedule/import"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
        >
          <Upload className="w-4 h-4" />
          导入课表
        </Link>
      </div>

      <Link
        href="/guide/export-schedule"
        className="flex items-center justify-center gap-2 mt-4 text-sm text-blue-100 hover:text-white transition-colors"
      >
        查看详细教程
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
