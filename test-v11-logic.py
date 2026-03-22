# -*- coding: utf-8 -*-
"""
直接测试 V11 逻辑
"""
import pdfplumber
import re
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

pdf_file = None
for f in os.listdir('.'):
    if '李涵' in f and f.endswith('.pdf'):
        pdf_file = f
        break

with pdfplumber.open(pdf_file) as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables()

    # 测试行 2 列 2
    row_idx, col_idx = 2, 2
    cell = tables[row_idx][col_idx]
    cell_text = cell.replace('\n', ' ').replace('\r', '').strip()

    print(f"=== 测试行{row_idx}列{col_idx} ===")
    print(f"单元格文本：{cell_text[:100]}...")
    print()

    # 找到所有☆位置
    symbols = '☆★◎●※'
    symbol_positions = [i for i, c in enumerate(cell_text) if c in symbols]
    print(f"☆位置：{symbol_positions}")
    print()

    for i, pos in enumerate(symbol_positions):
        print(f"--- 课程 {i+1} ---")

        # 提取课程名
        start = pos - 1
        while start >= 0 and cell_text[start] not in ' \t\n/':
            start -= 1
        start += 1

        course_name = cell_text[start:pos].strip()
        print(f"课程名：{course_name} (len={len(course_name)})")

        if len(course_name) < 2:
            print("  [跳过] 课程名太短")
            continue

        # 提取详情
        detail_start = pos + 1
        if i + 1 < len(symbol_positions):
            detail_end = symbol_positions[i+1]
        else:
            detail_end = len(cell_text)

        detail = cell_text[detail_start:detail_end].strip()
        print(f"详情：{detail[:50]}...")

        # 匹配节次
        print(f"详情前 10 字符：{repr(detail[:10])}")

        period_match = re.search(r'[(（](\d+)\s*-\s*(\d+)\s* 节', detail)
        print(f"匹配 1 (有空格): {period_match}")

        if not period_match:
            period_match = re.search(r'[(（](\d+)-(\d+) 节', detail)
            print(f"匹配 2 (无空格): {period_match}")

        if period_match:
            print(f"  节次：{period_match.group(1)}-{period_match.group(2)}")

            period_end_pos = period_match.end()
            detail_text = detail[period_end_pos:].strip()
            print(f"  剩余：{detail_text[:50]}")

            parts = detail_text.split('/')
            print(f"  部分数：{len(parts)}")

            if len(parts) >= 3:
                teacher_raw = parts[2].strip()
                print(f"  教师原始：{repr(teacher_raw[:20])}")

                teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
                teacher = teacher_match.group(1) if teacher_match else ''
                print(f"  教师：{teacher}")
        else:
            print("  [跳过] 未匹配到节次")
