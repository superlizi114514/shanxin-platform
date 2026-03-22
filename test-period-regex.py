# -*- coding: utf-8 -*-
import re
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

detail = "(1-2 节)1-2 周，4-6 周 (双),7- 8 周，10-14 周/K4405 教室/赵海 清"

print(f"测试文本：{repr(detail[:30])}")
print()

patterns = [
    r'[(（](\d+)\s*-\s*(\d+)\s*节 [)）]?',
    r'[(（](\d+)-(\d+) 节 [)）]?',
    r'[(（](\d+)-(\d+) 节',
    r'\((\d+)-(\d+) 节',
    r'[(（](\d+)-(\d+)',
]

for p in patterns:
    m = re.search(p, detail)
    if m:
        print(f"OK {p}")
        print(f"  匹配：{repr(m.group(0))}")
        print(f"  组：{m.group(1)}-{m.group(2)}")
    else:
        print(f"FAIL {p}")

print()
print("=== 字符分析 ===")
for i, c in enumerate(detail[:15]):
    print(f"  [{i}] {repr(c)} 0x{ord(c):04X}")
