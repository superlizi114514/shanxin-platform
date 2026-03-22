# -*- coding: utf-8 -*-
"""
测试周次解析 - 正确版本
"""
import re

def parse_week_range(text):
    """解析周次范围"""
    # 检查是否有单双周标记
    is_even = '(双)' in text or '双' in text
    is_odd = '(单)' in text or '(奇)' in text or '单' in text or '奇' in text

    # 将中文逗号，替换为英文逗号,
    text_normalized = text.replace('，', ',')

    # 移除单双周标记和括号
    text_clean = re.sub(r'\(双\)|\(单\)|\(奇\)|\(偶\)|双 | 单 | 奇 | 偶', '', text_normalized)

    # 移除"周"字
    text_clean = text_clean.replace('周', '')

    # 按逗号分割多个范围
    parts = [p.strip() for p in text_clean.split(',') if p.strip()]

    min_week = 999
    max_week = 0

    for part in parts:
        # 匹配范围 "1-2" 或 "1~2"
        match = re.match(r'(\d+)\s*[-~]\s*(\d+)', part)
        if match:
            start = int(match.group(1))
            end = int(match.group(2))
            min_week = min(min_week, start)
            max_week = max(max_week, end)
        else:
            # 单个周次
            match = re.match(r'(\d+)', part)
            if match:
                week = int(match.group(1))
                min_week = min(min_week, week)
                max_week = max(max_week, week)

    # 生成所有周次
    all_weeks = []
    for w in range(min_week, max_week + 1):
        if is_even and w % 2 == 0:
            all_weeks.append(w)
        elif is_odd and w % 2 == 1:
            all_weeks.append(w)
        elif not is_even and not is_odd:
            all_weeks.append(w)

    return {
        'weekStart': min_week if min_week != 999 else 1,
        'weekEnd': max_week if max_week != 0 else 16,
        'weekPattern': 'even' if is_even else ('odd' if is_odd else None),
        'allWeeks': sorted(set(all_weeks))
    }


# 测试各种周次格式
test_cases = [
    "1-2 周，4-6 周 (双),7- 8 周，10-14 周",
    "1-2 周，4-13 周",
    "1-2 周，4-14 周",
    "4-7 周",
    "9-14 周",
    "11 周",
    "15-17 周",
    "1-2 周，4-7 周，9-14 周",
]

print("=== Week Range Parsing Test ===\n")

for text in test_cases:
    result = parse_week_range(text)
    print(f"Input: {text}")
    print(f"  weekStart: {result['weekStart']}")
    print(f"  weekEnd: {result['weekEnd']}")
    print(f"  weekPattern: {result['weekPattern']}")
    print(f"  allWeeks: {result['allWeeks']}")
    print()
