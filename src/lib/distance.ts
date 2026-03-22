/**
 * 计算两个经纬度坐标之间的距离（使用 Haversine 公式）
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @returns 两点之间的直线距离（单位：米）
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // 地球半径（单位：米）

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 估算步行时间
 * @param distanceMeters 距离（单位：米）
 * @param walkingSpeed 步行速度（单位：km/h），默认 4.5 km/h
 * @returns 预计步行时间（单位：分钟）
 */
export function estimateWalkingTime(
  distanceMeters: number,
  walkingSpeed: number = 4.5
): number {
  // 将速度转换为 m/min
  const speedInMetersPerMinute = (walkingSpeed * 1000) / 60;

  return Math.ceil(distanceMeters / speedInMetersPerMinute);
}

/**
 * 格式化距离显示
 * @param meters 距离（单位：米）
 * @returns 格式化后的距离字符串
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * 格式化时间显示
 * @param minutes 时间（单位：分钟）
 * @returns 格式化后的时间字符串
 */
export function formatWalkingTime(minutes: number): string {
  if (minutes < 1) {
    return "< 1 分钟";
  }
  return `${minutes} 分钟`;
}
