"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { StarRating } from "./StarRating";
import { XIcon, UploadIcon, ImageIcon } from "lucide-react";

interface ReviewFormProps {
  merchantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  url?: string;
  error?: string;
}

/**
 * 点评表单组件
 *
 * 功能特性:
 * - 评分选择 (1-5 星)
 * - 内容输入 (10-1000 字)
 * - 图片上传 (最多 5 张，支持拖拽)
 * - 实时表单验证
 * - 上传进度显示
 *
 * @example
 * <ReviewForm
 *   merchantId="xxx"
 *   onSuccess={() => router.refresh()}
 *   onCancel={() => setIsOpen(false)}
 * />
 */
export function ReviewForm({
  merchantId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 验证表单
  const validateForm = (): string | null => {
    if (rating === 0) {
      return "请评分";
    }
    if (content.trim().length < 10) {
      return "点评内容至少 10 个字";
    }
    if (content.trim().length > 1000) {
      return "点评内容最多 1000 个字";
    }
    return null;
  };

  // 上传单张图片
  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "上传失败");
      }

      return data.url;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    }
  };

  // 处理文件选择
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // 验证文件数量和类型
    if (images.length + fileArray.length > 5) {
      showToast("error", "最多上传 5 张图片");
      return;
    }

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        showToast("error", "只能上传图片文件");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "单张图片大小不能超过 5MB");
        continue;
      }

      // 创建预览
      const preview = URL.createObjectURL(file);
      const imagePreview: ImagePreview = {
        id: Math.random().toString(36).substring(2, 9),
        file,
        preview,
        uploading: true,
      };

      setImages((prev) => [...prev, imagePreview]);

      // 上传
      try {
        const url = await uploadImage(file);
        setImages((prev) =>
          prev.map((img) =>
            img.id === imagePreview.id
              ? { ...img, uploading: false, url: url || undefined }
              : img
          )
        );
      } catch (error) {
        setImages((prev) =>
          prev.map((img) =>
            img.id === imagePreview.id
              ? { ...img, uploading: false, error: "上传失败" }
              : img
          )
        );
        showToast("error", `${file.name} 上传失败`);
      }
    }
  }, [images.length]);

  // 拖拽事件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = true;
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [handleFiles]);

  // 删除图片
  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      showToast("error", error);
      return;
    }

    // 检查是否有上传失败或正在上传的图片
    const uploadingImages = images.filter((img) => img.uploading);
    const failedImages = images.filter((img) => img.error);

    if (uploadingImages.length > 0) {
      showToast("info", "请等待图片上传完成");
      return;
    }

    if (failedImages.length > 0) {
      showToast("error", "请删除上传失败的图片");
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrls = images
        .map((img) => img.url)
        .filter((url): url is string => !!url);

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          rating,
          content: content.trim(),
          images: imageUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "发布失败");
      }

      showToast("success", "点评已提交，等待审核");

      // 清理表单
      setRating(0);
      setContent("");
      setImages([]);

      onSuccess?.();
    } catch (error) {
      console.error("Submit review error:", error);
      showToast("error", error instanceof Error ? error.message : "发布失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`flex items-center gap-3 p-4 rounded-lg shadow-lg border ${
              toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}
            role="alert"
          >
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-gray-400 hover:text-gray-500"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 评分 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            评分 <span className="text-red-500">*</span>
          </label>
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            size="lg"
          />
          {rating === 0 && isSubmitting && (
            <p className="mt-1 text-sm text-red-500">请评分</p>
          )}
        </div>

        {/* 内容 */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            点评内容 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="分享您的消费体验：产品质量、服务态度、环境设施..."
              rows={4}
              className={cn(
                "w-full px-4 py-3 rounded-xl border border-gray-300",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "placeholder:text-gray-400",
                "transition-all"
              )}
            />
            <div className={cn(
              "absolute bottom-3 right-3 text-sm",
              content.length > 1000 ? "text-red-500" : "text-gray-400"
            )}>
              {content.length}/1000
            </div>
          </div>
        </div>

        {/* 图片上传 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            添加图片 <span className="text-gray-400 font-normal">(最多 5 张)</span>
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-6",
              "transition-all cursor-pointer",
              "hover:border-blue-400 hover:bg-blue-50/50",
              "border-gray-300 bg-gray-50/50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center text-center">
              {images.length < 5 ? (
                <>
                  <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    点击或拖拽上传图片
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    支持 JPG/PNG，单张最大 5MB
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  已达最大图片数量 (5 张)
                </p>
              )}
            </div>
          </div>

          {/* 图片预览 */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={img.preview}
                    alt="预览"
                    className={cn(
                      "w-full h-full object-cover",
                      img.uploading && "opacity-50"
                    )}
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-xs text-white">失败</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              取消
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "flex-1 px-6 py-3 rounded-xl font-medium text-white",
              "bg-gradient-to-r from-blue-600 to-indigo-600",
              "hover:from-blue-700 hover:to-indigo-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-300 shadow-lg shadow-blue-500/30",
              isSubmitting && "animate-pulse"
            )}
          >
            {isSubmitting ? "提交中..." : "提交点评"}
          </button>
        </div>
      </form>
    </div>
  );
}
