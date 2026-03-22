"use client";

import { useState, useRef } from "react";
import StarRating from "./star-rating";
import Image from "next/image";

interface ReviewFormProps {
  merchantId: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

export default function ReviewForm({
  merchantId,
  onSubmitSuccess,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState<{ url: string; file: File }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images max
    if (uploadedImages.length + files.length > 5) {
      setError("最多只能上传 5 张图片");
      return;
    }

    setUploading(true);
    setError("");

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("只能上传图片文件");
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("图片大小不能超过 5MB");
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "上传失败");
          continue;
        }

        setUploadedImages((prev) => [...prev, { url: data.url, file }]);
      } catch {
        setError("网络错误，上传失败");
      }
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating < 1 || rating > 5) {
      setError("请选择评分（1-5 星）");
      return;
    }

    if (!content.trim()) {
      setError("请输入评价内容");
      return;
    }

    setLoading(true);

    try {
      const imageUrls = uploadedImages.map((img) => img.url);

      const response = await fetch(`/api/merchants/${merchantId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          rating,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "提交失败");
      } else {
        onSubmitSuccess();
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          评分
        </label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          评价内容
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="分享您的消费体验..."
        />
      </div>

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          添加图片（可选）
        </label>
        <div className="flex flex-wrap gap-3">
          {/* Uploaded Images Preview */}
          {uploadedImages.map((img, index) => (
            <div
              key={index}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group"
            >
              <Image
                src={img.url}
                alt={`上传的图片 ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="删除此图片"
              >
                ×
              </button>
            </div>
          ))}

          {/* Upload Button */}
          {uploadedImages.length < 5 && (
            <label
              className={`w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                uploading
                  ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                  : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? (
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="text-2xl text-gray-400">+</span>
                  <span className="text-xs text-gray-500 mt-1">上传图片</span>
                </>
              )}
            </label>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          最多上传 5 张图片，每张图片不超过 5MB
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "提交中..." : "提交评价"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium"
        >
          取消
        </button>
      </div>
    </form>
  );
}
