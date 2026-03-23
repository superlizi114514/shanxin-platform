/**
 * 敏感词库
 * 生产环境应从数据库或配置文件动态加载
 */

export const sensitiveWords: string[] = [
  // 政治敏感
  "赌博",
  "彩票",
  "六合彩",
  "传销",
  "毒品",
  "枪支",
  "弹药",
  // 不当内容
  "色情",
  "淫秽",
  "暴力",
  "恐怖",
  // 广告 spam
  "加 V",
  "加微信",
  "扫码",
  "兼职",
  "刷单",
  // 其他
  "彩票",
  "下注",
  "赔率",
];

/**
 * 检查文本是否包含敏感词
 */
export function checkSensitiveWords(text: string): boolean {
  for (const word of sensitiveWords) {
    if (text.includes(word)) {
      return true;
    }
  }
  return false;
}

/**
 * 过滤敏感词，替换为星号
 */
export function filterSensitiveWords(text: string, replacement = "*"): string {
  let result = text;
  for (const word of sensitiveWords) {
    const regex = new RegExp(word, "g");
    result = result.replace(regex, replacement.repeat(word.length));
  }
  return result;
}
