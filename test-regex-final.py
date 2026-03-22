# -*- coding: utf-8 -*-
import re
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 从 debug 输出复制的详情文本
detail = "(1-2 节)1-2 周，4-6 周 (双),7- 8 周，10-14 周/K4405 教室/赵海 清"

print(f"测试文本：{repr(detail[:30])}")
print()

# 字符分析
print("=== 字符分析 ===")
for i, c in enumerate(detail[:15]):
    print(f"  [{i}] {repr(c)} 0x{ord(c):04X}")

print()
print("=== 测试正则 ===")

# 测试各种变体
patterns = [
    (r'[(（](\d+)\s*-\s*(\d+)\s* 节', '有空格'),
    (r'[(（](\d+)-(\d+) 节', '无空格'),
    (r'\((\d+)-(\d+) 节', '简单'),
    (r'[(（](\d+)\s*-\s*(\d+) 节', '混合'),
    (r'\((\d+)\s*-\s*(\d+) 节', '最简'),
]

for p, name in patterns:
    m = re.search(p, detail)
    status = "OK" if m else "FAIL"
    match_text = repr(m.group(0)) if m else ""
    print(f"{status} {name}: {p} => {match_text}")
