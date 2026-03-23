"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CaptchaInputProps {
  value: string;
  onChange: (value: string) => void;
  onError?: (error: string) => void;
  onVerified?: () => void;
  className?: string;
  label?: string;
  required?: boolean;
}

/**
 * 验证码输入组件
 *
 * 功能：
 * - 显示验证码图片
 * - 点击刷新验证码
 * - 输入验证
 * - 自动验证（可选）
 */
export function CaptchaInput({
  value,
  onChange,
  onError,
  onVerified,
  className,
  label,
  required = false,
}: CaptchaInputProps) {
  const [captchaUrl, setCaptchaUrl] = useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef<string>("");

  // 加载验证码图片
  const loadCaptcha = () => {
    const timestamp = Date.now();
    setCaptchaUrl(`/api/captcha?t=${timestamp}`);
    setVerified(false);
    onChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  // 当用户输入变化时
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // 如果输入了 4 位验证码，自动验证
    if (newValue.length === 4 && !verifying && !verified) {
      setVerifying(true);
      try {
        const response = await fetch("/api/captcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: newValue }),
        });

        const data = await response.json();

        if (response.ok && data.valid) {
          setVerified(true);
          onVerified?.();
        } else {
          onError?.(data.error || "验证码错误");
          loadCaptcha();
        }
      } catch {
        onError?.("网络错误，请重试");
        loadCaptcha();
      } finally {
        setVerifying(false);
      }
    }

    // 如果用户删除了内容，重置验证状态
    if (newValue.length === 0 && previousValueRef.current.length > 0) {
      setVerified(false);
    }

    previousValueRef.current = newValue;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          验证码 {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        {/* 验证码图片 */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            maxLength={4}
            value={value}
            onChange={handleChange}
            disabled={verifying || verified}
            placeholder="输入验证码"
            className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
          />
          {verified && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* 验证码图片 + 刷新按钮 */}
        <div className="relative">
          {captchaUrl && (
            <div
              onClick={loadCaptcha}
              className="h-[46px] w-[120px] rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
              title="点击刷新验证码"
            >
              <img
                src={captchaUrl}
                alt="验证码"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          )}
          {verifying && (
            <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>点击图片可刷新验证码，不区分大小写</span>
      </div>
    </div>
  );
}
