/**
 * templates/silver-luxury.js
 * نسخه اصلی و لایت استودیو اِما: پس‌زمینه نقره‌ای متالیک، کارت‌های شیشه‌ای و امواج افقی
 */

export default {
  id: 'silver-luxury',
  name: 'نقره‌ای متالیک لوکس (Silver Luxury)',

  renderScene(ctx, { width: W, height: H, time, state, helpers }) {
    const { levels, brand, images, cues, duration, tracksLoaded, peaks, logoHeight } = state;

    const C = {
      ai: '#0a91d5',
      hu: '#f2557a',
      textMain: '#0f1722',
      textMuted: '#5d6776'
    };

    ctx.globalAlpha = 1;
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';

    // ۱. پس‌زمینه متالیک نقره‌ای پویا (مشابه نسخه اول برنامه)
    const sh = Math.sin(time * 0.35) * 160;
    const bg = ctx.createLinearGradient(sh, 0, W + sh - 300, H);
    bg.addColorStop(0, '#fbfcfd');
    bg.addColorStop(0.28, '#e4e8ee');
    bg.addColorStop(0.46, '#ffffff');
    bg.addColorStop(0.62, '#d3d9e1');
    bg.addColorStop(0.82, '#f3f5f8');
    bg.addColorStop(1, '#dfe4ea');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // هاله‌های نورانی ملایم
    this.drawBlob(ctx, '#ffffff', 300 + Math.sin(time * 0.3) * 80, 260, 780, 0.9);
    this.drawBlob(ctx, C.ai, 220 + Math.sin(time * 0.5) * 40, 700, 640, 0.08 + levels.ai * 0.22);
    this.drawBlob(ctx, C.hu, 860 + Math.cos(time * 0.45) * 40, 940, 640, 0.08 + levels.hu * 0.22);

    // ۲. برندینگ بالا
    ctx.direction = 'rtl';
    ctx.font = '800 110px Vazirmatn, system-ui';
    ctx.fillStyle = C.ai;
    ctx.fillText(brand.name || 'اِما', 540, 300);

    ctx.font = '400 36px Vazirmatn, system-ui';
    ctx.fillStyle = C.textMuted;
    ctx.fillText(brand.tag || 'دستیار صوتی هوشمند', 540, 365);

    // ۳. کارت‌های سفید گلس‌مورفیسم برای لاین‌های AI و انسان
    const CYA = 700;
    const CYH = 940;
    const AVR = 70;
    const AVX = 140;
    const X0 = 240;
    const N = 52;
    const BW = 8;
    const GAP = 6;
    const MH = 70;

    const lanes = [
      { key: 'ai', y: CYA, label: 'AI', color: C.ai, level: levels.ai, pks: peaks.ai },
      { key: 'hu', y: CYH, label: 'انسان', color: C.hu, level: levels.hu, pks: peaks.hu }
    ];

    const pi = duration ? Math.min(N, (time / duration) * N) : 0;

    for (const lane of lanes) {
      // بدنه کارت سفید با سایه ملایم
      ctx.save();
      ctx.shadowColor = 'rgba(70, 84, 104, 0.22)';
      ctx.shadowBlur = 44;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.beginPath();
      ctx.roundRect(40, lane.y - 100, 1000, 200, 100);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, lane.y - 100, 1000, 200, 100);
      ctx.stroke();

      // آواتار با رینگ ارتعاشی
      helpers.drawCircleImage(ctx, images[lane.key], AVX, lane.y, AVR, '#dfe5ec', '#b4bdc9');
      ctx.strokeStyle = lane.color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(AVX, lane.y, AVR + 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.2 + lane.level * 0.45;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(AVX, lane.y, AVR + 14 + lane.level * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // برچسب
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.font = '700 25px Vazirmatn, system-ui';
      ctx.fillStyle = lane.color;
      ctx.fillText(lane.label, X0 + 15, lane.y - 74);
      ctx.textAlign = 'center';
      ctx.direction = 'ltr';

      // میله‌های اکولایزر
      for (let i = 0; i < N; i++) {
        const a = lane.pks ? lane.pks[i] : 0.08 + 0.06 * Math.sin(i * 0.28 + time * 1.6 * (lane.key === 'ai' ? 1 : -1));
        const d = i + 0.5 - pi;
        const reactive = tracksLoaded[lane.key] ? lane.level * MH * 0.5 * Math.exp(-d * d / 40) * (a > 0.04 ? 1 : 0.3) : 0;
        const h = Math.min(MH, Math.max(3, a * MH) + reactive);

        ctx.globalAlpha = (!duration || i < pi ? 1 : 0.3);
        ctx.fillStyle = lane.color;
        ctx.beginPath();
        ctx.roundRect(X0 + i * (BW + GAP), lane.y - h, BW, h * 2, 4);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    // ۴. اسکرابر عمودی زمان
    if (duration) {
      const scrX = X0 + pi * (BW + GAP);
      ctx.fillStyle = '#0f1722';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(scrX - 1, CYA - 112, 2, CYH - CYA + 224);
      for (const lane of lanes) {
        if (!tracksLoaded[lane.key]) continue;
        ctx.fillStyle = lane.color;
        ctx.globalAlpha = 0.25 + lane.level * 0.3;
        ctx.beginPath();
        ctx.arc(scrX, lane.y, 16 + lane.level * 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(scrX, lane.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    // ۵. زیرنویس‌ها
    const activeCue = cues.find(c => time >= c.s && time < c.e && c.tx.trim());
    if (activeCue) {
      const a = Math.max(0, Math.min(1, (time - activeCue.s) / 0.25, (activeCue.e - time) / 0.2));
      const ease = 1 - Math.pow(1 - a, 3);
      ctx.save();
      ctx.globalAlpha = ease;
      ctx.translate(0, (1 - ease) * 28);
      ctx.direction = 'rtl';

      ctx.font = '700 30px Vazirmatn, system-ui';
      const speakerName = activeCue.k === 'ai' ? 'هوش مصنوعی' : 'کاربر';
      const w = ctx.measureText(speakerName).width;
      ctx.fillStyle = activeCue.k === 'ai' ? C.ai : C.hu;
      ctx.beginPath();
      ctx.arc(540 - w / 2 - 24, 1198, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(speakerName, 540, 1208);

      ctx.font = '600 50px Vazirmatn, system-ui';
      ctx.fillStyle = C.textMain;
      const lines = helpers.wrapText(ctx, activeCue.tx, 880);
      lines.forEach((l, i) => ctx.fillText(l, 540, 1290 + i * 80));
      ctx.restore();
    }

    // ۶. لوگوی پایین
    if (images.logo) {
      const img = images.logo;
      const r = img.width / img.height;
      const w = Math.min(850, r * logoHeight);
      ctx.drawImage(img, 540 - w / 2, 1830 - w / r, w, w / r);
    }

    // ۷. نوار پیشرفت باریک انتهایی
    const gr = ctx.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, C.ai);
    gr.addColorStop(1, C.hu);
    ctx.fillStyle = gr;
    ctx.fillRect(0, H - 10, duration ? Math.min(1, time / duration) * W : 0, 10);
  },

  drawBlob(ctx, color, x, y, r, a) {
    const q = ctx.createRadialGradient(x, y, 0, x, y, r);
    q.addColorStop(0, color);
    q.addColorStop(1, color.startsWith('#') ? color + '00' : 'transparent');
    ctx.globalAlpha = a;
    ctx.fillStyle = q;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1.0;
  }
};