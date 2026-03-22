# -*- coding: utf-8 -*-
"""
测试精确正则
"""
import re

after = "(1-2 节)1-2 周，4-6 周 (双),7- 8 周，10-14 周/K4405 教室/赵海 清"

print(f"测试：{after[:30]}...")

# 测试各种变体
patterns = [
    r'\((\d+)-(\d+)\s* 节\s*\)',     # 原始 - 数字和节之间可选空格
    r'\((\d+)-(\d+) 节\s*\)',        # 数字和节之间无空格
    r'\((\d+)\s*-\s*(\d+)\s* 节\s*\)',  # 所有位置都可选空格
    r'\((\d+)-(\d+) 节\)',           # 最严格
    r'[(](\d+)-(\d+)[节][)]',        # 字符类
]

for pattern in patterns:
    match = re.search(pattern, after)
    if match:
        print(f"OK: {pattern} => {match.group(0)}")
    else:
        print(f"FAIL: {pattern}")
