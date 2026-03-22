# -*- coding: utf-8 -*-
"""
测试新正则
"""
import re

# 测试文本（实际 from PDF）
after = "(1-2 节)1-2 周，4-6 周 (双),7- 8 周，10-14 周/K4405 教室/赵海 清/大学英语 D2-2025 级网络 1 班/2025 级网络 1 班"

print(f"测试文本：{after[:50]}...")

# 测试不同的正则
patterns = [
    (r'\((\d+)-(\d+)\s* 节\s*\)', '原始'),
    (r'\((\d+)\s*-\s*(\d+)\s* 节\s*\)', '新正则'),
    (r'[(（](\d+)\s*-\s*(\d+)[^\d]* 节\s*[)）]', '更宽松'),
    (r'[(（](\d+)\s*-\s*(\d+)[节節]', '最小匹配'),
]

for pattern, name in patterns:
    match = re.search(pattern, after)
    if match:
        print(f"\n模式 '{name}': 匹配成功")
        print(f"  完整匹配：{match.group(0)}")
        print(f"  组 1: {match.group(1)}, 组 2: {match.group(2)}")
    else:
        print(f"\n模式 '{name}': 匹配失败")
