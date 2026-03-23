"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { calculateDistance, estimateWalkingTime, formatDistance, formatWalkingTime } from "@/lib/distance";
import dynamic from "next/dynamic";
import { CAMPUS_CONFIG, BUILDING_ICONS } from "@/constants/map-constants";

// 使用动态导入来避免 SSR 问题
const MapWrapper = dynamic(() => import("@/components/MapWrapper").then(mod => mod.MapWrapper), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-gray-500">
      加载地图中...
    </div>
  ),
});

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

export default function CampusMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <MapContent />
    </Suspense>
  );
}

function MapContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [buildings, setBuildings] = useState<BuildingMarker[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingMarker | null>(null);
  const [distanceReference, setDistanceReference] = useState<BuildingMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<string>("kuwen"); // 默认奎文校区
  const [activeTab, setActiveTab] = useState<"map" | "list">("map");

  // 加载状态 - 等待 session 验证
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 从 URL 参数读取校区设置（可选覆盖默认值）
  useEffect(() => {
    const campusParam = searchParams?.get("campus");
    if (campusParam) {
      setSelectedCampus(campusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchBuildings();
  }, [selectedCampus]);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCampus !== "all") {
        params.set("campus", selectedCampus);
      }

      const response = await fetch(`/api/campus-buildings?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        const markers: BuildingMarker[] = data.buildings.map((building: CampusBuilding) => {
          const coords = JSON.parse(building.coordinates);
          return {
            building,
            lat: coords.lat,
            lng: coords.lng,
          };
        });

        setBuildings(markers);
      }
    } catch (error) {
      console.error("获取建筑数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingClick = useCallback((marker: BuildingMarker) => {
    setSelectedBuilding(marker);
  }, []);

  const handleSetDistanceReference = useCallback((marker: BuildingMarker) => {
    setDistanceReference(marker);
  }, []);

  // 暴露全局函数供高德地图信息窗口调用
  useEffect(() => {
    (window as any).setDistanceReference = (buildingId: string) => {
      const marker = buildings.find(m => m.building.id === buildingId);
      if (marker) {
        handleSetDistanceReference(marker);
      }
    };
    return () => {
      delete (window as any).setDistanceReference;
    };
  }, [buildings, handleSetDistanceReference]);

  if (!session) {
    router.push("/login");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">正在跳转登录...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🗺️ 校园地图</h1>
              <p className="text-sm text-gray-600 mt-1">山东信息职业技术学院 - 奎文 / 滨海</p>
            </div>
            <button
              onClick={() => router.push("/schedule")}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              aria-label="返回课表页面"
            >
              返回课表
            </button>
          </div>

          {/* 校区选择器 */}
          <div className="mt-4 flex items-center gap-2" role="group" aria-label="校区选择">
            <span className="text-sm font-medium text-gray-700">校区:</span>
            <button
              onClick={() => {
                setSelectedCampus("all");
              }}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedCampus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-pressed={selectedCampus === "all"}
            >
              全部
            </button>
            <button
              onClick={() => setSelectedCampus("kuwen")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedCampus === "kuwen"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-pressed={selectedCampus === "kuwen"}
            >
              🏫 奎文校区
            </button>
            <button
              onClick={() => setSelectedCampus("binhai")}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedCampus === "binhai"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-pressed={selectedCampus === "binhai"}
            >
              🌊 滨海校区
            </button>

            {/* 视图切换 */}
            <div className="ml-auto flex gap-1 bg-gray-100 rounded-md p-1" role="group" aria-label="视图切换">
              <button
                onClick={() => setActiveTab("map")}
                className={`px-3 py-1.5 text-sm rounded ${
                  activeTab === "map" ? "bg-white shadow text-gray-900" : "text-gray-600"
                }`}
                aria-pressed={activeTab === "map"}
              >
                地图
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1.5 text-sm rounded ${
                  activeTab === "list" ? "bg-white shadow text-gray-900" : "text-gray-600"
                }`}
                aria-pressed={activeTab === "list"}
              >
                列表
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">加载地图数据中...</p>
            </div>
          </div>
        ) : activeTab === "map" ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: "600px" }}>
            <MapWrapper
              buildings={buildings}
              selectedCampus={selectedCampus}
              distanceReference={distanceReference}
              onBuildingClick={handleBuildingClick}
              selectedBuilding={selectedBuilding}
              onSetDistanceReference={handleSetDistanceReference}
            />
          </div>
        ) : (
          // 列表视图
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((marker) => {
              const distance = distanceReference && distanceReference.building.id !== marker.building.id
                ? calculateDistance(distanceReference.lat, distanceReference.lng, marker.lat, marker.lng)
                : null;

              const iconConfig = BUILDING_ICONS[marker.building.icon as keyof typeof BUILDING_ICONS] || BUILDING_ICONS.school;

              return (
                <div
                  key={marker.building.id}
                  onClick={() => handleBuildingClick(marker)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleBuildingClick(marker);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`查看${marker.building.name}详情`}
                  className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${
                    selectedBuilding?.building.id === marker.building.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${iconConfig.color}20` }}
                      aria-hidden="true"
                    >
                      {iconConfig.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{marker.building.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          marker.building.campus === "kuwen"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {marker.building.campus === "kuwen" ? "奎文" : "滨海"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{marker.building.description}</p>
                      <p className="text-xs text-gray-400 mt-1">📍 {marker.building.address}</p>
                      {distance !== null && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600">
                          <span>📏 {formatDistance(distance)}</span>
                          <span>步行约 {formatWalkingTime(estimateWalkingTime(distance))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 图例 */}
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-900 mb-3">图例</h3>
          <div className="flex flex-wrap gap-4 text-sm" role="list" aria-label="地图图例">
            <div className="flex items-center gap-2" role="listitem">
              <span className="text-xl" aria-hidden="true">🏫</span>
              <span>教学楼</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <span className="text-xl" aria-hidden="true">🏭</span>
              <span>实训楼</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <span className="text-xl" aria-hidden="true">📚</span>
              <span>图书馆</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <span className="text-xl" aria-hidden="true">🍽️</span>
              <span>食堂</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <span className="text-xl" aria-hidden="true">🏠</span>
              <span>宿舍</span>
            </div>
            <div className="flex items-center gap-2" role="listitem">
              <span className="text-xl" aria-hidden="true">🏟️</span>
              <span>体育场</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: CAMPUS_CONFIG.kuwen.color }} aria-hidden="true"></div>
              <span>奎文校区</span>
              <div className="w-4 h-4 rounded ml-2" style={{ backgroundColor: CAMPUS_CONFIG.binhai.color }} aria-hidden="true"></div>
              <span>滨海校区</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
