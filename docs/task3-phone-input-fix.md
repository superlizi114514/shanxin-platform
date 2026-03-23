# 任务三：手机号格式化 Bug 修复 + 体验优化

## 任务概述
修复手机号输入时自动添加空格导致的格式不正确提示问题，优化输入体验。

## 问题描述
- ❌ 当前问题：输入手机号时自动添加空格（3-4-4 格式），但验证时提示格式不正确
- ❌ 验证正则要求纯数字，但显示带空格
- ❌ 用户在多个页面遇到此问题

## 解决方案
移除自动格式化功能，改为纯数字输入，仅在提交时确保格式正确。

---

## 修复范围

### 涉及文件清单
1. `src/app/register/page.tsx` - 注册页面
2. `src/app/profile/account-security/page.tsx` - 账号安全页
3. `src/app/admin/users/[id]/edit/page.tsx` - 管理员编辑用户
4. `src/components/PhoneInput.tsx` - 新建通用组件

---

## 第一步：修复注册页面

### 文件：`src/app/register/page.tsx`

**1. 修改 `formatPhone` 函数 - 移除空格格式化**

将：
```typescript
// 格式化手机号：138 8888 8888
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)} ${numbers.slice(3, 7)} ${numbers.slice(7, 11)}`;
};
```

改为：
```typescript
// 移除格式化，只保留数字
const formatPhone = (value: string): string => {
  return value.replace(/\D/g, ''); // 只保留数字
};
```

**2. 修改手机号输入框**

将：
```tsx
<input
  id="phone"
  name="phone"
  type="tel"
  autoComplete="tel"
  required
  value={phone}
  onChange={(e) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    if (phoneError) validatePhone(formatted);
  }}
  onBlur={(e) => validatePhone(e.target.value)}
  className="..."
  placeholder="138 8888 8888"
  maxLength={14}
/>
```

改为：
```tsx
<input
  id="phone"
  name="phone"
  type="tel"
  autoComplete="tel"
  required
  value={phone}
  onChange={(e) => {
    // 只允许输入数字
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
    if (phoneError && value.length === 11) {
      validatePhone(value);
    }
  }}
  onBlur={(e) => validatePhone(e.target.value)}
  className="..."
  placeholder="请输入 11 位手机号"
  maxLength={11}
/>
```

**3. 修改提交时的处理**

将：
```typescript
phone: phone.replace(/\D/g, ""), // 提交时移除空格
```

改为：
```typescript
phone: phone, // 已经是纯数字，无需处理
```

---

## 第二步：修复账号安全页

### 文件：`src/app/profile/account-security/page.tsx`

**搜索并修改**

查找所有手机号相关的输入框，应用同样修复：

1. 移除 `formatPhone` 函数（如存在）
2. 修改 `onChange` 为纯数字输入
3. 修改 `maxLength` 为 11
4. 修改 `placeholder` 为 "请输入 11 位手机号"

---

## 第三步：新建通用手机号输入组件

### 文件：`src/components/PhoneInput.tsx`

```tsx
"use client";

import React, { useState } from "react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
  label,
  required = false,
  disabled = false,
  className = "",
}: PhoneInputProps) {
  const [localError, setLocalError] = useState<string>("");

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phone) {
      setLocalError("请输入手机号");
      return false;
    }
    if (phone.length !== 11) {
      setLocalError("手机号必须为 11 位");
      return false;
    }
    if (!phoneRegex.test(phone)) {
      setLocalError("手机号格式不正确");
      return false;
    }
    setLocalError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 只允许输入数字
    const value = e.target.value.replace(/\D/g, "");
    onChange(value);

    // 当输入到 11 位时自动验证
    if (value.length === 11) {
      validatePhone(value);
    } else {
      setLocalError("");
    }
  };

  const handleBlur = () => {
    if (value) {
      validatePhone(value);
    }
    onBlur?.(value);
  };

  const displayError = error || localError;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          手机号 {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          maxLength={11}
          placeholder="请输入 11 位手机号"
          className={`
            appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5
            border placeholder-gray-400 text-gray-900
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
            ${displayError ? "border-red-500" : "border-gray-300"}
          `}
        />
        {value.length > 0 && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {value.length === 11 && !displayError ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <span className="text-xs text-gray-400">{value.length}/11</span>
            )}
          </div>
        )}
      </div>
      {displayError && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {displayError}
        </p>
      )}
    </div>
  );
}
```

---

## 第四步：全局替换检查

### 搜索并修复

使用 Grep 搜索以下关键词，确保所有手机号输入都已修复：

```bash
# 搜索格式化函数
grep -r "formatPhone" src/

# 搜索带空格的 placeholder
grep -r "138 8888 8888" src/

# 搜索 maxLength={14}
grep -r "maxLength={14}" src/
```

全部修复为：
- 无 `formatPhone` 调用
- `placeholder="请输入 11 位手机号"`
- `maxLength={11}`

---

## 验收标准

### 功能验收
- [ ] 注册页面手机号输入不带空格
- [ ] 账号安全页手机号输入不带空格
- [ ] 管理员编辑用户页手机号输入不带空格
- [ ] 输入 11 位数字后自动验证通过
- [ ] 非 1[3-9] 开头提示错误
- [ ] 少于 11 位提示错误

### 体验验收
- [ ] 只能输入数字（自动过滤非数字字符）
- [ ] 输入到 11 位时显示绿色对勾
- [ ] 错误提示清晰明确
- [ ] 提交时不会带空格

---

## 预计工作量
- 修复注册页：0.5 小时
- 修复账号安全页：0.5 小时
- 新建通用组件：1 小时
- 全局替换检查：0.5 小时
- 测试验证：0.5 小时
- **总计：3 小时**

## 优先级
🔥 **最高优先级** - 用户反馈最多的问题
