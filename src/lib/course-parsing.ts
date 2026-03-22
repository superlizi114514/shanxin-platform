/**
 * 解析星期
 */
export function parseDayOfWeek(text: string): number | null {
  const textStr = text.toString().trim();

  const dayMap: Record<string, number> = {
    "周一": 1, "星期一": 1, "1": 1, "一": 1,
    "周二": 2, "星期二": 2, "2": 2, "二": 2,
    "周三": 3, "星期三": 3, "3": 3, "三": 3,
    "周四": 4, "星期四": 4, "4": 4, "四": 4,
    "周五": 5, "星期五": 5, "5": 5, "五": 5,
    "周六": 6, "星期六": 6, "6": 6, "六": 6,
    "周日": 7, "星期日": 7, "7": 7, "日": 7,
  };

  return dayMap[textStr] || null;
}

/**
 * 解析节次时间
 */
export function parsePeriod(text: string): { startTime: string; endTime: string; period?: string } {
  const textStr = text.toString().trim();

  // 标准节次映射（山东信息职业技术学院作息时间）
  const periodMap: Record<string, { start: string; end: string }> = {
    "1": { start: "08:00", end: "08:45" },
    "2": { start: "08:55", end: "09:40" },
    "3": { start: "10:00", end: "10:45" },
    "4": { start: "10:55", end: "11:40" },
    "5": { start: "14:30", end: "15:15" },
    "6": { start: "15:25", end: "16:10" },
    "7": { start: "16:30", end: "17:15" },
    "8": { start: "17:25", end: "18:10" },
    "9": { start: "19:00", end: "19:45" },
    "10": { start: "19:55", end: "20:40" },
    "11": { start: "20:50", end: "21:35" },
    "12": { start: "21:45", end: "22:30" },
  };

  // 匹配 "1-2 节" 或 "1,2 节"
  const match = textStr.match(/(\d+)[-,](\d+)\s*节？/);
  if (match) {
    const startPeriod = parseInt(match[1]);
    const endPeriod = parseInt(match[2]);
    const start = periodMap[startPeriod]?.start || "08:00";
    const end = periodMap[endPeriod]?.end || "09:40";
    return { startTime: start, endTime: end, period: `${startPeriod}-${endPeriod}节` };
  }

  // 匹配单个节次
  const singleMatch = textStr.match(/(\d+)\s*节？/);
  if (singleMatch) {
    const periodNum = parseInt(singleMatch[1]);
    const periodData = periodMap[periodNum];
    if (periodData) {
      return { startTime: periodData.start, endTime: periodData.end, period: `${periodNum}节` };
    }
  }

  // 直接时间格式 HH:MM-HH:MM
  const timeMatch = textStr.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
  if (timeMatch) {
    return { startTime: timeMatch[1], endTime: timeMatch[2] };
  }

  return { startTime: "08:00", endTime: "09:40" };
}

/**
 * 解析周次范围 - 支持多段周次和单双周
 */
export function parseWeekRange(text: string): { weekStart: number; weekEnd: number; weekPattern?: string | null; weekList?: number[] } {
  const textStr = text.toString().trim();

  if (!textStr || textStr.trim() === '') {
    return { weekStart: 1, weekEnd: 16, weekPattern: null, weekList: undefined };
  }

  // 将中文逗号，替换为英文逗号，（全局替换）
  const textNormalized = textStr.replace(/\uFF0C/g, ',');

  // 按逗号分割多个周次段
  const segments = textNormalized.split(',').map(s => s.trim()).filter(s => s);

  const allWeeks: Set<number> = new Set();
  let globalWeekPattern: string | null = null;

  for (const segment of segments) {
    // 检查当前段是否有单双周标记
    const segmentIsEven = segment.includes('(双)') || segment.includes('双');
    const segmentIsOdd = segment.includes('(单)') || segment.includes('(奇)') || segment.includes('单') || segment.includes('奇');

    // 移除此段中的单双周标记和括号、周字
    const cleanSegment = segment.replace(/\(双\)|\(单\)|\(奇\)|\(偶\)|双 | 单 | 奇 | 偶|周/g, '');

    // 匹配范围 "1-2" 或 "1~2"
    const rangeMatch = cleanSegment.match(/(\d+)\s*[-~]\s*(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);

      if (segmentIsEven) {
        // 双周：只添加偶数周
        for (let w = start; w <= end; w++) {
          if (w % 2 === 0) allWeeks.add(w);
        }
      } else if (segmentIsOdd) {
        // 单周：只添加奇数周
        for (let w = start; w <= end; w++) {
          if (w % 2 === 1) allWeeks.add(w);
        }
      } else {
        // 无单双周限制，添加所有周
        for (let w = start; w <= end; w++) {
          allWeeks.add(w);
        }
      }
    } else {
      // 单个周次
      const singleMatch = cleanSegment.match(/(\d+)/);
      if (singleMatch) {
        const week = parseInt(singleMatch[1]);
        allWeeks.add(week);
      }
    }

    // 如果整个文本有单双周标记（没有逗号分隔的混合情况），设置全局 pattern
    if (segments.length === 1) {
      if (segmentIsEven) globalWeekPattern = 'even';
      if (segmentIsOdd) globalWeekPattern = 'odd';
    }
  }

  const weekList = Array.from(allWeeks).sort((a, b) => a - b);

  if (weekList.length === 0) {
    // 默认 1-16 周
    return { weekStart: 1, weekEnd: 16, weekPattern: null, weekList: undefined };
  }

  const weekStart = Math.min(...weekList);
  const weekEnd = Math.max(...weekList);

  return {
    weekStart,
    weekEnd,
    weekPattern: globalWeekPattern,
    weekList,
  };
}
