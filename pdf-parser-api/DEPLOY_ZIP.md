# 阿里云函数计算 - ZIP 包部署

## 步骤

### 1. 复制文件到新目录

```bash
# 创建部署目录
mkdir aliyun-deploy
cd aliyun-deploy

# 复制代码
cp ../aliyun-web-index.py ./index.py
cp ../requirements.txt ./requirements.txt
```

### 2. 安装依赖到目录

```bash
# Windows PowerShell
python -m pip install -r requirements.txt -t ./python/lib/python3.10/site-packages

# 或者用这个命令
pip install pdfplumber pillow waitress -t ./python/lib/python3.10/site-packages
```

### 3. 创建 ZIP 包

```bash
# 压缩所有文件
powershell -Command "Compress-Archive -Path index.py,python -DestinationPath aliyun-pdf-parser.zip -Force"

# 或者手动：全选 index.py 和 python 文件夹 → 右键 → 发送到 → 压缩文件夹
```

### 4. 上传到阿里云

1. 回到阿里云函数计算控制台
2. 代码上传方式：选择 **通过 ZIP 包上传代码**
3. 上传 `aliyun-pdf-parser.zip`
4. 运行环境：选择 **自定义运行时 Debian 10**
5. 启动命令：
   ```
   python3 -m waitress --listen=0.0.0.0:9000 --call index:app
   ```
6. 监听端口：`9000`

### 5. 配置触发器

- 触发器类型：HTTP 触发器
- 认证方式：免认证（anonymous）

### 6. 测试

部署成功后，访问函数 URL：
```bash
curl -X POST \
  -F "file=@你的课表.pdf" \
  "https://你的函数 URL/invoke"
```
