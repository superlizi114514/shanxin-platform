"""
阿里云函数计算 Web 函数 - PDF 课程表解析器
入口文件：index.py
启动命令：python3 index.py
监听端口：9000
"""

import json
import io
import re
import pdfplumber
from http.server import HTTPServer, BaseHTTPRequestHandler

PERIOD_TIME = {
    1: {"start": "08:00", "end": "08:45"},
    2: {"start": "08:55", "end": "09:40"},
    3: {"start": "10:00", "end": "10:45"},
    4: {"start": "10:55", "end": "11:40"},
    5: {"start": "14:00", "end": "14:45"},
    6: {"start": "14:55", "end": "15:40"},
    7: {"start": "16:00", "end": "16:45"},
    8: {"start": "16:55", "end": "17:40"},
    9: {"start": "18:30", "end": "19:15"},
    10: {"start": "19:25", "end": "20:10"},
}

DAY_MAP = {
    '星期一': 1, '周一': 1, '星期二': 2, '周二': 2, '星期三': 3, '周三': 3,
    '星期四': 4, '周四': 4, '星期五': 5, '周五': 5, '星期六': 6, '周六': 6,
    '星期日': 7, '周日': 7
}


def parse_week_range(text: str) -> dict:
    if not text or text.strip() == '':
        return {"weekStart": 1, "weekEnd": 16, "weekPattern": None, "weekList": None}
    text = text.replace('\uFF0C', ',')
    segments = [s.strip() for s in text.split(',') if s.strip()]
    all_weeks = set()
    week_pattern = None
    for segment in segments:
        is_even = '(双)' in segment or '双' in segment
        is_odd = '(单)' in segment or '(奇)' in segment or '单' in segment or '奇' in segment
        clean = re.sub(r'\(双\)|\(单\)|\(奇\)|\(偶\)| 双 | 单 | 奇 | 偶|周', '', segment)
        range_match = re.match(r'(\d+)\s*[-~]\s*(\d+)', clean)
        if range_match:
            start, end = int(range_match[1]), int(range_match[2])
            if is_even:
                all_weeks.update(w for w in range(start, end + 1) if w % 2 == 0)
            elif is_odd:
                all_weeks.update(w for w in range(start, end + 1) if w % 2 == 1)
            else:
                all_weeks.update(range(start, end + 1))
        else:
            single_match = re.search(r'(\d+)', clean)
            if single_match:
                all_weeks.add(int(single_match[1]))
    if len(segments) == 1:
        if '(双)' in text or '双' in text:
            week_pattern = 'even'
        elif '(单)' in text or '单' in text:
            week_pattern = 'odd'
    week_list = sorted(list(all_weeks)) if all_weeks else None
    return {
        "weekStart": min(week_list) if week_list else 1,
        "weekEnd": max(week_list) if week_list else 16,
        "weekPattern": week_pattern,
        "weekList": week_list
    }


def extract_courses_from_pdf(pdf_bytes: bytes) -> list:
    courses = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table:
                    continue
                current_day = 0
                for row in table:
                    if not row:
                        continue
                    row_text = ' | '.join([str(c) if c else '' for c in row])
                    for day_text, day_num in DAY_MAP.items():
                        if day_text in row_text or f'周{day_text}' in row_text:
                            current_day = day_num
                            break
                    if current_day == 0:
                        continue
                    for cell in row:
                        if not cell or '☆' not in cell:
                            continue
                        course_name = cell.replace('☆', '').strip()
                        if len(course_name) < 2 or len(course_name) > 50:
                            continue
                        full_info = ' '.join([str(c) if c else '' for c in row])
                        period_match = re.search(r'\((\d+)-(\d+) 节\)', full_info)
                        if not period_match:
                            continue
                        start_period = int(period_match.group(1))
                        end_period = int(period_match.group(2))
                        after_period = full_info[period_match.end():]
                        week_match = re.match(r'^([\d, 周双单 ()\-~☆]+)', after_period)
                        week_text = week_match.group(1) if week_match else ''
                        remaining = after_period[week_match.end():] if week_match else after_period
                        parts = [p.strip() for p in remaining.split('/') if p.strip()]
                        classroom = parts[0].replace('教室', '').replace('合堂', '').strip() if parts else ''
                        teacher = parts[1].strip() if len(parts) > 1 else ''
                        week_info = parse_week_range(week_text)
                        start_time = PERIOD_TIME.get(start_period, {}).get('start', '')
                        end_time = PERIOD_TIME.get(end_period, {}).get('end', '')
                        courses.append({
                            "course_name": course_name,
                            "teacher": teacher,
                            "classroom": classroom,
                            "day_of_week": current_day,
                            "period": f"{start_period}-{end_period}节",
                            "start_time": start_time,
                            "end_time": end_time,
                            "weekStart": week_info["weekStart"],
                            "weekEnd": week_info["weekEnd"],
                            "weekPattern": week_info["weekPattern"],
                            "weekList": week_info["weekList"]
                        })
    return courses


def parse_multipart_form_data(content_type: str, body: bytes) -> bytes:
    if 'boundary=' not in content_type:
        return b''
    boundary = content_type.split('boundary=')[1].strip()
    if boundary.startswith('"') and boundary.endswith('"'):
        boundary = boundary[1:-1]
    boundary_bytes = boundary.encode()
    parts = body.split(b'--' + boundary_bytes)
    for part in parts:
        part = part.strip(b'\r\n')
        if not part or part == b'--':
            continue
        if b'filename=' in part:
            header_end = part.find(b'\r\n\r\n')
            if header_end != -1:
                file_data = part[header_end + 4:]
                if file_data.endswith(b'\r\n--' + boundary_bytes + b'--'):
                    file_data = file_data[:-len(b'\r\n--' + boundary_bytes + b'--')]
                elif file_data.endswith(b'--' + boundary_bytes + b'--'):
                    file_data = file_data[:-len(b'--' + boundary_bytes + b'--')]
                elif file_data.endswith(b'\r\n'):
                    file_data = file_data[:-2]
                return file_data
    return b''


class WSGIHandler:
    def __init__(self):
        pass

    def __call__(self, environ, start_response):
        return handler(environ, start_response)


def handler(environ, start_response):
    if environ.get('REQUEST_METHOD') == 'OPTIONS':
        headers = [
            ('Content-Type', 'application/json'),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization'),
        ]
        start_response('200 OK', headers)
        return [json.dumps({}).encode()]

    try:
        content_length = int(environ.get('CONTENT_LENGTH', 0))
        request_body = environ['wsgi.input'].read(content_length)
        content_type = environ.get('CONTENT_TYPE', '')

        if 'multipart/form-data' in content_type:
            pdf_data = parse_multipart_form_data(content_type, request_body)
            if not pdf_data:
                response_data = {"success": False, "error": "未找到 PDF 文件"}
            else:
                courses = extract_courses_from_pdf(pdf_data)
                if not courses:
                    response_data = {"success": False, "error": "未解析到课程数据", "count": 0}
                else:
                    response_data = {"success": True, "count": len(courses), "courses": courses}
        else:
            response_data = {"success": False, "error": "请使用 multipart/form-data 格式"}

    except Exception as e:
        response_data = {"success": False, "error": f"解析失败：{str(e)}"}

    headers = [
        ('Content-Type', 'application/json'),
        ('Access-Control-Allow-Origin', '*'),
    ]
    start_response('200 OK', headers)
    return [json.dumps(response_data, ensure_ascii=False).encode('utf-8')]


# HTTP Server 入口 - 阿里云函数计算 Web 函数
class PDFHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {"status": "ok", "service": "PDF Parser API"}
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        request_body = self.rfile.read(content_length)
        content_type = self.headers.get('Content-Type', '')

        try:
            if 'multipart/form-data' in content_type:
                pdf_data = parse_multipart_form_data(content_type, request_body)
                if not pdf_data:
                    response_data = {"success": False, "error": "未找到 PDF 文件"}
                else:
                    courses = extract_courses_from_pdf(pdf_data)
                    if not courses:
                        response_data = {"success": False, "error": "未解析到课程数据", "count": 0}
                    else:
                        response_data = {"success": True, "count": len(courses), "courses": courses}
            else:
                response_data = {"success": False, "error": "请使用 multipart/form-data 格式"}
        except Exception as e:
            response_data = {"success": False, "error": f"解析失败：{str(e)}"}

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 9000))
    server = HTTPServer(('0.0.0.0', port), PDFHandler)
    print(f'Starting server on port {port}...')
    server.serve_forever()
