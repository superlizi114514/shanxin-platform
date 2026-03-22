# -*- coding: utf-8 -*-
"""
最终调试：直接在 parse-schedule-v7.py 中添加调试
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
    cell = tables[0][2][2]  # 行 2 列 2

    # 清理文本
    cell_text = cell.replace('\n', ' ').replace('\r', '').strip()

    # 找到第一个☆
    pos = cell_text.find('☆')
    after = cell_text[pos+1:].strip()

    print(f"after: {after[:80]}...")
    print(f"after 前 20 字符 hex:")
    for i, c in enumerate(after[:20]):
        print(f"  [{i}] {repr(c)} 0x{ord(c):04X}")

    # 测试正则
    pattern = r'\((\d+)-(\d+)\s* 节\s*\)'
    match = re.search(pattern, after)

    print(f"\n正则：{pattern}")
    print(f"匹配结果：{match}")

    if match:
        print(f"  匹配值：{match.group(0)}")
        print(f"  组 1: {match.group(1)}")
        print(f"  组 2: {match.group(2)}")
    else:
        # 尝试找到问题
        print("\n尝试诊断问题:")

        # 检查是否有 ( 字符
        paren_count = after.count('(')
        print(f"  '(' 字符数：{paren_count}")

        # 检查是否有数字
        digit_count = sum(1 for c in after if c.isdigit())
        print(f"  数字字符数：{digit_count}")

        # 检查是否有节字符
        jie_count = after.count('节')
        print(f"  '节' 字符数：{jie_count}")

        # 打印包含节的上下文
        jie_pos = after.find('节')
        if jie_pos >= 0:
            print(f"  '节' 在位置 {jie_pos}")
            print(f"  上下文：{after[max(0,jie_pos-10):jie_pos+10]}")

            # 检查节前面的字符
            for i in range(max(0, jie_pos-5), jie_pos+1):
                print(f"    [{i}] {repr(after[i])} 0x{ord(after[i]):04X}")
