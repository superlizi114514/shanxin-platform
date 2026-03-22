# PDF 文本提取脚本 - 输出为 JSON
import pdfplumber
import sys
import os
import json

# 设置控制台编码为 UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def extract_pdf_text(pdf_path):
    """提取 PDF 文本内容"""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
            return {
                "success": True,
                "text": full_text.strip(),
                "pages": len(pdf.pages)
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    # 从当前目录查找 PDF
    pdf_file = None
    for f in os.listdir('.'):
        if '李涵' in f and f.endswith('.pdf'):
            pdf_file = f
            break

    if not pdf_file:
        print(json.dumps({"success": False, "error": "未找到 PDF 文件"}))
        sys.exit(1)

    result = extract_pdf_text(pdf_file)
    print(json.dumps(result, ensure_ascii=False))
