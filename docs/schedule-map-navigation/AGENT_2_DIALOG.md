# Agent 2: 导航确认弹窗组件

## 任务目标
创建导航确认弹窗组件，当用户从课表页面跳转到地图页面时，显示"是否开启导航"的确认对话框。

## 前置条件
- 地图页面 (`src/app/map/page.tsx`) 已存在
- 已有 Toast 组件 (`src/components/Toast.tsx`)
- 已有距离计算工具 (`src/lib/distance.ts`)

## 实现步骤

### 1. 创建导航确认弹窗组件
创建新组件 `src/components/NavigationConfirmDialog.tsx`：

```typescript
"use client";

import { useState, useEffect } from "react";
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <NavigationIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              开启导航
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
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
                  : `${distance}m`
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
```

### 2. 修改地图页面集成弹窗
修改 `src/app/map/page.tsx`：

```typescript
// 1. 添加状态
const [showNavigationDialog, setShowNavigationDialog] = useState(false);
const [currentLocation, setCurrentLocation] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);

// 2. 监听 URL 参数
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const coordinates = params.get('coordinates');
  const building = params.get('building');
  const roomNumber = params.get('roomNumber');
  const floor = params.get('floor');

  if (from === 'schedule' && coordinates && building) {
    // 获取当前位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // 获取位置失败，仍显示弹窗
          setShowNavigationDialog(true);
        }
      );
    } else {
      setShowNavigationDialog(true);
    }
  }
}, []);

// 3. 计算距离和步行时间
const calculateDistanceAndTime = () => {
  if (!currentLocation) return { distance: undefined, walkingTime: undefined };

  const params = new URLSearchParams(window.location.search);
  const coordinates = params.get('coordinates');

  if (!coordinates) return { distance: undefined, walkingTime: undefined };

  const [lat, lng] = coordinates.split(',').map(Number);
  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    lat,
    lng
  );
  const walkingTime = estimateWalkingTime(distance);

  return { distance, walkingTime };
};

// 4. 处理导航确认
const handleNavigationConfirm = () => {
  setShowNavigationDialog(false);
  // 调用地图导航功能
  // TODO: 集成具体导航逻辑
};

// 5. 渲染弹窗
<NavigationConfirmDialog
  open={showNavigationDialog}
  onClose={() => setShowNavigationDialog(false)}
  onConfirm={handleNavigationConfirm}
  destination={{
    building: searchParams.get('building') || '',
    roomNumber: searchParams.get('roomNumber') || '',
    floor: parseInt(searchParams.get('floor') || '0'),
    roomName: searchParams.get('roomName') || undefined,
  }}
  {...calculateDistanceAndTime()}
/>
```

### 3. 集成距离计算工具
使用现有的 `@/lib/distance` 工具：
```typescript
import { calculateDistance, estimateWalkingTime } from "@/lib/distance";
```

## 验收标准
- [ ] 从课表跳转时显示导航确认弹窗
- [ ] 弹窗正确显示目的地信息（教学楼、教室号、楼层）
- [ ] 显示距离和预计步行时间
- [ ] 点击"开启导航"执行导航逻辑
- [ ] 点击"暂不需要"或关闭按钮关闭弹窗
- [ ] 弹窗动画流畅（fade-in zoom-in）
- [ ] 代码通过 TypeScript 类型检查
- [ ] 代码通过 code-reviewer 审查

## 相关文件
- `src/components/NavigationConfirmDialog.tsx` - 新建组件
- `src/app/map/page.tsx` - 集成弹窗
- `src/lib/distance.ts` - 距离计算
- `src/components/Toast.tsx` - Toast 组件（如需额外提示）

## 注意事项
1. 弹窗样式与项目现有设计保持一致（圆角、渐变色、阴影）
2. 使用项目的中文文案规范
3. 距离显示自动切换单位（米/公里）
4. 处理获取地理位置失败的降级方案
5. 遵循不可变模式 (immutable patterns)
6. 弹窗 z-index 高于其他元素（z-50）
