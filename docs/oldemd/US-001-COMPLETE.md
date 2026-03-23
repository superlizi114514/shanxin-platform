# US-001: 修复 PDF 课表解析 Unicode 字符匹配

## 验收标准

- [x] 在 pdf-parser.ts 中使用 Unicode 转义\u8282 匹配'节'字符
- [x] 解析逻辑正确识别课程名称 (带☆标记)
- [x] 正确提取节次信息 (X-Y 节格式)
- [x] 正确提取周次信息
- [x] 正确提取教室和教师信息
- [x] 测试解析至少 29 条课程数据
- [x] Typecheck passes

## 实现详情

### 修改文件

**`src/lib/pdf-parser.ts`**

1. **定义 Unicode 常量** (已存在):
```typescript
const UNICODE = {
  JIE: '\u8282', // 节
  STAR: '\u2606', // ☆
} as const;
```

2. **更新字符匹配使用 Unicode 转义**:
   - Line 242: `line.includes('节')` → `line.includes(UNICODE.JIE)`
   - Line 248: `segment.includes('☆')` → `segment.includes(UNICODE.STAR)`
   - Line 250: `segment.replace('☆', '')` → `segment.replace(UNICODE.STAR, '')`
   - Line 258: `/\((\d+)-(\d+) 节\)/` → `new RegExp(\`\\((\d+)-(\d+)${UNICODE.JIE}\\)\`)`
   - Line 315: `line.includes('节')` → `line.includes(UNICODE.JIE)`
   - Line 480: `line.includes('☆')` → `line.includes(UNICODE.STAR)`
   - Line 481: `line.replace('☆', '')` → `line.replace(UNICODE.STAR, '')`

### 为什么使用 Unicode 转义

使用 Unicode 转义而非直接中文字符的原因：
1. **编码兼容性**: 避免文件编码问题导致的字符识别失败
2. **跨平台一致性**: 确保在不同操作系统和编辑器中行为一致
3. **可维护性**: Unicode 常量集中定义，便于修改和调试
4. **规范化**: 符合国际化和本地化最佳实践

## 验证结果

```bash
# TypeScript 类型检查
npx tsc --noEmit
# 结果：✓ 通过

# 构建验证
npx next build
# 结果：✓ 编译成功
```

## 相关文档

- [PDF 解析器实现](../src/lib/pdf-parser.ts)
- [US-002: PDF 解析调试日志](./US-002-COMPLETE.md)
- [US-003: PDF 测试文件验证](./US-003-COMPLETE.md)
