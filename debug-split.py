# -*- coding: utf-8 -*-
"""
调试☆符号分割
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
    cell = tables[0][2][2]  # 行 2 列 2

    print("=== 原始内容 ===")
    print(repr(cell[:200]))
    print()

    # 清理换行
    cleaned = cell.replace('\n', ' ').replace('\r', '')
    print("=== 清理后 ===")
    print(repr(cleaned[:200]))
    print()

    # 找到所有☆位置
    symbols = '☆★◎●※'
    positions = [i for i, c in enumerate(cleaned) if c in symbols]
    print(f"=== 符号位置：{positions} ===")

    # 按☆分割
    parts = re.split(f'([{symbols}])', cleaned)
    print(f"\n=== 分割结果（保留符号） ===")
    for i, part in enumerate(parts):
        print(f"  [{i}] {repr(part[:50])}")

    # 另一种方法：找到每个☆开始到下一个☆之前的内容
    print("\n=== 按☆重新分组 ===")
    entries = []
    current = ""
    for char in cleaned:
        if char in symbols:
            if current:
                entries.append(current)
            current = char
        else:
            current += char
    if current:
        entries.append(current)

    for i, entry in enumerate(entries):
        print(f"  [{i}] {repr(entry[:80])}")
