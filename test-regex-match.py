# -*- coding: utf-8 -*-
"""
检查正则匹配问题
"""
import re

# 测试文本
after = "(1-2 节)1-2 周，4-6 周 (双),7- 8 周，10-14 周/K4405 教室/赵海 清/大学英语 D2-2025 级网络 1 班/2025 级网络 1 班"

print(f"测试文本：{after}")
print(f"长度：{len(after)}")

# 检查每个字符
print("\n字符分析:")
for i, c in enumerate(after[:30]):
    print(f"  [{i}] '{c}' U+{ord(c):04X}")

# 测试不同的正则
patterns = [
    (r'\((\d+)-(\d+)\s* 节\s*\)', '原始正则'),
    (r'\((\d+)-(\d+)[^)]*\)', '非右括号'),
    (r'\((\d+)-(\d+).*?\)', '最小匹配'),
    (r'[(（](\d+)-(\d+)[节節][)）]', '全角括号'),
]

for pattern, name in patterns:
    match = re.search(pattern, after)
    if match:
        print(f"\n模式 '{name}': 匹配成功")
        print(f"  匹配：{match.group(0)}")
        print(f"  组 1: {match.group(1)}, 组 2: {match.group(2)}")
    else:
        print(f"\n模式 '{name}': 匹配失败")
