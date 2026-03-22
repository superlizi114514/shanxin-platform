/**
 * MinerU PDF 解析客户端
 * 调用 MinerU 在线 API 服务解析 PDF 文件
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

export interface MinerUConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface MinerUResult {
  success: boolean;
  markdown?: string;
  content?: string;
  error?: string;
}

/**
 * MinerU API 客户端
 */
export class MinerUClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: MinerUConfig = {}) {
    this.apiKey = config.apiKey || process.env.MINERU_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.mineru.net';
  }

  /**
   * 解析 PDF 文件
   */
  async parsePDF(fileBuffer: Buffer): Promise<MinerUResult> {
    try {
      // 方案 1: 使用 MinerU 在线 API
      if (this.apiKey) {
        return await this.parseWithCloud(fileBuffer);
      }

      // 方案 2: 使用本地部署的 MinerU 服务
      return await this.parseWithLocal(fileBuffer);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 使用云端 API 解析
   */
  private async parseWithCloud(fileBuffer: Buffer): Promise<MinerUResult> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
    formData.append('file', blob, 'document.pdf');
    formData.append('api_key', this.apiKey);

    const response = await axios.post(
      `${this.baseUrl}/parse`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 分钟超时
      }
    );

    if (response.data.success) {
      return {
        success: true,
        markdown: response.data.markdown,
        content: response.data.content,
      };
    }

    return {
      success: false,
      error: response.data.message || '解析失败',
    };
  }

  /**
   * 使用本地服务解析（需要本地部署 MinerU）
   */
  private async parseWithLocal(fileBuffer: Buffer): Promise<MinerUResult> {
    // 本地部署的 MinerU 服务
    const localUrl = 'http://localhost:30000/parse';

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' });
    formData.append('file', blob, 'document.pdf');

    const response = await axios.post(localUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 分钟超时
    });

    if (response.data) {
      return {
        success: true,
        markdown: response.data.markdown,
        content: JSON.stringify(response.data),
      };
    }

    return {
      success: false,
      error: '本地服务响应异常',
    };
  }
}

/**
 * 解析课程表 PDF
 */
export async function parseScheduleWithMinerU(
  fileBuffer: Buffer,
  userId: string
): Promise<any[]> {
  const client = new MinerUClient();
  const result = await client.parsePDF(fileBuffer);

  if (!result.success || !result.markdown) {
    throw new Error(result.error || 'PDF 解析失败');
  }

  console.log('MinerU 解析结果预览:');
  console.log(result.markdown.substring(0, 1000));

  // 从 Markdown 中提取课程表数据
  return extractCoursesFromMarkdown(result.markdown, userId);
}

/**
 * 从 Markdown 文本中提取课程信息
 */
function extractCoursesFromMarkdown(markdown: string, userId: string): any[] {
  const courses: any[] = [];
  const lines = markdown.split('\n');

  // 课程表解析逻辑
  const dayMap: Record<string, number> = {
    '星期一': 1, '周一': 1,
    '星期二': 2, '周二': 2,
    '星期三': 3, '周三': 3,
    '星期四': 4, '周四': 4,
    '星期五': 5, '周五': 5,
    '星期六': 6, '周六': 6,
    '星期日': 7, '周日': 7,
  };

  let currentDay = 0;

  for (const line of lines) {
    // 检测星期
    for (const [dayText, dayNum] of Object.entries(dayMap)) {
      if (line.includes(dayText)) {
        currentDay = dayNum;
        break;
      }
    }

    if (currentDay === 0) continue;

    // 尝试匹配课程行
    // 格式可能是：课程名 | 节次 | 教室 | 教师 | 周次
    const courseMatch = line.match(/(.+?)(?:\||$)\s*(\d+)[-~](\d+)\s*节/);
    if (courseMatch) {
      const courseName = courseMatch[1].trim();
      const startPeriod = parseInt(courseMatch[2]);
      const endPeriod = parseInt(courseMatch[3]);

      // 提取教室和教师
      const parts = line.split('|').map(p => p.trim());
      const classroom = parts[2] || '';
      const teacher = parts[3] || '';

      if (courseName && courseName.length < 50) {
        courses.push({
          courseName,
          teacher: teacher || null,
          classroom: classroom || '',
          dayOfWeek: currentDay,
          startTime: `${startPeriod}`,
          endTime: `${endPeriod}`,
          period: `${startPeriod}-${endPeriod}节`,
          weekStart: 1,
          weekEnd: 20,
          weekPattern: null,
          notes: null,
          userId,
        });
      }
    }
  }

  return courses;
}

export default MinerUClient;
