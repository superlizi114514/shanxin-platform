# -*- coding: utf-8 -*-
"""
从实际 PDF 提取并测试
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

    # 提取前 10 个字符用于测试
    test_str = after[:10]

    print(f"测试字符串：{repr(test_str)}")
    print(f"测试字符串 hex: {[hex(ord(c)) for c in test_str]}")

    # 直接从 cell_text 复制粘贴
    copy_paste = "(1-2 节)"
    print(f"\n复制粘贴：{repr(copy_paste)}")
    print(f"复制粘贴 hex: {[hex(ord(c)) for c in copy_paste]}")

    # 测试两个字符串
    for i, s in enumerate([test_str, copy_paste]):
        print(f"\n--- 测试字符串 {i+1} ---")

        patterns = [
            (r'\((\d+)-(\d+)\s* 节\s*\)', '原始'),
            (r'\((\d+)-(\d+) 节\s*\)', '无空格'),
            (r'\((\d+)\s*-\s*(\d+)\s* 节\s*\)', '全空格'),
        ]

        for pattern, name in patterns:
            match = re.search(pattern, s)
            if match:
                print(f"  OK: {name} => {match.group(0)}")
            else:
                print(f"  FAIL: {name}")
