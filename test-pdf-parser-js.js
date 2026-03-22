/**
 * 测试 PDF 解析器 - 直接运行验证
 */

const fs = require('fs');
const path = require('path');

// 设置 DOMMatrix polyfill（必须在导入 pdfjs 之前）
globalThis.DOMMatrix = class DOMMatrix {
  a = 1; b = 0; c = 0; d = 0; e = 0; f = 0;
  m11 = 1; m12 = 0; m13 = 0; m14 = 0;
  m21 = 0; m22 = 1; m23 = 0; m24 = 0;
  m31 = 0; m32 = 0; m33 = 1; m34 = 0;
  m41 = 0; m42 = 0; m43 = 0; m44 = 1;
  multiply() { return this; }
  transformPoint(point) { return { x: point.x, y: point.y }; }
};

// 使用动态导入处理 ESM 模块
async function loadPDFLib() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // 设置 worker
  const workerPath = path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
  const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`).href;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  return pdfjsLib.default || pdfjsLib;
}

// 节次时间映射
const PERIOD_TIME = {
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
const DAY_MAP = {
  '星期一': 1, '周一': 1,
  '星期二': 2, '周二': 2,
  '星期三': 3, '周三': 3,
  '星期四': 4, '周四': 4,
  '星期五': 5, '周五': 5,
  '星期六': 6, '周六': 6,
  '星期日': 7, '周日': 7,
};

// 课程类型符号映射
const COURSE_TYPE_MAP = {
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

function parseWeekRange(text) {
  if (!text || text.trim() === '') {
    return { weekStart: 1, weekEnd: 16, weekPattern: null, weekList: null };
  }

  text = text.replace(/\uFF0C/g, ',');
  const segments = text.split(',').map(s => s.trim()).filter(s => s);

  const allWeeks = new Set();
  let weekPattern = null;

  for (const segment of segments) {
    const isEven = segment.includes('(双)') || segment.includes('双');
    const isOdd = segment.includes('(单)') || segment.includes('(奇)') ||
                  segment.includes('单') || segment.includes('奇');

    const clean = segment.replace(/\(双\)|\(单\)|\(奇\)|\(偶\)| 双 | 单 | 奇 | 偶 | 周/g, '');

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
      const singleMatch = clean.match(/(\d+)/);
      if (singleMatch) {
        allWeeks.add(parseInt(singleMatch[1]));
      }
    }
  }

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
 * 关键：用 transform 矩阵的 y 坐标来分组
 */
function groupByYPosition(items) {
  if (items.length === 0) return [];

  // 按 y 坐标分组（允许 8 像素误差 - 考虑不同字体大小）
  const EPSILON = 8;
  const rows = new Map();

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
function extractCoursesFromRows(rows) {
  const courses = [];
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

      // 提取符号
      const symbol = cell.match(/[☆★◎●※▣▤▥▦]/)?.[0] || '';

      // 提取课程名（去掉符号）
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
      const periodIndex = fullInfo.indexOf(periodMatch[0]);
      const afterPeriod = fullInfo.substring(periodIndex + periodMatch[0].length);
      const weekMatch = afterPeriod.match(/^([\d, 周双单 ()\-~☆★◎●※▣▤▥▦]+)/);
      const weekText = weekMatch ? weekMatch[1] : '';

      // 解析教室和教师（/分隔）
      const remaining = weekMatch ? afterPeriod.substring(weekMatch[0].length) : afterPeriod;
      const parts = remaining.split('/').map(p => p.trim()).filter(p => p);

      const classroom = parts[0]?.replace('教室', '').replace('合堂', '').trim() ?? '';
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

async function parseCourseSchedulePDF(pdfPath, pdfjsLib) {
  console.log('正在读取 PDF:', pdfPath);
  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Data = new Uint8Array(pdfBuffer);

  console.log('加载 PDF...');

  const pdf = await pdfjsLib.getDocument({ data: uint8Data }).promise;
  console.log('PDF 加载成功，页数:', pdf.numPages);

  const allRows = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    console.log(`\n解析第 ${pageNum} 页...`);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    console.log(`  文本项数量：${textContent.items.length}`);

    // 提取文本项
    const items = textContent.items.map((item) => ({
      str: item.str,
      transform: item.transform || [1, 0, 0, 1, 0, 0],
      hasEOL: item.hasEOL,
    }));

    // 按行分组
    const rows = groupByYPosition(items);
    console.log(`  分组后的行数：${rows.length}`);

    // 打印前几行看看
    rows.slice(0, 3).forEach((row, i) => {
      console.log(`    行 ${i}: [${row.join(' | ')}]`);
    });

    allRows.push(...rows);
  }

  console.log(`\n总行数：${allRows.length}`);
  console.log('提取课程...');

  const courses = extractCoursesFromRows(allRows);

  console.log(`\n提取到 ${courses.length} 门课程:`);
  courses.slice(0, 5).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.course_name} - 周${c.day_of_week} - ${c.period} - ${c.classroom}`);
  });

  return {
    success: courses.length > 0,
    count: courses.length,
    courses,
  };
}

// 查找 PDF 文件
const pdfFiles = fs.readdirSync('.').filter(f => f.endsWith('.pdf'));
if (pdfFiles.length === 0) {
  console.log('未找到 PDF 文件');
  process.exit(1);
}

console.log('使用 PDF 文件:', pdfFiles[0]);

// 主函数
async function main() {
  const pdfjsLib = await loadPDFLib();
  await parseCourseSchedulePDF(pdfFiles[0], pdfjsLib);
}

main().catch(console.error);
