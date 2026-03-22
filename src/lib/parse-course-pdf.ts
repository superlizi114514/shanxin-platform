/**
 * 课程表 PDF 解析器 - TypeScript 版本
 * 使用 pdfjs-dist 解析 PDF，智能重组文本行为表格结构
 */

import * as pdfjsLib from 'pdfjs-dist';

// 设置 Worker，使用 legacy 构建
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

// 节次时间映射（山东信息职业技术学院）
const PERIOD_TIME: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:55', end: '09:40' },
  3: { start: '10:00', end: '10:45' },
  4: { start: '10:55', end: '11:40' },
  5: { start: '14:00', end: '14:45' },
  6: { start: '14:55', end: '15:40' },
  7: { start: '16:00', end: '16:45' },
  8: { start: '16:55', end: '17:40' },
  9: { start: '18:30', end: '19:15' },
  10: { start: '19:25', end: '20:10' },
};

// 星期映射
const DAY_MAP: Record<string, number> = {
  星期一：1, 周一：1,
  星期二：2, 周二：2,
  星期三：3, 周三：3,
  星期四：4, 周四：4,
  星期五：5, 周五：5,
  星期六：6, 周六：6,
  星期日：7, 周日：7,
};

// 课程类型符号映射
const COURSE_TYPE_MAP: Record<string, string> = {
  '☆': '讲授',
  '★': '实验',
  '◎': '上机',
  '●': '实践',
  '※': '其它',
  '▣': '课程设计',
  '▤': '线上',
  '▥': '理实一体',
  '▦': '实习',
};

// 课程类型符号正则
const COURSE_TYPE_PATTERN = /[☆★◎●※▣▤▥▦]/;

export interface Course {
  course_name: string;
  teacher: string;
  classroom: string;
  day_of_week: number;
  start_period: string;
  end_period: string;
  period: string;
  start_time: string;
  end_time: string;
  week_range: string;
  weekStart: number;
  weekEnd: number;
  weekPattern: string | null;
  weekList: number[] | null;
  course_type: string; // 课程类型：讲授/实验/上机/实践/其它/课程设计/线上/理实一体/实习
  course_symbol: string; // 原始符号：☆★◎●※▣▤▥▦
}

/**
 * 解析周次范围
 */
function parseWeekRange(text: string): {
  weekStart: number;
  weekEnd: number;
  weekPattern: string | null;
  weekList: number[] | null;
} {
  if (!text || text.trim() === '') {
    return { weekStart: 1, weekEnd: 16, weekPattern: null, weekList: null };
  }

  // 中文逗号转英文
  text = text.replace(/\uFF0C/g, ',');
  const segments = text.split(',').map(s => s.trim()).filter(s => s);

  const allWeeks = new Set<number>();
  let weekPattern: string | null = null;

  for (const segment of segments) {
    const isEven = segment.includes('(双)') || segment.includes('双');
    const isOdd = segment.includes('(单)') || segment.includes('(奇)') ||
                  segment.includes('单') || segment.includes('奇');

    // 清理标记
    const clean = segment.replace(/\(双\)|\(单\)|\(奇\)|\(偶\)| 双 | 单 | 奇 | 偶 | 周/g, '');

    // 匹配范围 1-5 或 1~5
    const rangeMatch = clean.match(/(\d+)\s*[-~]\s*(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1]);
      const end = parseInt(rangeMatch[2]);
      if (isEven) {
        for (let w = start; w <= end; w++) {
          if (w % 2 === 0) allWeeks.add(w);
        }
      } else if (isOdd) {
        for (let w = start; w <= end; w++) {
          if (w % 2 === 1) allWeeks.add(w);
        }
      } else {
        for (let w = start; w <= end; w++) allWeeks.add(w);
      }
    } else {
      // 单个周次
      const singleMatch = clean.match(/(\d+)/);
      if (singleMatch) {
        allWeeks.add(parseInt(singleMatch[1]));
      }
    }
  }

  // 单双周标记
  if (segments.length === 1) {
    if (text.includes('(双)') || text.includes('双')) {
      weekPattern = 'even';
    } else if (text.includes('(单)') || text.includes('单')) {
      weekPattern = 'odd';
    }
  }

  const weekList = allWeeks.size > 0 ? Array.from(allWeeks).sort() : null;

  return {
    weekStart: weekList?.[0] ?? 1,
    weekEnd: weekList?.[weekList.length - 1] ?? 16,
    weekPattern,
    weekList,
  };
}

/**
 * 按 y 坐标分组文本项（同一行）
 */
function groupByYPosition(
  items: Array<{ str: string; transform: number[]; hasEOL?: boolean }>
): string[][] {
  if (items.length === 0) return [];

  // 按 y 坐标分组（允许 5 像素误差）
  const EPSILON = 5;
  const rows: Map<number, string[]> = new Map();

  for (const item of items) {
    if (!item.str.trim()) continue;

    // transform[5] 是 y 坐标
    const y = item.transform[5];

    // 找最近的行
    let foundRow = false;
    for (const [rowY, rowItems] of rows.entries()) {
      if (Math.abs(y - rowY) < EPSILON) {
        rowItems.push(item.str);
        foundRow = true;
        break;
      }
    }

    if (!foundRow) {
      rows.set(y, [item.str]);
    }
  }

  // 按 y 坐标从上到下排序（y 越大越靠上）
  const sortedRows = Array.from(rows.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([_, items]) => items);

  return sortedRows;
}

/**
 * 从文本行中提取课程
 */
function extractCoursesFromRows(rows: string[][]): Course[] {
  const courses: Course[] = [];
  let currentDay = 0;

  for (const row of rows) {
    const rowText = row.join(' ');

    // 检测星期
    for (const [dayText, dayNum] of Object.entries(DAY_MAP)) {
      if (rowText.includes(dayText) || rowText.includes(`周${dayText}`)) {
        currentDay = dayNum;
        break;
      }
    }

    if (currentDay === 0) continue;

    // 查找带课程类型符号的课程
    for (const cell of row) {
      if (!cell || !COURSE_TYPE_PATTERN.test(cell)) continue;

      // 提取课程名（去掉符号）
      const symbol = cell.match(/[☆★◎●※▣▤▥▦]/)?.[0] || '';
      const courseName = cell.replace(/[☆★◎●※▣▤▥▦]/g, '').trim();
      if (courseName.length < 2 || courseName.length > 50) continue;

      // 合并整行信息
      const fullInfo = row.join(' ');

      // 解析节次 (X-Y 节)
      const periodMatch = fullInfo.match(/\((\d+)-(\d+) 节\)/);
      if (!periodMatch) continue;

      const startPeriod = parseInt(periodMatch[1]);
      const endPeriod = parseInt(periodMatch[2]);

      // 解析周次
      const afterPeriod = fullInfo.substring(periodMatch.index! + periodMatch[0].length);
      const weekMatch = afterPeriod.match(/^([\d, 周双单 ()\-~☆★◎●※▣▤▥▦]+)/);
      const weekText = weekMatch ? weekMatch[1] : '';

      // 解析教室和教师（/分隔）
      const remaining = weekMatch ? afterPeriod.substring(weekMatch[0].length) : afterPeriod;
      const parts = remaining.split('/').map(p => p.trim()).filter(p => p);

      const classroom = parts[0]
        ?.replace('教室', '')
        .replace('合堂', '')
        .trim() ?? '';
      const teacher = parts[1]?.trim() ?? '';

      // 解析周次
      const weekInfo = parseWeekRange(weekText);

      // 节次转时间
      const startTime = PERIOD_TIME[startPeriod]?.start ?? '';
      const endTime = PERIOD_TIME[endPeriod]?.end ?? '';

      courses.push({
        course_name: courseName,
        teacher,
        classroom,
        day_of_week: currentDay,
        start_period: String(startPeriod),
        end_period: String(endPeriod),
        period: `${startPeriod}-${endPeriod}节`,
        start_time: startTime,
        end_time: endTime,
        week_range: weekText,
        weekStart: weekInfo.weekStart,
        weekEnd: weekInfo.weekEnd,
        weekPattern: weekInfo.weekPattern,
        weekList: weekInfo.weekList,
        course_type: COURSE_TYPE_MAP[symbol] || '未知',
        course_symbol: symbol,
      });
    }
  }

  return courses;
}

/**
 * 解析 PDF 课程表
 */
export async function parseCourseSchedulePDF(
  pdfData: ArrayBuffer | Uint8Array
): Promise<{ success: boolean; count: number; courses: Course[]; error?: string }> {
  try {
    // 转换为 Uint8Array
    const uint8Data = pdfData instanceof Uint8Array ? pdfData : new Uint8Array(pdfData);

    // 加载 PDF
    const pdf = await pdfjsLib.getDocument({ data: uint8Data }).promise;

    const allRows: string[][] = [];

    // 遍历所有页面
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // 提取文本项
      const items = textContent.items.map((item: any) => ({
        str: item.str,
        transform: item.transform || [1, 0, 0, 1, 0, 0],
        hasEOL: item.hasEOL,
      }));

      // 按行分组
      const rows = groupByYPosition(items);
      allRows.push(...rows);
    }

    // 提取课程
    const courses = extractCoursesFromRows(allRows);

    if (courses.length === 0) {
      return {
        success: false,
        count: 0,
        courses: [],
        error: '未解析到课程数据，请确保 PDF 格式正确',
      };
    }

    return {
      success: true,
      count: courses.length,
      courses,
    };
  } catch (error: any) {
    console.error('PDF 解析错误:', error);
    return {
      success: false,
      count: 0,
      courses: [],
      error: `解析失败：${error.message}`,
    };
  }
}
