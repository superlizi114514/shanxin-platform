/**
 * 建筑图标类型映射
 * 用于统一校内外建筑图标的显示
 */

export type BuildingIconType = "school" | "factory" | "menu-book" | "restaurant" | "home" | "sports";

/**
 * 建筑图标配置
 */
export const BUILDING_ICONS: Record<BuildingIconType, { emoji: string; color: string }> = {
  school: { emoji: "🏫", color: "#3b82f6" },
  factory: { emoji: "🏭", color: "#6b7280" },
  "menu-book": { emoji: "📚", color: "#8b5cf6" },
  restaurant: { emoji: "🍽️", color: "#f59e0b" },
  home: { emoji: "🏠", color: "#10b981" },
  sports: { emoji: "🏟️", color: "#ef4444" },
};

/**
 * 校区配置
 */
export const CAMPUS_CONFIG = {
  kuwen: {
    name: "奎文校区",
    center: [36.7069, 119.1508] as [number, number],
    zoom: 16,
    color: "#3b82f6",
    bounds: [
      [36.7050, 119.1490],
      [36.7090, 119.1530],
    ] as [[number, number], [number, number]],
  },
  binhai: {
    name: "滨海校区",
    center: [36.7845, 119.0655] as [number, number],
    zoom: 16,
    color: "#10b981",
    bounds: [
      [36.7830, 119.0640],
      [36.7865, 119.0675],
    ] as [[number, number], [number, number]],
  },
};

/**
 * 全部校区视图配置
 */
export const ALL_CAMPUS_VIEW = {
  center: [36.745, 119.108] as [number, number],
  zoom: 13,
};
