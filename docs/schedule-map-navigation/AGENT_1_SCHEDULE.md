# Agent 1: 课表页面导航改造

## 任务目标
修改个人课表页面 (`src/app/schedule/page.tsx`)，实现点击课程后跳转到地图页面并携带教室位置信息。

## 前置条件
- 课表页面已有完整的课程数据结构
- Course interface 已包含 location 字段 (building, floor, roomNumber, coordinates)
- 地图页面 (`src/app/map/page.tsx`) 已存在并支持参数传递

## 实现步骤

### 1. 确认课程数据结构
读取 `src/app/schedule/page.tsx`，确认 Course interface 的 location 字段结构：
```typescript
location?: {
  building: string;      // 教学楼名称，如 "南校教学楼"
  floor: number;         // 楼层
  roomNumber: string;    // 教室编号，如 "A301"
  roomName?: string;     // 教室名称，如 "计算机机房"
  coordinates: string | null;  // 坐标，用于地图定位
};
```

### 2. 添加课程点击处理函数
在课程卡片组件中添加点击事件：
```typescript
const handleCourseClick = useCallback((course: Course) => {
  if (!course.location?.coordinates) {
    // 显示提示：该课程暂无位置信息
    return;
  }

  // 构建 URL 参数
  const params = new URLSearchParams({
    building: course.location.building,
    roomNumber: course.location.roomNumber,
    coordinates: course.location.coordinates,
    floor: course.location.floor.toString(),
    from: 'schedule',  // 标记来源，用于地图页面判断是否显示导航确认
  });

  // 跳转到地图页面
  router.push(`/map?${params.toString()}`);
}, [router]);
```

### 3. 修改课程卡片样式
为课程卡片添加可点击的视觉反馈：
```typescript
<div
  onClick={() => handleCourseClick(course)}
  className={cn(
    "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
    "active:scale-[0.98]"
  )}
>
  {/* 课程内容 */}
</div>
```

### 4. 添加 Toast 提示
当课程没有位置信息时显示提示：
```typescript
const showToast = (message: string) => {
  // 使用项目现有的 Toast 组件或内联实现
};

// 在 handleCourseClick 中
if (!course.location?.coordinates) {
  showToast("该课程暂无位置信息");
  return;
}
```

### 5. 添加视觉标识
在课程卡片上添加地图图标，提示用户可以点击导航：
```typescript
import { MapPinIcon } from "lucide-react";

<div className="flex items-center justify-between">
  <span>{course.location?.roomNumber}</span>
  {course.location?.coordinates && (
    <MapPinIcon className="w-4 h-4 text-blue-500" />
  )}
</div>
```

## 验收标准
- [ ] 点击有位置信息的课程卡片，成功跳转到地图页面
- [ ] URL 参数正确传递 (building, roomNumber, coordinates, floor, from)
- [ ] 点击无位置信息的课程，显示提示信息
- [ ] 课程卡片有可点击的视觉样式 (hover 效果)
- [ ] 课程卡片显示地图图标标识
- [ ] 代码通过 TypeScript 类型检查
- [ ] 代码通过 code-reviewer 审查

## 相关文件
- `src/app/schedule/page.tsx` - 主要修改文件
- `src/components/Toast.tsx` - Toast 组件（如需使用）
- `src/lib/distance.ts` - 距离计算工具（参考坐标格式）

## 注意事项
1. 保持现有课表功能不变，仅添加点击导航功能
2. 遵循项目的不可变模式 (immutable patterns)
3. 使用 useCallback 优化性能
4. 遵循项目的中文错误提示规范
5. 参考现有代码风格，保持一致性
