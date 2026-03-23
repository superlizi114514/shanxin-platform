# Agent 1 - 课表与地图系统

## 负责范围

**模块边界**: 课表系统、校园地图、PDF 解析

**US 任务**: US-001 ~ US-009, US-036 (共 10 个任务)

---

## 任务清单

| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-001 | 修复 PDF 课表解析 Unicode 字符匹配 | ✅ 已完成 | `src/lib/pdf-parser.ts` |
| US-002 | 添加 PDF 解析调试日志 | ✅ 已完成 | `src/lib/pdf-parser.ts` |
| US-003 | 创建 PDF 测试文件验证解析 | ✅ 已完成 | `test-pdf-parse.js` |
| US-004 | 添加奎文校区建筑坐标数据 | ✅ 已完成 | `prisma/seed.ts` |
| US-005 | 添加滨海校区建筑坐标数据 | ✅ 已完成 | `prisma/seed.ts` |
| US-006 | 创建校园地图可视化组件 | ✅ 已完成 | `src/components/MapWrapper.tsx`, `src/app/map/page.tsx` |
| US-007 | 添加校区切换功能 | ✅ 已完成 | `src/app/map/page.tsx` |
| US-008 | 完善课表页面 UI | ✅ 已完成 | `src/app/schedule/page.tsx` |
| US-009 | 完善课表导入页面 | ✅ 已完成 | `src/app/schedule/import/page.tsx` |
| US-036 | 创建课程提醒页面 | ❌ 已取消 (不需要) | - |

---

## 执行顺序

```
阶段 1: US-006 → US-007 (校园地图) ✅ 已完成
阶段 2: US-008 → US-009 (课表页面) ✅ 已完成
阶段 3: US-036 (课程提醒) ❌ 已取消
```

---

## 任务状态

**US-001 ~ US-009**: ✅ 全部完成

---

## API 边界

### 允许调用的 API
- ✅ `/api/schedule/*` - 课表相关 API
- ✅ `/api/campus-buildings/*` - 校园建筑数据 API
- ✅ `/api/upload/*` - 文件上传 API

### 禁止调用的 API
- ❌ `/api/admin/*` - 管理后台 API
- ❌ `/api/profile/*` - 个人主页 API
- ❌ `/api/products/*` - 二手商品 API
- ❌ `/api/merchants/*` - 商家 API
- ❌ `/api/news/*` - 新闻 API

---

## 备注

- US-036 (课程提醒页面) 已取消 - 网站不需要此功能

---

**优先级**: P0 (核心功能修复)


```bash
# 开发服务器
npm run dev

# 类型检查
npx tsc --noEmit

# ESLint
npm run lint

# 构建验证
npm run build
```

---

## 构建命令