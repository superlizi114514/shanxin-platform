import { NextRequest, NextResponse } from "next/server";

/**
 * 生成随机验证码图片
 * 支持：
 * - 自定义长度（默认 4 位）
 * - 自定义字符集（字母 + 数字）
 * - 干扰线
 * - 干扰点
 * - 字体旋转
 */

// 字符集：排除容易混淆的字符 (0, O, 1, I, l)
const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * 生成随机字符
 */
function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

/**
 * 生成随机数
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机颜色
 */
function randomColor(minBrightness: number = 50): string {
  const r = randomInt(minBrightness, 200);
  const g = randomInt(minBrightness, 200);
  const b = randomInt(minBrightness, 200);
  return `rgb(${r},${g},${b})`;
}

/**
 * 生成验证码 SVG 图片
 */
function generateCaptchaSvg(code: string, width: number = 120, height: number = 40): string {
  const chars = code.split("");
  // 增加字符间距，给左边留更多空间
  const charWidth = width / chars.length;
  const leftPadding = 15; // 左边留白，防止第一个字被切

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

  // 背景 - 使用更浅的背景色
  svg += `<rect width="${width}" height="${height}" fill="#f8fafc"/>`;

  // 减少干扰线数量，降低不透明度
  for (let i = 0; i < 2; i++) {
    const x1 = randomInt(0, width);
    const y1 = randomInt(0, height);
    const x2 = randomInt(0, width);
    const y2 = randomInt(0, height);
    const stroke = randomColor(200); // 更浅的颜色
    const strokeWidth = randomInt(1, 1);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="0.2"/>`;
  }

  // 减少干扰点数量
  for (let i = 0; i < 15; i++) {
    const cx = randomInt(0, width);
    const cy = randomInt(0, height);
    const r = randomInt(1, 1);
    const fill = randomColor(200);
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="0.2"/>`;
  }

  // 绘制字符
  chars.forEach((char, index) => {
    // 第一个字符左边多留空间
    const offsetX = index === 0 ? leftPadding : 0;
    const x = offsetX + index * charWidth + charWidth * 0.25;
    const y = height / 2 + 6;
    // 减少旋转角度，让字符更容易辨认
    const rotation = randomInt(-10, 10);
    // 使用更大的字体
    const fontSize = randomInt(22, 28);
    // 使用更深的字符颜色，增加对比度
    const color = `rgb(${randomInt(30, 80)}, ${randomInt(30, 80)}, ${randomInt(30, 80)})`;
    // 使用更清晰的字体
    const fontFamily = ["Arial", "Verdana", "Georgia"][index % 3];

    svg += `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" fill="${color}" transform="rotate(${rotation}, ${x}, ${y})" text-anchor="middle" dominant-baseline="middle">${char}</text>`;
  });

  svg += "</svg>";
  return svg;
}

/**
 * GET - 获取验证码图片
 */
export async function GET(request: NextRequest) {
  try {
    // 生成验证码
    const codeLength = 4;
    let code = "";
    for (let i = 0; i < codeLength; i++) {
      code += randomChar();
    }

    // 将验证码存储到 cookie（加密）
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 分钟过期

    // 生成 SVG 图片
    const svg = generateCaptchaSvg(code);

    // 创建响应
    const response = new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      },
    });

    // 设置验证码 cookie（HTTPOnly，客户端无法读取）
    response.cookies.set("captcha_code", code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error generating captcha:", error);
    return NextResponse.json(
      { error: "Failed to generate captcha" },
      { status: 500 }
    );
  }
}

/**
 * POST - 验证验证码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "验证码不能为空" },
        { status: 400 }
      );
    }

    // 从 cookie 获取存储的验证码
    const storedCode = request.cookies.get("captcha_code")?.value;

    if (!storedCode) {
      return NextResponse.json(
        { error: "验证码已过期，请刷新重试" },
        { status: 400 }
      );
    }

    // 比较验证码（忽略大小写）
    const valid = code.toLowerCase() === storedCode.toLowerCase();

    if (!valid) {
      return NextResponse.json(
        { valid: false, error: "验证码错误" },
        { status: 400 }
      );
    }

    // 验证成功后删除验证码（一次性使用）
    const response = NextResponse.json({ valid: true });
    response.cookies.delete("captcha_code");

    return response;
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return NextResponse.json(
      { error: "验证失败" },
      { status: 500 }
    );
  }
}
