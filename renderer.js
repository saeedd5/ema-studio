/**
 * renderer.js
 * موتور منعطف که اختیار کامل نقاشی و چیدمان را به تمپلیت واگذار می‌کند
 */

export class VideoRenderer {
  constructor(canvas) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.template = null;
  }

  setTemplate(templateModule) {
    this.template = templateModule;
  }

  render(time, state) {
    if (!this.template || !this.template.renderScene) return;

    // ارسال بوم، زمان، وضعیت و توابع کمکی به تمپلیت
    this.template.renderScene(this.g, {
      width: this.cv.width,
      height: this.cv.height,
      time,
      state,
      helpers: {
        wrapText: this.wrapText,
        drawCircleImage: this.drawCircleImage
      }
    });
  }

  // متد کمکی شکستن خطوط متن فارسی
  wrapText(ctx, text, maxWidth) {
    const words = text.trim().split(/\s+/);
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // متد کمکی رسم تصویر دایره‌ای با کیفیت بالا
  drawCircleImage(ctx, img, cx, cy, r, fallbackBg = '#1e293b', fallbackColor = '#475569') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    if (img) {
      const s = Math.max((2 * r) / img.width, (2 * r) / img.height);
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    } else {
      ctx.fillStyle = fallbackBg;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = fallbackColor;
      ctx.beginPath();
      ctx.arc(cx, cy - 12, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy + r - 4, r * 0.65, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}