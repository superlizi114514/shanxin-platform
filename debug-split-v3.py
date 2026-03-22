# -*- coding: utf-8 -*-
"""
调试 - 找到正确的课程分割点
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

    cleaned = cell.replace('\n', ' ').replace('\r', '').strip()

    # 关键观察：
    # 每个课程格式：课程名☆(节次)...
    # 课程名后面总是跟着☆
    # ☆后面总是跟着 (节次)
    # 课程详情末尾到下一个课程名之间没有固定分隔符

    # 方法：使用正则匹配完整课程
    # 课程格式：课程名☆ (节次) 周次/教室/教师/...
    # 周次格式：数字 + 周，可能包含 (双)、(单) 等
    # 教室格式：K+ 数字 + 可选后缀
    # 教师格式：2-6 个中文字符

    # 尝试匹配：从课程名开始，到教师名结束
    # 课程名☆(节次) 周次/教室/教师

    # 用☆作为课程开始标记
    pattern = r'☆\s*\((\d+)-(\d+) 节\)\s*([^/]+)/([^/]+)/([^/\n]+)'

    # 找到所有匹配
    matches = re.findall(pattern, cleaned)
    print(f"正则匹配到 {len(matches)} 条")
    for i, m in enumerate(matches):
        print(f"  [{i}] 节次={m[0]}-{m[1]}, 周次={m[2][:30]}..., 教室={m[3]}, 教师={m[4]}")

    print()

    # 现在尝试提取课程名
    # 第一个课程名在第一个☆之前
    # 后续课程名在每个课程详情的末尾，下一个☆之前

    # 找到所有☆位置
    symbol_positions = [i for i, c in enumerate(cleaned) if c in '☆★◎●※']
    print(f"☆位置：{symbol_positions}")

    # 对于每个☆，提取前面的课程名
    for i, pos in enumerate(symbol_positions):
        # 课程名从上一个☆详情结束到这个☆之间
        if i == 0:
            # 第一个☆前面的就是课程名
            course_name = cleaned[:pos].strip()
        else:
            # 上一个☆位置到这个☆位置之间，课程名在末尾
            prev_pos = symbol_positions[i-1]
            between = cleaned[prev_pos+1:pos].strip()
            # 课程名是 between 的最后一部分（在/之后）
            # 但实际上 between 包含了整个详情...

            # 观察：课程名总是在☆之前，详情在☆之后
            # 所以课程名是从上一个课程详情结束到这个☆之间的内容
            # 但详情没有固定结束标记...

            # 换个思路：课程名是中文字符 + 字母数字，不包含 (
            # 所以从☆往前找，找到第一个 ( 字符，然后从 ( 往前找课程名

            # 简化：从☆往前找，取☆前面的非空字符直到遇到/或字符串开始
            pass

        print(f"  [{i}] 课程名候选：{cleaned[max(0,pos-30):pos]}|{cleaned[pos:pos+10]}")

    print()
    print("=== 换个思路：课程名总是在☆前面 ===")

    # 从☆位置往前找课程名
    for i, pos in enumerate(symbol_positions):
        # 往前找，找到课程名（不包含空格和/）
        start = pos - 1
        while start >= 0 and cleaned[start] not in ' \t\n/':
            start -= 1
        start += 1

        course_name = cleaned[start:pos].strip()
        print(f"  课程 {i+1}: '{course_name}' @ pos {pos}")

    print()
    print("=== 提取完整课程信息 ===")

    # 结合课程名和详情
    for i, pos in enumerate(symbol_positions):
        # 提取课程名
        start = pos - 1
        while start >= 0 and cleaned[start] not in ' \t\n/':
            start -= 1
        start += 1
        course_name = cleaned[start:pos].strip()

        if len(course_name) < 2:
            continue

        # 提取详情（☆后面到下一个☆或字符串结束）
        detail_start = pos + 1
        if i + 1 < len(symbol_positions):
            detail_end = symbol_positions[i+1]
        else:
            detail_end = len(cleaned)

        detail = cleaned[detail_start:detail_end].strip()

        # 解析详情
        # 格式：(节次) 周次/教室/教师/...
        detail_match = re.match(r'\((\d+)-(\d+) 节\)\s*([^/]+)/([^/]+)/([^/\n]+)', detail)

        if detail_match:
            period = f"{detail_match.group(1)}-{detail_match.group(2)}节"
            week_range = detail_match.group(3).strip()
            classroom_raw = detail_match.group(4).strip()
            teacher_raw = detail_match.group(5).strip()

            # 清理教室
            classroom = re.sub(r'(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)', '', classroom_raw)

            # 提取教师
            teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
            teacher = teacher_match.group(1) if teacher_match else ''

            if teacher:
                print(f"  ✓ {course_name} | {period} | {week_range} | {classroom} | {teacher}")
            else:
                print(f"  ✗ {course_name} | 教师无效：{teacher_raw[:20]}")
        else:
            print(f"  ✗ {course_name} | 详情解析失败：{detail[:50]}")
