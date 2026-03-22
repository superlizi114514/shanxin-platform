# -*- coding: utf-8 -*-
"""
V11 调试版本
"""
import pdfplumber
import re
import json
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def parse_course_cell(cell_text, day_of_week, debug=False):
    if not cell_text:
        return []

    courses = []
    cell_text = cell_text.replace('\n', ' ').replace('\r', '').strip()

    symbols = '☆★◎●※'
    symbol_positions = [i for i, c in enumerate(cell_text) if c in symbols]

    if debug:
        print(f"    符号位置：{symbol_positions}")

    for i, pos in enumerate(symbol_positions):
        start = pos - 1
        while start >= 0 and cell_text[start] not in ' \t\n/':
            start -= 1
        start += 1

        course_name = cell_text[start:pos].strip()
        if debug:
            print(f"    课程名：{course_name}")

        if len(course_name) < 2:
            if debug:
                print(f"    [跳过] 课程名太短")
            continue

        detail_start = pos + 1
        if i + 1 < len(symbol_positions):
            detail_end = symbol_positions[i+1]
        else:
            detail_end = len(cell_text)

        detail = cell_text[detail_start:detail_end].strip()
        if debug:
            print(f"    详情：{detail[:60]}...")

        # 匹配节次
        period_match = re.search(r'[(（](\d+)\s*-\s*(\d+)\s* 节', detail)
        if not period_match:
            period_match = re.search(r'[(（](\d+)-(\d+) 节', detail)

        if debug:
            print(f"    节次匹配：{period_match}")

        if not period_match:
            if debug:
                print(f"    [跳过] 未匹配到节次")
            continue

        start_period = period_match.group(1)
        end_period = period_match.group(2)
        period_end_pos = period_match.end()

        detail_text = detail[period_end_pos:].strip()
        parts = detail_text.split('/')
        if len(parts) < 3:
            if debug:
                print(f"    [跳过] 部分太少：{len(parts)}")
            continue

        week_range = parts[0].strip()
        classroom_raw = parts[1].strip()
        teacher_raw = parts[2].strip()

        classroom = re.sub(r'(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)', '', classroom_raw)

        teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
        teacher = teacher_match.group(1) if teacher_match else ''

        if debug:
            print(f"    教师：{teacher}")

        if not teacher:
            if debug:
                print(f"    [跳过] 未找到有效教师")
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


pdf_file = None
for f in os.listdir('.'):
    if '李涵' in f and f.endswith('.pdf'):
        pdf_file = f
        break

with pdfplumber.open(pdf_file) as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables()
    table = tables[0]

    # 测试行 2 列 2
    row_idx, col_idx = 2, 2
    cell = table[row_idx][col_idx]

    print(f"=== 测试行{row_idx}列{col_idx} (周一) ===")
    print(f"单元格：{cell[:100]}...")
    print()

    courses = parse_course_cell(cell.strip(), 1, debug=True)
    print(f"\n结果：{len(courses)} 条课程")
    for c in courses:
        print(f"  - {c['course_name']} ({c['period']}) @ {c['classroom']} ({c['teacher']})")
