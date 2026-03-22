# -*- coding: utf-8 -*-
"""
调试解析器
"""
import pdfplumber
import re
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 测试单元格文本
CELL_TEXT = "大学英语 D2☆ (1-2 节)1-2 周，4-6 周 (双),7- 8 周，10-14 周/K4405 教室/赵海 清/大学英语 D2-2025 级网络 1 班/2025 级网络 1 班"

print(f"测试文本：{CELL_TEXT}")
print(f"长度：{len(CELL_TEXT)}")

# 找到符号位置
symbols = '☆★◎●※'
for i, char in enumerate(CELL_TEXT):
    if char in symbols:
        print(f"\n符号 '{char}' 在位置 {i}")

        before = CELL_TEXT[:i]
        after = CELL_TEXT[i+1:]

        print(f"  before: {before}")
        print(f"  after: {after}")

        # 提取课程名
        name_match = re.search(r'([^\s]+)$', before)
        if name_match:
            course_name = name_match.group(1)
            print(f"  课程名：{course_name}")

        # 匹配节次
        period_match = re.search(r'\((\d+)-(\d+)\s* 节\s*\)', after)
        if period_match:
            print(f"  节次：{period_match.group(1)}-{period_match.group(2)}节")
            period_end_pos = period_match.end()
            detail_text = after[period_end_pos:]
            print(f"  详情：{detail_text[:50]}...")

            # 分割
            parts = detail_text.split('/')
            print(f"  分割成 {len(parts)} 部分:")
            for j, p in enumerate(parts[:4]):
                print(f"    [{j}] {p[:30]}...")
        else:
            print("  未匹配到节次")

# 现在测试完整的解析流程
print("\n" + "="*60)
print("测试完整表格解析")
print("="*60)

pdf_file = None
for f in os.listdir('.'):
    if '李涵' in f and f.endswith('.pdf'):
        pdf_file = f
        break

if not pdf_file:
    print("未找到 PDF 文件")
    sys.exit(1)

with pdfplumber.open(pdf_file) as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables()
    table = tables[0]

    # 测试行 2 列 2（大学英语）
    row_idx = 2
    col_idx = 2
    cell = table[row_idx][col_idx]

    print(f"\n行{row_idx}列{col_idx}单元格:")
    print(f"  内容：{cell[:100]}...")
    print(f"  长度：{len(cell)}")

    # 手动解析
    print("\n  手动解析:")

    # 找符号
    for i, char in enumerate(cell):
        if char == '☆':
            print(f"    找到☆ @ {i}")

    # 测试正则
    patterns = [
        (r'\((\d+)-(\d+)\s* 节\s*\)', '节次'),
        (r'([^\s☆]+)☆', '课程名'),
        (r'/([^/]+)/', '教室'),
    ]

    for pattern, name in patterns:
        matches = re.findall(pattern, cell)
        print(f"  模式 '{name}': {len(matches)} 匹配")
        for m in matches[:3]:
            print(f"    {m}")
