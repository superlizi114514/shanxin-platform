#!/bin/bash
# Ralph 快速启动脚本
# 用法：./start-ralph.sh [max_iterations]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║     🚀 Ralph 快速启动 - 山信二手平台           ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] 未找到 Node.js"
    exit 1
fi

# 检查 Claude CLI
if ! command -v claude &> /dev/null; then
    echo "[ERROR] 未找到 Claude CLI，请先安装：npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# 默认参数
MAX_ITERATIONS="${1:-100}"

echo "✓ Node.js: $(node -v)"
echo "✓ Claude CLI: $(claude --version 2>/dev/null || echo '已安装')"
echo "✓ 最大迭代次数：$MAX_ITERATIONS"
echo ""

# 运行主循环
./ralph-loop.sh "$MAX_ITERATIONS"
