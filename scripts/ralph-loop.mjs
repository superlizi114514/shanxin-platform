/**
 * Ralph 自主执行循环 - 带迭代计数
 * 读取 prd.json，按优先级执行用户故事，更新 progress.txt
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const ralphDir = join(projectRoot, '.ralph');
const stateFile = join(ralphDir, '.ralph-state.json');

// 读取或初始化状态
let state = { iteration: 0, startTime: new Date().toISOString() };
if (existsSync(stateFile)) {
  try {
    state = JSON.parse(readFileSync(stateFile, 'utf-8'));
    state.iteration++;
  } catch {
    state = { iteration: 1, startTime: new Date().toISOString() };
  }
}
writeFileSync(stateFile, JSON.stringify(state, null, 2));

const iteration = state.iteration;
const startTime = new Date(state.startTime).toLocaleString('zh-CN');

console.log('╔════════════════════════════════════════════════╗');
console.log(`║     Ralph 自主执行循环 - 第 ${iteration} 轮迭代`.padEnd(47) + '║');
console.log(`║     启动时间：${startTime}`.padEnd(47) + '║');
console.log('╚════════════════════════════════════════════════╝');
console.log('');

// 读取 PRD
const prdPath = join(projectRoot, '.ralph', 'prd.json');
const progressPath = join(projectRoot, '.ralph', 'progress.txt');

let prd;
try {
  prd = JSON.parse(readFileSync(prdPath, 'utf-8'));
  console.log(`✓ 已加载 PRD: ${prd.project}`);
  console.log(`  分支：${prd.branchName}`);
  console.log(`  故事数：${prd.userStories.length}`);
} catch (e) {
  console.error('✗ 无法读取 PRD:', e.message);
  process.exit(1);
}

// 读取进度
let progress = {
  completedTasks: [],
  currentTask: null,
  failedTasks: []
};

try {
  const progressContent = readFileSync(progressPath, 'utf-8');
  const inProgressMatch = progressContent.match(/🔄 In Progress\| ([^\|]+)/);
  if (inProgressMatch) {
    progress.currentTask = inProgressMatch[1].trim();
  }
  const completedMatch = progressContent.match(/## Completed Tasks:?\s*\n([\s\S]*?)(?:##|\n\n\n|$)/);
  if (completedMatch) {
    progress.completedTasks = completedMatch[1]
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^- /, '').trim());
  }

  // 从表格中解析已完成的任务
  const tableMatches = progressContent.matchAll(/\| (US-\d+) \|.*\| ✅ 已完成 \| 100% \|/g);
  for (const match of tableMatches) {
    if (!progress.completedTasks.includes(match[1])) {
      progress.completedTasks.push(match[1]);
    }
  }

  console.log(`✓ 当前任务：${progress.currentTask || '无'}`);
  console.log(`  已完成：${progress.completedTasks.length}/${prd.userStories.length}`);
} catch (e) {
  console.warn('⚠ 无法读取进度文件，从头开始');
}

// 计算完成率
const completionRate = Math.round((progress.completedTasks.length / prd.userStories.length) * 100);
console.log(`  完成率：${completionRate}%`);
console.log('');

// 找到下一个待处理的任务
const nextStory = prd.userStories.find(story => {
  if (story.passes === true) return false;
  if (progress.completedTasks.includes(story.id)) return false;
  return true;
});

if (!nextStory) {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🎉 所有用户故事已完成！'.padEnd(46) + '║');
  console.log('╚════════════════════════════════════════════════╝');
  process.exit(0);
}

console.log('─'.repeat(50));
console.log(`→ 下一个任务：${nextStory.id} - ${nextStory.title}`);
console.log(`  描述：${nextStory.description}`);
console.log(`  验收标准:`);
nextStory.acceptanceCriteria.forEach((c, i) => console.log(`    ${i + 1}. ${c}`));
console.log('');

// 生成任务提示
const taskPrompt = `
# Ralph Autonomous Execution

**Iteration**: ${iteration}
**Timestamp**: ${new Date().toLocaleString('zh-CN')}

## Project: ${prd.project}
## Branch: ${prd.branchName}
## Current Story: ${nextStory.id} - ${nextStory.title}

### Description:
${nextStory.description}

### Acceptance Criteria:
${nextStory.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

### Instructions:
1. Read relevant source files
2. Implement the feature or fix the bug
3. Write tests if applicable
4. Verify TypeScript compiles (npm run lint or npx tsc --noEmit)
5. Update progress.txt:
   - Mark ${nextStory.id} as completed
   - Update the progress table with ✅ and 100%
   - Move to next story

### Important:
- Make small, focused changes
- Test after each change
- Commit changes with descriptive message
- Update progress.txt when done
`;

// 将任务提示写入临时文件供 Claude Code 读取
const taskFilePath = join(projectRoot, '.ralph', 'current-task.md');
writeFileSync(taskFilePath, taskPrompt);

console.log('─'.repeat(50));
console.log(`✓ 任务已写入：${taskFilePath}`);
console.log('');
console.log('╔════════════════════════════════════════════════╗');
console.log('║  Claude Code 将自动读取并执行任务...           ║');
console.log('╚════════════════════════════════════════════════╝');
console.log('');

process.exit(0);
