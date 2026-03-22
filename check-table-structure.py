# -*- coding: utf-8 -*-
"""
检查表格结构
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
    print(f"PDF 页数：{len(pdf.pages)}")

    for page_num, page in enumerate(pdf.pages):
        print(f"\n=== 第 {page_num + 1} 页 ===")
        tables = page.extract_tables()
        print(f"表格数量：{len(tables)}")

        for table_num, table in enumerate(tables):
            print(f"\n表格 {table_num + 1}:")
            print(f"  行数：{len(table)}")
            if table:
                print(f"  列数：{len(table[0]) if table[0] else 0}")
                print(f"  每行列数：{[len(row) if row else 0 for row in table]}")

            # 打印前几行
            print(f"  内容预览:")
            for i, row in enumerate(table[:5]):
                print(f"    行{i}: {[c[:20] if c else None for c in row]}")
