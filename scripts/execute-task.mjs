/**
 * Ralph 任务执行器
 * 读取当前任务并执行
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const ralphDir = join(projectRoot, '.ralph');

console.log('╔════════════════════════════════════════════════╗');
console.log('║       Ralph 任务执行器 - 山信二手平台          ║');
console.log('╚════════════════════════════════════════════════╝');

// 读取当前任务
const taskPath = join(ralphDir, 'current-task.md');
const prdPath = join(ralphDir, 'prd.json');
const progressPath = join(ralphDir, 'progress.txt');

let taskContent;
try {
  taskContent = readFileSync(taskPath, 'utf-8');
  console.log('\n✓ 已加载当前任务');
} catch (e) {
  console.error('✗ 无法读取任务文件，先运行 ralph-loop.mjs');
  process.exit(1);
}

// 提取故事 ID
const storyIdMatch = taskContent.match(/## Current Story: (US-\d+)/);
const storyId = storyIdMatch ? storyIdMatch[1] : null;

if (!storyId) {
  console.error('✗ 无法解析故事 ID');
  process.exit(1);
}

console.log(`\n📋 执行任务：${storyId}`);
console.log('\n' + '─'.repeat(50));

// 更新进度文件 - 标记为进行中
let progressContent = readFileSync(progressPath, 'utf-8');

// 提取故事标题
const titleMatch = taskContent.match(/## Current Story: .*? - (.+?)\n/);
const storyTitle = titleMatch ? titleMatch[1].trim() : storyId;

console.log(`   标题：${storyTitle}`);

// 记录开始时间
const startTime = new Date().toLocaleString('zh-CN');
console.log(`   开始时间：${startTime}`);

console.log('\n' + '─'.repeat(50));
console.log('🚀 开始执行...\n');

// 这里输出任务内容，让 Claude Code 读取并执行
console.log(taskContent);

// 等待用户/Claude 完成工作后，更新进度
console.log('\n' + '═'.repeat(50));
console.log('任务已启动，请完成以下操作:');
console.log('1. 实现功能/修复 bug');
console.log('2. 运行 npx tsc --noEmit 验证类型');
console.log('3. 运行 npm run build 验证构建');
console.log('4. 更新 progress.txt 标记完成');
console.log('═'.repeat(50));

process.exit(0);
