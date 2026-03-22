// PDF 解析工具 - 处理 DOMMatrix 和 pdfjs 配置

// 在 Node.js 环境中定义 DOMMatrix（必须在导入 pdfjs 之前）
if (typeof globalThis.DOMMatrix === 'undefined') {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    m11: number;
    m12: number;
    m13: number;
    m14: number;
    m21: number;
    m22: number;
    m23: number;
    m24: number;
    m31: number;
    m32: number;
    m33: number;
    m34: number;
    m41: number;
    m42: number;
    m43: number;
    m44: number;

    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 0;
      this.e = 0;
      this.f = 0;
      this.m11 = 1;
      this.m12 = 0;
      this.m13 = 0;
      this.m14 = 0;
      this.m21 = 0;
      this.m22 = 1;
      this.m23 = 0;
      this.m24 = 0;
      this.m31 = 0;
      this.m32 = 0;
      this.m33 = 1;
      this.m34 = 0;
      this.m41 = 0;
      this.m42 = 0;
      this.m43 = 0;
      this.m44 = 1;
    }

    multiply() {
      return this;
    }

    transformPoint(point: { x: number; y: number }) {
      return { x: point.x, y: point.y };
    }
  };
}

import * as pdfjs from 'pdfjs-dist';
import path from 'path';
import { pathToFileURL } from 'url';

// 设置 pdfjs worker 路径
if (typeof window === 'undefined') {
  const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
  const workerUrl = pathToFileURL(workerPath).href;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
}

export { pdfjs };
