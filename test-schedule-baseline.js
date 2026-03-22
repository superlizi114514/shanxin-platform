/**
 * PDF 课程表解析基线测试
 * 测试现有解析器能提取多少条课程
 */
const fs = require('fs');
const path = require('path');

// 使用 Python pdfplumber 提取 PDF 文本
const { exec } = require('child_process');

async function extractPdfText(pdfPath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, 'extract-pdf-json.py');
    const command = `python "${pythonScript}" "${pdfPath}"`;

    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Python 执行失败：${error.message}`));
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (result.success) {
          resolve(result.text);
        } else {
          reject(new Error(result.error || 'PDF 提取失败'));
        }
      } catch (e) {
        reject(new Error(`JSON 解析失败：${stdout.substring(0, 500)}`));
      }
    });
  });
}

// 简化的 parseFormat5 逻辑（直接从 ts 复制核心正则）
function parseFormat5(text) {
  const courses = [];
  const dayMap = {
    '星期一': 1, '周一': 1,
    '星期二': 2, '周二': 2,
    '星期三': 3, '周三': 3,
    '星期四': 4, '周四': 4,
    '星期五': 5, '周五': 5,
    '星期六': 6, '周六': 6,
    '星期日': 7, '周日': 7
  };

  // 课程正则（从 pdf-parser-format5.ts 复制）
  const coursePattern = /([^\n☆★◎●※]+)([☆★◎●※])\s*\n?\((\d+)-(\d+)\s* 节 \)([^/]+)\/(K[^\s/]+(?:教室 | 合堂 | 微机室 | 中心 | 室 | 场)?[^\s/]*)\s*\/([^\n/]+)/g;

  let match;
  while ((match = coursePattern.exec(text)) !== null) {
    const courseNameRaw = match[1].trim();
    const courseTypeSymbol = match[2];
    const startPeriod = parseInt(match[3]);
    const endPeriod = parseInt(match[4]);
    const weekRange = match[5].trim();
    const classroomRaw = match[6];
    const teacherRaw = match[7];

    const courseName = courseNameRaw.replace(/^\d+\s*/, '').trim();

    // 清理教室
    const classroom = classroomRaw
      .replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)/g, '')
      .trim();

    // 清理教师
    const teacherMatch = teacherRaw.match(/^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+外教)/);
    const teacher = teacherMatch ? teacherMatch[1] : '';

    if (!courseName || courseName.length < 2 || !teacher) continue;

    courses.push({
      courseName,
      classroom,
      teacher,
      period: `${startPeriod}-${endPeriod}节`,
      weekRange,
      position: match.index
    });
  }

  // 确定星期几
  const dayPositions = [];
  const daysOfWeek = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

  for (const day of daysOfWeek) {
    const idx = text.indexOf(day);
    if (idx !== -1) {
      dayPositions.push({ day, position: idx, dayNum: dayMap[day] });
    }
  }

  const result = courses.map(course => {
    let dayOfWeek = 1;
    let closestDayPosition = -1;
    for (const dp of dayPositions) {
      if (dp.position < course.position && dp.position > closestDayPosition) {
        closestDayPosition = dp.position;
        dayOfWeek = dp.dayNum;
      }
    }
    return { ...course, dayOfWeek };
  });

  // 去重
  const seen = new Set();
  const unique = result.filter(c => {
    const key = `${c.courseName}-${c.period}-${c.classroom}-${c.teacher}-${c.dayOfWeek}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}

async function runTest() {
  const pdfPath = path.join(__dirname, '李涵 (2025-2026-2) 课表.pdf');

  console.log('='.repeat(60));
  console.log('PDF 课程表解析基线测试');
  console.log('='.repeat(60));
  console.log(`PDF 文件：${pdfPath}`);

  if (!fs.existsSync(pdfPath)) {
    console.error('错误：PDF 文件不存在');
    return;
  }

  console.log('\n[1/3] 正在提取 PDF 文本...');
  const text = await extractPdfText(pdfPath);
  console.log(`✓ 文本提取完成，长度：${text.length} 字符`);

  console.log('\n[2/3] PDF 文本预览 (前 1000 字符):');
  console.log('-'.repeat(60));
  console.log(text.substring(0, 1000));
  console.log('-'.repeat(60));

  console.log('\n[3/3] 正在解析课程...');
  const courses = parseFormat5(text);

  console.log('\n' + '='.repeat(60));
  console.log(`解析结果：${courses.length} 条课程`);
  console.log('='.repeat(60));

  if (courses.length === 0) {
    console.log('\n⚠️  警告：未解析到任何课程！');
    console.log('可能原因：');
    console.log('  1. 正则表达式不匹配 PDF 格式');
    console.log('  2. PDF 文本格式与预期不同');
    console.log('  3. 教室匹配模式"K"开头不正确');
  } else {
    console.log('\n课程列表:');
    courses.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.courseName} | 周${c.dayOfWeek} | ${c.period} | ${c.classroom} | ${c.teacher}`);
    });
  }

  // 保存提取的文本用于分析
  fs.writeFileSync(path.join(__dirname, 'extracted-schedule-text.txt'), text);
  console.log(`\n✓ 提取的文本已保存到：extracted-schedule-text.txt`);
}

runTest().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
