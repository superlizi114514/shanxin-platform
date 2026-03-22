import { BUILDING_ICONS, type BuildingIconType } from "../constants/map-constants";

/**
 * 获取建筑图标配置
 * @param type 建筑类型
 * @returns 图标配置（emoji 和颜色）
 */
export function getBuildingIcon(type: string | null): { emoji: string; color: string } {
  if (!type) return BUILDING_ICONS.school;
  return BUILDING_ICONS[type as BuildingIconType] || BUILDING_ICONS.school;
}

/**
 * 格式化坐标显示
 * @param lat 纬度
 * @param lng 经度
 * @returns 格式化后的坐标字符串
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

/**
 * 计算两点之间的距离（Haversine 公式）
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @returns 距离（公里）
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 估算步行时间（假设步行速度为 5km/h）
 * @param distance 距离（公里）
 * @returns 步行时间（分钟）
 */
export function estimateWalkingTime(distance: number): number {
  const WALKING_SPEED = 5; // km/h
  return Math.round((distance / WALKING_SPEED) * 60);
}

/**
 * 格式化距离显示
 * @param distance 距离（公里）
 * @returns 格式化后的距离字符串
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(2)}km`;
}

/**
 * 格式化步行时间显示
 * @param minutes 分钟数
 * @returns 格式化后的时间字符串
 */
export function formatWalkingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${remainingMinutes}分钟`;
}

/**
 * 将角度转换为弧度
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
