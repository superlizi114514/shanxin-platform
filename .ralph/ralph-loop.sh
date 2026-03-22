#!/bin/bash
# Ralph 自主执行循环 - 山信二手平台
# 基于 Ralph 官方模式：迭代计数 + 状态跟踪 + 电路断路器
#
# 用法：./ralph-loop.sh [max_iterations]
# 示例：./ralph-loop.sh 100

set -e

# =============================================================================
# 初始化
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$SCRIPT_DIR/logs"
STATE_FILE="$SCRIPT_DIR/.ralph-state.json"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 从参数或环境变量读取配置
MAX_ITERATIONS="${1:-${MAX_ITERATIONS:-100}}"
DELAY_SECONDS="${DELAY_SECONDS:-3}"
VERBOSE="${VERBOSE:-false}"

# 加载 .ralphrc 配置
RALPHRC="$PROJECT_ROOT/.ralphrc"
if [ -f "$RALPHRC" ]; then
    echo "正在加载 .ralphrc 配置..."
    source "$RALPHRC"
fi

# =============================================================================
# 日志函数
# =============================================================================

log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >&2
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1"
}

log_to_file() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" >> "$LOG_DIR/ralph.log"
    if [ "$VERBOSE" = "true" ]; then
        echo "$msg"
    fi
}

# =============================================================================
# 状态管理
# =============================================================================

load_state() {
    if [ -f "$STATE_FILE" ]; then
        local iteration=$(grep -o '"iteration": *[0-9]*' "$STATE_FILE" | grep -o '[0-9]*')
        local start_time=$(grep -o '"startTime": *"[^"]*"' "$STATE_FILE" | cut -d'"' -f4)
        ITERATION=${iteration:-0}
        START_TIME=${start_time:-$(date -Iseconds)}
    else
        ITERATION=0
        START_TIME=$(date -Iseconds)
    fi
}

save_state() {
    cat > "$STATE_FILE" <<EOF
{
  "iteration": $ITERATION,
  "startTime": "$START_TIME",
  "lastUpdate": "$(date -Iseconds)"
}
EOF
}

# =============================================================================
# 电路断路器检查
# =============================================================================

check_circuit_breaker() {
    local cb_state_file="$SCRIPT_DIR/.circuit_breaker_state"

    if [ -f "$cb_state_file" ]; then
        local state=$(cat "$cb_state_file")
        if [ "$state" = "OPEN" ]; then
            log_error "电路断路器已打开，停止循环"
            return 1
        fi
    fi
    return 0
}

# =============================================================================
# 主循环
# =============================================================================

main() {
    load_state

    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║     Ralph 自主执行循环 - 山信二手平台          ║"
    echo "╠════════════════════════════════════════════════╣"
    printf "║     最大迭代次数：%-25s ║\n" "$MAX_ITERATIONS"
    printf "║     延迟时间：%-28s ║\n" "${DELAY_SECONDS}s"
    echo "╚════════════════════════════════════════════════╝"
    echo ""

    log_info "Ralph 循环启动 (PID: $$)"
    log_to_file "=== Ralph 循环启动 ==="

    while [ $ITERATION -lt $MAX_ITERATIONS ]; do
        ITERATION=$((ITERATION + 1))
        save_state

        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_info "开始第 $ITERATION/$MAX_ITERATIONS 次 Ralph 迭代"
        log_to_file "开始迭代 #$ITERATION"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""

        # 检查电路断路器
        if ! check_circuit_breaker; then
            log_error "电路断路器检查失败"
            break
        fi

        # 步骤 1: 生成任务
        log_info "步骤 1/2: 生成任务..."
        if [ "$VERBOSE" = "true" ]; then
            node "$PROJECT_ROOT/scripts/ralph-loop.mjs"
        else
            node "$PROJECT_ROOT/scripts/ralph-loop.mjs" 2>&1 | head -20
        fi
        GENERATE_RESULT=$?

        if [ $GENERATE_RESULT -ne 0 ]; then
            log_error "任务生成失败，退出码：$GENERATE_RESULT"
            log_to_file "任务生成失败：退出码 $GENERATE_RESULT"
            break
        fi

        # 检查是否所有任务已完成
        if [ -f "$SCRIPT_DIR/current-task.md" ]; then
            if grep -q "所有用户故事已完成" "$SCRIPT_DIR/current-task.md" 2>/dev/null; then
                log_success "所有任务已完成!"
                break
            fi
        fi

        # 步骤 2: 执行任务
        log_info "步骤 2/3: 执行任务..."

        if [ -f "$SCRIPT_DIR/current-task.md" ]; then
            # 记录任务开始
            TASK_LOG="$LOG_DIR/claude_output_$(date '+%Y-%m-%d_%H-%M-%S').log"
            echo "任务开始：$(date)" >> "$TASK_LOG"
            echo "---" >> "$TASK_LOG"

            # 执行 Claude Code - 直接调用 claude 命令
            log_info "正在调用 Claude Code 执行任务..."
            log_to_file "调用 Claude Code"

            # 使用 claude 命令执行任务
            claude -p "$(cat "$SCRIPT_DIR/current-task.md")" >> "$TASK_LOG" 2>&1

            CLAUDE_RESULT=$?
            echo "---" >> "$TASK_LOG"
            echo "任务结束：$(date), 退出码：$CLAUDE_RESULT" >> "$TASK_LOG"

            if [ $CLAUDE_RESULT -ne 0 ]; then
                log_error "Claude Code 执行失败，退出码：$CLAUDE_RESULT"
                log_to_file "Claude Code 失败：退出码 $CLAUDE_RESULT"
            else
                log_success "任务执行完成"
                log_to_file "任务执行成功"
            fi
        else
            log_error "未找到当前任务文件"
            log_to_file "未找到 current-task.md"
        fi

        # 步骤 3: 更新进度
        log_info "步骤 3/3: 更新进度..."
        node "$PROJECT_ROOT/scripts/update-progress.mjs" 2>&1 | head -20

        # 等待下一轮
        echo ""
        log_info "等待 ${DELAY_SECONDS}秒后继续下一轮..."
        sleep $DELAY_SECONDS

    done

    # =============================================================================
    # 循环结束
    # =============================================================================

    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║     Ralph 循环结束                             ║"
    echo "╠════════════════════════════════════════════════╣"
    printf "║     总迭代次数：%-26s ║\n" "$ITERATION"
    printf "║     启动时间：%-26s ║\n" "$START_TIME"
    printf "║     结束时间：%-26s ║\n" "$(date)"
    echo "╚════════════════════════════════════════════════╝"
    echo ""

    log_info "Ralph 循环结束"
    log_to_file "=== Ralph 循环结束，总迭代次数：$ITERATION ==="

    # 保存最终状态
    save_state
}

# =============================================================================
# 入口点
# =============================================================================

main "$@"
