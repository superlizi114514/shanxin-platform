FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用
COPY app.py .

# 暴露端口（使用环境变量，Railway 需要）
EXPOSE $PORT

# 启动命令（Railway 使用 $PORT 环境变量）
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
