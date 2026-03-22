"""
课程表 PDF 解析 API - 使用 pdfplumber
部署到 Hugging Face Spaces
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import json
import re
import sys

app = FastAPI(title="课程表 PDF 解析 API")

# 允许 CORS（你的 Vercel 域名）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境改为你的 Vercel 域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 节次时间映射（山东信息职业技术学院）
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

# 星期映射
DAY_MAP = {
    '星期一': 1, '周一': 1,
    '星期二': 2, '周二': 2,
    '星期三': 3, '周三': 3,
    '星期四': 4, '周四': 4,
    '星期五': 5, '周五': 5,
    '星期六': 6, '周六': 6,
    '星期日': 7, '周日': 7
}


def parse_week_range(text: str) -> dict:
    """解析周次范围"""
    if not text or text.strip() == '':
        return {"weekStart": 1, "weekEnd": 16, "weekPattern": None, "weekList": None}

    text = text.replace('\uFF0C', ',')  # 中文逗号转英文
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
    week_start = min(week_list) if week_list else 1
    week_end = max(week_list) if week_list else 16

    return {
        "weekStart": week_start,
        "weekEnd": week_end,
        "weekPattern": week_pattern,
        "weekList": week_list
    }


def extract_courses_from_pdf(pdf_bytes: bytes) -> list:
    """从 PDF 提取课程"""
    import io

    courses = []

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            # 提取表格
            tables = page.extract_tables()

            for table in tables:
                if not table:
                    continue

                current_day = 0

                for row in table:
                    if not row:
                        continue

                    row_text = ' | '.join([str(c) if c else '' for c in row])

                    # 检测星期
                    for day_text, day_num in DAY_MAP.items():
                        if day_text in row_text or f'周{day_text}' in row_text:
                            current_day = day_num
                            break

                    if current_day == 0:
                        continue

                    # 查找课程（带☆标记）
                    for cell in row:
                        if not cell or '☆' not in cell:
                            continue

                        course_name = cell.replace('☆', '').strip()
                        if len(course_name) < 2 or len(course_name) > 50:
                            continue

                        # 在同一行或其他单元格查找详情
                        full_info = ' '.join([str(c) if c else '' for c in row])

                        # 解析节次 (X-Y 节)
                        period_match = re.search(r'\((\d+)-(\d+) 节\)', full_info)
                        if not period_match:
                            continue

                        start_period = int(period_match.group(1))
                        end_period = int(period_match.group(2))

                        # 解析周次
                        after_period = full_info[period_match.end():]
                        week_match = re.match(r'^([\d, 周双单 ()\-~☆]+)', after_period)
                        week_text = week_match.group(1) if week_match else ''

                        # 解析教室和教师（通常在/分隔后）
                        remaining = after_period[week_match.end():] if week_match else after_period
                        parts = [p.strip() for p in remaining.split('/') if p.strip()]

                        classroom = parts[0].replace('教室', '').replace('合堂', '').strip() if parts else ''
                        teacher = parts[1].strip() if len(parts) > 1 else ''

                        # 解析周次
                        week_info = parse_week_range(week_text)

                        # 节次转时间
                        start_time = PERIOD_TIME.get(start_period, {}).get('start', '')
                        end_time = PERIOD_TIME.get(end_period, {}).get('end', '')

                        courses.append({
                            "course_name": course_name,
                            "teacher": teacher,
                            "classroom": classroom,
                            "day_of_week": current_day,
                            "start_period": str(start_period),
                            "end_period": str(end_period),
                            "period": f"{start_period}-{end_period}节",
                            "start_time": start_time,
                            "end_time": end_time,
                            "week_range": week_text,
                            "weekStart": week_info["weekStart"],
                            "weekEnd": week_info["weekEnd"],
                            "weekPattern": week_info["weekPattern"],
                            "weekList": week_info["weekList"]
                        })

    return courses


@app.post("/parse")
async def parse_pdf(file: UploadFile = File(...)):
    """解析课程表 PDF"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="只支持 PDF 文件")

    try:
        content = await file.read()
        courses = extract_courses_from_pdf(content)

        if not courses:
            return {
                "success": False,
                "error": "未解析到课程数据，请确保 PDF 格式正确",
                "courses": []
            }

        return {
            "success": True,
            "count": len(courses),
            "courses": courses
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"解析失败：{str(e)}")


@app.get("/")
async def root():
    """API 状态"""
    return {
        "status": "ok",
        "service": "课程表 PDF 解析 API",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get('PORT', 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
