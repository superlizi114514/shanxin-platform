# Ralph 执行计划 - 2026-03-21 重构版

> 基于 MASTER_PLAN.md 精简，供 Ralph 自主执行使用

---

## 当前状态

**项目**: 山信二手平台 - 全面完善
**总任务**: 41 个用户故事
**已完成**: 待验证 (fix_plan.md 标记全部完成，但 progress.txt 显示 0%)
**本阶段目标**: 验证已有功能 + 实现 41 个用户故事

---

## 执行优先级

### 立即执行 (P0 - 核心功能修复)

```
优先级 1: US-001 ~ US-003 (PDF 解析修复)

  - US-006: 创建校园地图可视化组件


优先级 3: US-008 ~ US-010 (课表页面)
  - US-008: 完善课表页面 UI
  - US-009: 完善课表导入页面
  - US-010: 创建管理员后台主页
```

### 后续执行 (P1-P6)

```
P1 管理后台：US-011 ~ US-014 (商家、新闻、信息大全、用户管理)
P2 个人主页：US-015 ~ US-020 (基本信息、发布、收藏、课表、评价、安全)
P3 安全加固：US-021 ~ US-023 (API 验证、速率限制、CSRF)
P4 UI 优化：US-024 ~ US-026 (响应式、动画、骨架屏)
P5 功能完善：US-027 ~ US-040 (各分站页面完善)
P6 最终验证：US-041 (全功能验收测试)
```

---

## Ralph 执行规则

### 每次迭代必须做

1. **读取 prd.json** - 获取当前用户故事的 acceptance criteria
2. **搜索代码库** - 确认功能是否已实现
3. **执行任务** - 实现/修复功能
4. **运行测试** - 验证功能正确
5. **更新状态** - 更新 prd.json(passes=true) 和 progress.txt
6. **输出 RALPH_STATUS** - 包含 EXIT_SIGNAL

### RALPH_STATUS 格式

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
EXIT_SIGNAL: false | true
RECOMMENDATION: <next task>
---END_RALPH_STATUS---
```

### 退出信号条件

`EXIT_SIGNAL: true` 当且仅当:
- [ ] 41 个用户故事全部 passes=true
- [ ] npm run build 成功
- [ ] npm run lint 无错误
- [ ] 无 BLOCKED 任务

---

## 任务验收标准示例

### US-001 验收标准 (必须逐项验证)

```json
{
  "id": "US-001",
  "acceptanceCriteria": [
    "✅ 在 pdf-parser.ts 中使用 Unicode 转义\\u8282 匹配'节'字符",
    "✅ 解析逻辑正确识别课程名称 (带☆标记)",
    "✅ 正确提取节次信息 (X-Y 节格式)",
    "✅ 正确提取周次信息",
    "✅ 正确提取教室和教师信息",
    "✅ 测试解析至少 29 条课程数据",
    "✅ Typecheck passes"
  ]
}
```

---

## 配置建议

### .ralphrc 调整

```bash
# 增加超时 (复杂任务需要更多时间)
CLAUDE_TIMEOUT_MINUTES=25

# 更早检测异常
CB_NO_PROGRESS_THRESHOLD=2
CB_SAME_ERROR_THRESHOLD=3

# 启用调试
RALPH_VERBOSE=true

# 允许 prisma 命令
ALLOWED_TOOLS="Write,Read,Edit,Grep,Glob,Bash(git *),Bash(npm *),Bash(npx *),Bash(node *),Bash(tsx *),Bash(prisma *)"
```

---

## 进度追踪

### 完成统计表

| 优先级 | 用户故事 | 状态 | 完成数 |
|--------|----------|------|--------|
| P0 | US-001 ~ US-010 | 🔄 进行中 | 0/10 |
| P1 | US-011 ~ US-014 | ⏳ 待开始 | 0/4 |
| P2 | US-015 ~ US-020 | ⏳ 待开始 | 0/6 |
| P3 | US-021 ~ US-023 | ⏳ 待开始 | 0/3 |
| P4 | US-024 ~ US-026 | ⏳ 待开始 | 0/3 |
| P5 | US-027 ~ US-040 | ⏳ 待开始 | 0/14 |
| P6 | US-041 | ⏳ 待开始 | 0/1 |
| **总计** | | | **0/41** |

### 更新记录

每次迭代后在下方添加记录:

```
## 迭代日志

### 2026-03-21
- 完成：US-XXX - <任务名称>
- 修改文件：<file1>, <file2>
- 测试状态：PASSING
- 下一任务：US-XXX
```

---

## 快速参考

### 常用命令

```bash
# 开发服务器
npm run dev

# 构建验证
npm run build

# 类型检查
npx tsc --noEmit

# ESLint
npm run lint

# Prisma 迁移
npx prisma migrate dev
npx prisma db push

# 运行测试
npm test
```

### 关键文件

| 文件 | 用途 |
|------|------|
| `.ralph/prd.json` | 41 个用户故事定义 |
| `.ralph/fix_plan.md` | 功能完成清单 |
| `.ralph/progress.txt` | 进度跟踪 |
| `.ralph/MASTER_PLAN.md` | 完整计划文档 |
| `src/lib/pdf-parser.ts` | PDF 解析器 |
| `prisma/schema.prisma` | 数据库模型 |

---

**重要**: Ralph 每次迭代只完成一个用户故事，不要贪多。完成一个，验证一个，更新一个。
