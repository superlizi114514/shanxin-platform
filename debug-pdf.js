// 本地测试 PDF 解析器 - 不依赖浏览器

const fs = require('fs');

// 设置 DOMMatrix
globalThis.DOMMatrix = globalThis.DOMMatrix || class DOMMatrix {
  a = 1; b = 0; c = 0; d = 0; e = 0; f = 0;
  m11 = 1; m12 = 0; m13 = 0; m14 = 0;
  m21 = 0; m22 = 1; m23 = 0; m24 = 0;
  m31 = 0; m32 = 0; m33 = 1; m34 = 0;
  m41 = 0; m42 = 0; m43 = 0; m44 = 1;
  constructor() {}
  multiply() { return this; }
  transformPoint(point) { return { x: point.x, y: point.y }; }
};

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

// 简化的解析器
const dayMap = {
  '星期一': 1, '周一': 1,
  '星期二': 2, '周二': 2,
  '星期三': 3, '周三': 3,
  '星期四': 4, '周四': 4,
  '星期五': 5, '周五': 5,
  '星期六': 6, '周六': 6,
  '星期日': 7, '周日': 7
};

const periodTimeMap = {
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

function parseFormat4(text) {
  const courses = [];
  const courseBlockRegex = /([^\n(]+) ☆\s*\n\((\d+)-(\d+) 节\)([\d,\-周 () 双单/]+?)\/([^/\n]+?)\/([^/\n]+?)\//g;

  let match;
  while ((match = courseBlockRegex.exec(text)) !== null) {
    const courseName = match[1].trim();
    const startPeriod = parseInt(match[2]);
    const endPeriod = parseInt(match[3]);
    const weekText = match[4];
    const classroomRaw = match[5];
    const teacherRaw = match[6];

    const classroom = classroomRaw.replace(/(?:教室 | 合堂教室 | 公共微机室)/g, '').trim();
    const teacher = teacherRaw.trim();

    if (!courseName || courseName.length < 2) continue;

    // 解析周次
    const weeks = new Set();
    const rangeRegex = /(\d+)-(\d+) 周/g;
    let weekMatch;
    while ((weekMatch = rangeRegex.exec(weekText)) !== null) {
      const start = parseInt(weekMatch[1]);
      const end = parseInt(weekMatch[2]);
      for (let i = start; i <= end; i++) weeks.add(i);
    }

    const weekList = Array.from(weeks);
    const weekStart = weekList.length > 0 ? Math.min(...weekList) : 1;
    const weekEnd = weekList.length > 0 ? Math.max(...weekList) : 16;

    const startTime = periodTimeMap[startPeriod]?.start || '';
    const endTime = periodTimeMap[endPeriod]?.end || '';

    // 确定星期
    const beforeText = text.substring(0, match.index);
    const dayMatches = [...beforeText.matchAll(/星期 ([一二三四五六日])/g)];
    const lastDayMatch = dayMatches.length > 0 ? dayMatches[dayMatches.length - 1][0] : null;
    const dayOfWeek = lastDayMatch ? dayMap[lastDayMatch] || 0 : 0;

    if (dayOfWeek === 0) continue;

    courses.push({
      courseName,
      teacher,
      classroom,
      dayOfWeek,
      startTime,
      endTime,
      period: `${startPeriod}-${endPeriod}节`,
      weekStart,
      weekEnd,
    });

    console.log(`解析到课程：${courseName} | 周${dayOfWeek} | ${classroom} | ${teacher}`);
  }

  return courses;
}

async function testPDF(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('文件不存在:', filePath);
    return;
  }

  console.log('读取文件:', filePath);
  const dataBuffer = fs.readFileSync(filePath);
  console.log('文件大小:', dataBuffer.length, 'bytes');

  const loadingTask = pdfjsLib.getDocument({
    data: dataBuffer,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  console.log('页数:', pdf.numPages);

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  console.log('\n========== 提取的文本前 500 字符 ==========');
  console.log(fullText.substring(0, 500));
  console.log('\n========== 开始解析课表 ==========');

  const courses = parseFormat4(fullText);
  console.log('\n========== 解析结果 ==========');
  console.log('解析到', courses.length, '门课程');

  if (courses.length === 0) {
    console.log('未解析到课程，检查正则表达式是否匹配');
    // 检查是否有 ☆ 标记
    if (fullText.includes('☆')) {
      console.log('找到☆标记，但正则未匹配');
    } else {
      console.log('未找到☆标记');
    }
  }
}

// 测试 - 使用短路径
const testFile = 'test-schedule.pdf';
if (fs.existsSync(testFile)) {
  testPDF(testFile).catch(e => console.log('错误:', e.message));
} else {
  console.log('请将 PDF 文件复制到当前目录并重命名为 test-schedule.pdf');
  console.log('当前目录:', process.cwd());
  console.log('存在的 PDF 文件:');
  const files = fs.readdirSync('.').filter(f => f.endsWith('.pdf'));
  files.forEach(f => console.log(' -', f));
}
