# -*- coding: utf-8 -*-
"""
调试：检查实际的空白字符
"""
import re

PDF_TEXT = """李涵课表
2025-2026 学年第 2 学期 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
1
大学英语 D2☆ 高等数学 C2☆ Web 前端开发☆ 形势与政策 2☆ 高等数学 C2☆
(1-2 节)1-2 周，4-6 周 (双),7- (1-2 节)1-2 周，4-13 周 (1-2 节)1-2 周，4-14 周 (1-2 节)4-7 周/K4103 合堂教 (1-2 节)1-2 周，4-7 周，9-14 周"""

full_text = ' '.join(line.strip() for line in PDF_TEXT.split('\n') if line.strip())

# 找到所有包含"节)"的位置
for i, char in enumerate(full_text):
    if char == '节':
        # 打印周围 10 个字符
        start = max(0, i-5)
        end = min(len(full_text), i+10)
        snippet = full_text[start:end]
        # 打印每个字符的 Unicode 编码
        print(f"@{i}: ", end='')
        for j, c in enumerate(snippet):
            print(f"{c}(U+{ord(c):04X})", end=' ')
        print()

# 测试不同的空格模式
patterns = [
    (r'\((\d+)-(\d+)\s* 节 \)', '普通\\s'),
    (r'\((\d+)-(\d+)\s*节\s*\)', '中文空格'),
    (r'\((\d+)-(\d+)[\s\u00A0]* 节 [\s\u00A0]*\)', '包含\u00A0'),
    (r'\((\d+)-(\d+)[^\d]* 节 [^\d]*\)', '非数字'),
]

for pattern, name in patterns:
    matches = re.findall(pattern, full_text)
    print(f"\n模式 {name}: {len(matches)} 个匹配")
    if matches:
        print(f"  示例：{matches[:3]}")
