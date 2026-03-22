# -*- coding: utf-8 -*-
"""
调试 V7 解析器 - 添加详细日志
"""
import pdfplumber
import re
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def parse_course_cell(cell_text, day_of_week):
    """解析单个课程单元格"""
    if not cell_text:
        print("    [SKIP] 单元格为空")
        return []

    courses = []

    # 清理文本
    cell_text = cell_text.replace('\n', ' ').replace('\r', '').strip()
    print(f"    清理后文本：{cell_text[:80]}...")

    # 找到所有课程符号位置
    symbols = '☆★◎●※'
    symbol_positions = []

    for i, char in enumerate(cell_text):
        if char in symbols:
            symbol_positions.append({'pos': i, 'symbol': char})

    print(f"    找到 {len(symbol_positions)} 个符号")

    # 对每个符号，提取课程信息
    for idx, sym_info in enumerate(symbol_positions):
        pos = sym_info['pos']
        symbol = sym_info['symbol']

        # 课程名在符号前面
        before = cell_text[:pos].strip()
        course_name = before.strip()

        print(f"    符号{idx}: {symbol} @ {pos}, 课程名='{course_name}'")

        # 跳过太短的课程名
        if len(course_name) < 2:
            print(f"      [SKIP] 课程名太短")
            continue

        # 详情在符号后面
        after = cell_text[pos+1:].strip()
        print(f"      after: {after[:50]}...")

        # 匹配节次
        period_match = re.search(r'\((\d+)-(\d+)\s* 节\s*\)', after)
        if not period_match:
            print(f"      [SKIP] 未匹配到节次")
            continue

        print(f"      节次：{period_match.group(1)}-{period_match.group(2)}节")

        start_period = period_match.group(1)
        end_period = period_match.group(2)
        period_end_pos = period_match.end()

        # 节次后面是周次/教室/教师
        detail_text = after[period_end_pos:].strip()
        print(f"      详情：{detail_text[:60]}...")

        # 按/分割
        parts = detail_text.split('/')
        print(f"      分割成 {len(parts)} 部分")

        if len(parts) < 3:
            print(f"      [SKIP] 部分太少 (<3)")
            continue

        week_range = parts[0].strip()
        classroom_raw = parts[1].strip()
        teacher_raw = parts[2].strip()

        print(f"      周次：{week_range[:30]}...")
        print(f"      教室：{classroom_raw[:30]}...")
        print(f"      教师：{teacher_raw[:30]}...")

        # 清理教室名
        classroom = re.sub(r'(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)', '', classroom_raw)

        # 提取教师名
        teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
        teacher = teacher_match.group(1) if teacher_match else ''

        if not teacher:
            print(f"      [SKIP] 未找到有效教师")
            continue

        print(f"      [OK] {course_name} | {classroom} | {teacher}")

        courses.append({
            'course_name': course_name,
            'teacher': teacher,
            'classroom': classroom,
            'day_of_week': day_of_week,
        })

    return courses


# 测试
pdf_file = None
for f in os.listdir('.'):
    if '李涵' in f and f.endswith('.pdf'):
        pdf_file = f
        break

if not pdf_file:
    print("未找到 PDF 文件")
    sys.exit(1)

print(f"处理文件：{pdf_file}")

with pdfplumber.open(pdf_file) as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables()
    table = tables[0]

    # 测试行 2 列 2（大学英语）
    print("\n=== 测试行 2 列 2（星期一，节次 1）===")
    row_idx = 2
    col_idx = 2
    cell = table[row_idx][col_idx]

    print(f"单元格内容:\n{cell}")
    print(f"\n解析结果:")
    courses = parse_course_cell(cell, 1)
    print(f"返回 {len(courses)} 条课程")
