# -*- coding: utf-8 -*-
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

    # 清理文本
    cell_text = cell.replace('\n', ' ').replace('\r', '').strip()

    # 找到第一个☆
    pos = cell_text.find('☆')

    # 提取详情
    detail_start = pos + 1
    detail = cell_text[detail_start:].strip()

    print("=== 详情文本 ===")
    print(repr(detail[:50]))
    print()

    print("=== 字符分析 ===")
    for i, c in enumerate(detail[:15]):
        print(f"  [{i}] {repr(c)} 0x{ord(c):04X}")

    print()
    print("=== 测试正则 ===")

    patterns = [
        r'[(（](\d+)\s*-\s*(\d+)\s* 节',
        r'[(（](\d+)-(\d+) 节',
        r'\((\d+)-(\d+) 节',
        r'\((\d+)-(\d+) 节',
    ]

    for p in patterns:
        m = re.search(p, detail)
        print(f"{p}: {m}")
        if m:
            print(f"  => match: {repr(m.group(0))}")

    # 直接测试
    print()
    print("=== 直接测试 ===")
    test_str = detail[:7]
    print(f"前 7 字符：{repr(test_str)}")
    m2 = re.search(r'\((\d+)-(\d+) 节', test_str)
    print(f"测试前 7 字符：{m2}")
