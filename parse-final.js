// 最终版解析器 - 简单直接的行处理
const { exec } = require('child_process');
const path = require('path');

async function parseScheduleFinal() {
  const pythonScript = path.join(process.cwd(), 'extract-pdf-json.py');
  const command = `python "${pythonScript}"`;

  const textResult = await new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(JSON.parse(stdout.trim()));
    });
  });

  if (!textResult.success) {
    console.log('Python 提取失败:', textResult.error);
    return;
  }

  const text = textResult.text;
  const lines = text.split('\n');

  console.log('=== 最终版解析器 ===\n');

  const courses = [];
  const dayMap = {
    '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4,
    '星期五': 5, '星期六': 6, '星期日': 7
  };

  let currentDay = 0;
  let currentPeriod = null;
  let headerFound = false;

  // 第一步：解析表头确定星期列位置
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 找到表头行
    if (line.includes('星期一') && line.includes('节次')) {
      headerFound = true;
      console.log('找到表头行');
      continue;
    }

    if (!headerFound) continue;

    // 检测节次行
    const periodMatch = line.match(/^\s*(\d+)\s*$/);
    if (periodMatch) {
      currentPeriod = periodMatch[1];
      console.log(`\n=== 节次 ${currentPeriod} ===`);
      continue;
    }

    // 检测课程名行（包含☆但不是详情行）
    if (line.includes('☆') && currentPeriod && !line.trim().startsWith('(')) {
      // 分割课程（按☆分割）
      const parts = line.split('☆').filter(p => p.trim());

      // 每个部分是一个课程名
      parts.forEach((part, idx) => {
        const courseName = part.trim();
        if (courseName.length < 2 || courseName.length > 30) return;

        // 星期几：根据索引映射（0=星期一，1=星期二...）
        // 但需要看表头确定
        const dayOfWeek = idx + 1; // 简化：假设从星期一开始

        console.log(`  课程：${courseName} (星期${dayOfWeek}, 节次${currentPeriod})`);

        courses.push({
          name: courseName,
          day: dayOfWeek,
          period: currentPeriod,
          detailIndex: idx
        });
      });
    }
  }

  console.log(`\n\n共找到 ${courses.length} 门课程`);

  // 第二步：为每个课程查找详情
  console.log('\n=== 查找课程详情 ===\n');

  const fullText = text;

  courses.forEach((course, idx) => {
    // 查找详情：(节次) 周次/教室/教师
    const pattern = new RegExp(
      `\\((\\d+)-(\\d+) 节\\)([^/]{0,40}?)/( [^/]{0,30}?)/([^/\\n]{0,20}?)`
    );

    // 从课程名后面开始查找
    const nameIdx = fullText.indexOf(course.name + '☆');
    if (nameIdx < 0) return;

    const afterName = fullText.substring(nameIdx);
    const match = afterName.match(/\((\d+)-(\d+) 节\)([^/\n]+)\/([^/\n]+)\/([^/\n]+)/);

    if (match) {
      course.weekRange = match[3].trim();
      course.classroom = match[4].trim();
      course.teacher = match[5].trim();
      course.startPeriod = match[1];
      course.endPeriod = match[2];

      console.log(`${idx + 1}. ${course.name}`);
      console.log(`   星期${course.day}, 节次${course.startPeriod}-${course.endPeriod}`);
      console.log(`   周次：${course.weekRange.substring(0, 30)}`);
      console.log(`   教室：${course.classroom}`);
      console.log(`   教师：${course.teacher}`);
    } else {
      console.log(`${idx + 1}. ${course.name} - 未找到详情`);
    }
  });

  return courses;
}

parseScheduleFinal().catch(console.error);
