# -*- coding: utf-8 -*-
"""
带详细调试的解析器
"""
import pdfplumber
import re
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def parse_course_cell(cell_text, day_of_week, debug=False):
    """解析单个课程单元格"""
    if not cell_text:
        return []

    courses = []

    # 清理文本
    cell_text = cell_text.replace('\n', ' ').replace('\r', '').strip()

    if debug:
        print(f"  [DEBUG] 清理后文本：{cell_text[:100]}...")

    # 找到所有课程符号位置
    symbols = '☆★◎●※'
    symbol_positions = []

    for i, char in enumerate(cell_text):
        if char in symbols:
            symbol_positions.append({'pos': i, 'symbol': char})

    if debug:
        print(f"  [DEBUG] 找到 {len(symbol_positions)} 个符号")

    # 对每个符号，提取课程信息
    for idx, sym_info in enumerate(symbol_positions):
        pos = sym_info['pos']
        symbol = sym_info['symbol']

        # 课程名在符号前面
        before = cell_text[:pos].strip()
        course_name = before.strip()

        if debug:
            print(f"  [DEBUG] 符号{idx}: 课程名='{course_name[:30]}...'")

        # 跳过太短的课程名
        if len(course_name) < 2:
            if debug:
                print(f"    [SKIP] 课程名太短")
            continue

        # 详情在符号后面
        after = cell_text[pos+1:].strip()

        if debug:
            print(f"    [DEBUG] after: {after[:50]}...")
            print(f"    [DEBUG] after hex: {[hex(ord(c)) for c in after[:15]]}")

        # 匹配节次
        period_pattern = r'\((\d+)\s*-\s*(\d+)\s* 节\s*\)'
        period_match = re.search(period_pattern, after)

        if debug:
            print(f"    [DEBUG] 正则：{period_pattern}")
            print(f"    [DEBUG] 匹配结果：{period_match}")

        if not period_match:
            # 尝试更宽松的正则
            period_pattern2 = r'[(（](\d+)\s*-\s*(\d+)[)） 节]'
            period_match2 = re.search(period_pattern2, after)
            if debug:
                print(f"    [DEBUG] 尝试正则 2: {period_pattern2}")
                print(f"    [DEBUG] 匹配结果 2: {period_match2}")
            if period_match2:
                period_match = period_match2

        if not period_match:
            if debug:
                print(f"    [SKIP] 未匹配到节次")
            continue

        print(f"    [OK] {course_name[:20]}: 节次={period_match.group(1)}-{period_match.group(2)}")

        start_period = period_match.group(1)
        end_period = period_match.group(2)
        period_end_pos = period_match.end()

        # 节次后面是周次/教室/教师
        detail_text = after[period_end_pos:].strip()

        # 按/分割
        parts = detail_text.split('/')
        if len(parts) < 3:
            if debug:
                print(f"      [SKIP] 部分太少：{len(parts)}")
            continue

        week_range = parts[0].strip()
        classroom_raw = parts[1].strip()
        teacher_raw = parts[2].strip()

        # 清理教室名
        classroom = re.sub(r'(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)', '', classroom_raw)

        # 提取教师名
        teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
        teacher = teacher_match.group(1) if teacher_match else ''

        if not teacher:
            if debug:
                print(f"      [SKIP] 未找到有效教师：{teacher_raw[:20]}...")
            continue

        courses.append({
            'course_name': course_name,
            'teacher': teacher,
            'classroom': classroom,
            'day_of_week': day_of_week,
        })

    return courses


# 查找 PDF 文件
pdf_file = None
for f in os.listdir('.'):
    if '李涵' in f and f.endswith('.pdf'):
        pdf_file = f
        break

if not pdf_file:
    print("未找到 PDF 文件")
    sys.exit(1)

print(f"处理文件：{pdf_file}\n")

with pdfplumber.open(pdf_file) as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables()
    table = tables[0]

    # 测试行 2 列 2（星期一，节次 1）
    print("=== 测试行 2 列 2（星期一，节次 1）===")
    row_idx = 2
    col_idx = 2
    cell = table[row_idx][col_idx]

    print(f"单元格内容:\n{cell[:200]}...\n")

    courses = parse_course_cell(cell, 1, debug=True)
    print(f"\n返回 {len(courses)} 条课程")
