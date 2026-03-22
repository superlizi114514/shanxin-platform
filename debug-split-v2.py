# -*- coding: utf-8 -*-
"""
调试 - 理解正确的分割逻辑
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
    cell = tables[0][2][2]

    # 清理文本
    cleaned = cell.replace('\n', ' ').replace('\r', '').strip()

    print("=== 清理后文本 ===")
    print(cleaned[:300])
    print()

    # 正确的分割逻辑：
    # 1. 找到所有☆位置
    # 2. 第一个☆之前的内容 = 第一门课程名
    # 3. 每个☆到下一个☆之间 = 第一门课程的详情 + 第二门课程名
    # 4. 最后一个☆之后 = 最后一门课程的详情

    symbols = '☆★◎●※'
    positions = [i for i, c in enumerate(cleaned) if c in symbols]

    print(f"=== 符号位置：{positions}")
    print()

    # 方法：按☆分割，但保留课程名
    # 第一个☆前面的部分是课程名 1
    # ☆后面到下一个课程名之前是详情 1
    # 然后课程名 2☆详情 2...

    # 简单方法：用☆分割，然后第一部分特殊处理
    parts = cleaned.split('☆')
    print(f"按☆分割：{len(parts)} 部分")
    for i, p in enumerate(parts):
        print(f"  [{i}] {repr(p[:80])}")
    print()

    # 分析：
    # parts[0] = "大学英语 D2" - 课程名 1（没有☆）
    # parts[1] = " (1-2 节)... 数据库应用技术" - 详情 1 + 课程名 2
    # parts[2] = " (1-2 节)..." - 详情 2

    # 所以课程名在：
    # - parts[0] 整体是课程名 1
    # - parts[1] 的末尾部分（在下一个☆之前的文字）是课程名 2

    # 但问题是 parts[1] 包含了详情 1 和课程名 2，混在一起了
    # 需要找到课程名 2 的开始位置

    # 观察：课程名后面总是跟着☆，然后是 (节次)
    # 所以可以用正则找到"中文字符☆("的模式

    # 更好的方法：用正则匹配完整的课程模式
    print("=== 用正则匹配完整课程 ===")
    # 课程模式：课程名☆(节次) 周次/教室/教师
    pattern = r'([\u4e00-\u9fa5A-Za-z0-9]+)☆\((\d+)-(\d+) 节\)([^/]+)/([^/]+)/([^/]+)'
    matches = re.findall(pattern, cleaned)
    print(f"匹配到 {len(matches)} 条课程")
    for m in matches:
        print(f"  - 课程名：{m[0]}, 节次：{m[1]}-{m[2]}, 周次：{m[3][:20]}..., 教室：{m[4]}, 教师：{m[5]}")
