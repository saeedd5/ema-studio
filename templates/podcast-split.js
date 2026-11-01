/**
 * templates/podcast-split.js
 * استایل پادکست ویدیویی روبه‌رو (Split Studio Face-Off)
 */

export default {
  id: 'podcast-split',
  name: 'پادکست روبه‌رو اسپلیت (Studio Split)',

  renderScene(ctx, { width: W, height: H, time, state, helpers }) {
    const { levels, brand, images, cues, duration, peaks } = state;

    // ۱. پس‌زمینه سینمایی مشکی-سرمه‌ای
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, W, H);

    // خط حائل طلایی/نئونی وسط صفحه
    const midY = H / 2 - 50;
    const splitGrad = ctx.createLinearGradient(0, 0, W, 0);
    splitGrad.addColorStop(0, 'transparent');
    splitGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
    splitGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = splitGrad;
    ctx.fillRect(0, midY - 2, W, 4);

    // ۲. بخش بالا: هوش مصنوعی
    this.drawSpeakerZone(ctx, {
      cx: W / 2, cy: midY - 380,
      name: brand.name || 'هوش مصنوعی',
      role: 'HOST / AI',
      img: images.ai,
      level: levels.ai,
      color: '#0284c7',
      glow: '#38bdf8',
      helpers
    });

    // ۳. بخش پایین: انسان/مهمان
    this.drawSpeakerZone(ctx, {
      cx: W / 2, cy: midY + 420,
      name: 'کاربر مهمان',
      role: 'GUEST',
      img: images.hu,
      level: levels.hu,
      color: '#e11d48',
      glow: '#fb7185',
      helpers
    });

    // ۴. باکس شناور زیرنویس در مرکز صفحه (بین دو گوینده)
    const activeCue = cues.find(c => time >= c.s && time < c.e && c.tx.trim());
    if (activeCue) {
      const isAi = activeCue.k === 'ai';
      ctx.save();
      ctx.direction = 'rtl';
      ctx.font = '700 52px Vazirmatn, system-ui';
      const lines = helpers.wrapText(ctx, activeCue.tx, 860);
      const boxH = 50 + lines.length * 85;
      const boxY = midY - boxH / 2;

      // پس‌زمینه مات تیره
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowColor = isAi ? '#0284c7' : '#e11d48';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.roundRect(70, boxY, 940, boxH, 24);
      ctx.fill();
      ctx.strokeStyle = isAi ? '#38bdf8' : '#fb7185';
      ctx.lineWidth = 3;
      ctx.stroke();

      // متن سینمایی طلایی/سفید
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      lines.forEach((l, i) => ctx.fillText(l, W / 2, boxY + 75 + i * 85));
      ctx.restore();
    }

    // ۵. نوار وضعیت و برندینگ
    ctx.direction = 'rtl';
    ctx.font = '600 30px Vazirmatn, system-ui';
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'center';
    ctx.fillText(brand.tag || 'مکالمه زنده پادکست', W / 2, 90);

    // نوار پیشرفت خطی باریک
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(0, H - 12, duration ? (time / duration) * W : 0, 12);
  },

  drawSpeakerZone(ctx, { cx, cy, name, role, img, level, color, glow, helpers }) {
    ctx.save();
    // رینگ‌های ارتعاشی صدا دور سر آواتار
    for (let r = 1; r <= 3; r++) {
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.max(0, (0.4 - r * 0.1) + level * 0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, 110 + r * 28 + level * (r * 22), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // کادر آواتار
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.stroke();

    // عکس آواتار بزرگ
    helpers.drawCircleImage(ctx, img, cx, cy, 105);

    // مشخصات گوینده
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.font = '800 46px Vazirmatn, system-ui';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, cx, cy + 175);

    ctx.font = '600 24px Vazirmatn, system-ui';
    ctx.fillStyle = glow;
    ctx.fillText(role, cx, cy + 215);
    ctx.restore();
  }
};