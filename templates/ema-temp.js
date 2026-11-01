/**
 * templates/ema-temp.js
 * تمپلیت اختصاصی استودیوی اِما
 * نسخه ۵ — «آبی زنده»: مدرن، مینیمال و گرافیکی
 *
 * ایده‌ی طراحی
 *  • رنگ اصلی کل تمپلیت همان آبی سازمانی #0a91d5 است (پس‌زمینه، کارت‌ها، نورها).
 *  • اِما = نور سفید-یخی | کاربر = نور گرم هلویی  → گوینده را فقط از رنگ هم می‌شود فهمید.
 *  • صدا فقط نمایش داده نمی‌شود، در کل فضا «حس» می‌شود:
 *      موج‌های حلقوی که از آواتار به‌سمت موج صوتی حرکت می‌کنند،
 *      شبکه‌ی نقطه‌ای که با صدا موج برمی‌دارد، روبان‌های نوری،
 *      نور محیطی از بالا (اِما) و پایین (کاربر)، و کارت‌هایی که با گوینده روشن می‌شوند.
 *  • همه‌ی انیمیشن‌ها فقط تابع زمان و سطح صدا هستند (بدون حافظه‌ی فریم قبل)،
 *    پس خروجی ویدیو و پیش‌نمایش دقیقاً یکسان است.
 *
 * تنظیم سریع: PALETTE (رنگ‌ها) | FX (روشن/خاموش کردن لایه‌ها) | LAYOUT (چیدمان)
 */
import { CONFIG } from '../config.js';

// ============================================================
// پالت رنگ — آبی برند محور اصلی است
// ============================================================
const C = {
  brand: [10, 145, 213],   // #0a91d5
  light: [58, 178, 235],
  sky:   [124, 212, 250],
  ice:   [214, 244, 255],
  deep:  [7, 105, 160],
  navy:  [3, 56, 92],
  night: [2, 33, 58],
  white: [255, 255, 255],
  ai:    [190, 240, 255],  // نور اِما: سفید-یخی
  hu:    [255, 190, 142]   // نور کاربر: هلویی گرم (مکمل آبی)
};

const rgba = (c, a = 1) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t
];

// ============================================================
// تنظیمات افکت‌ها و چیدمان
// ============================================================
const FX = {
  dotGap: 60,        // فاصله‌ی نقطه‌های شبکه
  dotField: true,    // شبکه‌ی نقطه‌ای واکنش‌گر
  ribbons: true,     // روبان‌های نوری
  particles: 34,     // ذرات شناور
  ripples: true      // موج‌های حلقوی از آواتار
};

const LAYOUT = {
  avatarX: 150,
  avatarR: 74,
  laneAI: 650,
  laneHU: 920,
  cardHalfH: 125,
  cardInset: 36,
  ribbonAI: 470,
  ribbonHU: 1130
};

// ============================================================
// ابزارهای کمکی
// ============================================================
const rnd = (i, k) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const clamp01 = value => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
};

// تبدیل سطح خام صدا به انرژی نرم ۰ تا ۱ (نویز کم حذف می‌شود)
function voiceEnergy(value) {
  const level = clamp01(value);
  const n = clamp01((level - 0.025) / 0.42);
  return n * n * (3 - 2 * n);
}

// ============================================================
// پس‌زمینه: آبی برند + نورهای نرم + ذرات
// ============================================================
function drawBackground(ctx, W, H, time, mood) {
  ctx.save();

  // پایه: آبی برند در مرکز تصویر، کمی روشن‌تر بالا و عمیق‌تر پایین
  const base = ctx.createLinearGradient(0, 0, W * 0.2, H);
  base.addColorStop(0, '#1ba7ea');
  base.addColorStop(0.34, '#0a91d5');
  base.addColorStop(0.7, '#0879b6');
  base.addColorStop(1, '#05486f');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // نورهای نرم آبی روشن — آهسته حرکت می‌کنند و با صدا کمی بزرگ‌تر می‌شوند
  ctx.globalCompositeOperation = 'screen';
  const lights = [
    {
      x: W * (0.2 + Math.sin(time * 0.17) * 0.07),
      y: H * (0.18 + Math.cos(time * 0.13) * 0.04),
      r: H * 0.42, c: C.sky, a: 0.3
    },
    {
      x: W * (0.86 + Math.cos(time * 0.14) * 0.05),
      y: H * (0.46 + Math.sin(time * 0.11) * 0.05),
      r: H * 0.4, c: C.light, a: 0.26
    },
    {
      x: W * (0.3 + Math.sin(time * 0.1 + 2) * 0.08),
      y: H * (0.82 + Math.cos(time * 0.16) * 0.04),
      r: H * 0.46, c: C.sky, a: 0.16
    }
  ];

  for (const b of lights) {
    const a = b.a * (1 + mood * 0.35);
    const r = b.r * (1 + mood * 0.06);
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
    g.addColorStop(0, rgba(b.c, a));
    g.addColorStop(0.5, rgba(b.c, a * 0.35));
    g.addColorStop(1, rgba(b.c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // سایه‌های عمیق آبی برای عمق و کنتراست متن
  ctx.globalCompositeOperation = 'source-over';
  const shades = [
    { x: W * 0.98, y: H * 0.08, r: H * 0.36, a: 0.3 },
    { x: W * 0.02, y: H * 0.64, r: H * 0.34, a: 0.22 }
  ];

  for (const s of shades) {
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
    g.addColorStop(0, rgba(C.night, s.a));
    g.addColorStop(1, rgba(C.night, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ذرات نوری که آرام بالا می‌روند (سرعتشان ثابت است تا پرش نکنند)
  for (let i = 0; i < FX.particles; i++) {
    const speed = 10 + rnd(i, 22) * 22;
    const py = H - ((time * speed + rnd(i, 23) * H) % H);
    const px = rnd(i, 21) * W + Math.sin(time * 0.35 + i * 1.7) * 16;
    const tw = 0.5 + 0.5 * Math.sin(time * (0.8 + rnd(i, 24)) + i);

    ctx.globalAlpha = Math.min(1, (0.14 + tw * 0.3) * (0.75 + mood * 0.6));
    ctx.fillStyle = i % 5 === 0 ? '#ffffff' : '#bfeaff';
    ctx.beginPath();
    ctx.arc(px, py, 0.9 + rnd(i, 25) * 1.6 + mood * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

// ============================================================
// نور صدا: اِما از بالا و کاربر از پایین وارد فضا می‌شود
// ============================================================
function drawVoiceLight(ctx, W, H, time, ai, hu) {
  if (ai < 0.004 && hu < 0.004) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const sources = [
    {
      e: ai, y: LAYOUT.laneAI, c: C.ai,
      edgeX: W * (0.5 + Math.sin(time * 0.42) * 0.08), edgeY: -H * 0.05
    },
    {
      e: hu, y: LAYOUT.laneHU, c: C.hu,
      edgeX: W * (0.5 + Math.cos(time * 0.37) * 0.08), edgeY: H * 1.05
    }
  ];

  for (const s of sources) {
    if (s.e < 0.004) continue;

    // هاله‌ی بیضوی روی ردیف گوینده
    ctx.save();
    ctx.translate(LAYOUT.avatarX + 300 + Math.sin(time * 0.8) * 30, s.y);
    ctx.scale(1.7, 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 430);
    g.addColorStop(0, rgba(s.c, 0.34 * s.e));
    g.addColorStop(0.45, rgba(s.c, 0.12 * s.e));
    g.addColorStop(1, rgba(s.c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-430, -430, 860, 860);
    ctx.restore();

    // نور لبه‌ی کادر
    const eg = ctx.createRadialGradient(
      s.edgeX, s.edgeY, 0,
      s.edgeX, s.edgeY, H * 0.62
    );
    eg.addColorStop(0, rgba(s.c, 0.14 * s.e));
    eg.addColorStop(0.5, rgba(s.c, 0.05 * s.e));
    eg.addColorStop(1, rgba(s.c, 0));
    ctx.fillStyle = eg;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

// ============================================================
// شبکه‌ی نقطه‌ای: صدا مثل موج در سطح آب در آن پخش می‌شود
// ============================================================
function drawDotField(ctx, W, H, time, ai, hu) {
  if (!FX.dotField) return;

  const gap = FX.dotGap;
  const cols = Math.ceil(W / gap) + 1;
  const rows = Math.ceil(H / gap) + 1;
  const ox = (W - (cols - 1) * gap) / 2;
  const oy = (H - (rows - 1) * gap) / 2;

  const sx = LAYOUT.avatarX;
  const sA = LAYOUT.laneAI;
  const sH = LAYOUT.laneHU;

  ctx.save();

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * gap;
      const y = oy + j * gap;

      const dA = Math.hypot(x - sx, y - sA);
      const dH = Math.hypot(x - sx, y - sH);

      const kA = ai * Math.exp(-dA / 520) * (0.5 + 0.5 * Math.sin(dA * 0.036 - time * 5.2));
      const kH = hu * Math.exp(-dH / 520) * (0.5 + 0.5 * Math.sin(dH * 0.036 - time * 5.2));
      const k = Math.min(1, kA + kH);

      const tw = 0.5 + 0.5 * Math.sin(time * 0.9 + i * 0.83 + j * 1.17);
      const alpha = 0.09 + tw * 0.05 + k * 0.75;
      const r = 1.5 + tw * 0.35 + k * 4.2;

      const t = kA + kH > 1e-4 ? kH / (kA + kH) : 0;
      const tint = mix(C.ice, mix(C.ai, C.hu, t), clamp01(k * 2));

      ctx.fillStyle = rgba(tint, alpha);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ============================================================
// روبان‌های نوری: بالا ↔ اِما ، پایین ↔ کاربر
// ============================================================
function drawRibbons(ctx, W, time, ai, hu) {
  if (!FX.ribbons) return;

  const defs = [
    { y: LAYOUT.ribbonAI, e: ai, c: C.ai, dir: 1, seed: 0 },
    { y: LAYOUT.ribbonHU, e: hu, c: C.hu, dir: -1, seed: 1 }
  ];

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const d of defs) {
    const amp = 12 + d.e * 34;
    const tint = mix(C.white, d.c, 0.35 + d.e * 0.65);

    const layers = [
      { a: amp, f: 0.0062, s: 0.75 * d.dir, p: d.seed * 1.7, al: 0.16 + d.e * 0.34, lw: 2.2 + d.e * 1.2 },
      { a: amp * 0.7, f: 0.0094, s: -0.55 * d.dir, p: 2.1 + d.seed * 1.1, al: 0.09 + d.e * 0.22, lw: 1.5 },
      { a: amp * 0.45, f: 0.0128, s: 0.95 * d.dir, p: 4 + d.seed, al: 0.05 + d.e * 0.16, lw: 1.1 }
    ];

    const yAt = (x, l) =>
      d.y +
      Math.sin(x * l.f + time * l.s + l.p) * l.a +
      Math.sin(x * l.f * 0.43 - time * l.s * 0.6 + l.p * 2) * l.a * 0.5;

    for (const l of layers) {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, rgba(tint, 0));
      g.addColorStop(0.5, rgba(tint, l.al));
      g.addColorStop(1, rgba(tint, 0));

      ctx.strokeStyle = g;
      ctx.lineWidth = l.lw;
      ctx.beginPath();

      for (let x = 0; x <= W; x += 10) {
        const y = yAt(x, l);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    // جرقه‌ی نورانی که روی روبان حرکت می‌کند
    const t = (time * 70 + d.seed * 430) % (W + 160);
    const gx = d.dir > 0 ? t - 80 : W + 80 - t;
    const edge = Math.sin(Math.PI * clamp01(gx / W));
    const gy = yAt(gx, layers[0]);

    ctx.fillStyle = rgba(tint, 0.14 * edge * (1 + d.e));
    ctx.beginPath();
    ctx.arc(gx, gy, 16 + d.e * 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${0.85 * edge})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// وینیت آبی: گوشه‌ها عمیق‌تر می‌شوند، مرکز همان آبی برند می‌ماند
function drawVignette(ctx, W, H) {
  ctx.save();
  const v = ctx.createRadialGradient(
    W * 0.5, H * 0.45, Math.min(W, H) * 0.35,
    W * 0.5, H * 0.45, Math.max(W, H) * 0.78
  );
  v.addColorStop(0, rgba(C.night, 0));
  v.addColorStop(0.7, rgba(C.night, 0.1));
  v.addColorStop(1, rgba(C.night, 0.5));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ============================================================
// آواتار اِما: گوی نورانی مینیمال با حلقه‌ی اکولایزر
// ============================================================
function drawAIAvatar(ctx, x, y, R, time, raw) {
  const e = voiceEnergy(raw);
  const pulse =
    1 +
    Math.sin(time * 1.7) * 0.016 +
    e * (0.03 + 0.03 * (0.5 + 0.5 * Math.sin(time * 12.5)));
  const S = R * pulse;

  const blinkPhase = (time + 0.8) % 4.6;
  const blink = Math.max(0, 1 - Math.abs(blinkPhase - 0.1) / 0.1);
  const eyeOpen = Math.max(0.1, 1 - blink * 0.9);

  ctx.save();
  ctx.translate(x, y + Math.sin(time * 1.25) * 1.5);

  // قاب شیشه‌ای تیره
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.92, 0, Math.PI * 2);
  const disc = ctx.createRadialGradient(-R * 0.3, -R * 0.35, 2, 0, 0, R * 0.95);
  disc.addColorStop(0, rgba(C.ai, 0.3 + e * 0.14));
  disc.addColorStop(0.5, rgba(C.deep, 0.62));
  disc.addColorStop(1, rgba(C.night, 0.88));
  ctx.fillStyle = disc;
  ctx.fill();

  // حلقه‌ی اکولایزر: خط‌های شعاعی که با صدا بلند و کوتاه می‌شوند
  ctx.save();
  ctx.lineCap = 'round';
  const ticks = 48;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2 - Math.PI / 2;
    const w = 0.5 + 0.5 * Math.sin(time * 9.5 + i * 1.9 + rnd(i, 3) * 6.283);
    const major = i % 6 === 0;
    const inner = R * 0.66;
    const len = R * (0.035 + e * 0.15 * w + (major ? 0.02 : 0));

    ctx.strokeStyle = rgba(major ? C.white : C.sky, 0.28 + e * 0.55);
    ctx.lineWidth = 1.6 + e * 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * (inner + len), Math.sin(a) * (inner + len));
    ctx.stroke();
  }
  ctx.restore();

  // هاله‌ی گوی
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.74);
  halo.addColorStop(0, rgba(C.sky, 0.3 + e * 0.35));
  halo.addColorStop(1, rgba(C.sky, 0));
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.74, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // مدار نازک با ذره‌ی چرخان
  ctx.save();
  ctx.rotate(time * 0.55);
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.56, R * 0.2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = rgba(C.sky, 0.3 + e * 0.35);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  const oa = time * 1.9;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(Math.cos(oa) * R * 0.56, Math.sin(oa) * R * 0.2, 2.2 + e * 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // بدنه‌ی ارگانیک گوی؛ شکلش با صدا تغییر می‌کند
  ctx.beginPath();
  const seg = 56;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const organic =
      1 +
      Math.sin(a * 3 + time * 1.7) * (0.045 + e * 0.04) +
      Math.sin(a * 5 - time * 1.2) * 0.022 +
      Math.cos(a * 2 + time * 2.1) * 0.015;
    const r = S * 0.4 * organic * (1 + e * 0.06);
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const core = ctx.createRadialGradient(
    -S * 0.12, -S * 0.15, S * 0.02,
    0, 0, S * 0.46
  );
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.35, '#c4efff');
  core.addColorStop(0.75, '#4cb9ee');
  core.addColorStop(1, '#0a91d5');
  ctx.fillStyle = core;
  ctx.fill();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = `rgba(255,255,255,${0.7 + e * 0.25})`;
  ctx.stroke();

  // چشم‌ها و دهان بسیار مینیمال
  const ink = '#06456b';
  ctx.fillStyle = ink;
  for (const side of [-1, 1]) {
    const w = S * 0.07;
    const h = S * 0.13 * eyeOpen;
    ctx.beginPath();
    ctx.roundRect(side * S * 0.115 - w / 2, -S * 0.035 - h / 2, w, h, w / 2);
    ctx.fill();
  }

  const mouthH = S * (0.008 + e * (0.03 + 0.022 * (0.5 + 0.5 * Math.sin(time * 15))));
  ctx.beginPath();
  ctx.ellipse(0, S * 0.105, S * 0.062, mouthH, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================
// آواتار کاربر: چهره‌ی فلت و مینیمال با پلک و تکان طبیعی
// ============================================================
function drawHumanAvatar(ctx, x, y, R, time, raw) {
  const e = voiceEnergy(raw);
  const breath = Math.sin(time * 1.55) * 1.6;
  const nod = Math.sin(time * 4.7) * e * 1.4;
  const blinkPhase = (time + 1.35) % 5.8;
  const blink = Math.max(0, 1 - Math.abs(blinkPhase - 0.12) / 0.12);
  const eyeOpen = Math.max(0.12, 1 - blink * 0.9);
  const tilt = Math.sin(time * 0.62) * 0.018 + Math.sin(time * 2.4) * e * 0.012;
  const R9 = R * 0.92;

  ctx.save();
  ctx.translate(x, y + Math.sin(time * 1.12) * 1.1);

  // قاب شیشه‌ای تیره با ته‌رنگ گرم
  ctx.beginPath();
  ctx.arc(0, 0, R9, 0, Math.PI * 2);
  const disc = ctx.createRadialGradient(-R * 0.28, -R * 0.38, 2, 0, 0, R);
  disc.addColorStop(0, rgba(C.hu, 0.34 + e * 0.16));
  disc.addColorStop(0.55, rgba(C.navy, 0.7));
  disc.addColorStop(1, rgba(C.night, 0.9));
  ctx.fillStyle = disc;
  ctx.fill();

  // محتوا داخل دایره بریده می‌شود
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, R9, 0, Math.PI * 2);
  ctx.clip();

  // هاله‌ی گرم هنگام صحبت
  const warm = ctx.createRadialGradient(0, R * 0.1, 2, 0, 0, R * 1.05);
  warm.addColorStop(0, rgba(C.hu, 0.06 + e * 0.24));
  warm.addColorStop(1, rgba(C.hu, 0));
  ctx.fillStyle = warm;
  ctx.fillRect(-R, -R, R * 2, R * 2);

  // شانه‌ها با تنفس آرام
  ctx.save();
  ctx.translate(0, breath * 0.34);
  ctx.beginPath();
  ctx.moveTo(-R * 0.78, R * 1.05);
  ctx.quadraticCurveTo(-R * 0.68, R * 0.3, -R * 0.25, R * 0.22);
  ctx.lineTo(R * 0.25, R * 0.22);
  ctx.quadraticCurveTo(R * 0.68, R * 0.3, R * 0.78, R * 1.05);
  ctx.closePath();
  ctx.fillStyle = '#eef8ff';
  ctx.fill();
  ctx.restore();

  // گردن
  ctx.fillStyle = '#e6b69c';
  ctx.beginPath();
  ctx.roundRect(-R * 0.145, R * 0.08, R * 0.29, R * 0.34, R * 0.09);
  ctx.fill();

  // سر: چرخش بسیار محدود + تکان هنگام صحبت
  ctx.save();
  ctx.translate(0, -R * 0.12 + nod);
  ctx.rotate(tilt);

  // گوش‌ها
  ctx.fillStyle = '#e3ae94';
  ctx.beginPath();
  ctx.ellipse(-R * 0.34, -R * 0.02, R * 0.085, R * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(R * 0.34, -R * 0.02, R * 0.085, R * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // صورت
  ctx.fillStyle = '#ffd9c2';
  ctx.beginPath();
  ctx.ellipse(0, 0, R * 0.31, R * 0.405, 0, 0, Math.PI * 2);
  ctx.fill();

  // مو
  ctx.fillStyle = '#0b3558';
  ctx.beginPath();
  ctx.moveTo(-R * 0.33, -R * 0.08);
  ctx.quadraticCurveTo(-R * 0.37, -R * 0.53, -R * 0.02, -R * 0.54);
  ctx.quadraticCurveTo(R * 0.34, -R * 0.54, R * 0.34, -R * 0.08);
  ctx.quadraticCurveTo(R * 0.2, -R * 0.24, R * 0.04, -R * 0.28);
  ctx.quadraticCurveTo(-R * 0.12, -R * 0.13, -R * 0.33, -R * 0.08);
  ctx.closePath();
  ctx.fill();

  // ابروها
  ctx.strokeStyle = 'rgba(60,45,50,0.8)';
  ctx.lineWidth = 1.55;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-R * 0.2, -R * 0.09);
  ctx.quadraticCurveTo(-R * 0.13, -R * 0.13, -R * 0.075, -R * 0.09);
  ctx.moveTo(R * 0.075, -R * 0.09);
  ctx.quadraticCurveTo(R * 0.13, -R * 0.13, R * 0.2, -R * 0.09);
  ctx.stroke();

  // چشم‌ها با پلک‌زدن نرم
  ctx.fillStyle = '#1e3d52';
  ctx.beginPath();
  ctx.ellipse(-R * 0.135, -R * 0.035, 1.8, 1.95 * eyeOpen, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(R * 0.135, -R * 0.035, 1.8, 1.95 * eyeOpen, 0, 0, Math.PI * 2);
  ctx.fill();

  // دهان: با انرژی صدای کاربر باز و بسته می‌شود
  const mouthOpen = 1.1 + e * (2.7 + 1.8 * (0.5 + 0.5 * Math.sin(time * 13)));
  ctx.fillStyle = `rgba(150,70,76,${0.3 + e * 0.35})`;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.13, R * 0.07, mouthOpen, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,90,86,0.8)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, R * 0.12, R * 0.085, 0.18, Math.PI - 0.18);
  ctx.stroke();

  ctx.restore(); // سر
  ctx.restore(); // clip

  // هایلایت شیشه‌ای
  ctx.strokeStyle = `rgba(220,242,255,${0.16 + e * 0.16})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.84, -Math.PI * 0.86, -Math.PI * 0.24);
  ctx.stroke();

  ctx.restore();
}

// حلقه‌ی دور آواتار: حلقه‌ی ثابت + ضربان + کمان «در حال صحبت»
function drawAvatarRing(ctx, lane, e, time) {
  const x = LAYOUT.avatarX;
  const y = lane.y;
  const R = LAYOUT.avatarR;

  ctx.save();

  ctx.strokeStyle = rgba(lane.c, 0.55 + e * 0.4);
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(x, y, R + 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.14 + e * 0.6;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, R + 14 + e * 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (e > 0.02) {
    const dir = lane.key === 'ai' ? 1 : -1;
    const a0 = time * 2.6 * dir;
    const len = Math.PI * (0.35 + e * 1.1);

    ctx.lineCap = 'round';
    ctx.lineWidth = 4.2;
    ctx.strokeStyle = `rgba(255,255,255,${0.55 + e * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, R + 5, a0, a0 + len);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================
// کارت هر ردیف: شیشه‌ی آبی تیره که با صدای گوینده روشن می‌شود
// ============================================================
function drawLaneCard(ctx, W, lane, e, time) {
  const x = LAYOUT.cardInset;
  const w = W - LAYOUT.cardInset * 2;
  const y = lane.y - LAYOUT.cardHalfH;
  const h = LAYOUT.cardHalfH * 2;
  const r = 40;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);

  // const fill = ctx.createLinearGradient(0, y, 0, y + h);
  // fill.addColorStop(0, 'rgba(4,62,102,0.30)');
  // fill.addColorStop(1, 'rgba(3,46,78,0.40)');
  // ctx.fillStyle = fill;
  // ctx.fill();
  ctx.clip();

  if (e > 0.004) {
    // درخشش داخل کارت
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(
      LAYOUT.avatarX, lane.y, 0,
      LAYOUT.avatarX, lane.y, w * 0.75
    );
    g.addColorStop(0, rgba(lane.c, 0.26 * e));
    g.addColorStop(0.5, rgba(lane.c, 0.07 * e));
    g.addColorStop(1, rgba(lane.c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';

    // موج‌های حلقوی: از آواتار شروع می‌شوند و در کارت پخش می‌شوند
    if (FX.ripples) {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = rgba(lane.c, 1);
      for (let k = 0; k < 3; k++) {
        const p = (time / 2.4 + k / 3) % 1;
        ctx.globalAlpha = (1 - p) * (1 - p) * 0.34 * e;
        ctx.beginPath();
        ctx.arc(LAYOUT.avatarX, lane.y, LAYOUT.avatarR + 10 + p * 520, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();

  // لبه‌ی کارت
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = rgba(mix(C.white, lane.c, 0.5), 0.14 + e * 0.55);
  ctx.lineWidth = 1.4 + e * 1.4;
  ctx.stroke();
  ctx.restore();
}

// رشته‌ی نوری زنده: دور نقطه‌ی پخش می‌لرزد و با صدا بزرگ می‌شود
function drawVoiceThread(ctx, lane, X0, totalW, scrX, MH, time, e) {
  if (e < 0.012) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const layers = [
    { f: 0.03, s: 9.0, p: 0, amp: 0.8, lw: 2.4, al: 0.85 },
    { f: 0.047, s: -7.0, p: 1.7, amp: 0.55, lw: 1.6, al: 0.55 },
    { f: 0.021, s: 5.2, p: 3.1, amp: 0.38, lw: 1.2, al: 0.38 }
  ];

  for (const l of layers) {
    ctx.strokeStyle = rgba(lane.c, l.al * (0.45 + 0.55 * e));
    ctx.lineWidth = l.lw;
    ctx.beginPath();

    for (let x = X0; x <= X0 + totalW; x += 5) {
      const dx = (x - scrX) / 190;
      const env = Math.exp(-dx * dx);
      const y = lane.y + Math.sin(x * l.f + time * l.s + l.p) * MH * l.amp * e * env;
      if (x === X0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================
// بخش‌های متنی
// ============================================================
function drawHeadline(ctx, W, cf) {
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${cf.size || 38}px Vazirmatn, system-ui`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(2,45,80,0.35)';
  ctx.shadowBlur = 14;
  ctx.fillText(cf.text, cf.x ?? (W / 2), cf.y ?? 440);
  ctx.restore();
}

function drawLiveBadge(ctx, W, cf, time) {
  const text = cf.text.trim();
  const fontSize = cf.size || 28;
  const posX = cf.x ?? (W / 2);
  const posY = cf.y ?? 510;

  ctx.save();
  ctx.font = `600 ${fontSize}px Vazirmatn, system-ui`;

  const textWidth = ctx.measureText(text).width;
  const dotR = fontSize * 0.22;
  const gap = fontSize * 0.45;
  const padX = fontSize * 0.9;
  const padY = fontSize * 0.42;

  const badgeW = padX * 2 + dotR * 2 + gap + textWidth;
  const badgeH = fontSize + padY * 2;
  const boxX = posX - badgeW / 2;
  const boxY = posY - badgeH / 2;

  ctx.beginPath();
  ctx.roundRect(boxX, boxY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = 'rgba(3,56,92,0.28)';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const blink = (Math.sin(time * 5.5) + 1) / 2;
  const dotX = boxX + badgeW - padX - dotR;

  ctx.beginPath();
  ctx.arc(dotX, posY, dotR * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(239,68,68,${blink * 0.45})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(dotX, posY, dotR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(239,68,68,${0.45 + blink * 0.55})`;
  ctx.fill();

  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(2,45,80,0.3)';
  ctx.shadowBlur = 10;
  ctx.fillText(text, dotX - dotR - gap, posY);

  ctx.restore();
}

// ============================================================
// تمپلیت
// ============================================================
export default {
  id: 'ema-temp',
  name: '۱. اِما آبی زنده (برند #0a91d5 | مدرن، مینیمال و گرافیکی)',

  renderScene(ctx, {
    width: W,
    height: H,
    time,
    state,
    helpers
  }) {
    const {
      brand,
      images,
      duration,
      logoHeight
    } = state;

    const levels = state.levels || {};
    const peaks = state.peaks || {};
    const tracksLoaded = state.tracksLoaded || {};
    const cues = state.cues || [];
    const audioEvents = state.audioEvents || [];

    ctx.globalAlpha = 1.0;
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';

    const ai = voiceEnergy(levels.ai);
    const hu = voiceEnergy(levels.hu);
    const mood = Math.min(1, ai + hu);

    // ----------------------------------------------------------
    // ۱. فضای زنده
    // ----------------------------------------------------------
    drawBackground(ctx, W, H, time, mood);
    drawVoiceLight(ctx, W, H, time, ai, hu);
    drawDotField(ctx, W, H, time, ai, hu);
    drawRibbons(ctx, W, time, ai, hu);
    drawVignette(ctx, W, H);

    // ----------------------------------------------------------
    // ۲. فیلدهای سفارشی
    // ----------------------------------------------------------
    if (state.customField1 && state.customField1.text && state.customField1.text.trim()) {
      drawHeadline(ctx, W, state.customField1);
    }

    if (state.customField2 && state.customField2.text && state.customField2.text.trim()) {
      drawLiveBadge(ctx, W, state.customField2, time);
    }

    // ----------------------------------------------------------
    // ۳. برندینگ
    // ----------------------------------------------------------
    const brandX = brand.nameX !== undefined ? brand.nameX : W / 2;
    const brandY = brand.nameY !== undefined ? brand.nameY : 280;
    const brandSize = brand.nameSize || 115;

    ctx.save();
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `800 ${brandSize}px Vazirmatn, system-ui`;
    ctx.fillStyle = '#ffffff';
    // درخشش نام برند با صدا نفس می‌کشد
    ctx.shadowColor = `rgba(190,240,255,${0.18 + mood * 0.4})`;
    ctx.shadowBlur = 22 + mood * 26;
    ctx.fillText(brand.name || 'اِما', brandX, brandY);
    ctx.restore();

    // شعارهای پویا
    const activeTag = (state.dynamicTags || []).find(
      t => time >= t.s && time < t.e && t.text.trim()
    );

    if (activeTag) {
      const transTime = 0.25;
      const pIn = Math.min(1, Math.max(0, (time - activeTag.s) / transTime));
      const pOut = Math.min(1, Math.max(0, (activeTag.e - time) / transTime));
      const alpha = Math.min(pIn, pOut);
      const ease = 1 - Math.pow(1 - alpha, 3);

      ctx.save();
      ctx.globalAlpha = ease;
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `600 ${activeTag.size || 34}px Vazirmatn, system-ui`;

      const posX = activeTag.x !== undefined ? activeTag.x : W / 2;
      const posY = activeTag.y !== undefined ? activeTag.y : 345;

      if (activeTag.anim === 'pop') {
        const scale = 0.75 + ease * 0.25;
        ctx.translate(posX, posY);
        ctx.scale(scale, scale);
        ctx.fillText(activeTag.text, 0, 0);
      } else if (activeTag.anim === 'slide') {
        ctx.fillText(activeTag.text, posX, posY + (1 - ease) * 22);
      } else {
        ctx.fillText(activeTag.text, posX, posY);
      }

      ctx.restore();

    } else if (brand.tag && (!state.dynamicTags || state.dynamicTags.length === 0)) {
      ctx.save();
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '400 34px Vazirmatn, system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(brand.tag, W / 2, 345);
      ctx.restore();
    }

    // ----------------------------------------------------------
    // ۴. ردیف‌های گفتگو: کارت + آواتار + موج صوتی
    // ----------------------------------------------------------
    const CYA = LAYOUT.laneAI;
    const CYH = LAYOUT.laneHU;
    const AVR = LAYOUT.avatarR;
    const AVX = LAYOUT.avatarX;

    const {
      startX: X0,
      barWidth: BW,
      barGap: GAP,
      barCount: N,
      maxHeight: MH
    } = CONFIG.layout.waveform;

    const totalWaveW = N * (BW + GAP) - GAP;

    const lanes = [
      {
        key: 'ai', y: CYA, label: 'اِما', e: ai,
        pks: peaks.ai, c: C.ai, bar: [255, 255, 255]
      },
      {
        key: 'hu', y: CYH, label: 'کاربر', e: hu,
        pks: peaks.hu, c: C.hu, bar: [255, 232, 210]
      }
    ];

    const progress = duration ? clamp01(time / duration) : 0;
    const currentBarIdx = progress * N;
    const scrX = X0 + progress * totalWaveW;

    for (const lane of lanes) {
      const e = lane.e;

      // کارت شیشه‌ای + موج‌های حلقوی
      drawLaneCard(ctx, W, lane, e, time);

      // خط تراز موج
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0, lane.y);
      ctx.lineTo(X0 + totalWaveW, lane.y);
      ctx.stroke();
      ctx.restore();

      // اکولایزر صوتی
      ctx.save();
      ctx.direction = 'ltr';

      for (let i = 0; i < N; i++) {
        const a = lane.pks && lane.pks[i] !== undefined ? lane.pks[i] : 0.08;
        const dist = Math.abs(i - currentBarIdx);

        const reactive = tracksLoaded[lane.key]
          ? e * MH * 0.6 * Math.exp(-(dist * dist) / 16)
          : 0;

        const h = Math.min(MH, Math.max(4, a * MH) + reactive);
        const played = !duration || i <= currentBarIdx;

        // میله‌های نزدیک نقطه‌ی پخش به رنگ گوینده می‌گروند
        const near = Math.exp(-(dist * dist) / 30) * e;
        const col = mix(lane.bar, lane.c, near * 0.8);

        ctx.fillStyle = rgba(col, played ? 1 : 0.3);

        ctx.beginPath();
        ctx.roundRect(X0 + i * (BW + GAP), lane.y - h, BW, h * 2, BW / 2);
        ctx.fill();
      }

      ctx.restore();

      // رشته‌ی نوری زنده روی موج
      drawVoiceThread(ctx, lane, X0, totalWaveW, scrX, MH, time, e);

      // آواتار + حلقه
      if (lane.key === 'ai') {
        drawAIAvatar(ctx, AVX, lane.y, AVR, time, levels.ai);
      } else {
        drawHumanAvatar(ctx, AVX, lane.y, AVR, time, levels.hu);
      }

      drawAvatarRing(ctx, lane, e, time);

      // نام گوینده
      ctx.save();
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = '700 26px Vazirmatn, system-ui';
      ctx.fillStyle = rgba(mix(C.white, lane.c, e * 0.8));
      ctx.fillText(lane.label, AVX, lane.y + AVR + 36);
      ctx.restore();
    }

    // ----------------------------------------------------------
    // ۵. اسکرابر زمان
    // ----------------------------------------------------------
    if (duration) {
      const top = CYA - LAYOUT.cardHalfH;
      const span = CYH - CYA + LAYOUT.cardHalfH * 2;

      ctx.save();
      const line = ctx.createLinearGradient(0, top, 0, top + span);
      line.addColorStop(0, 'rgba(255,255,255,0)');
      line.addColorStop(0.18, 'rgba(255,255,255,0.5)');
      line.addColorStop(0.82, 'rgba(255,255,255,0.5)');
      line.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = line;
      ctx.fillRect(scrX - 1, top, 2, span);
      ctx.restore();

      for (const lane of lanes) {
        if (!tracksLoaded[lane.key]) continue;

        ctx.save();

        ctx.globalCompositeOperation = 'screen';
        const gr = 22 + lane.e * 30;
        const glow = ctx.createRadialGradient(scrX, lane.y, 0, scrX, lane.y, gr);
        glow.addColorStop(0, rgba(lane.c, 0.45 + lane.e * 0.4));
        glow.addColorStop(1, rgba(lane.c, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(scrX, lane.y, gr, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = rgba(lane.c, 0.8);
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(scrX, lane.y, 11 + lane.e * 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(scrX, lane.y, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    // ----------------------------------------------------------
    // ۶. رویدادهای صوتی (ایموجی‌ها)
    // ----------------------------------------------------------
    if (audioEvents.length > 0) {
      const activeEvents = audioEvents.filter(
        ev => time >= ev.time && time < ev.time + 2.0
      );

      activeEvents.forEach(evt => {
        const age = time - evt.time;
        const ep = age / 2.0;

        ctx.save();
        ctx.globalAlpha = Math.sin(ep * Math.PI);
        ctx.font = '50px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (evt.type === 'overlap') {
          const scale = 1 + Math.sin(age * 15) * 0.25;
          ctx.translate(W / 2, (CYA + CYH) / 2);
          ctx.scale(scale, scale);
          ctx.fillText(evt.emoji, 0, 0);
        } else {
          const startY = (evt.speaker === 'ai' ? CYA : CYH) - AVR - 10;
          const floatY = startY - ep * 85;
          const driftX = Math.sin(age * 4) * 18;

          ctx.translate(AVX + driftX, floatY);
          if (evt.type === 'laugh') ctx.rotate(Math.sin(age * 5) * 0.2);
          ctx.fillText(evt.emoji, 0, 0);
        }

        ctx.restore();
      });
    }

    // ----------------------------------------------------------
    // ۷. زیرنویس‌ها
    // ----------------------------------------------------------
    const activeCue = cues.find(c => time >= c.s && time < c.e && c.tx.trim());

    if (activeCue) {
      const rel = time - activeCue.s;
      const a = clamp01(Math.min(rel / 0.18, (activeCue.e - time) / 0.18));
      const ease = 1 - Math.pow(1 - a, 3);

      const isAI = activeCue.k === 'ai';
      const acc = isAI ? C.ai : C.hu;
      const name = isAI ? 'اِما' : 'کاربر';
      const y0 = 1220;

      ctx.save();
      ctx.globalAlpha = ease;
      ctx.translate(0, (1 - ease) * 18);
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // نام گوینده با رنگ خودش و دو خط کوتاه کناری
      ctx.font = '700 30px Vazirmatn, system-ui';
      const nw = ctx.measureText(name).width;
      ctx.fillStyle = rgba(acc, 0.98);
      ctx.fillText(name, W / 2, y0);

      ctx.strokeStyle = rgba(acc, 0.7);
      ctx.fillStyle = rgba(acc, 0.9);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        const x1 = W / 2 + side * (nw / 2 + 18);
        const x2 = W / 2 + side * (nw / 2 + 66);
        ctx.beginPath();
        ctx.moveTo(x1, y0 - 11);
        ctx.lineTo(x2, y0 - 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W / 2 + side * (nw / 2 + 80), y0 - 11, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = '800 54px Vazirmatn, system-ui';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(2,45,80,0.5)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 4;

      const lines = helpers.wrapText(ctx, activeCue.tx, 900);
      lines.forEach((line, idx) => {
        ctx.fillText(line, W / 2, y0 + 82 + idx * 84);
      });

      ctx.restore();
    }

    // ----------------------------------------------------------
    // ۸. لوگو و متن فوتر
    // ----------------------------------------------------------
    const hasFooterText =
      state.footer && state.footer.text && state.footer.text.trim();

    if (images && images.logo) {
      const img = images.logo;
      const r = img.width / img.height;
      const w = Math.min(800, r * logoHeight);
      const logoBottomY = hasFooterText ? (state.footer.y - 45) : 1810;

      ctx.drawImage(img, W / 2 - w / 2, logoBottomY - w / r, w, w / r);
    }

    if (hasFooterText) {
      ctx.save();
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `600 ${state.footer.size || 32}px Vazirmatn, system-ui`;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.shadowColor = 'rgba(2,45,80,0.3)';
      ctx.shadowBlur = 14;
      ctx.fillText(state.footer.text, W / 2, state.footer.y || 1855);
      ctx.restore();
    }











// ─────────────────────────────────────────────────────────────
    // ۵.۵ رندر لیبل‌ها و نشانگرهای صوتی (تم مدرن سفید/مشکی با نقطه آبی)
    // ─────────────────────────────────────────────────────────────
    const labels = state.labels || [];
    if (labels.length > 0 && duration > 0) {
      const activeWindow = 4.5; // ۴.۵ ثانیه قبل تا ۴.۵ ثانیه بعد (مجموعاً ۹ ثانیه کامل فعال است)

      labels.forEach(lbl => {
        if (!lbl.text || !lbl.text.trim()) return;

        // محاسبه مختصات دقیق روی موج صدای هوش مصنوعی
        const progressX = Math.max(0, Math.min(1, lbl.time / duration));
        const pinX = X0 + progressX * totalWaveW;
        
        const waveBaseY = CYA;      // شروع خط از خط میانی موج صدا (۶۵۰)
        // خواندن ارتفاع دلخواه کاربر (یا پیش‌فرض ۵۱۰)
        const labelCenterY = (lbl.y !== undefined && lbl.y !== null) ? Number(lbl.y) : 510;

        // فاصله زمانی از ثانیه وقوع لیبل
        const diff = time - lbl.time;
        const isActive = Math.abs(diff) <= activeWindow;

        ctx.save();

        if (isActive) {
          // ==========================================
          // ۱. حالت فعال (خط مشکی، بک‌گراند مشکی، متن سفید، نقطه آبی و بزرگ‌تر)
          // ==========================================
          const p = 1 - (Math.abs(diff) / activeWindow);
          const ease = Math.sin(p * Math.PI * 0.5); // اوج نرم در ثانیه دقیق

          // الف) خط اتصال مشکی و ضخیم
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4.0;
          ctx.beginPath();
          ctx.moveTo(pinX, waveBaseY);
          ctx.lineTo(pinX, labelCenterY + 24);
          ctx.stroke();

          // ب) نقطه اتصال روی موج صدا (مشکی با حلقه راداری آبی)
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(pinX, waveBaseY, 6.5, 0, Math.PI * 2);
          ctx.fill();

          // پالس و رادار آبی دور نقطه
          const radar = (time * 1.6) % 1;
          ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - radar) * 0.85})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pinX, waveBaseY, 8 + radar * 25, 0, Math.PI * 2);
          ctx.stroke();

          // ج) کادر لیبل مشکی (۲۴٪ بزرگ‌تر)
          const scale = 1.0 + ease * 0.24;
          ctx.translate(pinX, labelCenterY);
          ctx.scale(scale, scale);

          ctx.font = '800 25px Vazirmatn, system-ui';
          const txtW = ctx.measureText(lbl.text).width;
          const dotRadius = 5.5;
          const dotGap = 12;
          const padX = 22;
          const boxW = txtW + dotRadius * 2 + dotGap + padX * 2;
          const boxH = 48;

          // پس‌زمینه کاملاً مشکی
          ctx.fillStyle = '#000000';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 24);
          ctx.fill();
          ctx.shadowBlur = 0;

          // نقطه لایو آبی چشمک‌زن (پالس آبی نئونی)
          const blink = (Math.sin(time * 6) + 1) / 2;
          const dotX = boxW / 2 - padX - dotRadius;
          
          // هاله درخشان دور نقطه آبی
          ctx.fillStyle = `rgba(56, 189, 248, ${0.35 + blink * 0.45})`;
          ctx.beginPath();
          ctx.arc(dotX, 0, dotRadius * 1.9, 0, Math.PI * 2);
          ctx.fill();

          // دایره اصلی آبی
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(dotX, 0, dotRadius, 0, Math.PI * 2);
          ctx.fill();

          // متن کاملاً سفید
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(lbl.text, dotX - dotRadius - dotGap, 0);

        } else {
          // ==========================================
          // ۲. حالت عادی (خط سفید، بک‌گراند سفید، متن مشکی، بدون نقطه لایو)
          // ==========================================
          // الف) خط اتصال سفید مشخص
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(pinX, waveBaseY);
          ctx.lineTo(pinX, labelCenterY + 20);
          ctx.stroke();

          // ب) نقطه روی موج صدا (سفید)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pinX, waveBaseY, 5, 0, Math.PI * 2);
          ctx.fill();

          // ج) کادر لیبل کاملاً سفید
          ctx.translate(pinX, labelCenterY);

          ctx.font = '700 24px Vazirmatn, system-ui';
          const txtW = ctx.measureText(lbl.text).width;
          const padX = 22;
          const boxW = txtW + padX * 2;
          const boxH = 44;

          // پس‌زمینه سفید با سایه ملایم برای عمق داشتن روی پس‌زمینه آبی
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0, 25, 55, 0.25)';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 22);
          ctx.fill();
          ctx.shadowBlur = 0;

          // متن کاملاً مشکی (دقیقاً در مرکز چون نقطه لایو ندارد)
          ctx.direction = 'rtl';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#000000';
          ctx.fillText(lbl.text, 0, 0);
        }

        ctx.restore();
      });
    }



    // ----------------------------------------------------------
    // ۹. نوار پیشرفت
    // ----------------------------------------------------------
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(0, H - 8, W, 8);

    if (duration) {
      const px = progress * W;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, H - 8, px, 8);

      ctx.globalCompositeOperation = 'screen';
      const head = ctx.createRadialGradient(px, H - 4, 0, px, H - 4, 26);
      head.addColorStop(0, `rgba(190,240,255,${0.55 + mood * 0.3})`);
      head.addColorStop(1, 'rgba(190,240,255,0)');
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.arc(px, H - 4, 26, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
};