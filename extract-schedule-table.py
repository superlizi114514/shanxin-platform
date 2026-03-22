# -*- coding: utf-8 -*-
"""
PDF 课程表解析器 - 表格提取版本
使用 pdfplumber 提取表格结构，然后解析每个单元格
输出 JSON 格式供 TypeScript 调用
"""
import pdfplumber
import re
import json
import sys
import os

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Unicode constants
JIE = '\u8282'  # '节' 字


def parse_course_cell(cell_text, day_of_week):
    """解析单个课程单元格"""
    if not cell_text:
        return []

    courses = []
    cell_text = cell_text.replace('\n', ' ').replace('\r', '').strip()

    symbols = '☆★◎●※'
    symbol_positions = [i for i, c in enumerate(cell_text) if c in symbols]

    for i, pos in enumerate(symbol_positions):
        # 提取课程名
        start = pos - 1
        while start >= 0 and cell_text[start] not in ' \t\n/':
            start -= 1
        start += 1

        course_name = cell_text[start:pos].strip()
        if len(course_name) < 2:
            continue

        # 提取详情
        detail_start = pos + 1
        if i + 1 < len(symbol_positions):
            detail_end = symbol_positions[i+1]
        else:
            detail_end = len(cell_text)

        detail = cell_text[detail_start:detail_end].strip()

        # 匹配节次
        period_match = re.search(r'[(（](\d+)-(\d+)' + JIE, detail)
        if not period_match:
            continue

        start_period = period_match.group(1)
        end_period = period_match.group(2)
        period_end_pos = period_match.end()

        detail_text = detail[period_end_pos:].strip()
        parts = detail_text.split('/')
        if len(parts) < 3:
            continue

        week_range = parts[0].strip()
        # 清理周次 - 移除前导的) 字符
        week_range = week_range.lstrip(')')
        classroom_raw = parts[1].strip()
        teacher_raw = parts[2].strip()

        # 清理教室名
        classroom = re.sub(r'(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)', '', classroom_raw)

        # 提取教师名
        teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
        teacher = teacher_match.group(1) if teacher_match else ''

        if not teacher:
            continue

        courses.append({
            'course_name': course_name,
            'teacher': teacher,
            'classroom': classroom,
            'day_of_week': day_of_week,
            'start_period': start_period,
            'end_period': end_period,
            'period': f"{start_period}-{end_period}节",
            'week_range': week_range
        })

    return courses


def extract_courses_from_pdf(pdf_path):
    """从 PDF 提取所有课程"""
    all_courses = []

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()

                for table in tables:
                    for row_idx, row in enumerate(table):
                        if not row or len(row) < 9:
                            continue
                        # 跳过表头
                        if '星期' in str(row[2]) or '时间段' in str(row[0]):
                            continue

                        # 处理星期一到星期日（列 2-8）
                        for col_idx in range(2, min(9, len(row))):
                            day_of_week = col_idx - 1
                            cell = row[col_idx]
                            if not cell or not cell.strip():
                                continue

                            courses = parse_course_cell(cell.strip(), day_of_week)
                            all_courses.extend(courses)
    except Exception as e:
        return {'success': False, 'error': str(e)}

    return {'success': True, 'courses': all_courses}


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': '缺少 PDF 文件路径'}))
        sys.exit(1)

    pdf_path = sys.argv[1]
    # 规范化路径
    pdf_path = os.path.normpath(pdf_path)
    if not os.path.exists(pdf_path):
        print(json.dumps({'success': False, 'error': 'PDF 文件不存在：' + pdf_path}))
        sys.exit(1)

    result = extract_courses_from_pdf(pdf_path)
    print(json.dumps(result, ensure_ascii=False))
