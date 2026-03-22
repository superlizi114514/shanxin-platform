# -*- coding: utf-8 -*-
import re
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 用字符构建字符串
s1 = '(' + '1' + '-' + '2' + '节' + ')'
print(f"构建字符串 1: {repr(s1)}")
m1 = re.search(r'\((\d+)-(\d+) 节', s1)
print(f"  匹配：{m1}")

# 从 PDF 提取的字符
import pdfplumber
import os

pdf_file = None
for f in os.listdir('.'):
    if '李涵' in f and f.endswith('.pdf'):
        pdf_file = f
        break

with pdfplumber.open(pdf_file) as pdf:
    page = pdf.pages[0]
    tables = page.extract_tables()
    cell = tables[0][2][2]

    cell_text = cell.replace('\n', ' ').replace('\r', '').strip()
    pos = cell_text.find('☆')
    detail = cell_text[pos+1:].strip()

    # 取前 7 个字符
    detail_7 = detail[:7]
    print(f"\nPDF 提取：{repr(detail_7)}")

    # 字符分析
    print("字符分析:")
    for i, c in enumerate(detail_7):
        print(f"  [{i}] {repr(c)} ord={ord(c)}")

    # 测试正则
    m2 = re.search(r'\((\d+)-(\d+) 节', detail_7)
    print(f"\n匹配结果：{m2}")

    # 尝试逐字符构建
    s2 = '(' + detail_7[1] + '-' + detail_7[3] + detail_7[4]
    print(f"\n逐字符构建：{repr(s2)}")
    m3 = re.search(r'\((\d+)-(\d+) 节', s2)
    print(f"  匹配：{m3}")
