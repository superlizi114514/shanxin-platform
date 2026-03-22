# -*- coding: utf-8 -*-
"""
PDF 课程表解析基线测试 - Python 版本
测试现有正则能匹配多少条课程
"""
import re
import json

# PDF 文本（从 extract-pdf-json.py 输出复制）
PDF_TEXT = """李涵课表
2025-2026 学年第 2 学期 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
1
大学英语 D2☆ 高等数学 C2☆ Web 前端开发☆ 形势与政策 2☆ 高等数学 C2☆
(1-2 节)1-2 周，4-6 周 (双),7- (1-2 节)1-2 周，4-13 周 (1-2 节)1-2 周，4-14 周 (1-2 节)4-7 周/K4103 合堂教 (1-2 节)1-2 周，4-7 周，9-14 周
8 周，10-14 周/K4405 教室/赵海 /K4407 教室/张馨镭/高等数 /K2605 公共微机室/李振华 室/杨坤/形势与政策 2- /K4403 教室/张馨镭/高等数
清/大学英语 D2-2025 级网络 学 C2-2025 级网络 1 班/2025 级 /Web 前端开发 -0002/2025 级 0049/2025 级网络 1 班;2025 级 学 C2-2025 级网络 1 班/2025 级
1 班/2025 级网络 1 班/考试/无 网络 1 班/考试/无/讲授:48/周 网络 1 班/考试/无/讲授:32,实 网络 2 班/未安排/无/讲授 网络 1 班/考试/无/讲授:48/周
/讲授:56/周学时:4/总学时 学时:4/总学时:48/学分:3.0 验:32/周学时:4/总学时:60/学 :8/周学时:2/总学时:36/学分 学时:4/总学时:48/学分:3.0
:56/学分:3.5 分:4.0 :0
数据库应用技术☆ 数据库应用技术☆
2
数据库应用技术☆ (1-2 节)15-17 周/K4102 合堂 数据库应用技术☆ 网络综合布线☆ (1-4 节)16-17 周/K4101 合堂
(1-2 节)15-17 周/K1217 合堂 教室/匈牙利外教 1/数据库 (1-2 节)15-17 周/K4102 合堂 (1-2 节)9-14 周/K5311 网络空 教室/匈牙利外教 1/数据库
教室/匈牙利外教 1/数据库 应用技术 -0008/2025 级网络 教室/匈牙利外教 1/数据库 间安全培养中心与考试认证 应用技术 -0008/2025 级网络
应用技术 -0008/2025 级网络 1 班;2025 级网络 2 班/考试/无 应用技术 -0008/2025 级网络 中心/王立征/网络综合布线 - 1 班;2025 级网络 2 班/考试/无
1 班;2025 级网络 2 班/考试/无 /讲授:32,实验:32/周学时 1 班;2025 级网络 2 班/考试/无 0003/2025 级网络 1 班;2025 级 /讲授:32,实验:32/周学时
/讲授:32,实验:32/周学时 :4/总学时:64/学分:4.0 /讲授:32,实验:32/周学时 网络 2 班/考试/无/讲授:16,实 :4/总学时:64/学分:4.0
:4/总学时:64/学分:4.0 :4/总学时:64/学分:4.0 验:16/周学时:2/总学时:32/学
3 大学体育与健康 2-体育 大学语文☆ 思想道德与法治 2☆ 分:2.0 大学英语 D2☆
舞蹈 (3-4 节)1-2 周，4-14 周 (3-4 节)1-2 周，4-12 周 (3-4 节)1-2 周，4-7 周，9-14 周
(3-4 节)1-4 周，6-8 周，10-17 周 /K4101 合堂教室/王中慧/大 /K4102 合堂教室/冯晓艳/思 网络综合布线☆ /K4405 教室/赵海清/大学英
/北篮球场/赵文菁/大学体育 学语文 -2025 级网络 1 班 想道德与法治 2-0031/2025 级 (1-4 节)1-2 周，8 周/K5311 网络 语 D2-2025 级网络 1 班/2025 级
与健康 2-体育舞蹈 - 奎文 1 班 ,2025 级网络 2 班/2025 级网络 网络 1 班;2025 级网络 2 班/考 空间安全培养中心与考试认 网络 1 班/考试/无/讲授:56/周
上午 /2025/未安排/无/理实一体 1 班;2025 级网络 2 班/考试/无 试/无/讲授:24/周学时:2/总 证中心/王立征/网络综合布 学时:4/总学时:56/学分:3.5
:36/周学时:2/总学时:30/学分 /讲授:32/周学时:2/总学时 学时:24/学分:1.5 线 -0003/2025 级网络 1 班
:2.0 :32/学分:2 ;2025 级网络 2 班/考试/无/讲
授:16,实验:16/周学时:2/总学
数据库应用技术☆ 时:32/学分:2.0
(3-4 节)15-17 周/K4101 合堂
教室/匈牙利外教 1/数据库 数据库应用技术☆
应用技术 -0008/2025 级网络 (1-4 节)15-17 周/K5311 网络
4 1 班;2025 级网络 2 班/考试/无 空间安全培养中心与考试认
/讲授:32,实验:32/周学时 证中心/匈牙利外教 1/数据
:4/总学时:64/学分:4.0 库应用技术 -0008/2025 级网
络 1 班;2025 级网络 2 班/考试
/无/讲授:32,实验:32/周学时
:4/总学时:64/学分:4.0
网络综合布线☆
(3-4 节)4-7 周/K5311 网络空
间安全培养中心与考试认证
中心/王立征/网络综合布线 -
0003/2025 级网络 1 班;2025 级
网络 2 班/考试/无/讲授:16,实
验:16/周学时:2/总学时:32/学
分:2.0
5
军事理论☆ Web 前端开发☆ 职业发展与就业指导 2☆ Web 前端开发☆
(5-6 节)1-2 周，4-6 周 (双),7- (5-6 节)1-2 周，4-10 周，13-16 周 (5-6 节)1-2 周，4-5 周/K4405 教 (5-6 节)9-14 周/K2605 公共微
8 周，10-14 周/K4103 合堂教室 /K2605 公共微机室/李振华 室/刘昱君/职业发展与就业 机室/李振华/Web 前端开发 -
/方文龙/军事理论 - /Web 前端开发 -0002/2025 级 指导 2-0021/2025 级网络 1 班 0002/2025 级网络 1 班/考试
0008/2025 级网络 1 班;2025 级 网络 1 班/考试/无/讲授:32,实 /未安排/无/讲授:4,实验:4/周 /无/讲授:32,实验:32/周学时
网络 2 班/考试/无/讲授:36/周 验:32/周学时:4/总学时:60/学 学时:2/总学时:8/学分:0.5 :4/总学时:60/学分:4.0
学时:2/总学时:28/学分:2.0 分:4.0
数据库应用技术☆ 数据库应用技术☆
6 数据库应用技术☆ 数据库应用技术☆ (5-6 节)15-17 周/K4102 合堂 (5-6 节)16-17 周/K5311 网络
(5-6 节)15-17 周/K5311 网络 (5-6 节)17 周/K5311 网络空间 教室/匈牙利外教 1/数据库 空间安全培养中心与考试认
空间安全培养中心与考试认 安全培养中心与考试认证中 应用技术 -0008/2025 级网络 证中心/匈牙利外教 1/数据
证中心/匈牙利外教 1/数据 心/匈牙利外教 1/数据库应 1 班;2025 级网络 2 班/考试/无 库应用技术 -0008/2025 级网
库应用技术 -0008/2025 级网 用技术 -0008/2025 级网络 1 班 /讲授:32,实验:32/周学时 络 1 班;2025 级网络 2 班/考试
络 1 班;2025 级网络 2 班/考试 ;2025 级网络 2 班/考试/无/讲 :4/总学时:64/学分:4.0 /无/讲授:32,实验:32/周学时
/无/讲授:32,实验:32/周学时 授:32,实验:32/周学时:4/总学 :4/总学时:64/学分:4.0
:4/总学时:64/学分:4.0 时:64/学分:4.0
7
大学语文☆ 大学英语 D2☆ 思想道德与法治 2☆
(7-8 节)12-14 周/K4101 合堂 (7-8 节)13-14 周/K4405 教室 (7-8 节)11 周/K4102 合堂教室
教室/王中慧/大学语文 - /赵海清/大学英语 D2-2025 级 /冯晓艳/思想道德与法治 2-
2025 级网络 1 班，2025 级网络 网络 1 班/2025 级网络 1 班/考 0031/2025 级网络 1 班;2025 级
2 班/2025 级网络 1 班;2025 级 试/无/讲授:56/周学时:4/总 网络 2 班/考试/无/讲授:24/周
网络 2 班/考试/无/讲授:32/周 学时:56/学分:3.5 学时:2/总学时:24/学分:1.5
学时:2/总学时:32/学分:2
8
大学英语 D2☆
(7-8 节)12-14 周/K4405 教室
/赵海清/大学英语 D2-2025 级
网络 1 班/2025 级网络 1 班/考
试/无/讲授:56/周学时:4/总
学时:56/学分:3.5
9
晚上
10
实践课程：短视频创作与运营☆潘玉鸽 (共 16 周)/1-16 周;
其它课程：普通话金永亮 (共 8 周)/3-10 周/无; 劳动实践☆刘昱君 (共 1 周)/3 周/无; 创造性思维与创新方法☆张雪 (共 2 周)/17-18 周/无;
☆: 讲授 ★: 实验 ◎：上机 ●: 实践 ※: 其它 : 课程设计 : 线上 : 理实一体 : 实习 打印时间:2026-03-18"""

def parse_format5_v1(text):
    """
    原始版本 - 从 pdf-parser-format5.ts 复制的正则
    问题：要求教室以 K 开头，但很多教室名不匹配
    """
    courses = []

    # 原始正则（要求教室以 K 开头）
    course_pattern = r'([^\n☆★◎●※]+)([☆★◎●※])\s*\n?\((\d+)-(\d+)\s* 节 \)([^/]+)/(K[^\s/]+(?:教室 | 合堂 | 微机室 | 中心 | 室 | 场)?[^\s/]*)\s*/([^\n/]+)'

    matches = list(re.finditer(course_pattern, text))
    print(f"原始正则 (V1) 匹配数：{len(matches)}")

    for match in matches:
        course_name = match.group(1).strip()
        course_name = re.sub(r'^\d+\s*', '', course_name)
        symbol = match.group(2)
        period = f"({match.group(3)}-{match.group(4)}节)"
        week_range = match.group(5).strip()
        classroom = match.group(6)
        teacher = match.group(7)

        print(f"  - {course_name}: {period} | {classroom} | {teacher[:10]}...")
        courses.append({
            'course_name': course_name,
            'symbol': symbol,
            'period': period,
            'week_range': week_range,
            'classroom': classroom,
            'teacher': teacher
        })

    return courses

def parse_format5_v2(text):
    """
    改进版本 - 放宽教室匹配（不要求 K 开头）
    """
    courses = []

    # 改进正则 - 不要求教室以 K 开头，允许更广泛的教室名
    course_pattern = r'([^\n☆★◎●※]+)([☆★◎●※])\s*\n?\((\d+)-(\d+)\s* 节 \)([^/\n]+)/([^\s/][^\n/]*?(?:教室 | 合堂 | 微机室 | 中心 | 室 | 场 | 篮球场 | 机房)?[^\s/]*)\s*/([^\n/]+)'

    matches = list(re.finditer(course_pattern, text))
    print(f"\n改进正则 (V2) 匹配数：{len(matches)}")

    for match in matches:
        course_name = match.group(1).strip()
        course_name = re.sub(r'^\d+\s*', '', course_name)
        symbol = match.group(2)
        period = f"({match.group(3)}-{match.group(4)}节)"
        week_range = match.group(5).strip()
        classroom = match.group(6)
        teacher_raw = match.group(7)

        # 提取教师名（2-6 个中文字符）
        teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
        teacher = teacher_match.group(1) if teacher_match else ''

        if not teacher:
            print(f"  ⚠️ 跳过 (无教师): {course_name}")
            continue

        print(f"  ✓ {course_name}: {period} | {classroom} | {teacher}")
        courses.append({
            'course_name': course_name,
            'symbol': symbol,
            'period': period,
            'week_range': week_range,
            'classroom': classroom,
            'teacher': teacher
        })

    return courses

def parse_format5_v3(text):
    """
    V3 版本 - 更宽松的教室匹配 + 处理换行
    """
    courses = []

    # 先预处理：将连续的短行合并（处理换行切断的问题）
    lines = text.split('\n')
    merged_lines = []
    current_line = ''

    for line in lines:
        line = line.strip()
        if not line:
            if current_line:
                merged_lines.append(current_line)
                current_line = ''
            continue

        # 如果当前行以 (节次) 开头，说明是新课程详情，另起一行
        if line.startswith('(') and re.match(r'^\(\d+-\d+\s* 节 \)', line):
            if current_line:
                merged_lines.append(current_line)
            current_line = line
        elif current_line and not line.startswith('('):
            # 继续合并到当前行
            current_line += ' ' + line
        else:
            if current_line:
                merged_lines.append(current_line)
            current_line = line

    if current_line:
        merged_lines.append(current_line)

    merged_text = '\n'.join(merged_lines)

    # V3 正则 - 更宽松的模式
    # 课程名 + 符号 + (节次) + 周次/教室/教师
    course_pattern = r'([^\n☆★◎●※]+?[☆★◎●※])\s*\((\d+)-(\d+)\s* 节 \)([^/\n]+)/([^\n/]+?)\s*/([^\n/]+)'

    matches = list(re.finditer(course_pattern, merged_text))
    print(f"\nV3 正则 (合并行) 匹配数：{len(matches)}")

    for match in matches:
        course_name = match.group(1).strip()
        course_name = re.sub(r'^\d+\s*', '', course_name)
        symbol = match.group(2)
        start_period = match.group(3)
        end_period = match.group(4)
        week_range = match.group(5).strip()
        classroom_raw = match.group(6)
        teacher_raw = match.group(7)

        # 清理教室
        classroom = re.sub(r'(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间 | 培养中心 | 考试认证 | 与)', '', classroom_raw)

        # 提取教师
        teacher_match = re.match(r'^([\u4e00-\u9fa5]{2,6}|[\u4e00-\u9fa5]+ 外教)', teacher_raw)
        teacher = teacher_match.group(1) if teacher_match else ''

        if not teacher or len(course_name) < 2:
            print(f"  ⚠️ 跳过：{course_name[:20]}...")
            continue

        print(f"  ✓ {course_name}: ({start_period}-{end_period}节) | {classroom} | {teacher}")
        courses.append({
            'course_name': course_name,
            'symbol': symbol,
            'period': f"{start_period}-{end_period}节",
            'week_range': week_range,
            'classroom': classroom,
            'teacher': teacher
        })

    return courses


def manual_count_expected(text):
    """
    手动统计预期的课程数量
    """
    print("\n" + "="*60)
    print("预期课程统计（手动分析）")
    print("="*60)

    # 统计所有带☆的课程名
    course_symbols = re.findall(r'([^\n☆★◎●※]+)([☆★◎●※])', text)

    unique_courses = set()
    valid_courses = []
    for name, symbol in course_symbols:
        name = name.strip()
        # 过滤掉无效的
        if len(name) >= 2 and not name.startswith('打印') and not name.startswith('☆:') and not name.startswith('实践课程') and not name.startswith('其它课程') and ':' not in name:
            unique_courses.add(name)
            valid_courses.append((name, symbol))

    print(f"所有带符号的课程出现次数：{len(valid_courses)}")
    print(f"去重后的课程名数量：{len(unique_courses)}")
    print("有效课程名列表:")
    for c in sorted(unique_courses):
        print(f"  - {c}")

    return len(valid_courses)

if __name__ == '__main__':
    print("="*60)
    print("PDF 课程表解析基线测试")
    print("="*60)

    expected = manual_count_expected(PDF_TEXT)

    print("\n" + "="*60)
    print("正则匹配测试")
    print("="*60)

    v1_courses = parse_format5_v1(PDF_TEXT)
    v2_courses = parse_format5_v2(PDF_TEXT)
    v3_courses = parse_format5_v3(PDF_TEXT)

    print("\n" + "="*60)
    print("结果对比")
    print("="*60)
    print(f"预期课程出现次数：{expected}")
    print(f"V1 (原始) 匹配数：{len(v1_courses)} - 读取率：{len(v1_courses)/expected*100:.1f}%")
    print(f"V2 (改进) 匹配数：{len(v2_courses)} - 读取率：{len(v2_courses)/expected*100:.1f}%")
    print(f"V3 (合并行) 匹配数：{len(v3_courses)} - 读取率：{len(v3_courses)/expected*100:.1f}%")
