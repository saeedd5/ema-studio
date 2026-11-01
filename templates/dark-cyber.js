/**
 * templates/ema-temp.js
 * تمپلیت اختصاصی استودیوی اِما
 * نسخه ۴: موجودیت دیجیتال واکنش‌گرا، آواتار انسانی و فضای شب سینمایی
 */
import { CONFIG } from '../config.js';

const FX = {
  nodes: 18,
  linkDist: 340,
  linkAlpha: 0.14,
  dotAlpha: 0.5,
  orbit: 90,
  ribbonY: [470, 1130],
  ribbonAlpha: 0.14,
  ripples: true
};

const rnd = (i, k) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

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

function drawLiveBackground(ctx, W, H, time, level) {
  ctx.save();
  ctx.lineCap = 'round';

  FX.ribbonY.forEach((baseY, bi) => {
    const dir = bi % 2 === 0 ? 1 : -1;
    const amp = 14 + level * 14;

    const ribbons = [
      {
        amp,
        freq: 0.0062,
        speed: 0.75 * dir,
        phase: bi * 1.7,
        alpha: FX.ribbonAlpha,
        lw: 2.2
      },
      {
        amp: amp * 0.7,
        freq: 0.0094,
        speed: -0.55 * dir,
        phase: 2.1 + bi * 1.1,
        alpha: FX.ribbonAlpha * 0.55,
        lw: 1.5
      }
    ];

    const yAt = (x, r) =>
      baseY +
      Math.sin(x * r.freq + time * r.speed + r.phase) * r.amp +
      Math.sin(
        x * r.freq * 0.43 -
        time * r.speed * 0.6 +
        r.phase * 2
      ) * r.amp * 0.5;

    for (const r of ribbons) {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${r.alpha})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');

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

    const t = (time * 70 + bi * 430) % (W + 160);
    const gx = dir > 0 ? t - 80 : W + 80 - t;
    const edge = Math.sin(
      Math.PI * Math.min(1, Math.max(0, gx / W))
    );
    const gy = yAt(gx, ribbons[0]);

    ctx.fillStyle = `rgba(255,255,255,${0.12 * edge})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,255,255,${0.85 * edge})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  const nodes = getNodes(W, H);

  const pos = nodes.map(n => ({
    x: n.ax + Math.sin(time * n.sx + n.ph) * n.rx,
    y: n.ay + Math.cos(time * n.sy + n.ph * 1.3) * n.ry
  }));

  ctx.lineWidth = 1.2;

  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const d = Math.hypot(
        pos[i].x - pos[j].x,
        pos[i].y - pos[j].y
      );

      if (d >= FX.linkDist) continue;

      const a =
        FX.linkAlpha *
        (1 - d / FX.linkDist) *
        (0.8 + level * 0.6);

      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.moveTo(pos[i].x, pos[i].y);
      ctx.lineTo(pos[j].x, pos[j].y);
      ctx.stroke();
    }
  }

  nodes.forEach((n, i) => {
    const p = pos[i];
    const twinkle = 0.7 + 0.3 * Math.sin(time * 1.2 + n.ph);

    ctx.fillStyle = `rgba(255,255,255,${FX.dotAlpha * twinkle})`;
    ctx.beginPath();
    ctx.arc(
      p.x,
      p.y,
      n.r * (1 + level * 0.25),
      0,
      Math.PI * 2
    );
    ctx.fill();

    if (n.pulse) {
      const k = (time * 0.25 + n.ph / (Math.PI * 2)) % 1;

      ctx.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.22})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.r + k * 38, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  ctx.restore();
}


/**
 * پس‌زمینه‌ی شبانه‌ی سینمایی اِما
 * رنگ آبی سازمانی #0a91d5 در هاله‌ها و نورهای محیطی حفظ شده است؛
 * اما سطح اصلی تصویر به آبی نفتی/سرمه‌ای عمیق تغییر می‌کند.
 */
function drawNightBackground(ctx, W, H, time, level) {
  ctx.save();

  // پایه‌ی شب: گرادیان عمیق با ته‌رنگ آبی برند
  const base = ctx.createLinearGradient(0, 0, W * 0.18, H);
  base.addColorStop(0, '#041321');
  base.addColorStop(0.28, '#06253b');
  base.addColorStop(0.58, '#07314a');
  base.addColorStop(0.82, '#061f34');
  base.addColorStop(1, '#020d18');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // ابرهای نور آبی برند؛ آهسته حرکت می‌کنند و با صدا اندکی جان می‌گیرند.
  ctx.globalCompositeOperation = 'screen';
  const blooms = [
    {
      x: W * (0.28 + Math.sin(time * 0.16) * 0.055),
      y: H * (0.24 + Math.cos(time * 0.13) * 0.035),
      r: H * 0.47,
      a: 0.19 + level * 0.045
    },
    {
      x: W * (0.78 + Math.cos(time * 0.12) * 0.045),
      y: H * (0.72 + Math.sin(time * 0.15) * 0.04),
      r: H * 0.53,
      a: 0.135 + level * 0.035
    },
    {
      x: W * 0.52,
      y: H * 0.49,
      r: H * 0.72,
      a: 0.045
    }
  ];

  for (const bloom of blooms) {
    const glow = ctx.createRadialGradient(
      bloom.x, bloom.y, 0,
      bloom.x, bloom.y, bloom.r
    );
    glow.addColorStop(0, `rgba(10,145,213,${bloom.a})`);
    glow.addColorStop(0.42, `rgba(7,104,164,${bloom.a * 0.48})`);
    glow.addColorStop(1, 'rgba(5,70,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // ستون‌های نور بسیار محو؛ حس عمق و فضای استودیویی ایجاد می‌کنند.
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const x = W * (0.08 + i * 0.145) + Math.sin(time * 0.11 + i * 1.4) * 24;
    const width = 24 + (i % 3) * 13;
    const beam = ctx.createLinearGradient(x, 0, x + 35, H * 0.72);
    beam.addColorStop(0, 'rgba(72,190,245,0)');
    beam.addColorStop(0.34, `rgba(45,164,220,${0.018 + level * 0.008})`);
    beam.addColorStop(1, 'rgba(25,110,170,0)');
    ctx.strokeStyle = beam;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(
      x - 25, H * 0.23,
      x + 45, H * 0.46,
      x + 20 + Math.sin(time * 0.09 + i) * 28, H * 0.72
    );
    ctx.stroke();
  }
  ctx.restore();

  // غبار نورانی بسیار ظریف؛ موقعیت‌ها قطعی‌اند تا فریم‌ها نلرزند.
  for (let i = 0; i < 38; i++) {
    const px = rnd(i, 21) * W;
    const drift = (time * (3 + rnd(i, 22) * 5) + rnd(i, 23) * H) % H;
    const py = drift;
    const twinkle = 0.28 + 0.42 * (0.5 + 0.5 * Math.sin(time * (0.7 + rnd(i, 24)) + i));
    const radius = 0.7 + rnd(i, 25) * 1.15;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = i % 5 === 0 ? '#bceeff' : '#5dbce8';
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // وینیت سینمایی: گوشه‌ها عمیق‌تر می‌شوند بدون آن‌که هویت آبی حذف شود.
  ctx.globalCompositeOperation = 'source-over';
  const vignette = ctx.createRadialGradient(
    W * 0.5, H * 0.46, Math.min(W, H) * 0.18,
    W * 0.5, H * 0.46, Math.max(W, H) * 0.77
  );
  vignette.addColorStop(0, 'rgba(0,5,14,0)');
  vignette.addColorStop(0.68, 'rgba(0,7,17,0.12)');
  vignette.addColorStop(1, 'rgba(0,4,12,0.66)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

// ============================================================
// توابع آواتارهای متحرک و نورپردازی
// ============================================================

const clamp01 = value => {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(0, Math.min(1, n))
    : 0;
};

function voiceEnergy(value) {
  const level = clamp01(value);
  const normalized = clamp01((level - 0.025) / 0.42);

  return normalized * normalized * (3 - 2 * normalized);
}

function drawVoiceAtmosphere(ctx, W, H, time, levels) {
  const ai = voiceEnergy(levels?.ai);
  const human = voiceEnergy(levels?.hu);

  if (ai < 0.005 && human < 0.005) return;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  if (ai > 0.005) {
    const driftX = Math.sin(time * 0.42) * W * 0.08;
    const centerX = W * 0.5 + driftX;
    const centerY = -H * 0.055;
    const radius = H * 0.68;
    const alpha = 0.15 * ai;

    const topGlow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    topGlow.addColorStop(0, `rgba(190,250,255,${alpha})`);
    topGlow.addColorStop(0.34, `rgba(120,225,255,${alpha * 0.62})`);
    topGlow.addColorStop(0.72, `rgba(100,205,255,${alpha * 0.18})`);
    topGlow.addColorStop(1, 'rgba(100,205,255,0)');

    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.lineCap = 'round';

    for (let i = 0; i < 5; i++) {
      const x =
        W * (0.12 + i * 0.19) +
        Math.sin(time * 0.32 + i * 1.7) * 24;

      const endX = x + Math.sin(time * 0.22 + i) * 70;

      const ray = ctx.createLinearGradient(
        x, 0, endX, H * 0.48
      );

      ray.addColorStop(0, `rgba(205,250,255,${0.035 * ai})`);
      ray.addColorStop(1, 'rgba(205,250,255,0)');

      ctx.strokeStyle = ray;
      ctx.lineWidth = 18 + i * 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(
        x + (endX - x) * 0.35,
        H * 0.2,
        endX,
        H * 0.48
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  if (human > 0.005) {
    const driftX = Math.cos(time * 0.37) * W * 0.075;
    const centerX = W * 0.52 + driftX;
    const centerY = H * 1.045;
    const radius = H * 0.66;
    const alpha = 0.14 * human;

    const bottomGlow = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius
    );

    bottomGlow.addColorStop(0, `rgba(255,211,225,${alpha})`);
    bottomGlow.addColorStop(0.36, `rgba(255,167,204,${alpha * 0.55})`);
    bottomGlow.addColorStop(0.74, `rgba(221,160,255,${alpha * 0.16})`);
    bottomGlow.addColorStop(1, 'rgba(221,160,255,0)');

    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.lineCap = 'round';

    for (let i = 0; i < 5; i++) {
      const x =
        W * (0.1 + i * 0.2) +
        Math.cos(time * 0.29 + i * 1.4) * 22;

      const endX = x + Math.cos(time * 0.2 + i) * 65;

      const ray = ctx.createLinearGradient(
        x, H, endX, H * 0.53
      );

      ray.addColorStop(0, `rgba(255,211,229,${0.032 * human})`);
      ray.addColorStop(1, 'rgba(255,211,229,0)');

      ctx.strokeStyle = ray;
      ctx.lineWidth = 19 + i * 3;
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.quadraticCurveTo(
        x + (endX - x) * 0.35,
        H * 0.79,
        endX,
        H * 0.53
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}
function drawAIEntity(ctx, x, y, radius, time, rawLevel) {
  const energy = voiceEnergy(rawLevel);
  const idleBreath = Math.sin(time * 1.72) * 0.018;
  const voicePulse = energy * (0.035 + 0.045 * (0.5 + 0.5 * Math.sin(time * 12.8)));
  const size = radius * (1 + idleBreath + voicePulse);
  const floatY = Math.sin(time * 1.28) * 1.8;

  ctx.save();
  ctx.translate(x, y + floatY);
  ctx.globalCompositeOperation = 'screen';

  // هاله‌ی چندلایه‌ی موجودیت زنده
  const halo = ctx.createRadialGradient(0, 0, size * 0.12, 0, 0, size * 1.42);
  halo.addColorStop(0, `rgba(226,254,255,${0.19 + energy * 0.2})`);
  halo.addColorStop(0.34, `rgba(90,219,255,${0.15 + energy * 0.14})`);
  halo.addColorStop(0.68, `rgba(10,145,213,${0.075 + energy * 0.075})`);
  halo.addColorStop(1, 'rgba(10,145,213,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, size * 1.42, 0, Math.PI * 2);
  ctx.fill();

  // حلقه‌ی انرژی محیطی با ضربان وابسته به صدای اِما
  ctx.save();
  ctx.rotate(time * 0.12);
  for (let i = 0; i < 44; i++) {
    const angle = (i / 44) * Math.PI * 2;
    const pulse = 0.5 + 0.5 * Math.sin(time * 5.6 - i * 0.42);
    const inner = size * (1.04 + pulse * 0.025);
    const outer = inner + size * (0.025 + energy * 0.055 + pulse * 0.018);
    const x1 = Math.cos(angle) * inner;
    const y1 = Math.sin(angle) * inner;
    const x2 = Math.cos(angle) * outer;
    const y2 = Math.sin(angle) * outer;
    ctx.strokeStyle = i % 4 === 0
      ? `rgba(226,251,255,${0.3 + energy * 0.42})`
      : `rgba(77,198,243,${0.12 + energy * 0.24})`;
    ctx.lineWidth = i % 4 === 0 ? 1.8 : 1.0;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  // سه مدار نامتقارن؛ حس یک موجودیت دیجیتال، نه تصویر ثابت یا آواتار انسانی
  for (let i = 0; i < 3; i++) {
    ctx.save();
    const direction = i === 1 ? -1 : 1;
    ctx.rotate(time * (0.34 + i * 0.075) * direction + i * 0.92);
    ctx.beginPath();
    ctx.ellipse(
      0, 0,
      size * (0.79 + i * 0.105),
      size * (0.31 + i * 0.055),
      i * 0.2,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = i === 1
      ? `rgba(231,253,255,${0.2 + energy * 0.28})`
      : `rgba(87,207,249,${0.17 + energy * 0.22})`;
    ctx.lineWidth = i === 1 ? 1.7 : 1.15;
    ctx.stroke();

    const dotAngle = time * (i % 2 === 0 ? 1.08 : -0.86) + i * 2.05;
    const dotX = Math.cos(dotAngle) * size * (0.79 + i * 0.105);
    const dotY = Math.sin(dotAngle) * size * (0.31 + i * 0.055);
    ctx.shadowColor = '#8deaff';
    ctx.shadowBlur = 10 + energy * 8;
    ctx.fillStyle = 'rgba(239,254,255,0.96)';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 1.7 + energy * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // رشته‌های زنده/شاخک‌های نرم که با صدا باز و بسته می‌شوند.
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + time * 0.16;
    const inner = size * 0.42;
    const wave = Math.sin(time * 2.05 + i * 1.47);
    const outer = size * (0.76 + wave * 0.055 + energy * 0.085);
    const sx = Math.cos(angle) * inner;
    const sy = Math.sin(angle) * inner;
    const bend = Math.sin(time * 1.55 + i * 1.2) * size * (0.11 + energy * 0.035);
    const ex = Math.cos(angle + wave * 0.1) * outer;
    const ey = Math.sin(angle + wave * 0.1) * outer;

    const tendril = ctx.createLinearGradient(sx, sy, ex, ey);
    tendril.addColorStop(0, `rgba(233,254,255,${0.5 + energy * 0.28})`);
    tendril.addColorStop(0.55, `rgba(104,220,255,${0.3 + energy * 0.28})`);
    tendril.addColorStop(1, 'rgba(104,220,255,0.04)');
    ctx.strokeStyle = tendril;
    ctx.lineWidth = 1.05 + energy * 0.9;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.48) * (inner + outer) * 0.5 + bend,
      Math.sin(angle + 0.48) * (inner + outer) * 0.5 - bend,
      ex,
      ey
    );
    ctx.stroke();

    ctx.fillStyle = `rgba(223,252,255,${0.54 + energy * 0.38})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 1.35 + energy * 1.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // پوسته‌ی ارگانیک؛ تغییر شکل آن با سطح صدا هماهنگ است.
  ctx.save();
  ctx.shadowColor = energy > 0.08 ? '#a7f3ff' : '#58cfff';
  ctx.shadowBlur = 13 + energy * 22;
  ctx.beginPath();
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const organic =
      1 +
      Math.sin(angle * 3 + time * 1.65) * (0.052 + energy * 0.018) +
      Math.sin(angle * 5 - time * 1.18) * 0.026 +
      Math.cos(angle * 2 + time * 2.0) * 0.018 +
      Math.sin(angle * 7 + time * 0.8) * 0.009;
    const r = size * 0.56 * organic;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r * 0.94;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const core = ctx.createRadialGradient(
    -size * 0.18, -size * 0.22, size * 0.02,
    size * 0.02, size * 0.02, size * 0.7
  );
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.18, '#e8fdff');
  core.addColorStop(0.43, '#a0edff');
  core.addColorStop(0.72, '#4fc4f0');
  core.addColorStop(1, 'rgba(38,139,204,0.52)');
  ctx.fillStyle = core;
  ctx.fill();
  ctx.lineWidth = 1.45;
  ctx.strokeStyle = `rgba(239,255,255,${0.76 + energy * 0.2})`;
  ctx.stroke();
  ctx.restore();

  // چهره‌ی بسیار مینیمال و غیرانسانی: چشم‌های نورانی و دهان واکنش‌گرا
  const faceGlow = ctx.createRadialGradient(0, -size * 0.08, 1, 0, 0, size * 0.35);
  faceGlow.addColorStop(0, 'rgba(255,255,255,0.42)');
  faceGlow.addColorStop(0.5, 'rgba(179,244,255,0.18)');
  faceGlow.addColorStop(1, 'rgba(120,225,255,0)');
  ctx.fillStyle = faceGlow;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.34, 0, Math.PI * 2);
  ctx.fill();

  const eyeY = -size * 0.075;
  for (const side of [-1, 1]) {
    const eyeX = side * size * 0.135;
    ctx.save();
    ctx.shadowColor = '#e6fcff';
    ctx.shadowBlur = 8 + energy * 7;
    ctx.fillStyle = 'rgba(246,255,255,0.97)';
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, size * 0.047, size * 0.057, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#168ab9';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY + size * 0.006, size * 0.026, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#06263d';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY + size * 0.006, size * 0.014, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX - size * 0.008, eyeY - size * 0.012, size * 0.008, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const mouthOpen = size * (0.012 + energy * (0.025 + 0.018 * (0.5 + 0.5 * Math.sin(time * 15))));
  ctx.strokeStyle = `rgba(12,92,135,${0.55 + energy * 0.2})`;
  ctx.lineWidth = 1.35 + energy * 0.75;
  ctx.beginPath();
  ctx.moveTo(-size * 0.075, size * 0.105);
  ctx.quadraticCurveTo(0, size * (0.105 + mouthOpen), size * 0.075, size * 0.105);
  ctx.stroke();

  // هسته‌ی نورانی مرکزی و ذراتی که در مدار موجودیت حرکت می‌کنند.
  const nucleus = ctx.createRadialGradient(
    -size * 0.055, -size * 0.09, 1,
    0, 0, size * 0.31
  );
  nucleus.addColorStop(0, 'rgba(255,255,255,0.35)');
  nucleus.addColorStop(0.42, 'rgba(205,248,255,0.13)');
  nucleus.addColorStop(1, 'rgba(120,225,255,0)');
  ctx.fillStyle = nucleus;
  ctx.beginPath();
  ctx.arc(0, 0, size * (0.3 + energy * 0.035), 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 12; i++) {
    const angle = time * (0.24 + (i % 4) * 0.055) + i * (Math.PI * 2 / 12);
    const orbit = size * (0.94 + (i % 3) * 0.075);
    const px = Math.cos(angle) * orbit;
    const py = Math.sin(angle * 1.06) * orbit * 0.78;
    const twinkle = 0.38 + 0.52 * (0.5 + 0.5 * Math.sin(time * 2.8 + i * 1.8));
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = i % 4 === 0 ? '#ffffff' : '#a8efff';
    ctx.beginPath();
    ctx.arc(px, py, 1.05 + (i % 3) * 0.38 + energy * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHumanAvatar(ctx, x, y, radius, time, rawLevel) {
  const energy = voiceEnergy(rawLevel);
  const breath = Math.sin(time * 1.55) * 1.7;
  const nod = Math.sin(time * 4.7) * energy * 1.45;
  const blinkPhase = (time + 1.35) % 5.8;
  const blink = Math.max(0, 1 - Math.abs(blinkPhase - 0.12) / 0.12);
  const eyeOpen = Math.max(0.12, 1 - blink * 0.9);
  const headTilt = Math.sin(time * 0.62) * 0.018 + Math.sin(time * 2.4) * energy * 0.012;

  ctx.save();
  ctx.translate(x, y + Math.sin(time * 1.12) * 1.15);

  // قاب شیشه‌ای تیره، هماهنگ با فضای شب
  const bg = ctx.createRadialGradient(
    -radius * 0.28, -radius * 0.38, 2,
    0, 0, radius * 1.14
  );
  bg.addColorStop(0, 'rgba(211,242,255,0.28)');
  bg.addColorStop(0.5, 'rgba(25,83,121,0.54)');
  bg.addColorStop(1, 'rgba(4,27,48,0.9)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
  ctx.fill();

  // هاله‌ی گرم و متفاوت برای لحظه‌ی صحبت کاربر
  const warmGlow = ctx.createRadialGradient(
    0, radius * 0.1, 2,
    0, 0, radius * 1.08
  );
  warmGlow.addColorStop(0, `rgba(255,178,207,${0.07 + energy * 0.22})`);
  warmGlow.addColorStop(0.55, `rgba(184,140,255,${0.025 + energy * 0.075})`);
  warmGlow.addColorStop(1, 'rgba(184,140,255,0)');
  ctx.fillStyle = warmGlow;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // شانه‌ها و لباس با حرکت تنفس آرام
  ctx.save();
  ctx.translate(0, breath * 0.34);
  ctx.beginPath();
  ctx.moveTo(-radius * 0.73, radius * 0.79);
  ctx.quadraticCurveTo(-radius * 0.65, radius * 0.28, -radius * 0.25, radius * 0.22);
  ctx.lineTo(radius * 0.25, radius * 0.22);
  ctx.quadraticCurveTo(radius * 0.65, radius * 0.28, radius * 0.73, radius * 0.79);
  ctx.closePath();
  const shirt = ctx.createLinearGradient(-radius * 0.5, 0, radius * 0.5, radius);
  shirt.addColorStop(0, '#b9deef');
  shirt.addColorStop(0.48, '#f5fbff');
  shirt.addColorStop(1, '#83b9d6');
  ctx.fillStyle = shirt;
  ctx.fill();
  ctx.restore();

  // گردن
  ctx.fillStyle = '#dba992';
  ctx.beginPath();
  ctx.roundRect(-radius * 0.145, radius * 0.08, radius * 0.29, radius * 0.34, radius * 0.09);
  ctx.fill();

  // سر با چرخش بسیار محدود، پلک‌زدن و تکان طبیعی هنگام صحبت
  ctx.save();
  ctx.translate(0, -radius * 0.12 + nod);
  ctx.rotate(headTilt);

  const skin = ctx.createLinearGradient(
    -radius * 0.38, -radius * 0.55,
    radius * 0.35, radius * 0.5
  );
  skin.addColorStop(0, '#ffe3d4');
  skin.addColorStop(0.58, '#f1c4ae');
  skin.addColorStop(1, '#d39a83');

  // گوش‌ها
  ctx.fillStyle = '#dfad97';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.34, -radius * 0.02, radius * 0.085, radius * 0.13, 0, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.34, -radius * 0.02, radius * 0.085, radius * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // صورت
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.31, radius * 0.405, 0, 0, Math.PI * 2);
  ctx.fill();

  // مو
  ctx.fillStyle = '#102e49';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.33, -radius * 0.08);
  ctx.quadraticCurveTo(-radius * 0.37, -radius * 0.53, -radius * 0.02, -radius * 0.54);
  ctx.quadraticCurveTo(radius * 0.34, -radius * 0.54, radius * 0.34, -radius * 0.08);
  ctx.quadraticCurveTo(radius * 0.2, -radius * 0.24, radius * 0.04, -radius * 0.28);
  ctx.quadraticCurveTo(-radius * 0.12, -radius * 0.13, -radius * 0.33, -radius * 0.08);
  ctx.closePath();
  ctx.fill();

  // ابروها
  ctx.strokeStyle = 'rgba(75,55,54,0.76)';
  ctx.lineWidth = 1.55;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-radius * 0.2, -radius * 0.09);
  ctx.quadraticCurveTo(-radius * 0.13, -radius * 0.13, -radius * 0.075, -radius * 0.09);
  ctx.moveTo(radius * 0.075, -radius * 0.09);
  ctx.quadraticCurveTo(radius * 0.13, -radius * 0.13, radius * 0.2, -radius * 0.09);
  ctx.stroke();

  // چشم‌ها؛ پلک‌زدن کوتاه و نرم
  ctx.fillStyle = '#24465c';
  ctx.beginPath();
  ctx.ellipse(-radius * 0.135, -radius * 0.035, 1.75, 1.9 * eyeOpen, 0, 0, Math.PI * 2);
  ctx.ellipse(radius * 0.135, -radius * 0.035, 1.75, 1.9 * eyeOpen, 0, 0, Math.PI * 2);
  ctx.fill();

  // لبخند/حرکت دهان بر اساس انرژی صدای کاربر
  const mouthOpen = 1.1 + energy * (2.7 + 1.8 * (0.5 + 0.5 * Math.sin(time * 13)));
  ctx.fillStyle = `rgba(145,73,77,${0.28 + energy * 0.3})`;
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.13, radius * 0.07, mouthOpen, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,87,84,0.74)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, radius * 0.12, radius * 0.085, 0.18, Math.PI - 0.18);
  ctx.stroke();

  ctx.restore();

  // حلقه‌ی بیرونی با رنگ گرم مختص آواتار انسان
  ctx.strokeStyle = `rgba(255,196,220,${0.5 + energy * 0.42})`;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
  ctx.stroke();

  // هایلایت نقطه‌ای قاب شیشه‌ای
  ctx.strokeStyle = `rgba(220,242,255,${0.16 + energy * 0.16})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, -Math.PI * 0.86, -Math.PI * 0.24);
  ctx.stroke();

  ctx.restore();
}

export default {
  id: 'ema-temp',
  name: '۱. اِما سینماتیک شب (آبی #0a91d5 | موجودیت دیجیتال زنده)',

  renderScene(ctx, {
    width: W,
    height: H,
    time,
    state,
    helpers
  }) {
    const {
      levels,
      brand,
      images,
      cues,
      duration,
      tracksLoaded,
      peaks,
      logoHeight,
      audioEvents
    } = state;

    ctx.globalAlpha = 1.0;
    ctx.direction = 'ltr';
    ctx.textAlign = 'center';

    // ۱. پس‌زمینه‌ی شبانه‌ی سینمایی؛ تون آبی سازمانی اِما حفظ شده است.
    const totalLevel = (clamp01(levels?.ai) + clamp01(levels?.hu)) * 0.5;
    drawNightBackground(ctx, W, H, time, totalLevel);

    // ۲. نور جهت‌دار صدا: صدای اِما از بالا و صدای کاربر از پایین وارد فضا می‌شود.
    drawVoiceAtmosphere(ctx, W, H, time, levels);

    // ۳. شبکه و نوارهای محیطی قبلی حفظ شده‌اند.
    drawLiveBackground(ctx, W, H, time, totalLevel);

    // فیلد سفارشی ۱
    if (
      state.customField1 &&
      state.customField1.text &&
      state.customField1.text.trim()
    ) {
      const cf1 = state.customField1;

      ctx.save();
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${cf1.size || 38}px Vazirmatn, system-ui`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,25,55,0.4)';
      ctx.shadowBlur = 14;

      ctx.fillText(
        cf1.text,
        cf1.x ?? (W / 2),
        cf1.y ?? 440
      );

      ctx.restore();
    }

    // فیلد سفارشی ۲
    if (
      state.customField2 &&
      state.customField2.text &&
      state.customField2.text.trim()
    ) {
      const cf2 = state.customField2;
      const text = cf2.text.trim();
      const fontSize = cf2.size || 28;
      const posX = cf2.x ?? (W / 2);
      const posY = cf2.y ?? 510;

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
      const radius = badgeH / 2;

      ctx.beginPath();
      ctx.roundRect(boxX, boxY, badgeW, badgeH, radius);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const blink = (Math.sin(time * 5.5) + 1) / 2;
      const dotX = boxX + badgeW - padX - dotR;
      const dotY = posY;

      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239,68,68,${blink * 0.45})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(239,68,68,${0.45 + blink * 0.55})`;
      ctx.fill();

      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,25,55,0.3)';
      ctx.shadowBlur = 10;

      ctx.fillText(
        text,
        dotX - dotR - gap,
        posY
      );

      ctx.restore();
    }

    // ۳. برندینگ
    const brandX =
      state.brand.nameX !== undefined
        ? state.brand.nameX
        : W / 2;

    const brandY =
      state.brand.nameY !== undefined
        ? state.brand.nameY
        : 280;

    const brandSize = state.brand.nameSize || 115;

    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.font = `800 ${brandSize}px Vazirmatn, system-ui`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,25,55,0.2)';
    ctx.shadowBlur = 20;

    ctx.fillText(
      brand.name || 'اِما',
      brandX,
      brandY
    );

    ctx.shadowBlur = 0;

    // شعارهای پویا
    const activeTag = (state.dynamicTags || []).find(
      t => time >= t.s && time < t.e && t.text.trim()
    );

    if (activeTag) {
      const transTime = 0.25;

      const pIn = Math.min(
        1,
        Math.max(0, (time - activeTag.s) / transTime)
      );

      const pOut = Math.min(
        1,
        Math.max(0, (activeTag.e - time) / transTime)
      );

      const alpha = Math.min(pIn, pOut);
      const ease = 1 - Math.pow(1 - alpha, 3);

      ctx.save();
      ctx.globalAlpha = ease;
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = `600 ${activeTag.size || 34}px Vazirmatn, system-ui`;

      const posX =
        activeTag.x !== undefined
          ? activeTag.x
          : W / 2;

      const posY =
        activeTag.y !== undefined
          ? activeTag.y
          : 345;

      if (activeTag.anim === 'pop') {
        const scale = 0.75 + ease * 0.25;

        ctx.translate(posX, posY);
        ctx.scale(scale, scale);
        ctx.fillText(activeTag.text, 0, 0);

      } else if (activeTag.anim === 'slide') {
        const offsetY = (1 - ease) * 22;

        ctx.fillText(
          activeTag.text,
          posX,
          posY + offsetY
        );

      } else {
        ctx.fillText(activeTag.text, posX, posY);
      }

      ctx.restore();

    } else if (
      brand.tag &&
      (!state.dynamicTags || state.dynamicTags.length === 0)
    ) {
      ctx.font = '400 34px Vazirmatn, system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(brand.tag, W / 2, 345);
    }

    // ==========================================================
    // ۴. آواتارها و موج‌های صوتی
    // ==========================================================

    const CYA = 650;
    const CYH = 920;
    const AVR = 74;
    const AVX = 150;

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
        key: 'ai',
        y: CYA,
        label: 'اِما',
        level: levels.ai,
        pks: peaks.ai
      },
      {
        key: 'hu',
        y: CYH,
        label: 'کاربر',
        level: levels.hu,
        pks: peaks.hu
      }
    ];

    const progress = duration
      ? Math.min(1, Math.max(0, time / duration))
      : 0;

    const currentBarIdx = progress * N;

    for (const lane of lanes) {

      // آواتار هوش مصنوعی و انسان
      if (lane.key === 'ai') {
        drawAIEntity(
          ctx,
          AVX,
          lane.y,
          AVR,
          time,
          lane.level
        );
      } else {
        drawHumanAvatar(
          ctx,
          AVX,
          lane.y,
          AVR,
          time,
          lane.level
        );
      }

      // حلقه بیرونی
      ctx.save();

      ctx.strokeStyle = lane.key === 'ai'
        ? `rgba(190,247,255,${0.58 + voiceEnergy(lane.level) * 0.38})`
        : `rgba(255,211,226,${0.55 + voiceEnergy(lane.level) * 0.4})`;

      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(AVX, lane.y, AVR + 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha =
        0.18 + voiceEnergy(lane.level) * 0.68;

      ctx.strokeStyle =
        lane.key === 'ai' ? '#b8f5ff' : '#ffd0e1';

      ctx.lineWidth = 2.5;
      ctx.beginPath();

      ctx.arc(
        AVX,
        lane.y,
        AVR + 12 + voiceEnergy(lane.level) * 18,
        0,
        Math.PI * 2
      );

      ctx.stroke();
      ctx.restore();

      // ریپل صوتی
      if (FX.ripples) {
        ctx.save();
        ctx.lineWidth = 2;

        ctx.strokeStyle =
          lane.key === 'ai'
            ? 'rgba(190,247,255,0.9)'
            : 'rgba(255,203,222,0.9)';

        for (let k = 0; k < 2; k++) {
          const p = ((time / 2.6) + k * 0.5) % 1;

          ctx.globalAlpha =
            (1 - p) *
            (1 - p) *
            0.4 *
            voiceEnergy(lane.level);

          ctx.beginPath();

          ctx.arc(
            AVX,
            lane.y,
            AVR + 14 + p * 62,
            0,
            Math.PI * 2
          );

          ctx.stroke();
        }

        ctx.restore();
      }

      // نام گوینده
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.font = '700 26px Vazirmatn, system-ui';
      ctx.fillStyle = '#ffffff';

      ctx.fillText(
        lane.label,
        AVX,
        lane.y + AVR + 36
      );

      // خط تراز موج
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X0, lane.y);
      ctx.lineTo(X0 + totalWaveW, lane.y);
      ctx.stroke();

      // اکولایزر صوتی
      ctx.direction = 'ltr';

      for (let i = 0; i < N; i++) {
        const a = lane.pks ? lane.pks[i] : 0.08;
        const dist = Math.abs(i - currentBarIdx);

        const reactive = tracksLoaded[lane.key]
          ? lane.level * MH * 0.5 * Math.exp(-dist * dist / 16)
          : 0;

        const h = Math.min(
          MH,
          Math.max(4, a * MH) + reactive
        );

        ctx.globalAlpha =
          (!duration || i <= currentBarIdx) ? 1.0 : 0.35;

        ctx.fillStyle = '#ffffff';

        const xPos = X0 + i * (BW + GAP);

        ctx.beginPath();

        ctx.roundRect(
          xPos,
          lane.y - h,
          BW,
          h * 2,
          4
        );

        ctx.fill();
      }

      ctx.globalAlpha = 1.0;

      // جداکننده
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, lane.y + 115);
      ctx.lineTo(1000, lane.y + 115);
      ctx.stroke();
    }

    // ۵. اسکرابر زمان
    if (duration) {
      const scrX = X0 + progress * totalWaveW;

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.45;

      ctx.fillRect(
        scrX - 1,
        CYA - 85,
        2,
        CYH - CYA + 170
      );

      ctx.globalAlpha = 1.0;

      for (const lane of lanes) {
        if (!tracksLoaded[lane.key]) continue;

        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.25 + lane.level * 0.45;

        ctx.beginPath();
        ctx.arc(
          scrX,
          lane.y,
          15 + lane.level * 18,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.globalAlpha = 1.0;

        ctx.beginPath();
        ctx.arc(scrX, lane.y, 6.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ۶. رویدادهای صوتی
    if (audioEvents && audioEvents.length > 0) {
      const activeEvents = audioEvents.filter(
        e => time >= e.time && time < e.time + 2.0
      );

      activeEvents.forEach(evt => {
        const age = time - evt.time;
        const ep = age / 2.0;

        ctx.save();
        ctx.globalAlpha = Math.sin(ep * Math.PI);
        ctx.font = '50px system-ui';

        if (evt.type === 'overlap') {
          const scale = 1 + Math.sin(age * 15) * 0.25;

          ctx.translate(
            W / 2,
            (CYA + CYH) / 2
          );

          ctx.scale(scale, scale);
          ctx.fillText(evt.emoji, 0, 0);

        } else {
          const startY =
            (evt.speaker === 'ai' ? CYA : CYH) - AVR - 10;

          const floatY = startY - ep * 85;
          const driftX = Math.sin(age * 4) * 18;

          ctx.translate(AVX + driftX, floatY);

          if (evt.type === 'laugh') {
            ctx.rotate(Math.sin(age * 5) * 0.2);
          }

          ctx.fillText(evt.emoji, 0, 0);
        }

        ctx.restore();
      });
    }

    // ۷. زیرنویس‌ها
    const activeCue = cues.find(
      c => time >= c.s && time < c.e && c.tx.trim()
    );

    if (activeCue) {
      const rel = time - activeCue.s;

      const a = Math.max(
        0,
        Math.min(
          1,
          rel / 0.18,
          (activeCue.e - time) / 0.18
        )
      );

      const ease = 1 - Math.pow(1 - a, 3);

      ctx.save();
      ctx.globalAlpha = ease;
      ctx.translate(0, (1 - ease) * 18);
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      const subStartY = 1220;

      ctx.font = '700 30px Vazirmatn, system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';

      const speakerName =
        activeCue.k === 'ai' ? '• اِما •' : '• کاربر •';

      ctx.fillText(speakerName, W / 2, subStartY);

      ctx.font = '800 54px Vazirmatn, system-ui';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,25,55,0.45)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 4;

      const lines = helpers.wrapText(
        ctx,
        activeCue.tx,
        900
      );

      lines.forEach((line, idx) => {
        ctx.fillText(
          line,
          W / 2,
          subStartY + 82 + idx * 84
        );
      });

      ctx.restore();
    }

    // ۸. لوگوی فوتر
    if (images.logo) {
      const img = images.logo;
      const r = img.width / img.height;
      const w = Math.min(800, r * logoHeight);

      const hasFooterText =
        state.footer &&
        state.footer.text &&
        state.footer.text.trim();

      const logoBottomY = hasFooterText
        ? (state.footer.y - 45)
        : 1810;

      ctx.drawImage(
        img,
        W / 2 - w / 2,
        logoBottomY - w / r,
        w,
        w / r
      );
    }

    // متن فوتر
    if (
      state.footer &&
      state.footer.text &&
      state.footer.text.trim()
    ) {
      ctx.save();
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';

      ctx.font =
        `600 ${state.footer.size || 32}px Vazirmatn, system-ui`;

      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.shadowColor = 'rgba(0,25,55,0.3)';
      ctx.shadowBlur = 14;

      ctx.fillText(
        state.footer.text,
        W / 2,
        state.footer.y || 1855
      );

      ctx.restore();
    }

    // ۹. نوار پیشرفت
    ctx.fillStyle = '#ffffff';

    ctx.fillRect(
      0,
      H - 8,
      duration ? Math.min(1, time / duration) * W : 0,
      8
    );
  }
};