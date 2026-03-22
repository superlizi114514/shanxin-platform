# -*- coding: utf-8 -*-
"""
调试：检查解析器中实际的 after 值
"""
import pdfplumber
import re
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
    table = tables[0]

    # 获取单元格
    cell = table[2][2]  # 行 2 列 2

    # 清理文本
    cell_text = cell.replace('\n', ' ').replace('\r', '').strip()
    print(f"清理后单元格：{cell_text[:100]}...")

    # 找到第一个☆
    pos = cell_text.find('☆')
    print(f"\n第一个☆位置：{pos}")

    # 符号后面的内容
    after = cell_text[pos+1:].strip()
    print(f"after: {after}")
    print(f"after 长度：{len(after)}")

    # 检查 after 的前 20 个字符
    print("\nafter 字符分析:")
    for i, c in enumerate(after[:30]):
        print(f"  [{i}] '{c}' U+{ord(c):04X}")

    # 测试正则
    print("\n正则测试:")
    pattern = r'\((\d+)-(\d+)\s* 节\s*\)'
    match = re.search(pattern, after)
    if match:
        print(f"  匹配成功：{match.group(0)}")
    else:
        print(f"  匹配失败!")

    # 尝试不同的正则
    pattern2 = r'[(（](\d+)-(\d+)[^)]*[)）]'
    match2 = re.search(pattern2, after)
    if match2:
        print(f"  正则 2 成功：{match2.group(0)}")
    else:
        print(f"  正则 2 失败!")
