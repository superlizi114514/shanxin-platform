/**
 * 格式 5：山东信息职业技术学院教务系统格式（横向表格）
 * 格式：按星期列分布，每列包含多个课程
 *
 * 符号说明：
 * - ☆: 讲授 ★: 实验 ◎: 上机 ●: 实践 ※: 其它
 * - : 课程设计 : 线上 : 理实一体 : 实习
 * - 4-6 周 (双): 双周上课，单周不上
 * - 4-6 周 (单): 单周上课，双周不上
 */
export function parseFormat5(text: string, dayMap: Record<string, number>, userId: string) {
  const courses: Array<{
    courseName: string;
    teacher: string | null;
    classroom: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    period: string;
    weekStart: number;
    weekEnd: number;
    weekPattern: string | null;
    notes: string | null;
    userId: string;
  }> = [];

  // 节次到时间映射
  const periodTimeMap: Record<number, { start: string; end: string }> = {
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

  // 课程类型符号映射
  const courseTypeMap: Record<string, string> = {
    '☆': '讲授',
    '★': '实验',
    '◎': '上机',
    '●': '实践',
    '※': '其它',
  };

  // 从文本中提取星期几分组
  // 格式：时间段 节次 星期一 星期二...
  // 使用正则表达式找到每个课程块：课程名☆\n(节次) 周次/教室/教师
  const coursePattern = /([^\n☆★◎●※]+)([☆★◎●※])\s*\n?\((\d+)-(\d+)\s*节 \)([^/]+)\/(K[^\s/]+(?:教室 | 合堂 | 微机室 | 中心 | 室 | 场)?[^\s/]*)\s*\/([^\n/]+)/g;

  let match;
  const foundCourses: Array<{
    courseName: string;
    courseType: string;
    periodText: string;
    startPeriod: number;
    endPeriod: number;
    weekRange: string;
    classroom: string;
    teacher: string;
    position: number;
    weekStart: number;
    weekEnd: number;
  }> = [];

  while ((match = coursePattern.exec(text)) !== null) {
    const courseNameRaw = match[1].trim();
    const courseTypeSymbol = match[2];
    const startPeriod = parseInt(match[3]);
    const endPeriod = parseInt(match[4]);
    const weekRange = match[5].trim();
    const classroomRaw = match[6];
    const teacherRaw = match[7];

    // 清理课程名（移除前导数字和空格）
    const courseName = courseNameRaw.replace(/^\d+\s*/, '').trim();

    // 跳过包含无效字符的课程名
    if (!courseName || courseName.length < 2 || courseName.includes('考试') || courseName.includes('无/')) {
      continue;
    }

    // 清理教室
    const classroom = classroomRaw
      .replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证|与)/g, '')
      .trim();

    // 清理教师（提取 2-6 个中文字符，允许"外教"）
    const teacherMatch = teacherRaw.match(/^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+外教)/);
    const teacher = teacherMatch ? teacherMatch[1] : '';

    // 跳过无效教师
    if (!teacher) continue;

    // 解析周次
    const weeks = new Set<number>();

    // 匹配周次范围：1-2 周，4-6 周，7-8 周 等
    const weekRangePattern = /(\d+)(?:-(\d+))? 周?/g;
    let weekMatch;
    const weekText = weekRange.replace(/\s+/g, '');

    while ((weekMatch = weekRangePattern.exec(weekText)) !== null) {
      const start = parseInt(weekMatch[1]);
      const end = weekMatch[2] ? parseInt(weekMatch[2]) : start;
      for (let w = start; w <= end; w++) {
        weeks.add(w);
      }
    }

    // 处理单双周
    const isEvenWeek = weekRange.includes('(双)');
    const isOddWeek = weekRange.includes('(单)');
    const weekPattern = isEvenWeek ? 'even' : isOddWeek ? 'odd' : null;

    if (weekPattern) {
      const filteredWeeks = new Set<number>();
      weeks.forEach(w => {
        if ((isEvenWeek && w % 2 === 0) || (isOddWeek && w % 2 !== 0)) {
          filteredWeeks.add(w);
        }
      });
      weeks.clear();
      filteredWeeks.forEach(w => weeks.add(w));
    }

    // 如果没有解析到周次，使用默认值
    const weekList = Array.from(weeks);
    const weekStart = weekList.length > 0 ? Math.min(...weekList) : 1;
    const weekEnd = weekList.length > 0 ? Math.max(...weekList) : 16;

    // 获取课程类型
    const courseType = courseTypeMap[courseTypeSymbol] || '讲授';

    foundCourses.push({
      courseName,
      courseType,
      periodText: `${startPeriod}-${endPeriod}节`,
      startPeriod,
      endPeriod,
      weekRange,
      classroom,
      teacher,
      position: match.index,
      weekStart,
      weekEnd,
    });
  }

  // 现在需要确定每个课程的星期几
  // 策略：根据课程在文本中的位置，判断属于哪个星期列
  // 文本格式：时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日

  // 找到星期标题的位置
  const dayPositions: Array<{ day: string; position: number }> = [];
  const daysOfWeek = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

  for (const day of daysOfWeek) {
    const idx = text.indexOf(day);
    if (idx !== -1) {
      dayPositions.push({ day, position: idx });
    }
  }

  // 对每个课程，判断它属于哪个星期
  for (const course of foundCourses) {
    let dayOfWeek = 1; // 默认星期一

    // 找到课程位置之前的最近星期标题
    let closestDayPosition = -1;
    for (const dp of dayPositions) {
      if (dp.position < course.position && dp.position > closestDayPosition) {
        closestDayPosition = dp.position;
        dayOfWeek = dayMap[dp.day] || 1;
      }
    }

    const startTime = periodTimeMap[course.startPeriod]?.start || '';
    const endTime = periodTimeMap[course.endPeriod]?.end || '';

    courses.push({
      courseName: course.courseName,
      teacher: course.teacher || null,
      classroom: course.classroom || '',
      dayOfWeek,
      startTime,
      endTime,
      period: course.periodText,
      weekStart: course.weekStart,
      weekEnd: course.weekEnd,
      weekPattern: course.weekRange.includes('(双)') ? 'even' : course.weekRange.includes('(单)') ? 'odd' : null,
      notes: course.courseType,
      userId,
    });
  }

  // 去重（相同的课程名、节次、教室、教师）
  const seen = new Set<string>();
  const uniqueCourses = courses.filter(c => {
    const key = `${c.courseName}-${c.period}-${c.classroom}-${c.teacher}-${c.dayOfWeek}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return uniqueCourses;
}
