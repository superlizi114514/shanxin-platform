# -*- coding: utf-8 -*-
"""
PDF 课程表解析器 - V11 版本（修复正则和课程分割）
"""
import pdfplumber
import re
import json
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Unicode constants for Chinese characters
JIE = '\u8282'  # '节' 字


def parse_course_cell(cell_text, day_of_week):
    """
    解析单个课程单元格 - 可能包含多门课程
    """
    if not cell_text:
        return []

    courses = []
    cell_text = cell_text.replace('\n', ' ').replace('\r', '').strip()

    # 找到所有☆位置
    symbols = '☆★◎●※'
    symbol_positions = [i for i, c in enumerate(cell_text) if c in symbols]

    for i, pos in enumerate(symbol_positions):
        # 提取课程名
        start = pos - 1
        while start >= 0 and cell_text[start] not in ' \t\n/':
            start -= 1
        start += 1

        course_name = cell_text[start:pos].strip()
        if len(course_name) < 2:
            continue

        # 提取详情
        detail_start = pos + 1
        if i + 1 < len(symbol_positions):
            detail_end = symbol_positions[i+1]
        else:
            detail_end = len(cell_text)

        detail = cell_text[detail_start:detail_end].strip()

        # 匹配节次 - 使用 Unicode 转义避免编码问题
        period_match = re.search(r'[(（](\d+)-(\d+)' + JIE, detail)

        if not period_match:
            continue

        start_period = period_match.group(1)
        end_period = period_match.group(2)
        period_end_pos = period_match.end()

        detail_text = detail[period_end_pos:].strip()
        parts = detail_text.split('/')
        if len(parts) < 3:
            continue

        week_range = parts[0].strip()
        # 清理周次 - 移除前导的) 字符
        week_range = week_range.lstrip(')')
        classroom_raw = parts[1].strip()
        teacher_raw = parts[2].strip()

        classroom = re.sub(r'(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)', '', classroom_raw)

        teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
        teacher = teacher_match.group(1) if teacher_match else ''

        if not teacher:
            continue

        courses.append({
            'course_name': course_name,
            'teacher': teacher,
            'classroom': classroom,
            'day_of_week': day_of_week,
            'start_period': start_period,
            'end_period': end_period,
            'period': f"{start_period}-{end_period}节",
            'week_range': week_range
        })

    return courses


def extract_courses_from_pdf(pdf_path):
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
                    if '星期' in str(row[2]) or '时间段' in str(row[0]):
                        continue

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
