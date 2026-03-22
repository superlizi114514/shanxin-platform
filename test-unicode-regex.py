# -*- coding: utf-8 -*-
import re
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 使用 Unicode 转义避免编码问题
JIE = '\u8282'  # '节' 字

# 测试字符串
s1 = '(1-2' + JIE + ')'
print(f"构建字符串：{repr(s1)}")

# 使用 Unicode 转义写正则
pattern = r'\((\d+)-(\d+)' + JIE
print(f"正则：{repr(pattern)}")

m1 = re.search(pattern, s1)
print(f"匹配：{m1}")
if m1:
    print(f"分组：{m1.groups()}")
