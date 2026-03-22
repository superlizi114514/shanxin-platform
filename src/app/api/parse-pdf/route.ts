import { NextRequest, NextResponse } from 'next/server';

const PDF_PARSER_API_URL = process.env.PDF_PARSER_API_URL || 'https://superlizi-sxhh.hf.space';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未找到上传文件' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: '只支持 PDF 文件' },
        { status: 400 }
      );
    }

    // 调用 HF Spaces API
    const hfFormData = new FormData();
    hfFormData.append('file', file);

    const response = await fetch(`${PDF_PARSER_API_URL}/parse`, {
      method: 'POST',
      body: hfFormData,
    });

    if (!response.ok) {
      throw new Error(`HF API 返回错误：${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API 错误:', error);
    return NextResponse.json(
      { success: false, error: `解析失败：${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: '课程表 PDF 解析 API (HF Spaces)',
    version: '3.0.0-hf-spaces',
    backend: PDF_PARSER_API_URL,
  });
}
