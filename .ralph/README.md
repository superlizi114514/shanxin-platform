# Ralph 自主执行循环 - 使用指南

## 概述

Ralph (Autonomous AI Development Agent) 是一个自主执行循环系统，可以自动读取 PRD、生成任务、调用 Claude Code 执行任务，并更新进度。

## 目录结构

```
.ralph/
├── ralph-loop.sh          # Linux/Mac 主循环脚本
├── ralph-loop.bat         # Windows 主循环脚本
├── start-ralph.sh         # Linux/Mac 快速启动
├── start-ralph.bat        # Windows 快速启动
├── .ralphrc               # 项目配置
├── prd.json               # 产品需求文档（用户故事）
├── progress.txt           # 进度跟踪
├── fix_plan.md            # 修复计划
├── current-task.md        # 当前任务（自动生成）
├── logs/                  # 执行日志
└── archive/               # 历史归档
```

## 快速开始

### Windows

```bash
# 方法 1: 使用快速启动脚本（推荐）
.ralph\start-ralph.bat [max_iterations]
# 示例：.ralph\start-ralph.bat 100

# 方法 2: 直接运行主循环
.ralph\ralph-loop.bat [max_iterations]
```

### Linux/Mac

```bash
# 方法 1: 使用快速启动脚本（推荐）
./ralph/start-ralph.sh [max_iterations]
# 示例：./ralph/start-ralph.sh 100

# 方法 2: 直接运行主循环
./ralph/ralph-loop.sh [max_iterations]
```

## 配置选项

在 `.ralphrc` 文件中配置：

```bash
# 最大迭代次数
MAX_ITERATIONS=100

# 每轮延迟（秒）
DELAY_SECONDS=3

# Claude 超时（分钟）
CLAUDE_TIMEOUT_MINUTES=15

# 允许的工具
ALLOWED_TOOLS="Write,Read,Edit,Bash(git *),Bash(npm *)"

#  verbosity
RALPH_VERBOSE=false
```

## 环境变量

```bash
# Linux/Mac
export MAX_ITERATIONS=50
export DELAY_SECONDS=5
export VERBOSE=true
./ralph-loop.sh

# Windows
set MAX_ITERATIONS=50
set DELAY_SECONDS=5
set VERBOSE=true
ralph-loop.bat
```

## 运行模式

### 1. 正常模式（默认）
```bash
./ralph-loop.sh 100
```
运行最多 100 次迭代，每次迭代：
1. 生成任务（从 PRD 读取下一个用户故事）
2. 执行任务（调用 Claude Code）
3. 更新进度（分析输出并更新状态）

### 2. 详细模式
```bash
VERBOSE=true ./ralph-loop.sh 100
```
显示完整日志输出，包括所有 Claude Code 响应。

### 3. 单次迭代模式
```bash
./ralph-loop.sh 1
```
只运行一次迭代，适合测试。

## 工作流程

```
┌─────────────────┐
│   启动 Ralph    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 1. 加载配置     │
│    - .ralphrc   │
│    - prd.json   │
│    - 状态文件   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. 检查断路器   │
│    - 防止无限   │
│    - 错误循环   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. 生成任务     │
│    - 读取 PRD   │
│    - 选择故事   │
│    - 写入任务   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. 执行任务     │
│    - Claude Code│
│    - 实现功能   │
│    - 运行测试   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. 更新进度     │
│    - 分析输出   │
│    - 标记完成   │
│    - 更新 PRD   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. 检查完成     │
│    - 所有故事？ │
│    - 退出信号？ │
└────────┬────────┘
         │
    ┌────┴────┐
    │  继续？  │
    └────┬────┘
         │
    Yes  │  No
    ┌────┴────┐
    │         │
    ▼         ▼
  循环 3    结束
```

## 任务状态

### RALPH_STATUS 块格式

Claude Code 在执行任务后应输出以下状态块：

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
EXIT_SIGNAL: false | true
RECOMMENDATION: <one line summary>
---END_RALPH_STATUS---
```

### 退出信号

当满足以下条件时，`EXIT_SIGNAL` 设置为 `true`：
1. ✅ fix_plan.md 中所有项目已标记完成
2. ✅ 所有测试通过
3. ✅ 无错误或警告
4. ✅ PRD 中所有需求已实现

## 日志文件

### ralph.log
主日志文件，记录循环启动、迭代开始/结束、错误信息。

### claude_output_YYYY-MM-DD_HH-MM-SS.log
每次 Claude Code 执行的完整输出。

### 状态文件
- `.ralph-state.json` - 当前状态（迭代次数、启动时间）
- `.circuit_breaker_state` - 电路断路器状态
- `.last-branch` - 最后工作的分支

## 故障排除

### 问题：任务生成失败
**解决方案**：
1. 检查 `prd.json` 格式是否正确
2. 确认 `progress.txt` 存在
3. 查看详细日志：`cat logs/ralph.log`

### 问题：Claude Code 执行失败
**解决方案**：
1. 确认已安装 Claude CLI: `npm install -g @anthropic-ai/claude-code`
2. 检查认证：`claude login`
3. 查看详细日志：`cat logs/claude_output_*.log`

### 问题：电路断路器打开
**解决方案**：
1. 检查断路器状态：`cat .ralph/.circuit_breaker_state`
2. 等待 cooldown 时间（默认 30 分钟）
3. 或手动重置：`echo "CLOSED" > .ralph/.circuit_breaker_state`

### 问题：无限循环
**解决方案**：
1. 按 Ctrl+C 停止循环
2. 减少 `MAX_ITERATIONS`
3. 检查任务是否正确标记完成

## 最佳实践

1. **小步迭代** - 每次迭代完成一个小功能
2. **及时提交** - 每次成功后 git commit
3. **详细日志** - 使用 `VERBOSE=true` 调试
4. **监控进度** - 定期检查 `progress.txt`
5. **备份状态** - 定期归档 `.ralph/archive/`

## 高级用法

### 并行执行（实验性）
```bash
# 启动多个 Ralph 实例（不推荐，可能导致冲突）
./ralph-loop.sh 50 &
./ralph-loop.sh 50 &
wait
```

### 定时启动
```bash
# 使用 cron (Linux/Mac)
0 9 * * * cd /path/to/project && ./ralph/start-ralph.sh 100

# 使用 Task Scheduler (Windows)
# 创建定时任务运行 start-ralph.bat
```

### 与 CI/CD 集成
```yaml
# GitHub Actions 示例
name: Ralph CI
on: [push]
jobs:
  ralph:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: ./ralph/start-ralph.sh 10
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## 状态监控

### 查看当前进度
```bash
cat .ralph/progress.txt
```

### 查看已完成故事
```bash
grep "✅" .ralph/progress.txt
```

### 查看执行历史
```bash
tail -f .ralph/logs/ralph.log
```

## 相关文档

- [PRD 格式](./prd.json) - 产品需求文档
- [Fix Plan](./fix_plan.md) - 修复计划
- [Agent 说明](./AGENT.md) - AI Agent 指令
- [项目配置](./.ralphrc) - Ralph 配置

## 支持

遇到问题或有建议？请查看：
- Ralph 官方文档：https://github.com/frankbria/ralph-claude-code
- 项目 Issue 追踪器
