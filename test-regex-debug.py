# -*- coding: utf-8 -*-
import re
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 从实际单元格提取的文本
detail = "(1-2 节)1-2 周，4-6 周 (双),7- 8 周，10-14 周/K4405 教室/赵海 清"

print(f"测试文本：{repr(detail[:50])}")
print()

# 字符分析
print("=== 字符分析 (前 20 个) ===")
for i, c in enumerate(detail[:20]):
    print(f"  [{i}] {repr(c)} 0x{ord(c):04X}")

print()
print("=== 测试正则 ===")

# 测试各种变体
patterns = [
    (r'[(（](\d+)\s*-\s*(\d+)\s* 节', '空格版'),
    (r'[(（](\d+)-(\d+) 节', '无空格版'),
    (r'\((\d+)-(\d+) 节', '简单版'),
]

for p, name in patterns:
    m = re.search(p, detail)
    print(f"{name}: {p}")
    if m:
        print(f"  OK => {repr(m.group(0))}, 节次={m.group(1)}-{m.group(2)}")
    else:
        print(f"  FAIL")
    print()

# 手动检查
print("=== 手动查找 ( 和节 ===")
paren_pos = detail.find('(')
jie_pos = detail.find('节')
print(f"'(' 位置：{paren_pos}")
print(f"'节' 位置：{jie_pos}")
print(f"之间内容：{repr(detail[paren_pos:jie_pos+1])}")
