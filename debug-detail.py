# -*- coding: utf-8 -*-
"""
调试详情解析
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

    cleaned = cell.replace('\n', ' ').replace('\r', '').strip()

    # 找到第一个☆
    pos = cleaned.find('☆')

    # 提取详情（☆后面到下一个☆）
    detail_start = pos + 1
    next_pos = cleaned.find('☆', detail_start)
    if next_pos == -1:
        next_pos = len(cleaned)

    detail = cleaned[detail_start:next_pos].strip()

    print("=== 详情文本 ===")
    print(repr(detail[:150]))
    print()

    # 分析详情格式
    # (1-2 节)1-2 周，4-6 周 (双),7- 8 周，10-14 周/K4405 教室/赵海 清/...

    # 按/分割
    parts = detail.split('/')
    print(f"=== 按/分割：{len(parts)} 部分 ===")
    for i, p in enumerate(parts):
        print(f"  [{i}] {repr(p[:50])}")
    print()

    # 第一部分包含 (节次) 和周次
    first_part = parts[0]
    print("=== 解析第一部分 ===")
    print(repr(first_part))

    # 匹配 (节次)
    period_match = re.search(r'\((\d+)-(\d+) 节\)', first_part)
    if period_match:
        print(f"节次：{period_match.group(1)}-{period_match.group(2)}")
        # 周次在节次后面
        week_range = first_part[period_match.end():].strip()
        print(f"周次：{repr(week_range)}")
    else:
        print("节次匹配失败")

        # 尝试宽松正则
        period_match2 = re.search(r'[(（](\d+)\s*-\s*(\d+)\s*[)）节]', first_part)
        if period_match2:
            print(f"节次 (宽松): {period_match2.group(1)}-{period_match2.group(2)}")
            print(f"匹配文本：{repr(period_match2.group(0))}")
        else:
            print("宽松正则也失败了")

    print()
    print("=== 测试各种正则 ===")
    patterns = [
        r'\((\d+)-(\d+) 节\)',
        r'\((\d+)-(\d+) 节\s*\)',
        r'[(（](\d+)-(\d+)[)）节]',
        r'[(（](\d+)\s*-\s*(\d+)\s*[)）节]',
    ]

    for p in patterns:
        m = re.search(p, first_part)
        if m:
            print(f"✓ {p} => {repr(m.group(0))}")
        else:
            print(f"✗ {p}")

    print()
    print("=== 检查字符 ===")
    for i, c in enumerate(first_part[:20]):
        print(f"  [{i}] {repr(c)} 0x{ord(c):04X}")
