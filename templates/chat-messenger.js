/**
 * templates/chat-messenger.js
 * استایل کامل اپلیکیشن پیام‌رسان (تلگرام / واتساپ)
 */

export default {
  id: 'chat-messenger',
  name: 'چت پیام‌رسان تلگرامی (Messenger UI)',

  renderScene(ctx, { width: W, height: H, time, state, helpers }) {
    const { levels, brand, images, cues, duration, tracksLoaded, peaks } = state;
    
    // ۱. پس‌زمینه چت با الگوی دارک
    ctx.fillStyle = '#0e1621';
    ctx.fillRect(0, 0, W, H);

    // ۲. هدر اپلیکیشن پیام‌رسان (Top Bar)
    ctx.fillStyle = '#17212b';
    ctx.fillRect(0, 0, W, 220);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 220); ctx.lineTo(W, 220); ctx.stroke();

    // آواتار هدر (AI)
    helpers.drawCircleImage(ctx, images.ai, 120, 110, 60);

    // نام و وضعیت آنلاین
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.font = '700 42px Vazirmatn, system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(brand.name || 'دستیار اِما', 210, 105);

    ctx.font = '400 28px Vazirmatn, system-ui';
    ctx.fillStyle = '#4ade80'; // سبز آنلاین
    ctx.fillText('آنلاین • ' + (brand.tag || 'پاسخگوی صوتی'), 210, 155);

    // ۳. وویس‌نوت هوش مصنوعی (پیام سمت راست)
    this.drawVoiceBubble(ctx, {
      x: 80, y: 340, w: 920, h: 230,
      speaker: 'ai',
      label: 'پیام صوتی هوش مصنوعی',
      color: '#2b5278',
      accentColor: '#38bdf8',
      img: images.ai,
      level: levels.ai,
      peaks: peaks.ai,
      loaded: tracksLoaded.ai,
      duration, time, helpers
    });

    // ۴. وویس‌نوت انسان/کاربر (پیام سمت چپ)
    this.drawVoiceBubble(ctx, {
      x: 80, y: 640, w: 920, h: 230,
      speaker: 'hu',
      label: 'پیام صوتی شما',
      color: '#182533',
      accentColor: '#f43f5e',
      img: images.hu,
      level: levels.hu,
      peaks: peaks.hu,
      loaded: tracksLoaded.hu,
      duration, time, helpers
    });

    // ۵. حباب متنی لایو زیرنویس (نمایش پیام‌های در حال گفت‌وگو)
    const activeCue = cues.find(c => time >= c.s && time < c.e && c.tx.trim());
    if (activeCue) {
      const isAi = activeCue.k === 'ai';
      const bubbleY = 1040;
      ctx.save();
      ctx.direction = 'rtl';
      ctx.font = '600 48px Vazirmatn, system-ui';
      const lines = helpers.wrapText(ctx, activeCue.tx, 800);
      const bubbleH = 80 + lines.length * 75;

      // حباب گفتگو با استایل تلگرام
      ctx.fillStyle = isAi ? '#2b5278' : '#232e3c';
      ctx.beginPath();
      ctx.roundRect(80, bubbleY, 920, bubbleH, 28);
      ctx.fill();

      // نام ارسال‌کننده پیام
      ctx.font = '700 30px Vazirmatn, system-ui';
      ctx.fillStyle = isAi ? '#38bdf8' : '#fb7185';
      ctx.fillText(isAi ? brand.name : 'شما', 130, bubbleY + 58);

      // متن پیام
      ctx.font = '500 44px Vazirmatn, system-ui';
      ctx.fillStyle = '#ffffff';
      lines.forEach((l, i) => ctx.fillText(l, 130, bubbleY + 128 + i * 75));
      ctx.restore();
    }

    // ۶. نوار پایین (Fake Input Bar پیام‌رسان)
    ctx.fillStyle = '#17212b';
    ctx.fillRect(0, H - 180, W, 180);
    ctx.fillStyle = '#242f3d';
    ctx.beginPath(); ctx.roundRect(140, H - 140, 800, 100, 50); ctx.fill();
    ctx.font = '400 32px Vazirmatn, system-ui';
    ctx.fillStyle = '#6c7883';
    ctx.direction = 'rtl';
    ctx.fillText('پاسخ صوتی خود را بفرستید...', 180, H - 78);

    // نوار پیشرفت باریک تلگرام
    ctx.fillStyle = '#2481cc';
    ctx.fillRect(0, H - 8, duration ? (time / duration) * W : 0, 8);
  },

  drawVoiceBubble(ctx, opt) {
    const { x, y, w, h, label, color, accentColor, img, level, peaks, duration, time, helpers } = opt;
    ctx.save();
    // حباب
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 36); ctx.fill();

    // آواتار دایره‌ای با پالس وویس
    helpers.drawCircleImage(ctx, img, x + 85, y + h / 2, 54);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x + 85, y + h / 2, 60 + level * 10, 0, Math.PI * 2); ctx.stroke();

    // برچسب پیام صوتی
    ctx.direction = 'rtl';
    ctx.font = '700 28px Vazirmatn, system-ui';
    ctx.fillStyle = accentColor;
    ctx.fillText(label, x + 165, y + 68);

    // میله‌های وویس نوت داخل حباب
    const startWaveX = x + 165;
    const barCount = 42;
    const pi = duration ? Math.min(barCount, (time / duration) * barCount) : 0;

    for (let i = 0; i < barCount; i++) {
      const pk = peaks ? peaks[i] : 0.15;
      const barH = Math.max(8, pk * 65 + (i < pi ? level * 25 : 0));
      ctx.fillStyle = i < pi ? accentColor : 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(startWaveX + i * 16, y + h / 2 + 15 - barH / 2, 8, barH, 4);
      ctx.fill();
    }
    ctx.restore();
  }
};