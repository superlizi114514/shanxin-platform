# -*- coding: utf-8 -*-
"""
分析单元格格式
"""
import pdfplumber
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 查找 PDF 文件
pdf_file = None
for f in os.listdir('.'):
    if '李涵' in f and f.endswith('.pdf'):
        pdf_file = f
        break

with pdfplumber.open(pdf_file) as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables()
    cell = tables[0][2][2]  # 行 2 列 2（星期一，节次 1）

    print("=== 原始单元格内容 ===")
    print(repr(cell))
    print("\n=== 可读格式 ===")
    print(cell)
    print("\n=== 字符分析 ===")
    for i, c in enumerate(cell[:100]):
        print(f"  [{i}] {repr(c)} 0x{ord(c):04X}")
