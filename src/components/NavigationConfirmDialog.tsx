"use client";

import { useEffect, useRef } from "react";
import { XIcon, NavigationIcon, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  destination: {
    building: string;
    roomNumber: string;
    floor: number;
    roomName?: string;
  };
  distance?: number;  // 距离（米）
  walkingTime?: number;  // 步行时间（分钟）
}

export function NavigationConfirmDialog({
  open,
  onClose,
  onConfirm,
  destination,
  distance,
  walkingTime,
}: NavigationConfirmDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 处理键盘事件（Escape 关闭）
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // 焦点 trap
  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <NavigationIcon className="w-6 h-6 text-blue-600" />
            <h3 id="dialog-title" className="text-lg font-semibold text-gray-900">
              开启导航
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="关闭"
          >
            <XIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 目的地信息 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <MapPinIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {destination.building}
              </p>
              <p className="text-sm text-gray-600">
                {destination.roomNumber} {destination.roomName}
              </p>
              <p className="text-sm text-gray-600">
                {destination.floor}楼
              </p>
            </div>
          </div>
        </div>

        {/* 距离和时间信息 */}
        {distance !== undefined && walkingTime !== undefined && (
          <div className="flex gap-4 mb-6">
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {distance >= 1000
                  ? `${(distance / 1000).toFixed(1)}km`
                  : `${Math.round(distance)}m`
                }
              </p>
              <p className="text-xs text-gray-500">距离</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {walkingTime}
              </p>
              <p className="text-xs text-gray-500">分钟</p>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            暂不需要
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30"
          >
            开启导航
          </button>
        </div>
      </div>
    </div>
  );
}
