import pdfplumber
import sys
import os

# 设置控制台编码为 UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 查找 PDF 文件
pdf_file = None
for f in os.listdir('.'):
    if '李涵' in f and f.endswith('.pdf'):
        pdf_file = f
        break

if not pdf_file:
    print("未找到 PDF 文件")
    sys.exit(1)

print(f"读取 PDF: {pdf_file}")

try:
    with pdfplumber.open(pdf_file) as pdf:
        print(f"页数：{len(pdf.pages)}")

        full_text = ""
        for i, page in enumerate(pdf.pages):
            print(f"\n=== 第 {i+1} 页 ===")
            text = page.extract_text()
            print(f"文本长度：{len(text) if text else 0}")
            if text:
                print(text)
                full_text += text + "\n"

        print("\n========== 完整文本 ==========")
        print(full_text)
        print("============================")

        if '☆' in full_text:
            print("\n[OK] 找到☆标记！")
        else:
            print("\n[INFO] 未找到☆标记")

except Exception as e:
    print(f"错误：{e}")
    import traceback
    traceback.print_exc()
