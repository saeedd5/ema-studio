// /**
//  * templates/ema-temp.js
//  * تمپلیت اصلی و اختصاصی استودیوی اِما
//  * پس‌زمینه زنده آبی (#0a91d5) - المان‌های تماماً سفید بدون باکس - نام دقیقاً زیر آواتار
//  */
// import { CONFIG } from '../config.js';
// export default {
//   id: 'ema-temp',
//   name: '۱. اِما اورجینال (آبی #0a91d5 و مینیمال سفید)',

//   renderScene(ctx, { width: W, height: H, time, state, helpers }) {
//     const { levels, brand, images, cues, duration, tracksLoaded, peaks, logoHeight, audioEvents } = state;

//     ctx.globalAlpha = 1.0;
//     ctx.direction = 'ltr';
//     ctx.textAlign = 'center';

//     // ۱. پس‌زمینه آبی یکدست اختصاصی (#0a91d5)
//     ctx.fillStyle = '#0a91d5';
//     ctx.fillRect(0, 0, W, H);

//     // ۲. انیمیشن پس‌زمینه: هاله‌های نوری محو و ذرات بسیار ملایم
//     const totalLevel = (levels.ai + levels.hu) / 2;

//     // هاله متحرک اول
//     const glow1X = W * 0.35 + Math.sin(time * 0.25) * 130;
//     const glow1Y = 540 + Math.cos(time * 0.2) * 90;
//     const glow1 = ctx.createRadialGradient(glow1X, glow1Y, 50, glow1X, glow1Y, 750);
//     glow1.addColorStop(0, `rgba(255, 255, 255, ${0.06 + totalLevel * 0.05})`);
//     glow1.addColorStop(1, 'transparent');
//     ctx.fillStyle = glow1;
//     ctx.fillRect(0, 0, W, H);

//     // هاله متحرک دوم
//     const glow2X = W * 0.72 + Math.cos(time * 0.2) * 150;
//     const glow2Y = 1260 + Math.sin(time * 0.28) * 110;
//     const glow2 = ctx.createRadialGradient(glow2X, glow2Y, 60, glow2X, glow2Y, 850);
//     glow2.addColorStop(0, `rgba(255, 255, 255, ${0.05 + totalLevel * 0.04})`);
//     glow2.addColorStop(1, 'transparent');
//     ctx.fillStyle = glow2;
//     ctx.fillRect(0, 0, W, H);

//     // ذرات شناور نوری در فضا (خیلی ملایم و کم‌رنگ)
//     for (let i = 0; i < 6; i++) {
//       const speed = 0.07 + (i % 3) * 0.03;
//       const py = (H - ((time * 40 * speed + i * 320) % H));
//       const px = (W * 0.12 + (i * 160) + Math.sin(time * 0.4 + i * 1.5) * 60) % W;
//       const alpha = 0.03 + Math.sin(time * 0.6 + i) * 0.02;
//       const r = 3 + (i % 2) * 3;

//       ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
//       ctx.beginPath();
//       ctx.arc(px, py, r, 0, Math.PI * 2);
//       ctx.fill();
//     }

//     // ۳. برندینگ بالای ویدیو (سفید خالص)
// // ۳. برندینگ بالای ویدیو (سفید خالص)
//     const brandX = state.brand.nameX !== undefined ? state.brand.nameX : (W / 2);
//     const brandY = state.brand.nameY !== undefined ? state.brand.nameY : 280;
//     const brandSize = state.brand.nameSize || 115;
// ctx.direction = 'rtl';
//     ctx.textAlign = 'center';
//     ctx.font = `800 ${brandSize}px Vazirmatn, system-ui`;
//     ctx.fillStyle = '#ffffff';
//     ctx.shadowColor = 'rgba(0, 25, 55, 0.2)';
//     ctx.shadowBlur = 20;
//     ctx.fillText(brand.name || 'اِما', brandX, brandY);
//     ctx.shadowBlur = 0;

//     // بررسی آیا شعار پویایی در ثانیه فعلی فعال است؟
//     const activeTag = (state.dynamicTags || []).find(t => time >= t.s && time < t.e && t.text.trim());

//     if (activeTag) {
//       // محاسبه زمان ترانزیشن نرم (۰.۲۵ ثانیه برای ورود و خروج)
//       const transTime = 0.25;
//       const pIn = Math.min(1, Math.max(0, (time - activeTag.s) / transTime));
//       const pOut = Math.min(1, Math.max(0, (activeTag.e - time) / transTime));
//       const alpha = Math.min(pIn, pOut);
//       const ease = 1 - Math.pow(1 - alpha, 3); // منحنی نرم کیوبیک

//       ctx.save();
//       ctx.globalAlpha = ease;
//       ctx.direction = 'rtl';
//       ctx.textAlign = 'center';
//       ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
//       ctx.font = `600 ${activeTag.size || 34}px Vazirmatn, system-ui`;

//       const posX = activeTag.x !== undefined ? activeTag.x : (W / 2);
//       const posY = activeTag.y !== undefined ? activeTag.y : 345;

//       // اجرای انیمیشن‌های ورود و خروج
//       if (activeTag.anim === 'pop') {
//         const scale = 0.75 + ease * 0.25;
//         ctx.translate(posX, posY);
//         ctx.scale(scale, scale);
//         ctx.fillText(activeTag.text, 0, 0);
//       } else if (activeTag.anim === 'slide') {
//         const offsetY = (1 - ease) * 22; // اسلاید نرم از پایین به بالا
//         ctx.fillText(activeTag.text, posX, posY + offsetY);
//       } else {
//         // حالت محو شدن ساده (Fade)
//         ctx.fillText(activeTag.text, posX, posY);
//       }
//       ctx.restore();

//     } else if (brand.tag && (!state.dynamicTags || state.dynamicTags.length === 0)) {
//       // اگر هیچ شعار پویایی ثبت نشده باشد، همان شعار ثابت پیش‌فرض نشان داده می‌شود
//       ctx.font = '400 34px Vazirmatn, system-ui';
//       ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
//       ctx.fillText(brand.tag, W / 2, 345);
//     }

//     // ۴. لاین‌های صدا: آواتار با نام در زیر آن و امواج مینیمال
//    // ۴. لاین‌های صدا: خواندن ابعاد مستقیماً از CONFIG برای جلوگیری از تاخیر زمانی
//     const CYA = 650;
//     const CYH = 920;
//     const AVR = 74;
//     const AVX = 150;

//     // خواندن مستقیم ابعاد از کانفیگ
//     const { startX: X0, barWidth: BW, barGap: GAP, barCount: N, maxHeight: MH } = CONFIG.layout.waveform;
//     const totalWaveW = N * (BW + GAP) - GAP;

//     const lanes = [
//       { key: 'ai', y: CYA, label: 'اِما', level: levels.ai, pks: peaks.ai },
//       { key: 'hu', y: CYH, label: 'کاربر', level: levels.hu, pks: peaks.hu }
//     ];

//     // درصد پیشرفت خطی صدا بین ۰ تا ۱
//     const progress = duration ? Math.min(1, Math.max(0, time / duration)) : 0;
//     // ایندکس پیوسته فعلی
//     const currentBarIdx = progress * N;

//     for (const lane of lanes) {
//       // الف) آواتار
//       helpers.drawCircleImage(ctx, images[lane.key], AVX, lane.y, AVR, 'rgba(255,255,255,0.2)', '#ffffff');

//       ctx.strokeStyle = '#ffffff';
//       ctx.lineWidth = 4.5;
//       ctx.beginPath();
//       ctx.arc(AVX, lane.y, AVR + 3, 0, Math.PI * 2);
//       ctx.stroke();

//       ctx.globalAlpha = 0.2 + lane.level * 0.65;
//       ctx.lineWidth = 3;
//       ctx.beginPath();
//       ctx.arc(AVX, lane.y, AVR + 12 + lane.level * 18, 0, Math.PI * 2);
//       ctx.stroke();
//       ctx.globalAlpha = 1.0;

//       // ب) نام گوینده
//       ctx.direction = 'rtl';
//       ctx.textAlign = 'center';
//       ctx.font = '700 26px Vazirmatn, system-ui';
//       ctx.fillStyle = '#ffffff';
//       ctx.fillText(lane.label, AVX, lane.y + AVR + 36);

//       // ج) خط تراز امواج
//       ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
//       ctx.lineWidth = 2;
//       ctx.beginPath();
//       ctx.moveTo(X0, lane.y);
//       ctx.lineTo(X0 + totalWaveW, lane.y);
//       ctx.stroke();

//       // د) میله‌های اکولایزر
//       ctx.direction = 'ltr';
//       for (let i = 0; i < N; i++) {
//         const a = lane.pks ? lane.pks[i] : 0.08;
//         const dist = Math.abs(i - currentBarIdx);
//         // واکنش ارتعاشی نقطه در حال پخش
//         const reactive = tracksLoaded[lane.key] ? lane.level * MH * 0.5 * Math.exp(-dist * dist / 16) : 0;
//         const h = Math.min(MH, Math.max(4, a * MH) + reactive);

//         // میله‌های خوانده شده روشن‌تر، میله‌های جلوتر نیمه‌شفاف
//         ctx.globalAlpha = (!duration || i <= currentBarIdx ? 1.0 : 0.35);
//         ctx.fillStyle = '#ffffff';
//         const xPos = X0 + i * (BW + GAP);
//         ctx.beginPath();
//         ctx.roundRect(xPos, lane.y - h, BW, h * 2, 4);
//         ctx.fill();
//       }
//       ctx.globalAlpha = 1.0;

//       // خط جداکننده افقی
//       ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
//       ctx.lineWidth = 1.5;
//       ctx.beginPath();
//       ctx.moveTo(80, lane.y + 115);
//       ctx.lineTo(1000, lane.y + 115);
//       ctx.stroke();
//     }

//     // ۵. خط و نقطه اسکرابر زمان (دقیقاً منطبق بر درصد واقعی زمان)
//     if (duration) {
//       // محاسبه میلی‌متری مختصات X اسکرابر روی امواج
//       const scrX = X0 + progress * totalWaveW;

//       ctx.fillStyle = '#ffffff';
//       ctx.globalAlpha = 0.45;
//       ctx.fillRect(scrX - 1, CYA - 85, 2, CYH - CYA + 170);
//       ctx.globalAlpha = 1.0;

//       for (const lane of lanes) {
//         if (!tracksLoaded[lane.key]) continue;
//         ctx.fillStyle = '#ffffff';
//         ctx.globalAlpha = 0.25 + lane.level * 0.45;
//         ctx.beginPath();
//         ctx.arc(scrX, lane.y, 15 + lane.level * 18, 0, Math.PI * 2);
//         ctx.fill();
//         ctx.globalAlpha = 1.0;
//         ctx.beginPath();
//         ctx.arc(scrX, lane.y, 6.5, 0, Math.PI * 2);
//         ctx.fill();
//       }
//     }






//     // ۶. ایموجی‌های شناور رویدادهای صوتی (خنده، تردید، تداخل)
//     if (audioEvents && audioEvents.length > 0) {
//       const activeEvents = audioEvents.filter(e => time >= e.time && time < e.time + 2.0);
//       activeEvents.forEach(evt => {
//         const age = time - evt.time;
//         const progress = age / 2.0;

//         ctx.save();
//         ctx.globalAlpha = Math.sin(progress * Math.PI);
//         ctx.font = '50px system-ui';

//         if (evt.type === 'overlap') {
//           // تداخل صحبت: جرقه نوسانی در مرکز
//           const scale = 1 + Math.sin(age * 15) * 0.25;
//           ctx.translate(W / 2, (CYA + CYH) / 2);
//           ctx.scale(scale, scale);
//           ctx.fillText(evt.emoji, 0, 0);
//         } else {
//           // خنده و تردید: شناور شدن نرم از بالای آواتار
//           const startY = (evt.speaker === 'ai' ? CYA : CYH) - AVR - 10;
//           const floatY = startY - (progress * 85);
//           const driftX = Math.sin(age * 4) * 18;

//           ctx.translate(AVX + driftX, floatY);
//           if (evt.type === 'laugh') ctx.rotate(Math.sin(age * 5) * 0.2);
//           ctx.fillText(evt.emoji, 0, 0);
//         }
//         ctx.restore();
//       });
//     }

//     // ۷. زیرنویس‌ها: کاملاً بدون کادر، آزاد و خوانا
//     const activeCue = cues.find(c => time >= c.s && time < c.e && c.tx.trim());
//     if (activeCue) {
//       const rel = time - activeCue.s;
//       const a = Math.max(0, Math.min(1, rel / 0.18, (activeCue.e - time) / 0.18));
//       const ease = 1 - Math.pow(1 - a, 3);

//       ctx.save();
//       ctx.globalAlpha = ease;
//       ctx.translate(0, (1 - ease) * 18);
//       ctx.direction = 'rtl';
//       ctx.textAlign = 'center';

//       const subStartY = 1220;

//       // گوینده زیرنویس (بدون پس‌زمینه)
//       ctx.font = '700 30px Vazirmatn, system-ui';
//       ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
//       const speakerName = activeCue.k === 'ai' ? '• اِما •' : '• کاربر •';
//       ctx.fillText(speakerName, W / 2, subStartY);

//       // متن زیرنویس: سایز ۵۴ و بولد با سایه ملایم جهت خوانایی در ریلز
//       ctx.font = '800 54px Vazirmatn, system-ui';
//       ctx.fillStyle = '#ffffff';
//       ctx.shadowColor = 'rgba(0, 25, 55, 0.45)';
//       ctx.shadowBlur = 22;
//       ctx.shadowOffsetY = 4;

//       const lines = helpers.wrapText(ctx, activeCue.tx, 900);
//       lines.forEach((l, idx) => {
//         ctx.fillText(l, W / 2, subStartY + 82 + idx * 84);
//       });
//       ctx.restore();
//     }

//     // ۸. لوگوی انتخابی در پایین ویدیو
// // ۸. بخش فوتر و لوگوی پایین ویدیو (عکس، متن یا هر دو)
//     // الف) اگر عکس لوگو وجود داشته باشد:
//     if (images.logo) {
//       const img = images.logo;
//       const r = img.width / img.height;
//       const w = Math.min(800, r * logoHeight);
//       // اگر متن فوتر هم باشد، لوگو را کمی بالاتر می‌کشیم تا تداخل نداشته باشند
//       const hasFooterText = state.footer && state.footer.text && state.footer.text.trim();
//       const logoBottomY = hasFooterText ? (state.footer.y - 45) : 1810;
//       ctx.drawImage(img, W / 2 - w / 2, logoBottomY - w / r, w, w / r);
//     }

//     // ب) اگر متن فوتر (آیدی اینستاگرام، سایت و...) ثبت شده باشد:
//     if (state.footer && state.footer.text && state.footer.text.trim()) {
//       ctx.save();
//       ctx.direction = 'rtl';
//       ctx.textAlign = 'center';
//       ctx.font = `600 ${state.footer.size || 32}px Vazirmatn, system-ui`;
//       ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
//       ctx.shadowColor = 'rgba(0, 25, 55, 0.3)';
//       ctx.shadowBlur = 14;
//       ctx.fillText(state.footer.text, W / 2, state.footer.y || 1855);
//       ctx.restore();
//     }

//     // ۹. نوار باریک پیشرفت در انتهای ویدیو
//     ctx.fillStyle = '#ffffff';
//     ctx.fillRect(0, H - 8, duration ? Math.min(1, time / duration) * W : 0, 8);
//   }
// };






/**
 * templates/ema-temp.js
 * تمپلیت اصلی و اختصاصی استودیوی اِما
 * پس‌زمینه زنده آبی (#0a91d5) - المان‌های تماماً سفید بدون باکس - نام دقیقاً زیر آواتار
 *
 * نسخه ۲: فضای زنده‌تر و مینیمال
 *  - شبکه‌ی ملایم نقطه و خط (نقطه‌ها آرام شناورند و نزدیک‌ها با خط نازک به هم وصل می‌شوند)
 *  - دو نوار موجی نازک در فضاهای خالی + یک نقطه‌ی نورانی که روی آن‌ها می‌لغزد
 *  - ریپل نرم دور آواتار وقتی همان گوینده صحبت می‌کند
 */
import { CONFIG } from '../config.js';

// ─────────────────────────────────────────────────────────────
// تنظیمات افکت‌های زنده‌ی پس‌زمینه
// اگر فضا شلوغ شد، این عددها را کم کن؛ اگر ساکت بود، زیادشان کن.
// ─────────────────────────────────────────────────────────────
const FX = {
  nodes: 18,            // تعداد نقطه‌های شناور
  linkDist: 340,        // حداکثر فاصله‌ای که دو نقطه با خط به هم وصل می‌شوند
  linkAlpha: 0.14,      // شفافیت بیشینه‌ی خطوط اتصال
  dotAlpha: 0.5,        // شفافیت نقطه‌ها
  orbit: 90,            // دامنه‌ی حرکت هر نقطه (پیکسل)
  ribbonY: [470, 1130], // ارتفاع نوارهای موجی (در فضاهای خالی بین بخش‌ها)
  ribbonAlpha: 0.14,    // شفافیت نوارهای موجی
  ripples: true         // ریپل دور آواتار هنگام صحبت
};

// عدد تصادفی ثابت (بدون تغییر بین فریم‌ها) تا خروجی ویدیو همیشه یکسان باشد
const rnd = (i, k) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// نقطه‌ها یک‌بار برای هر ابعاد بوم ساخته و ذخیره می‌شوند
let _nodeCache = { key: '', nodes: [] };
function getNodes(W, H) {
  const key = `${W}x${H}x${FX.nodes}x${FX.orbit}`;
  if (_nodeCache.key === key) return _nodeCache.nodes;

  const cols = 3;
  const rows = Math.ceil(FX.nodes / cols);
  const nodes = [];
  for (let i = 0; i < FX.nodes; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    nodes.push({
      ax: (c + 0.5 + (rnd(i, 1) - 0.5) * 0.7) * (W / cols),
      ay: (r + 0.5 + (rnd(i, 2) - 0.5) * 0.7) * (H / rows),
      rx: 40 + rnd(i, 3) * FX.orbit,
      ry: 40 + rnd(i, 4) * FX.orbit,
      sx: 0.12 + rnd(i, 5) * 0.2,
      sy: 0.1 + rnd(i, 6) * 0.2,
      ph: rnd(i, 7) * Math.PI * 2,
      r: 2.2 + rnd(i, 8) * 2.6,
      pulse: i % 4 === 0
    });
  }
  _nodeCache = { key, nodes };
  return nodes;
}

// پس‌زمینه‌ی زنده: نوارهای موجی + شبکه‌ی نقطه و خط
function drawLiveBackground(ctx, W, H, time, level) {
  ctx.save();
  ctx.lineCap = 'round';

  // الف) نوارهای موجی نازک با محو شدن در دو طرف
  FX.ribbonY.forEach((baseY, bi) => {
    const dir = bi % 2 === 0 ? 1 : -1;
    const amp = 14 + level * 14;
    const ribbons = [
      { amp, freq: 0.0062, speed: 0.75 * dir, phase: bi * 1.7, alpha: FX.ribbonAlpha, lw: 2.2 },
      { amp: amp * 0.7, freq: 0.0094, speed: -0.55 * dir, phase: 2.1 + bi * 1.1, alpha: FX.ribbonAlpha * 0.55, lw: 1.5 }
    ];

    const yAt = (x, r) =>
      baseY +
      Math.sin(x * r.freq + time * r.speed + r.phase) * r.amp +
      Math.sin(x * r.freq * 0.43 - time * r.speed * 0.6 + r.phase * 2) * r.amp * 0.5;

    for (const r of ribbons) {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(255, 255, 255, 0)');
      g.addColorStop(0.5, `rgba(255, 255, 255, ${r.alpha})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = r.lw;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10) {
        const y = yAt(x, r);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // نقطه‌ی نورانی که آرام روی نوار اصلی می‌لغزد
    const t = (time * 70 + bi * 430) % (W + 160);
    const gx = dir > 0 ? t - 80 : W + 80 - t;
    const edge = Math.sin(Math.PI * Math.min(1, Math.max(0, gx / W)));
    const gy = yAt(gx, ribbons[0]);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.12 * edge})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * edge})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // ب) شبکه‌ی نقطه و خط
  const nodes = getNodes(W, H);
  const pos = nodes.map(n => ({
    x: n.ax + Math.sin(time * n.sx + n.ph) * n.rx,
    y: n.ay + Math.cos(time * n.sy + n.ph * 1.3) * n.ry
  }));

  // خطوط اتصال (هرچه نقطه‌ها دورتر، کم‌رنگ‌تر)
  ctx.lineWidth = 1.2;
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const d = Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y);
      if (d >= FX.linkDist) continue;
      const a = FX.linkAlpha * (1 - d / FX.linkDist) * (0.8 + level * 0.6);
      ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
      ctx.beginPath();
      ctx.moveTo(pos[i].x, pos[i].y);
      ctx.lineTo(pos[j].x, pos[j].y);
      ctx.stroke();
    }
  }

  // نقطه‌ها: چشمک ملایم + تپش خیلی کم با صدا
  nodes.forEach((n, i) => {
    const p = pos[i];
    const twinkle = 0.7 + 0.3 * Math.sin(time * 1.2 + n.ph);
    ctx.fillStyle = `rgba(255, 255, 255, ${FX.dotAlpha * twinkle})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, n.r * (1 + level * 0.25), 0, Math.PI * 2);
    ctx.fill();

    // حلقه‌ی نرمی که از بعضی نقطه‌ها پخش می‌شود
    if (n.pulse) {
      const k = (time * 0.25 + n.ph / (Math.PI * 2)) % 1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - k) * 0.22})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.r + k * 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.2;
    }
  });

  ctx.restore();
}

export default {
  id: 'ema-temp',
  name: '۱. اِما اورجینال (آبی #0a91d5 و مینیمال سفید)',

  renderScene(ctx, { width: W, height: H, time, state, helpers }) {
    const { levels, brand, images, cues, duration, tracksLoaded, peaks, logoHeight, audioEvents } = state;

    ctx.globalAlpha = 1.0;
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';

    // ۱. پس‌زمینه آبی یکدست اختصاصی (#0a91d5)
    ctx.fillStyle = '#0a91d5';
    ctx.fillRect(0, 0, W, H);

    // ۲. انیمیشن پس‌زمینه: هاله‌های نوری محو
    const totalLevel = (levels.ai + levels.hu) / 2;

    // هاله متحرک اول
    const glow1X = W * 0.35 + Math.sin(time * 0.25) * 130;
    const glow1Y = 540 + Math.cos(time * 0.2) * 90;
    const glow1 = ctx.createRadialGradient(glow1X, glow1Y, 50, glow1X, glow1Y, 750);
    glow1.addColorStop(0, `rgba(255, 255, 255, ${0.06 + totalLevel * 0.05})`);
    glow1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, W, H);

    // هاله متحرک دوم
    const glow2X = W * 0.72 + Math.cos(time * 0.2) * 150;
    const glow2Y = 1260 + Math.sin(time * 0.28) * 110;
    const glow2 = ctx.createRadialGradient(glow2X, glow2Y, 60, glow2X, glow2Y, 850);
    glow2.addColorStop(0, `rgba(255, 255, 255, ${0.05 + totalLevel * 0.04})`);
    glow2.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, W, H);

    // شبکه‌ی نقطه و خط + نوارهای موجی (لایه‌ی زنده‌ی پس‌زمینه)
    drawLiveBackground(ctx, W, H, time, totalLevel);








// ─────────────────────────────────────────────────────────────
    // فیلد سفارشی ۱: متن ساده سفید (در صورت خالی بودن نمایش داده نمی‌شود)
    // ─────────────────────────────────────────────────────────────
    if (state.customField1 && state.customField1.text && state.customField1.text.trim()) {
      const cf1 = state.customField1;
      ctx.save();
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${cf1.size || 38}px Vazirmatn, system-ui`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 25, 55, 0.4)';
      ctx.shadowBlur = 14;
      ctx.fillText(cf1.text, cf1.x ?? (W / 2), cf1.y ?? 440);
      ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────
    // فیلد سفارشی ۲: برچسب کپسولی با کادر سفید و نقطه قرمز چشمک‌زن
    // ─────────────────────────────────────────────────────────────
    if (state.customField2 && state.customField2.text && state.customField2.text.trim()) {
      const cf2 = state.customField2;
      const text = cf2.text.trim();
      const fontSize = cf2.size || 28;
      const posX = cf2.x ?? (W / 2);
      const posY = cf2.y ?? 510;

      ctx.save();
      ctx.font = `600 ${fontSize}px Vazirmatn, system-ui`;

      // محاسبه ابعاد دقیق پدینگ و کپسول بر اساس اندازه فونت
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const dotR = fontSize * 0.22;       // شعاع دایره قرمز
      const gap = fontSize * 0.45;        // فاصله بین نقطه قرمز و متن
      const padX = fontSize * 0.9;        // پدینگ چپ و راست
      const padY = fontSize * 0.42;       // پدینگ بالا و پایین

      const badgeW = padX * 2 + dotR * 2 + gap + textWidth;
      const badgeH = fontSize + padY * 2;
      const boxX = posX - badgeW / 2;
      const boxY = posY - badgeH / 2;
      const radius = badgeH / 2;          // گردی کامل کپسولی (border-radius تماس)

      // ۱. رسم کادر سفید بدون بک‌گراند (شفاف)
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, badgeW, badgeH, radius);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // ۲. نقطه قرمز با انیمیشن چشمک‌زن ملایم و هاله نورانی (REC/Live Indicator)
      const blink = (Math.sin(time * 5.5) + 1) / 2; // نوسان نرم بین 0 و 1
      const dotX = boxX + badgeW - padX - dotR;      // قرارگیری در سمت راست متن
      const dotY = posY;

      // هاله نورانی قرمز
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${blink * 0.45})`;
      ctx.fill();

      // دایره قرمز اصلی
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239, 68, 68, ${0.45 + blink * 0.55})`;
      ctx.fill();

      // ۳. رسم متن داخل نشانگر
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 25, 55, 0.3)';
      ctx.shadowBlur = 10;
      ctx.fillText(text, dotX - dotR - gap, posY);

      ctx.restore();
    }














    // ۳. برندینگ بالای ویدیو (سفید خالص)
    const brandX = state.brand.nameX !== undefined ? state.brand.nameX : (W / 2);
    const brandY = state.brand.nameY !== undefined ? state.brand.nameY : 280;
    const brandSize = state.brand.nameSize || 115;
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.font = `800 ${brandSize}px Vazirmatn, system-ui`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 25, 55, 0.2)';
    ctx.shadowBlur = 20;
    ctx.fillText(brand.name || 'اِما', brandX, brandY);
    ctx.shadowBlur = 0;

    // بررسی آیا شعار پویایی در ثانیه فعلی فعال است؟
    const activeTag = (state.dynamicTags || []).find(t => time >= t.s && time < t.e && t.text.trim());

    if (activeTag) {
      // محاسبه زمان ترانزیشن نرم (۰.۲۵ ثانیه برای ورود و خروج)
      const transTime = 0.25;
      const pIn = Math.min(1, Math.max(0, (time - activeTag.s) / transTime));
      const pOut = Math.min(1, Math.max(0, (activeTag.e - time) / transTime));
      const alpha = Math.min(pIn, pOut);
      const ease = 1 - Math.pow(1 - alpha, 3); // منحنی نرم کیوبیک

      ctx.save();
      ctx.globalAlpha = ease;
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.font = `600 ${activeTag.size || 34}px Vazirmatn, system-ui`;

      const posX = activeTag.x !== undefined ? activeTag.x : (W / 2);
      const posY = activeTag.y !== undefined ? activeTag.y : 345;

      // اجرای انیمیشن‌های ورود و خروج
      if (activeTag.anim === 'pop') {
        const scale = 0.75 + ease * 0.25;
        ctx.translate(posX, posY);
        ctx.scale(scale, scale);
        ctx.fillText(activeTag.text, 0, 0);
      } else if (activeTag.anim === 'slide') {
        const offsetY = (1 - ease) * 22; // اسلاید نرم از پایین به بالا
        ctx.fillText(activeTag.text, posX, posY + offsetY);
      } else {
        // حالت محو شدن ساده (Fade)
        ctx.fillText(activeTag.text, posX, posY);
      }
      ctx.restore();

    } else if (brand.tag && (!state.dynamicTags || state.dynamicTags.length === 0)) {
      // اگر هیچ شعار پویایی ثبت نشده باشد، همان شعار ثابت پیش‌فرض نشان داده می‌شود
      ctx.font = '400 34px Vazirmatn, system-ui';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(brand.tag, W / 2, 345);
    }

    // ۴. لاین‌های صدا: آواتار با نام در زیر آن و امواج مینیمال
    // ابعاد مستقیماً از CONFIG خوانده می‌شود تا تاخیر زمانی نداشته باشیم
    const CYA = 650;
    const CYH = 920;
    const AVR = 74;
    const AVX = 150;

    const { startX: X0, barWidth: BW, barGap: GAP, barCount: N, maxHeight: MH } = CONFIG.layout.waveform;
    const totalWaveW = N * (BW + GAP) - GAP;

    const lanes = [
      { key: 'ai', y: CYA, label: 'اِما', level: levels.ai, pks: peaks.ai },
      { key: 'hu', y: CYH, label: 'کاربر', level: levels.hu, pks: peaks.hu }
    ];

    // درصد پیشرفت خطی صدا بین ۰ تا ۱
    const progress = duration ? Math.min(1, Math.max(0, time / duration)) : 0;
    // ایندکس پیوسته فعلی
    const currentBarIdx = progress * N;

    for (const lane of lanes) {
      // الف) آواتار
      helpers.drawCircleImage(ctx, images[lane.key], AVX, lane.y, AVR, 'rgba(255,255,255,0.2)', '#ffffff');

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(AVX, lane.y, AVR + 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.2 + lane.level * 0.65;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(AVX, lane.y, AVR + 12 + lane.level * 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // ریپل نرم دور آواتار (فقط وقتی همین گوینده صحبت می‌کند)
      if (FX.ripples) {
        ctx.lineWidth = 2;
        for (let k = 0; k < 2; k++) {
          const p = ((time / 2.6) + k * 0.5) % 1;
          ctx.globalAlpha = (1 - p) * (1 - p) * 0.4 * Math.min(1, lane.level * 1.8);
          ctx.beginPath();
          ctx.arc(AVX, lane.y, AVR + 14 + p * 62, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      }

      // ب) نام گوینده
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.font = '700 26px Vazirmatn, system-ui';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(lane.label, AVX, lane.y + AVR + 36);

      // ج) خط تراز امواج
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0, lane.y);
      ctx.lineTo(X0 + totalWaveW, lane.y);
      ctx.stroke();

      // د) میله‌های اکولایزر
      ctx.direction = 'ltr';
      for (let i = 0; i < N; i++) {
        const a = lane.pks ? lane.pks[i] : 0.08;
        const dist = Math.abs(i - currentBarIdx);
        // واکنش ارتعاشی نقطه در حال پخش
        const reactive = tracksLoaded[lane.key] ? lane.level * MH * 0.5 * Math.exp(-dist * dist / 16) : 0;
        const h = Math.min(MH, Math.max(4, a * MH) + reactive);

        // میله‌های خوانده شده روشن‌تر، میله‌های جلوتر نیمه‌شفاف
        ctx.globalAlpha = (!duration || i <= currentBarIdx ? 1.0 : 0.35);
        ctx.fillStyle = '#ffffff';
        const xPos = X0 + i * (BW + GAP);
        ctx.beginPath();
        ctx.roundRect(xPos, lane.y - h, BW, h * 2, 4);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // خط جداکننده افقی
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, lane.y + 115);
      ctx.lineTo(1000, lane.y + 115);
      ctx.stroke();
    }

    // ۵. خط و نقطه اسکرابر زمان (دقیقاً منطبق بر درصد واقعی زمان)
    if (duration) {
      const scrX = X0 + progress * totalWaveW;

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.45;
      ctx.fillRect(scrX - 1, CYA - 85, 2, CYH - CYA + 170);
      ctx.globalAlpha = 1.0;

      for (const lane of lanes) {
        if (!tracksLoaded[lane.key]) continue;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.25 + lane.level * 0.45;
        ctx.beginPath();
        ctx.arc(scrX, lane.y, 15 + lane.level * 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(scrX, lane.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ۶. ایموجی‌های شناور رویدادهای صوتی (خنده، تردید، تداخل)
    if (audioEvents && audioEvents.length > 0) {
      const activeEvents = audioEvents.filter(e => time >= e.time && time < e.time + 2.0);
      activeEvents.forEach(evt => {
        const age = time - evt.time;
        const ep = age / 2.0;

        ctx.save();
        ctx.globalAlpha = Math.sin(ep * Math.PI);
        ctx.font = '50px system-ui';

        if (evt.type === 'overlap') {
          // تداخل صحبت: جرقه نوسانی در مرکز
          const scale = 1 + Math.sin(age * 15) * 0.25;
          ctx.translate(W / 2, (CYA + CYH) / 2);
          ctx.scale(scale, scale);
          ctx.fillText(evt.emoji, 0, 0);
        } else {
          // خنده و تردید: شناور شدن نرم از بالای آواتار
          const startY = (evt.speaker === 'ai' ? CYA : CYH) - AVR - 10;
          const floatY = startY - (ep * 85);
          const driftX = Math.sin(age * 4) * 18;

          ctx.translate(AVX + driftX, floatY);
          if (evt.type === 'laugh') ctx.rotate(Math.sin(age * 5) * 0.2);
          ctx.fillText(evt.emoji, 0, 0);
        }
        ctx.restore();
      });
    }

    // ۷. زیرنویس‌ها: کاملاً بدون کادر، آزاد و خوانا
    const activeCue = cues.find(c => time >= c.s && time < c.e && c.tx.trim());
    if (activeCue) {
      const rel = time - activeCue.s;
      const a = Math.max(0, Math.min(1, rel / 0.18, (activeCue.e - time) / 0.18));
      const ease = 1 - Math.pow(1 - a, 3);

      ctx.save();
      ctx.globalAlpha = ease;
      ctx.translate(0, (1 - ease) * 18);
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      const subStartY = 1220;

      // گوینده زیرنویس (بدون پس‌زمینه)
      ctx.font = '700 30px Vazirmatn, system-ui';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const speakerName = activeCue.k === 'ai' ? '• اِما •' : '• کاربر •';
      ctx.fillText(speakerName, W / 2, subStartY);

      // متن زیرنویس: سایز ۵۴ و بولد با سایه ملایم جهت خوانایی در ریلز
      ctx.font = '800 54px Vazirmatn, system-ui';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 25, 55, 0.45)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 4;

      const lines = helpers.wrapText(ctx, activeCue.tx, 900);
      lines.forEach((l, idx) => {
        ctx.fillText(l, W / 2, subStartY + 82 + idx * 84);
      });
      ctx.restore();
    }

    // ۸. بخش فوتر و لوگوی پایین ویدیو (عکس، متن یا هر دو)
    // الف) اگر عکس لوگو وجود داشته باشد:
    if (images.logo) {
      const img = images.logo;
      const r = img.width / img.height;
      const w = Math.min(800, r * logoHeight);
      // اگر متن فوتر هم باشد، لوگو را کمی بالاتر می‌کشیم تا تداخل نداشته باشند
      const hasFooterText = state.footer && state.footer.text && state.footer.text.trim();
      const logoBottomY = hasFooterText ? (state.footer.y - 45) : 1810;
      ctx.drawImage(img, W / 2 - w / 2, logoBottomY - w / r, w, w / r);
    }

    // ب) اگر متن فوتر (آیدی اینستاگرام، سایت و...) ثبت شده باشد:
    if (state.footer && state.footer.text && state.footer.text.trim()) {
      ctx.save();
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.font = `600 ${state.footer.size || 32}px Vazirmatn, system-ui`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.shadowColor = 'rgba(0, 25, 55, 0.3)';
      ctx.shadowBlur = 14;
      ctx.fillText(state.footer.text, W / 2, state.footer.y || 1855);
      ctx.restore();
    }

    // ۹. نوار باریک پیشرفت در انتهای ویدیو
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, H - 8, duration ? Math.min(1, time / duration) * W : 0, 8);
  }
};