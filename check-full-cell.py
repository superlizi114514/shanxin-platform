# -*- coding: utf-8 -*-
"""
检查完整单元格内容
"""
import pdfplumber
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

    # 获取表格 0 行 2 列 2 的原始对象
    table = tables[0]
    cell = table[2][2]

    print("=== 行 2 列 2 单元格内容 ===")
    print(repr(cell))
    print()

    # 尝试直接提取页面文本
    print("=== 页面文本 ===")
    text = page.extract_text()
    print(text[:500])
