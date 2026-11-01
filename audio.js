/**
 * audio.js
 * موتور پردازش صوت، تقویت ولوم با کمپرسور، آنالیز امواج و تشخیص هوشمند گفتار (VAD)
 */

import { CONFIG } from './config.js';

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.compressor = null; // برای جلوگیری از خش‌خش صدا در ولوم بالای ۱۰۰٪
    
    // مشخصات دو کانال صدا
    this.tracks = {
      ai: { buf: null, rawData: null, name: '', vol: CONFIG.audio.defaultAiVolume, gainNode: null, srcNode: null, env: null, peaks: null },
      hu: { buf: null, rawData: null, name: '', vol: CONFIG.audio.defaultHuVolume, gainNode: null, srcNode: null, env: null, peaks: null }
    };

    this.duration = 0;
    this.offset = 0;
    this.startAt = 0;
    this.playing = false;
  }

  // آماده‌سازی اولیه بستر صوتی مرورگر
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // ساخت کمپرسور داینامیک برای محافظت از کیفیت در ولوم‌های تقویت‌شده (تا ۳۰۰٪)
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-4, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
    this.compressor.connect(this.ctx.destination);

    // ایجاد گره‌های ولوم مجزا
    for (const key of ['ai', 'hu']) {
      const t = this.tracks[key];
      t.gainNode = this.ctx.createGain();
      t.gainNode.gain.setValueAtTime(t.vol, this.ctx.currentTime);
      t.gainNode.connect(this.compressor);
    }
  }

  // بارگذاری و دیکود فایل صوتی
  async loadTrack(speaker, arrayBuffer, fileName = '') {
    this.init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    // ذخیره کپی بافر خام
    this.tracks[speaker].rawData = arrayBuffer.slice(0);
    const audioBuf = await this.ctx.decodeAudioData(arrayBuffer);
    
    this.tracks[speaker].buf = audioBuf;
    this.tracks[speaker].name = fileName;

    // استخراج پاکت انرژی (Envelope) جهت انیمیشن لحظه‌ای
    this.analyzeEnvelope(speaker);

    // به‌روزرسانی طول کل مکالمه
    this.duration = Math.max(
      this.tracks.ai.buf ? this.tracks.ai.buf.duration : 0,
      this.tracks.hu.buf ? this.tracks.hu.buf.duration : 0
    );

    // محاسبه پیک‌های کلی برای کشیدن میله‌های موج ثابت
    this.computeStaticPeaks();


    return this.duration;
  }

  // تنظیم ولوم هر گوینده (بین 0 تا 3.0 برابر)
  setVolume(speaker, volumeValue) {
    this.init();
    const val = Math.max(CONFIG.audio.minVolume, Math.min(CONFIG.audio.maxVolume, volumeValue));
    this.tracks[speaker].vol = val;
    if (this.tracks[speaker].gainNode) {
      this.tracks[speaker].gainNode.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  // آنالیز ریاضی موج جهت تشخیص حرکت دهان و جهش امواج (Hop Size 60fps)
  analyzeEnvelope(speaker) {
    const t = this.tracks[speaker];
    const d = t.buf.getChannelData(0);
    const hop = (t.buf.sampleRate / CONFIG.audio.hopSize) | 0;
    const n = Math.ceil(d.length / hop);
    const raw = new Float32Array(n);
    let mx = 1e-5;

    for (let i = 0; i < n; i++) {
      let s = 0;
      const a = i * hop;
      const e = Math.min(d.length, a + hop);
      for (let j = a; j < e; j++) s += d[j] * d[j];
      raw[i] = Math.sqrt(s / Math.max(1, e - a));
      if (raw[i] > mx) mx = raw[i];
    }

    t.env = new Float32Array(n);
    let smooth = 0;
    for (let i = 0; i < n; i++) {
      smooth = Math.max(Math.pow(raw[i] / mx, 0.8), smooth * 0.84);
      t.env[i] = smooth;
    }
  }

  // ایجاد داده‌های ثابت میله‌های اکولایزر برای کل طول صدا
// درون audio.js:
// محاسبه پیک‌ها (با قابلیت زوم روی بازه برش‌خورده)
  computeStaticPeaks(startTime = 0, endTime = this.duration) {
    const N = CONFIG.layout.waveform.barCount;
    const dur = Math.max(0.1, endTime - startTime);

    for (const key of ['ai', 'hu']) {
      const t = this.tracks[key];
      if (!t.buf) { t.peaks = null; continue; }

      const d = t.buf.getChannelData(0);
      const sr = t.buf.sampleRate;
      const pk = new Float32Array(N);
      let mx = 1e-5;

      for (let i = 0; i < N; i++) {
        const sT = startTime + (i / N) * dur;
        const eT = startTime + ((i + 1) / N) * dur;
        const a = Math.floor(sT * sr);
        const b = Math.min(d.length, Math.floor(eT * sr));
        
        let m = 0;
        const step = Math.max(1, ((b - a) / 80) | 0);
        for (let j = a; j < b; j += step) {
          const val = Math.abs(d[j]);
          if (val > m) m = val;
        }
        pk[i] = m;
        if (m > mx) mx = m;
      }
      t.peaks = pk.map(v => Math.pow(v / mx, 0.75));
    }
  }

  // پخش صدا از ثانیه‌ای مشخص
  play(fromTime = 0) {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.stopSources();

    this.offset = Math.min(fromTime, this.duration);
    this.startAt = this.ctx.currentTime;

    for (const key of ['ai', 'hu']) {
      const t = this.tracks[key];
      if (!t.buf) continue;
      const src = this.ctx.createBufferSource();
      src.buffer = t.buf;
      src.connect(t.gainNode);
      if (this.offset < t.buf.duration) {
        src.start(0, this.offset);
      }
      t.srcNode = src;
    }
    this.playing = true;
  }

  // توقف پخش
  stop(resetToZero = false) {
    if (this.playing && !resetToZero) {
      this.offset = this.getCurrentTime();
    }
    if (resetToZero) this.offset = 0;
    this.playing = false;
    this.stopSources();
  }

  stopSources() {
    for (const key of ['ai', 'hu']) {
      const s = this.tracks[key].srcNode;
      if (s) {
        try { s.stop(); } catch (e) {}
        s.disconnect();
        this.tracks[key].srcNode = null;
      }
    }
  }

  // زمان فعلی دقیق پخش
  getCurrentTime() {
    if (!this.playing) return this.offset;
    const t = this.offset + (this.ctx.currentTime - this.startAt);
    return Math.min(this.duration, t);
  }

  // دریافت شدت انرژی صدا در زمان مشخص (جهت ضربان آواتارها)
  getLevel(speaker, time) {
    const e = this.tracks[speaker].env;
    if (!e) return 0;
    const idx = Math.min(e.length - 1, Math.max(0, (time * CONFIG.audio.hopSize) | 0));
    return e[idx] || 0;
  }

  // 🪄 الگوریتم تشخیص هوشمند گفتار (VAD) جهت تولید خودکار زیرنویس‌ها
  // 🪄 الگوریتم ارتقایافته تشخیص هوشمند سکانس‌های گفتار (Adaptive VAD)
  detectSpeechSequences() {
    if (!this.duration) return [];
    const cues = [];
    const HOP = CONFIG.audio.hopSize; // 60 فریم در ثانیه

    for (const speaker of ['ai', 'hu']) {
      const t = this.tracks[speaker];
      const env = t.env;
      if (!env || !t.buf) continue;

      // ۱. محاسبه بالاترین قله انرژی صدا جهت تنظیم آستانه متغیر
      let maxEnv = 0;
      for (let i = 0; i < env.length; i++) {
        if (env[i] > maxEnv) maxEnv = env[i];
      }
      if (maxEnv < 0.02) continue; // صدایی در این لاین نیست

      // آستانه هوشمند: ۲۰٪ اوج صدا (سازگار با صداهای کم‌جان و بلند)
      const startThresh = Math.max(0.035, maxEnv * 0.18);
      const stopThresh = startThresh * 0.55;

      let inSpeech = false;
      let speechStart = 0;
      let silenceStart = 0;
      const maxSilenceBridge = 0.38; // ادغام مکث‌های کوتاه زیر ۳۸۰ میلی‌ثانیه بین کلمات
      const maxSegmentDuration = 4.2; // حداکثر طول هر خط زیرنویس برای خوانایی بهتر در ریلز

      let segments = [];

      for (let i = 0; i < env.length; i++) {
        const val = env[i];
        const curTime = i / HOP;

        if (!inSpeech) {
          if (val >= startThresh) {
            inSpeech = true;
            speechStart = curTime;
            silenceStart = 0;
          }
        } else {
          // در حین صحبت
          if (val < stopThresh) {
            if (silenceStart === 0) silenceStart = curTime;
            // اگر سکوت طولانی شد یا جمله خیلی طولانی گشت
            if ((curTime - silenceStart >= maxSilenceBridge) || (curTime - speechStart >= maxSegmentDuration)) {
              const segEnd = silenceStart > 0 ? silenceStart : curTime;
              if (segEnd - speechStart >= 0.35) { // حذف نویز و کلیک‌های زیر ۳۵۰ میلی‌ثانیه
                segments.push({
                  start: Math.max(0, speechStart - 0.06), // پدینگ ظریف شروع
                  end: Math.min(this.duration, segEnd + 0.1)  // پدینگ ظریف پایان
                });
              }
              inSpeech = false;
              silenceStart = 0;
            }
          } else {
            silenceStart = 0;
            // تقطیع هوشمند در صورت پیوستگی بیش از حد صحبت
            if (curTime - speechStart >= maxSegmentDuration) {
              segments.push({
                start: Math.max(0, speechStart - 0.06),
                end: curTime
              });
              speechStart = curTime;
            }
          }
        }
      }

      // اضافه کردن آخرین جمله باقی‌مانده
      if (inSpeech && (env.length / HOP - speechStart >= 0.35)) {
        segments.push({
          start: Math.max(0, speechStart - 0.06),
          end: Math.min(this.duration, env.length / HOP)
        });
      }

      // افزودن به لیست نهایی زیرنویس‌ها
      segments.forEach(seg => {
        cues.push({
          k: speaker,
          s: Math.round(seg.start * 10) / 10,
          e: Math.round(seg.end * 10) / 10,
          tx: speaker === 'ai' ? '[پاسخ هوش مصنوعی]' : '[صحبت کاربر]'
        });
      });
    }

    // مرتب‌سازی زمانی سکانس‌ها
    cues.sort((a, b) => a.s - b.s);

    // رفع تداخل‌های احتمالی بین ثانیه پایان و شروع دو گوینده
    for (let i = 0; i < cues.length - 1; i++) {
      if (cues[i].e > cues[i + 1].s) {
        cues[i].e = Math.max(cues[i].s + 0.3, cues[i + 1].s - 0.05);
        cues[i].e = Math.round(cues[i].e * 10) / 10;
      }
    }

    return cues;
  }




  // رندر صوتی آفلاین بسیار سریع و باکیفیت برای خروجی نهایی MP4
// رندر صوتی آفلاین (با قابلیت برش ثانیه‌های مشخص)
// رندر صوتی آفلاین چندبخشی (برش و چسباندن دقیق چندین بازه زمانی)
  async mixOffline(rangesOrStart = 0, maybeEnd = this.duration, sampleRate = 48000) {
    let ranges = [];
    let sr = sampleRate;

    if (Array.isArray(rangesOrStart)) {
      ranges = rangesOrStart;
      sr = maybeEnd || 48000;
    } else {
      ranges = [{ s: rangesOrStart, e: maybeEnd }];
    }

    // محاسبه طول کل تمام قطعات چسبیده‌شده
    let totalLen = 0;
    ranges.forEach(r => {
      const dur = Math.max(0, r.e - r.s);
      totalLen += dur;
    });
    totalLen = Math.max(0.1, totalLen);

    const oc = new OfflineAudioContext(1, Math.ceil(totalLen * sr), sr);
    const comp = oc.createDynamicsCompressor();
    comp.threshold.value = -4;
    comp.ratio.value = 6;
    comp.connect(oc.destination);

    for (const key of ['ai', 'hu']) {
      const t = this.tracks[key];
      if (!t.buf) continue;

      let outOffset = 0;
      for (const r of ranges) {
        const segDur = Math.max(0, r.e - r.s);
        if (segDur <= 0) continue;

        if (r.s < t.buf.duration) {
          const src = oc.createBufferSource();
          const g = oc.createGain();
          g.gain.value = t.vol;
          src.buffer = t.buf;
          src.connect(g);
          g.connect(comp);

          const sliceDur = Math.min(segDur, Math.max(0, t.buf.duration - r.s));
          src.start(outOffset, r.s, sliceDur);
        }
        outOffset += segDur;
      }
    }
    return oc.startRendering();
  }
   }