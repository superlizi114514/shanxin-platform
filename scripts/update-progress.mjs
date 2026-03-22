/**
 * Ralph 进度更新器
 * 分析 Claude Code 输出，自动更新 progress.txt 和 fix_plan.md
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const ralphDir = join(projectRoot, '.ralph');

console.log('╔════════════════════════════════════════════════╗');
console.log('║      Ralph 进度更新器 - 山信二手平台           ║');
console.log('╚════════════════════════════════════════════════╝');

// 读取状态文件
const statePath = join(ralphDir, '.ralph-state.json');
const progressPath = join(ralphDir, 'progress.txt');
const fixPlanPath = join(ralphDir, 'fix_plan.md');
const prdPath = join(ralphDir, 'prd.json');

// 分析最新的 Claude 输出日志
const logDir = join(ralphDir, 'logs');
const claudeOutputs = [];

try {
  const logFiles = readdirSync(logDir)
    .filter(f => f.startsWith('claude_output_'))
    .sort()
    .reverse();

  if (logFiles.length > 0) {
    const latestLog = join(logDir, logFiles[0]);
    const logContent = readFileSync(latestLog, 'utf-8');

    // 检查是否包含 RALPH_STATUS 块
    const statusMatch = logContent.match(/---RALPH_STATUS---([\s\S]*?)---END_RALPH_STATUS---/);
    if (statusMatch) {
      const statusBlock = statusMatch[1];
      console.log('\n✓ 检测到 RALPH_STATUS 块');

      // 解析状态
      const status = statusBlock.match(/STATUS: (IN_PROGRESS|COMPLETE|BLOCKED)/);
      const exitSignal = statusBlock.match(/EXIT_SIGNAL: (true|false)/);
      const tasksCompleted = statusBlock.match(/TASKS_COMPLETED_THIS_LOOP: (\d+)/);
      const filesModified = statusBlock.match(/FILES_MODIFIED: (\d+)/);
      const testsStatus = statusBlock.match(/TESTS_STATUS: (PASSING|FAILING|NOT_RUN)/);
      const workType = statusBlock.match(/WORK_TYPE: (\w+)/);
      const recommendation = statusBlock.match(/RECOMMENDATION: (.+)/);

      console.log(`   状态：${status ? status[1] : 'UNKNOWN'}`);
      console.log(`   退出信号：${exitSignal ? exitSignal[1] : 'false'}`);
      console.log(`   完成任务数：${tasksCompleted ? tasksCompleted[1] : '0'}`);
      console.log(`   修改文件数：${filesModified ? filesModified[1] : '0'}`);
      console.log(`   测试状态：${testsStatus ? testsStatus[1] : 'NOT_RUN'}`);

      if (exitSignal && exitSignal[1] === 'true') {
        console.log('\n🎉 检测到退出信号 - 所有任务已完成!');

        // 更新 PRD 状态
        if (existsSync(prdPath)) {
          const prd = JSON.parse(readFileSync(prdPath, 'utf-8'));
          prd.userStories.forEach(story => {
            story.passes = true;
          });
          writeFileSync(prdPath, JSON.stringify(prd, null, 2));
          console.log('✓ 已更新 PRD 状态');
        }

        // 更新进度文件
        updateProgressFile(progressPath, 'COMPLETE');

        process.exit(0);
      }
    } else {
      console.log('\n⚠ 未检测到 RALPH_STATUS 块');
    }
  }
} catch (e) {
  console.error('⚠ 无法分析日志:', e.message);
}

// 检查 fix_plan.md 中的完成项
if (existsSync(fixPlanPath)) {
  const fixPlan = readFileSync(fixPlanPath, 'utf-8');
  const completedMatches = [...fixPlan.matchAll(/- \[x\] (.+)/g)];
  const pendingMatches = [...fixPlan.matchAll(/- \[ \] (.+)/g)];

  console.log(`\n📋 Fix Plan 状态:`);
  console.log(`   已完成：${completedMatches.length}`);
  console.log(`   待处理：${pendingMatches.length}`);

  if (pendingMatches.length === 0 && completedMatches.length > 0) {
    console.log('\n🎉 所有 Fix Plan 项目已完成!');
  }
}

// 更新进度文件
function updateProgressFile(progressPath, status) {
  let content = readFileSync(progressPath, 'utf-8');

  // 更新当前任务状态
  if (status === 'COMPLETE') {
    content = content.replace(
      /## Current Task: (.+?)\n/,
      '## Last Completed: $1\n'
    );
    content = content.replace(
      /🔄 In Progress/,
      '✅ Complete'
    );
  }

  writeFileSync(progressPath, content);
  console.log('✓ 已更新 progress.txt');
}

console.log('\n' + '═'.repeat(50));
console.log('进度分析完成');
console.log('═'.repeat(50));

process.exit(0);
