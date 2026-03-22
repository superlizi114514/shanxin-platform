const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const Tesseract = require('tesseract.js');
const { pathToFileURL } = require('url');

async function extractTextFromPDF() {
  const pdfjsPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

  const pdfjsLib = await import(pathToFileURL(pdfjsPath).href);
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const baseDir = path.join(process.cwd(), 'sucai/');
  const files = fs.readdirSync(baseDir);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  const data = new Uint8Array(fs.readFileSync(baseDir + pdfFile));

  console.log('使用 OCR 方式提取 PDF 文本...\n');

  try {
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;
    console.log('文档加载成功，页数:', doc.numPages);

    for (let i = 1; i <= doc.numPages; i++) {
      console.log(`\n=== 第 ${i} 页 ===`);
      const page = await doc.getPage(i);

      // 使用更高的缩放比例
      const viewport = page.getViewport({ scale: 3 });
      console.log('页面尺寸:', viewport.width, 'x', viewport.height);

      // 创建 canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d');

      // 填充白色背景
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      // 渲染 PDF 页面到 canvas
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // 保存为图像
      const imagePath = `C:/temp/page-${i}-hd.png`;
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(imagePath, buffer);
      console.log('页面图像已保存到:', imagePath);
      console.log('图像大小:', buffer.length, 'bytes');
    }

    // 使用 Tesseract 进行 OCR
    console.log('\n开始 OCR 识别...');

    // 使用在线语言数据
    const worker = await Tesseract.createWorker();

    // 加载简体中文
    await worker.loadLanguage('chi_sim');
    await worker.initialize('chi_sim');

    for (let i = 1; i <= doc.numPages; i++) {
      console.log(`\n=== OCR 第 ${i} 页 ===`);
      const imagePath = `C:/temp/page-${i}-hd.png`;

      const { data } = await worker.recognize(imagePath);
      console.log('识别文本:');
      console.log(data.text);
      console.log('置信度:', data.confidence);
    }

    await worker.terminate();

  } catch (e) {
    console.error('错误:', e.message);
    console.error(e.stack);
  }
}

extractTextFromPDF();
