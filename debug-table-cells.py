# -*- coding: utf-8 -*-
"""
调试：查看单元格原始内容
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

if not pdf_file:
    print("未找到 PDF 文件")
    sys.exit(1)

print(f"处理文件：{pdf_file}")

with pdfplumber.open(pdf_file) as pdf:
    for page_num, page in enumerate(pdf.pages):
        print(f"\n=== 第 {page_num + 1} 页 ===")

        tables = page.extract_tables()

        for table_num, table in enumerate(tables):
            print(f"\n表格 {table_num + 1}:")

            for row_idx, row in enumerate(table):
                print(f"\n行{row_idx}:")
                for col_idx, cell in enumerate(row):
                    if cell and cell.strip():
                        # 显示前 50 个字符
                        cell_preview = cell.replace('\n', ' ')[:80]
                        print(f"  列{col_idx}: [{len(cell)}字符] {cell_preview}...")
