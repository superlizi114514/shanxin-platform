# -*- coding: utf-8 -*-
"""
PDF 课程表解析器 - V10 版本（正确按☆分割多门课程）
"""
import pdfplumber
import re
import json
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def parse_course_entry(course_text, day_of_week):
    """
    解析单个课程条目

    格式：课程名☆(节次) 周次/教室/教师/...
    """
    if not course_text:
        return None

    # 清理文本 - 替换所有空白字符为单个空格
    course_text = re.sub(r'\s+', ' ', course_text).strip()

    # 找到☆符号位置
    symbol_pos = -1
    symbols = '☆★◎●※'
    for i, char in enumerate(course_text):
        if char in symbols:
            symbol_pos = i
            break

    if symbol_pos == -1:
        return None

    # 课程名在☆前面
    course_name = course_text[:symbol_pos].strip()

    # 跳过太短的课程名
    if len(course_name) < 2:
        return None

    # 详情在☆后面
    after = course_text[symbol_pos+1:].strip()

    # 匹配节次：(1-2 节)
    period_match = re.search(r'\((\d+)-(\d+) 节\)', after)
    if not period_match:
        # 尝试宽松格式
        period_match = re.search(r'[(（](\d+)\s*-\s*(\d+)\s*[)）节]', after)
    if not period_match:
        return None

    start_period = period_match.group(1)
    end_period = period_match.group(2)
    period_end_pos = period_match.end()

    # 节次后面是周次/教室/教师
    detail_text = after[period_end_pos:].strip()

    # 按/分割
    parts = detail_text.split('/')
    if len(parts) < 3:
        return None

    week_range_raw = parts[0].strip()
    classroom_raw = parts[1].strip()
    teacher_raw = parts[2].strip()

    # 清理周次 - 移除前导的) 字符
    week_range = week_range_raw.lstrip(')').strip()

    # 清理教室名
    classroom = re.sub(r'(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)', '', classroom_raw)

    # 提取教师名（2-6 个中文字符，或包含"外教"）
    teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
    teacher = teacher_match.group(1) if teacher_match else ''

    # 如果没有有效教师，跳过
    if not teacher:
        return None

    return {
        'course_name': course_name,
        'teacher': teacher,
        'classroom': classroom,
        'day_of_week': day_of_week,
        'start_period': start_period,
        'end_period': end_period,
        'period': f"{start_period}-{end_period}节",
        'week_range': week_range
    }


def parse_course_cell(cell_text, day_of_week):
    """
    解析单个课程单元格 - 可能包含多门课程

    格式：
    课程名 1☆详情 1
    课程名 2☆详情 2
    """
    if not cell_text:
        return []

    courses = []

    # 清理文本 - 替换换行符为空格
    cell_text = cell_text.replace('\n', ' ').replace('\r', '').strip()

    # 按☆符号分割，每个☆开始一个新的课程
    # 方法：遍历字符，遇到☆时将前面的内容作为一个课程
    symbols = '☆★◎●※'

    entries = []
    current = ""
    for char in cell_text:
        if char in symbols:
            # 保存当前条目（包含☆）
            if current:
                entries.append(current + char)
            else:
                entries.append(char)
            current = ""
        else:
            current += char

    # 处理剩余内容 - 附加到最后一个条目
    if current.strip() and entries:
        entries[-1] += current

    # 解析每个条目
    for entry in entries:
        course = parse_course_entry(entry, day_of_week)
        if course:
            courses.append(course)

    return courses


def extract_courses_from_pdf(pdf_path):
    """从 PDF 提取所有课程"""

    all_courses = []

    with pdfplumber.open(pdf_path) as pdf:
        print(f"PDF 页数：{len(pdf.pages)}")

        for page_num, page in enumerate(pdf.pages):
            print(f"\n=== 处理第 {page_num + 1} 页 ===")

            tables = page.extract_tables()
            print(f"表格数量：{len(tables)}")

            for table_num, table in enumerate(tables):
                print(f"处理表格 {table_num + 1}: {len(table)} 行 x {len(table[0]) if table[0] else 0} 列")

                for row_idx, row in enumerate(table):
                    if not row or len(row) < 9:
                        continue

                    # 跳过表头
                    if '星期' in str(row[2]) or '时间段' in str(row[0]):
                        continue

                    # 处理星期一到星期日（列 2-8）
                    for col_idx in range(2, min(9, len(row))):
                        day_of_week = col_idx - 1
                        cell = row[col_idx]

                        if not cell or not cell.strip():
                            continue

                        courses = parse_course_cell(cell.strip(), day_of_week)

                        if courses:
                            print(f"  行{row_idx}列{col_idx}(周{day_of_week}): {len(courses)} 条课程")
                            for c in courses:
                                print(f"    - {c['course_name']} ({c['period']}) @ {c['classroom']} ({c['teacher']})")
                            all_courses.extend(courses)

    return all_courses


def deduplicate_courses(courses):
    """去重"""
    seen = set()
    unique = []

    for c in courses:
        key = f"{c['course_name']}-{c['period']}-{c['classroom']}-{c['teacher']}-{c['day_of_week']}"
        if key not in seen:
            seen.add(key)
            unique.append(c)

    return unique


if __name__ == '__main__':
    pdf_file = None
    for f in os.listdir('.'):
        if '李涵' in f and f.endswith('.pdf'):
            pdf_file = f
            break

    if not pdf_file:
        print("未找到 PDF 文件")
        sys.exit(1)

    print(f"处理文件：{pdf_file}")
    print("="*60)

    courses = extract_courses_from_pdf(pdf_file)
    unique_courses = deduplicate_courses(courses)

    print("\n" + "="*60)
    print(f"总计：{len(courses)} 条课程（去重前）")
    print(f"去重后：{len(unique_courses)} 条课程")
    print("="*60)

    by_day = {}
    for c in unique_courses:
        day = c['day_of_week']
        if day not in by_day:
            by_day[day] = []
        by_day[day].append(c)

    day_names = {1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六', 7: '周日'}

    print("\n按星期统计:")
    for day in sorted(by_day.keys()):
        print(f"  {day_names.get(day, '未知')}: {len(by_day[day])} 条")

    print("\n课程列表 (JSON):")
    print(json.dumps(unique_courses, ensure_ascii=False, indent=2))
