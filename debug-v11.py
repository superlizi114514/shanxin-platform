# -*- coding: utf-8 -*-
"""
调试 V11
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
    cell = tables[0][2][2]

    cell_text = cell.replace('\n', ' ').replace('\r', '').strip()

    print("=== 单元格文本 ===")
    print(cell_text[:200])
    print()

    # 找到所有☆位置
    symbols = '☆★◎●※'
    symbol_positions = [i for i, c in enumerate(cell_text) if c in symbols]

    print(f"=== ☆位置：{symbol_positions} ===")
    print()

    # 对每个☆，提取课程信息
    for i, pos in enumerate(symbol_positions):
        print(f"--- 课程 {i+1} ---")

        # 提取课程名
        start = pos - 1
        while start >= 0 and cell_text[start] not in ' \t\n/':
            start -= 1
        start += 1

        course_name = cell_text[start:pos].strip()
        print(f"课程名：{course_name}")

        # 提取详情
        detail_start = pos + 1
        if i + 1 < len(symbol_positions):
            detail_end = symbol_positions[i+1]
        else:
            detail_end = len(cell_text)

        detail = cell_text[detail_start:detail_end].strip()
        print(f"详情：{detail[:80]}...")

        # 解析节次
        period_match = re.search(r'[(（](\d+)\s*-\s*(\d+)\s* 节', detail)
        print(f"详情前 20 字符：{repr(detail[:20])}")
        print(f"节次匹配：{period_match}")

        # 字符分析
        if detail:
            print(f"详情字符分析:")
            for i, c in enumerate(detail[:10]):
                print(f"  [{i}] {repr(c)} 0x{ord(c):04X}")

        if period_match:
            print(f"  节次：{period_match.group(1)}-{period_match.group(2)}")
            print(f"  匹配文本：{repr(period_match.group(0))}")

            period_end_pos = period_match.end()
            detail_text = detail[period_end_pos:].strip()
            print(f"  剩余详情：{detail_text[:50]}")

            parts = detail_text.split('/')
            print(f"  部分数：{len(parts)}")
            if len(parts) >= 3:
                print(f"    周次：{parts[0]}")
                print(f"    教室：{parts[1]}")
                print(f"    教师：{parts[2]}")

                # 提取教师
                teacher_raw = parts[2].strip()
                teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
                teacher = teacher_match.group(1) if teacher_match else ''
                print(f"  教师提取：{teacher}")
        print()
