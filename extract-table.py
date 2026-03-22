# -*- coding: utf-8 -*-
"""
使用 pdfplumber 表格提取功能
直接提取 PDF 表格结构，保持行列关系
"""
import pdfplumber
import json
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_table_from_pdf(pdf_path):
    """提取 PDF 中的表格数据"""

    with pdfplumber.open(pdf_path) as pdf:
        print(f"PDF 页数：{len(pdf.pages)}")

        for i, page in enumerate(pdf.pages):
            print(f"\n=== 第 {i+1} 页 ===")

            # 提取表格
            tables = page.extract_tables()
            print(f"表格数量：{len(tables)}")

            for j, table in enumerate(tables):
                print(f"\n表格 {j+1}: {len(table)} 行 x {len(table[0]) if table[0] else 0} 列")

                # 打印表格内容
                for row_idx, row in enumerate(table):
                    print(f"  行{row_idx}: ", end='')
                    cells = []
                    for cell in row:
                        if cell:
                            # 截断过长的单元格
                            cell_text = cell.replace('\n', ' ')[:30]
                            cells.append(cell_text)
                        else:
                            cells.append('')
                    print(' | '.join(cells))

            # 也提取文本
            text = page.extract_text()
            if text:
                print(f"\n文本内容 (前 500 字符):")
                print(text[:500])


if __name__ == '__main__':
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
    extract_table_from_pdf(pdf_file)
