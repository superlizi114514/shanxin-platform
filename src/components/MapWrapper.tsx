"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";

declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

interface CampusBuilding {
  id: string;
  name: string;
  campus: string;
  coordinates: string;
  address: string;
  description: string;
  order: number;
  icon: string | null;
  classrooms?: ClassroomLocation[];
}

interface ClassroomLocation {
  id: string;
  building: string;
  floor: number;
  roomNumber: string;
  roomName: string | null;
  type: string;
}

interface BuildingMarker {
  building: CampusBuilding;
  lat: number;
  lng: number;
}

interface MapWrapperProps {
  buildings: BuildingMarker[];
  selectedCampus: string;
  distanceReference: BuildingMarker | null;
  onBuildingClick: (marker: BuildingMarker) => void;
  selectedBuilding: BuildingMarker | null;
  onSetDistanceReference?: (marker: BuildingMarker) => void;
}

// 建筑图标映射（使用高德地图内置图标）
const BUILDING_ICONS: Record<string, { emoji: string; color: string }> = {
  school: { emoji: "🏫", color: "#3b82f6" },
  factory: { emoji: "🏭", color: "#6b7280" },
  "menu-book": { emoji: "📚", color: "#8b5cf6" },
  restaurant: { emoji: "🍽️", color: "#f59e0b" },
  home: { emoji: "🏠", color: "#10b981" },
  sports: { emoji: "🏟️", color: "#ef4444" },
};

// 校区配置
const CAMPUS_CONFIG = {
  kuwen: {
    name: "奎文校区",
    center: [119.1508, 36.7069] as [number, number],
    zoom: 16,
  },
  binhai: {
    name: "滨海校区",
    center: [119.0655, 36.7845] as [number, number],
    zoom: 16,
  },
};

export function MapWrapper({
  buildings,
  selectedCampus,
  distanceReference,
  onBuildingClick,
  selectedBuilding,
  onSetDistanceReference,
}: MapWrapperProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [AMap, setAMap] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  // 组件挂载后初始化地图
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 获取校区中心点和缩放级别
  const getCenter = (): [number, number] => {
    if (selectedCampus === "all") {
      return [119.108, 36.745]; // 两个校区的中间点
    }
    if (selectedCampus === "kuwen") {
      return CAMPUS_CONFIG.kuwen.center;
    }
    return CAMPUS_CONFIG.binhai.center;
  };

  const getZoom = () => {
    if (selectedCampus === "all") return 12;
    if (selectedCampus === "kuwen") return CAMPUS_CONFIG.kuwen.zoom;
    return CAMPUS_CONFIG.binhai.zoom;
  };

  // 初始化地图 - 在组件挂载后执行
  useEffect(() => {
    // 等待组件完全挂载并且 DOM 元素存在
    if (!isMounted || !mapRef.current) {
      return;
    }

    // 等待下一个事件循环，确保 DOM 已经渲染
    const initMap = () => {
      if (!mapRef.current) {
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_AMAP_KEY || "";
      const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || "";

      // 设置高德地图安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: securityCode,
      };

      // 添加超时处理
      const loadPromise = AMapLoader.load({
        key: apiKey,
        version: "2.0",
        plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.MapType", "AMap.PlaceSearch"],
      });

      // 5 秒超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('高德地图加载超时（5 秒）')), 5000);
      });

      Promise.race([loadPromise, timeoutPromise])
        .then((AMapInstance) => {
          setAMap(AMapInstance);

          const map = new AMapInstance.Map(mapRef.current!, {
            center: getCenter(),
            zoom: getZoom(),
            viewMode: "2D",
            mapStyle: "amap://styles/normal",
          });

          // 添加比例尺
          map.addControl(new AMapInstance.Scale());

          // 添加工具栏
          map.addControl(new AMapInstance.ToolBar());

          // 添加图层切换
          map.addControl(new AMapInstance.MapType({ defaultType: 0 }));

          mapInstance.current = map;
          setMapLoaded(true);
        })
        .catch((err) => {
          console.error("[AMap] 高德地图加载失败:", err);
        });
    };

    // 等待 DOM 渲染完成
    setTimeout(initMap, 0);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
      markersRef.current = [];
    };
  }, [isMounted]);

  // 切换校区时更新地图视图
  useEffect(() => {
    if (mapInstance.current && mapLoaded) {
      mapInstance.current.setCenter(getCenter());
      mapInstance.current.setZoom(getZoom());
    }
  }, [selectedCampus, mapLoaded]);

  // 计算两点之间的距离（Haversine 公式）
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  const estimateWalkingTime = (distance: number) => {
    const WALKING_SPEED = 5;
    return Math.round((distance / WALKING_SPEED) * 60);
  };

  const formatWalkingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}小时`;
    }
    return `${hours}小时${remainingMinutes}分钟`;
  };

  // 渲染建筑标记
  useEffect(() => {
    if (!mapInstance.current || !AMap || !mapLoaded) return;

    // 清除旧标记
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // 添加新标记
    buildings.forEach((markerData) => {
      const iconConfig =
        markerData.building.icon && BUILDING_ICONS[markerData.building.icon]
          ? BUILDING_ICONS[markerData.building.icon]
          : BUILDING_ICONS.school;

      const isHighlighted = selectedBuilding?.building.id === markerData.building.id;
      const scale = isHighlighted ? 1.2 : 1;

      // 创建文字标记
      const content = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          transition: transform 0.2s ease;
          cursor: pointer;
        ">
          <div style="
            background: ${iconConfig.color};
            padding: 4px 10px;
            border-radius: 12px;
            color: white;
            font-size: ${12 * scale}px;
            font-weight: 600;
            white-space: nowrap;
          ">${markerData.building.name}</div>
        </div>
      `;

      const marker = new AMap.Marker({
        position: [markerData.lng, markerData.lat],
        content: content,
        offset: new AMap.Pixel(0, -20),
        map: mapInstance.current,
      });

      // 计算距离信息
      let distanceInfo = "";
      if (distanceReference && distanceReference.building.id !== markerData.building.id) {
        const distance = calculateDistance(
          distanceReference.lat,
          distanceReference.lng,
          markerData.lat,
          markerData.lng
        );
        distanceInfo = `
          <div style="margin-top: 8px; padding: 8px; background: #eef2ff; border-radius: 4px;">
            <p style="font-size: 12px; color: #4338ca; margin: 0 0 4px 0; font-weight: 600;">
              📍 距离 ${distanceReference.building.name}
            </p>
            <p style="font-size: 13px; color: #4338ca; margin: 0;">
              ${formatDistance(distance)} · 步行约${estimateWalkingTime(distance)}
            </p>
          </div>
        `;
      }

      // 教室列表
      let classroomInfo = "";
      if (markerData.building.classrooms && markerData.building.classrooms.length > 0) {
        classroomInfo = `
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 13px; color: #374151; font-weight: 600; margin: 0 0 8px 0;">教室列表</p>
            <div style="max-height: 150px; overflow-y: auto;">
              ${markerData.building.classrooms
                .map(
                  (c) => `
                <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 4px 8px; background: #f9fafb; border-radius: 4px; margin-bottom: 4px;">
                  <span>${c.floor}F - ${c.roomNumber}</span>
                  <span style="color: #9ca3af;">${c.type}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      }

      // 信息窗口内容
      const infoContent = `
        <div style="padding: 12px; min-width: 220px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">
            ${iconConfig.emoji} ${markerData.building.name}
          </h3>
          <p style="font-size: 13px; color: #4b5563; margin: 0 0 8px 0;">${markerData.building.description}</p>
          <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px 0;">📍 ${markerData.building.address}</p>
          <button
            onclick="window.setDistanceReference('${markerData.building.id}')"
            style="width: 100%; padding: 6px 12px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; margin-bottom: 8px;"
          >
            📏 设为距离参考点
          </button>
          ${distanceInfo}
          ${classroomInfo}
        </div>
      `;

      const infoWindow = new AMap.InfoWindow({
        content: infoContent,
        offset: new AMap.Pixel(0, -10),
      });

      // 点击事件
      marker.on("click", () => {
        onBuildingClick(markerData);
        infoWindow.open(mapInstance.current, [markerData.lng, markerData.lat]);
      });

      marker.setMap(mapInstance.current);
      markersRef.current.push(marker);
    });
  }, [buildings, mapLoaded, AMap, selectedBuilding, distanceReference, calculateDistance]);

  // 渲染距离参考点标记
  useEffect(() => {
    if (!mapInstance.current || !AMap || !mapLoaded || !distanceReference) return;

    const refMarker = new AMap.CircleMarker({
      center: [distanceReference.lng, distanceReference.lat],
      radius: 12,
      fillColor: "#ef4444",
      fillOpacity: 0.6,
      strokeColor: "#dc2626",
      strokeWeight: 2,
      map: mapInstance.current,
    });

    const label = new AMap.Text({
      text: `📍 ${distanceReference.building.name}`,
      position: [distanceReference.lng, distanceReference.lat],
      offset: new AMap.Pixel(0, -30),
      style: {
        "background-color": "transparent",
        "font-size": "12px",
        "color": "#dc2626",
        "white-space": "nowrap",
      },
      map: mapInstance.current,
    });

    markersRef.current.push(refMarker, label);

    return () => {
      refMarker.setMap(null);
      label.setMap(null);
    };
  }, [distanceReference, mapLoaded, AMap]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} role="application" aria-label="校园地图" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-white/80 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p>加载高德地图中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
