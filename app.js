/**
 * app.js
 * کنترلر مرکزی استودیوی ویدیوی اِما (نسخه سبک، تمیز و پایدار)
 */

import { CONFIG } from './config.js';
import { Storage } from './storage.js';
import { AudioManager } from './audio.js';
import { VideoRenderer } from './renderer.js';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// --- توابع کمکی سراسری ---
function round1(n) {
  return Math.round((n || 0) * 10) / 10;
}

// function fmtTime(s) {
//   s = Math.max(0, s | 0);
//   return String((s / 60) | 0).padStart(2, '0') + ':' + String((s % 60) | 0).padStart(2, '0');
// }
// -------------------------

const audio = new AudioManager();
const canvas = $('#cv');
const renderer = new VideoRenderer(canvas);
let previewUntil = null; // برای جلوگیری از ارور رفرنس در اسکرابر و اکسپورت
const state = {
  brand: { 
    name: 'اِما', 
    tag: 'دستیار صوتی و هوشمند هوش مصنوعی',
    nameSize: 115,
    nameX: 540,
    nameY: 280
  },
  footer: {
    text: '',
    size: 32,
    y: 1855
  },
  // بازه خروجی: فقط زمان شروع/پایان را تعیین می‌کند و به امواج صدا کاری ندارد
// سیستم برش و چسباندن چند بازه
  range: { enabled: false, start: 0, end: 0 }, // حفظ برای سازگاری عقب‌رو
  rangeEnabled: false,
  ranges: [], // آرایه‌ای از { s: شروع, e: پایان }  customField1: { text: '', size: 38, x: 540, y: 440 },
  customField2: { text: '', size: 28, x: 540, y: 510 },
  images: { ai: null, hu: null, logo: null },
  imageNames: { ai: '', hu: '', logo: '' },
  logoHeight: 160,
  cues: [],
  emojis: [],
  dynamicTags: [],
  labels: [],
  templateId: 'ema-temp',
  projectDirHandle: null,
  isExporting: false,
  tracksLoaded: { ai: false, hu: false }
};

let loadedTemplates = {};
let cueRows = [];
let lastActiveCue = -2;

/* ==========================================================================
   ۱. راه‌اندازی و بارگذاری اولیه (Initialization)
   ========================================================================== */

async function init() {
  // ۱. پر کردن سلکتور تمپلیت‌ها
const tmplSelect = $('#templateSelect');
  if (tmplSelect) {
    tmplSelect.innerHTML = '';
    CONFIG.availableTemplates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      tmplSelect.appendChild(opt);
    });
  }

  // ۲. بارگذاری تمپلیت اصلی
  await switchTemplate(CONFIG.availableTemplates[0].id);

  // ۳. بازیابی تنظیمات متنی
  restoreSettings();

  // ۴. بازیابی فایل‌های سنگین صوتی و تصویری از دیتابیس
  await restoreMediaAssets();

  // ۵. اجرای لوپ رندر Canvas
  requestAnimationFrame(loop);
}

async function switchTemplate(templateId) {
  state.templateId = templateId;
  const tmplSelect = $('#templateSelect');
  if (tmplSelect) tmplSelect.value = templateId;

  const tmplInfo = CONFIG.availableTemplates.find(t => t.id === templateId);

  // به‌روزرسانی بج نشان‌دهنده قالب فعال در UI
  const badge = $('#currentTemplateBadge');
  if (badge && tmplInfo) {
    badge.textContent = tmplInfo.name.split('(')[0].trim();
  }

  try {
    if (!loadedTemplates[templateId]) {
      if (tmplInfo) {
        const module = await import(tmplInfo.file);
        loadedTemplates[templateId] = module.default;
      }
    }
    renderer.setTemplate(loadedTemplates[templateId]);
  } catch (err) {
    console.error('خطا در بارگذاری فایل قالب:', err);
  }

  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
}

function getSavableSettings() {
  return {
    brand: state.brand,
    footer: state.footer,
    templateId: state.templateId,
    logoHeight: state.logoHeight,
    volAi: audio.tracks.ai.vol,
    volHu: audio.tracks.hu.vol,
     customField1: state.customField1, // اضافه شد
    customField2: state.customField2, // اضافه شد
    cues: state.cues,
    emojis: state.emojis,
    dynamicTags: state.dynamicTags,
    labels: state.labels,
    range: state.range,
    rangeEnabled: state.rangeEnabled,
    ranges: state.ranges

  };
}

async function restoreSettings() {
  const saved = Storage.getSetting('emma_master_state_v2') || Storage.getSetting(CONFIG.storageKeys.settings);
  if (!saved) return;

  // ۱. بازیابی برند
  if (saved.brand) {
    state.brand = { ...state.brand, ...saved.brand };
    $('#bn').value = state.brand.name || '';
    $('#bt').value = state.brand.tag || '';
    $('#bnSize').value = state.brand.nameSize ?? 115;
    $('#bnX').value = state.brand.nameX ?? 540;
    $('#bnY').value = state.brand.nameY ?? 280;
  }

  // ۲. بازیابی متن فوتر و آدرس سایت/پیج
  if (saved.footer) {
    state.footer = { ...state.footer, ...saved.footer };
    $('#ftText').value = state.footer.text || '';
    $('#ftSize').value = state.footer.size ?? 32;
    $('#ftY').value = state.footer.y ?? 1855;
  }

  // ۳. اندازه لوگو
  if (saved.logoHeight) {
    state.logoHeight = saved.logoHeight;
    $('#ls').value = state.logoHeight;
    $('#lsVal').textContent = `${state.logoHeight}px`;
  }

  // ۴. ولوم‌ها
  if (saved.volAi !== undefined) {
    audio.setVolume('ai', saved.volAi);
    $('#volAi').value = saved.volAi;
    $('#volValAi').textContent = `${Math.round(saved.volAi * 100)}٪`;
  }

  if (saved.volHu !== undefined) {
    audio.setVolume('hu', saved.volHu);
    $('#volHu').value = saved.volHu;
    $('#volValHu').textContent = `${Math.round(saved.volHu * 100)}٪`;
  }

  // ۵. تمپلیت
  if (saved.templateId) {
    switchTemplate(saved.templateId);
  }

  // ۶. زیرنویس‌ها، ایموجی‌ها و شعارهای پویا
  if (saved.cues && Array.isArray(saved.cues)) {
    state.cues = saved.cues;
    renderCuesUI();
  }

  if (saved.emojis && Array.isArray(saved.emojis)) {
    state.emojis = saved.emojis;
    renderEmojisUI();
  }

  if (saved.dynamicTags && Array.isArray(saved.dynamicTags)) {
    state.dynamicTags = saved.dynamicTags;
    renderDynamicTagsUI();
  }

  // بازیابی بازه خروجی
  // بازیابی چند بازه زمانی
  if (saved.ranges && Array.isArray(saved.ranges) && saved.ranges.length > 0) {
    state.ranges = saved.ranges;
    state.rangeEnabled = !!saved.rangeEnabled;
  } else if (saved.range && saved.range.enabled) {
    // تبدیل تنظیمات تک‌بازه‌ای قدیم به سیستم جدید
    state.ranges = [{ s: saved.range.start || 0, e: saved.range.end || 0 }];
    state.rangeEnabled = true;
  }
  const chk = $('#rangeEnable');
  if (chk) chk.checked = state.rangeEnabled;
  const ctl = $('#rangeControls');
  if (ctl) ctl.style.display = state.rangeEnabled ? 'block' : 'none';
  renderRangesUI();

  // ۷. بازیابی پوشه پروژه ذخیره‌شده
  try {
    const savedDirHandle = await Storage.getHandle('project_dir_handle');
    if (savedDirHandle) {
      // بررسی دسترسی خواندن/نوشتن در مک
      const perm = await savedDirHandle.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        state.projectDirHandle = savedDirHandle;
        $('#folderPathHint').textContent = `پوشه متصل است: ${savedDirHandle.name} ✓`;
        $('#folderPathHint').style.color = '#34d399';
      } else {
        $('#folderPathHint').textContent = `پوشه قبلی: ${saved.dirName || 'projects'} (جهت تایید کلیک کنید)`;
      }
    }
  } catch (e) {
    console.warn('عدم بازیابی پوشه پروژه:', e);
  }


// بازیابی فیلدهای سفارشی جدید
  if (saved.customField1) {
    state.customField1 = { ...state.customField1, ...saved.customField1 };
    if ($('#cf1Text')) $('#cf1Text').value = state.customField1.text || '';
    if ($('#cf1Size')) $('#cf1Size').value = state.customField1.size ?? 38;
    if ($('#cf1X')) $('#cf1X').value = state.customField1.x ?? 540;
    if ($('#cf1Y')) $('#cf1Y').value = state.customField1.y ?? 440;
  }

  if (saved.customField2) {
    state.customField2 = { ...state.customField2, ...saved.customField2 };
    if ($('#cf2Text')) $('#cf2Text').value = state.customField2.text || '';
    if ($('#cf2Size')) $('#cf2Size').value = state.customField2.size ?? 28;
    if ($('#cf2X')) $('#cf2X').value = state.customField2.x ?? 540;
    if ($('#cf2Y')) $('#cf2Y').value = state.customField2.y ?? 510;
  }




  if (saved.labels && Array.isArray(saved.labels)) {
    state.labels = saved.labels;
    renderLabelsUI();
  }


}




async function bufferToImage(arrayBuffer, mimeType) {
  const blob = new Blob([arrayBuffer], { type: mimeType || 'image/png' });
  try {
    return await createImageBitmap(blob);
  } catch (e) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }
}

async function restoreMediaAssets() {
  try {
    for (const key of ['ai', 'hu']) {
      const media = await Storage.getMedia(`${key}_audio`);
      if (media && media.buffer) {
        await audio.loadTrack(key, media.buffer, media.name);
        state.tracksLoaded[key] = true;
        $(`#sm${key === 'ai' ? 'Ai' : 'Hu'}`).textContent = media.name || 'فایل بازیابی‌شده';
      }
    }

    for (const key of ['ai', 'hu', 'logo']) {
      const media = await Storage.getMedia(`img_${key}`);
      if (media && media.buffer) {
        state.images[key] = await bufferToImage(media.buffer, media.type);
        $(`#nm-${key}`).textContent = media.name || 'تصویر بازیابی‌شده';
      }
    }

    updatePlayButtons();
  } catch (e) {
    console.warn('خطا در بازیابی مدیا:', e);
  }
}

function updatePlayButtons() {
  const hasAudio = audio.duration > 0;
  if ($('#play')) $('#play').disabled = !hasAudio;
  if ($('#exp')) $('#exp').disabled = !hasAudio;
  if (hasAudio) {
    if (state.rangeEnabled && state.ranges.length > 0) {
      const total = getTotalRangesDuration();
      $('#st').textContent = `آماده رندر ${state.ranges.length} قطعه منتخب — مجموع: ${total.toFixed(1)} ثانیه`;
    } else {
      $('#st').textContent = `آماده رندر: ۱۰۸۰×۱۹۲۰ (مدت زمان: ${fmtTime(audio.duration)})`;
    }
  }
  // هماهنگ‌سازی بازه‌ها با طول فایل صوتی جدید
  renderRangesUI();
}

// تعریف مستعار برای سازگاری عقب‌رو و جلوگیری از هرگونه ارور احتمالی
function syncRangeFromState() {
  renderRangesUI();
}

/* ==========================================================================
   ۲. مدیریت فایل‌های صوتی، عکس‌ها و ولوم‌ها
   ========================================================================== */

$$('input[type=file][data-k]').forEach(inp => {
  const speaker = inp.dataset.k;

  const handleAudio = async file => {
    if (!file) return;
    try {
      $(`#sm${speaker === 'ai' ? 'Ai' : 'Hu'}`).textContent = 'در حال پردازش...';
      
      const buffer = await file.arrayBuffer();
      // کلون برای ذخیره امن در دیتابیس
      const bufferCopy = buffer.slice(0);

      await audio.loadTrack(speaker, buffer, file.name);
      await Storage.saveMedia(`${speaker}_audio`, bufferCopy, file.name);

      state.tracksLoaded[speaker] = true;
      $(`#sm${speaker === 'ai' ? 'Ai' : 'Hu'}`).textContent = file.name;
      updatePlayButtons();
    } catch (err) {
      console.error('Audio Load Error:', err);
      alert('خطا در پردازش فایل صوتی: ' + (err.message || ''));
      $(`#sm${speaker === 'ai' ? 'Ai' : 'Hu'}`).textContent = 'خطا در بارگذاری';
    }
  };

  inp.addEventListener('change', () => handleAudio(inp.files[0]));

  const slot = inp.closest('.slot');
  ['dragenter', 'dragover'].forEach(e => slot.addEventListener(e, ev => { ev.preventDefault(); slot.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(e => slot.addEventListener(e, ev => { ev.preventDefault(); slot.classList.remove('drag'); }));
  slot.addEventListener('drop', ev => {
    ev.preventDefault();
    slot.classList.remove('drag');
    handleAudio(ev.dataTransfer.files[0]);
  });
});

$$('input[data-i]').forEach(inp => {
  const key = inp.dataset.i;
  inp.addEventListener('change', async () => {
    const file = inp.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      await Storage.saveMedia(`img_${key}`, buffer, file.name);
      state.images[key] = await bufferToImage(buffer, file.type);
      $(`#nm-${key}`).textContent = file.name;
    } catch (e) {
      $(`#nm-${key}`).textContent = 'خطا در بارگذاری تصویر';
    }
  });
});

$('#volAi').oninput = e => {
  const val = +e.target.value;
  audio.setVolume('ai', val);
  $('#volValAi').textContent = `${Math.round(val * 100)}٪`;
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
};

$('#volHu').oninput = e => {
  const val = +e.target.value;
  audio.setVolume('hu', val);
  $('#volValHu').textContent = `${Math.round(val * 100)}٪`;
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
};

// به جای خط قبلی، این شرط ایمن را قرار دهید:
const tmplDropdown = $('#templateSelect');
if (tmplDropdown) {
  tmplDropdown.onchange = async (e) => {
    await switchTemplate(e.target.value);
  };
}

$('#bn').oninput = e => {
  state.brand.name = e.target.value;
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
};

$('#bt').oninput = e => {
  state.brand.tag = e.target.value;
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
};

$('#ls').oninput = e => {
  state.logoHeight = +e.target.value;
  $('#lsVal').textContent = `${state.logoHeight}px`;
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
};

/* ==========================================================================
   ۳. مدیریت زیرنویس‌ها
   ========================================================================== */

function renderCuesUI() {
  const box = $('#cues');
  box.innerHTML = '';
  state.cues.forEach((c, idx) => {
    const r = document.createElement('div');
    r.className = `cue ${c.k}`;
    r.innerHTML = `
      <select aria-label="گوینده"><option value="ai">AI</option><option value="hu">انسان</option></select>
      <input type="number" step="0.1" min="0" value="${c.s}" title="شروع">
      <input type="number" step="0.1" min="0" value="${c.e}" title="پایان">
      <input type="text" class="tx" value="${c.tx.replace(/"/g, '&quot;')}" placeholder="متن زیرنویس...">
      <button class="btn-del" title="حذف">×</button>
    `;

    const [sel, s, e, tx, del] = r.children;
    sel.value = c.k;
    sel.onchange = () => { c.k = sel.value; r.className = `cue ${c.k}`; persistCues(); };
    s.oninput = () => { c.s = +s.value || 0; persistCues(); };
    e.oninput = () => { c.e = +e.value || 0; persistCues(); };
    tx.oninput = () => { c.tx = tx.value; persistCues(); };
    del.onclick = () => { state.cues.splice(idx, 1); renderCuesUI(); persistCues(); };

    box.append(r);
  });
  cueRows = [...box.children];
  lastActiveCue = -2;
}

function persistCues() {
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
}

$('#addCue').onclick = () => {
  const t = Math.round(audio.getCurrentTime() * 10) / 10;
  const last = state.cues[state.cues.length - 1];
  state.cues.push({
    k: last && last.k === 'ai' ? 'hu' : 'ai',
    tx: '',
    s: t,
    e: Math.round((t + 2.5) * 10) / 10
  });
  renderCuesUI();
  persistCues();
  cueRows[cueRows.length - 1]?.querySelector('.tx')?.focus();
};

$('#clearCues').onclick = () => {
  if (confirm('آیا تمام خطوط زیرنویس پاک شوند؟')) {
    state.cues = [];
    renderCuesUI();
    persistCues();
  }
};


// اتصال دکمه تشخیص هوشمند سکانس‌ها
$('#autoVad').onclick = () => {
  if (!audio.duration) {
    alert('ابتدا فایل‌های صوتی AI یا انسان را بارگذاری کنید.');
    return;
  }

  const detected = audio.detectSpeechSequences();
  if (detected.length === 0) {
    alert('صدایی برای تقطیع در فایل‌ها پیدا نشد. سطح ولوم را بررسی کنید.');
    return;
  }

  state.cues = detected;
  renderCuesUI();
  persistCues();

  alert(`تشخیص هوشمند انجام شد: ${detected.length} سکانس با زمان‌بندی دقیق ریلز تقطیع شد.`);
};









/* ==========================================================================
   مدیریت زیرتیترها و شعارهای پویای زمان‌بندی‌شده (Dynamic Taglines)
   ========================================================================== */

function renderDynamicTagsUI() {
  const box = $('#dynamicTagsList');
  box.innerHTML = '';
  state.dynamicTags.forEach((tag, idx) => {
    const r = document.createElement('div');
    r.className = 'cue ai';
    r.style.gridTemplateColumns = '1fr 65px 65px 55px 60px 60px 85px 30px';
    r.style.gap = '5px';
    r.innerHTML = `
      <input type="text" class="tx" value="${tag.text.replace(/"/g, '&quot;')}" placeholder="متن شعار..." title="متن">
      <input type="number" step="0.1" min="0" value="${tag.s}" title="شروع (ثانیه)">
      <input type="number" step="0.1" min="0" value="${tag.e}" title="پایان (ثانیه)">
      <input type="number" min="16" max="90" value="${tag.size}" title="سایز فونت">
      <input type="number" value="${tag.x}" title="موقعیت افقی X (وسط: ۵۴۰)">
      <input type="number" value="${tag.y}" title="موقعیت عمودی Y (پیش‌فرض: ۳۴۵)">
      <select title="انیمیشن ورود و خروج">
        <option value="slide">اسلاید (نرم)</option>
        <option value="pop">جهش (Pop)</option>
        <option value="fade">محو (Fade)</option>
      </select>
      <button class="btn-del" title="حذف">×</button>
    `;

    const [tx, s, e, size, x, y, anim, del] = r.children;
    anim.value = tag.anim || 'slide';

    tx.oninput = () => { tag.text = tx.value; persistDynamicTags(); };
    s.oninput = () => { tag.s = +s.value || 0; persistDynamicTags(); };
    e.oninput = () => { tag.e = +e.value || 0; persistDynamicTags(); };
    size.oninput = () => { tag.size = +size.value || 34; persistDynamicTags(); };
    x.oninput = () => { tag.x = +x.value || 540; persistDynamicTags(); };
    y.oninput = () => { tag.y = +y.value || 345; persistDynamicTags(); };
    anim.onchange = () => { tag.anim = anim.value; persistDynamicTags(); };
    del.onclick = () => { state.dynamicTags.splice(idx, 1); renderDynamicTagsUI(); persistDynamicTags(); };

    box.append(r);
  });
}

function persistDynamicTags() {
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
}

const addDynamicBtn = $('#addDynamicTagBtn');
if (addDynamicBtn) {
  addDynamicBtn.onclick = () => {
    const curTime = Math.round(audio.getCurrentTime() * 10) / 10;
    state.dynamicTags.push({
      text: 'شعار یا پیام متغیر شما...',
      s: curTime,
      e: Math.round((curTime + 3.0) * 10) / 10,
      size: 34,
      x: 540,
      y: 345,
      anim: 'slide'
    });
    renderDynamicTagsUI();
    persistDynamicTags();
  };
}



/* ==========================================================================
   سینک آنی و زنده (Live Sync) تمام کادرها و اسلایدرها با بوم ویدیو
   ========================================================================== */

function numField(selector, fallback) {
  const el = $(selector);
  if (!el) return fallback;
  const raw = String(el.value).trim();
  if (raw === '') return fallback;
  const v = Number(raw);
  return Number.isFinite(v) ? v : fallback;
}

function syncLiveInputsToCanvas() {
  // ۱. سینک آنی نام برند، سایز و مختصات
  if ($('#bn')) state.brand.name = $('#bn').value;
  if ($('#bt')) state.brand.tag = $('#bt').value;
  if ($('#bnSize')) state.brand.nameSize = +$('#bnSize').value || 115;
  if ($('#bnX')) state.brand.nameX = +$('#bnX').value || 540;
  if ($('#bnY')) state.brand.nameY = +$('#bnY').value || 280;

  // ۲. سینک آنی متن فوتر، سایز و ارتفاع Y
  if ($('#ftText')) state.footer.text = $('#ftText').value;
  if ($('#ftSize')) state.footer.size = +$('#ftSize').value || 32;
  if ($('#ftY')) state.footer.y = +$('#ftY').value || 1855;

  // ۳. سینک اندازه لوگو
  if ($('#ls')) {
    state.logoHeight = +$('#ls').value || 160;
    if ($('#lsVal')) $('#lsVal').textContent = `${state.logoHeight}px`;
  }


    // سینک آنی فیلدهای سفارشی جدید
  if ($('#cf1Text')) state.customField1.text = $('#cf1Text').value;
  state.customField1.size = numField('#cf1Size', 38);
  state.customField1.x = numField('#cf1X', 540);
  state.customField1.y = numField('#cf1Y', 440);

  if ($('#cf2Text')) state.customField2.text = $('#cf2Text').value;
  state.customField2.size = numField('#cf2Size', 28);
  state.customField2.x = numField('#cf2X', 540);
  state.customField2.y = numField('#cf2Y', 510);



}

// این ایونت جادویی باعث می‌شود هر کلیدی در هر کادری فشرده شد، در همان میلی‌ثانیه ویدیو آپدیت شود
document.addEventListener('input', syncLiveInputsToCanvas);
/* ==========================================================================
   تابع جامع ذخیره تمام داده‌ها، آدرس‌ها، اسلایدرها و موقعیت‌ها
   ========================================================================== */

async function saveAllState(showFeedback = true) {
  // ۱. جمع‌آوری آخرین مقادیر تمام فیلدهای صفحه
  state.brand.name = $('#bn').value;
  state.brand.tag = $('#bt').value;
  state.brand.nameSize = +$('#bnSize').value || 115;
  state.brand.nameX = +$('#bnX').value || 540;
  state.brand.nameY = +$('#bnY').value || 280;

  state.footer.text = $('#ftText').value;
  state.footer.size = +$('#ftSize').value || 32;
  state.footer.y = +$('#ftY').value || 1855;

  state.logoHeight = +$('#ls').value || 160;
  state.templateId = $('#templateSelect')?.value || state.templateId;

  // ۲. بسته‌بندی کامل تنظیمات
  const fullBundle = {
    brand: state.brand,
    footer: state.footer,
    templateId: state.templateId,
    logoHeight: state.logoHeight,
    volAi: +$('#volAi').value || 1.0,
    volHu: +$('#volHu').value || 1.8,
     customField1: state.customField1, // اضافه شد
    customField2: state.customField2, // اضافه شد
    cues: state.cues,
    emojis: state.emojis,
    dynamicTags: state.dynamicTags,
    dirName: state.projectDirHandle ? state.projectDirHandle.name : null
  };

  // ۳. ذخیره تمام تنظیمات متنی در LocalStorage
  Storage.saveSetting('emma_master_state_v2', fullBundle);

  // ۴. ذخیره هندل پوشه پروژه در دیتابیس
  if (state.projectDirHandle) {
    try {
      await Storage.saveHandle('project_dir_handle', state.projectDirHandle);
    } catch (e) {
      console.warn('عدم امکان کش Handle پوشه:', e);
    }
  }

  // ۵. فیدبک بصری به کاربر
  if (showFeedback) {
    const status = $('#saveStatus');
    status.textContent = '✓ تمامی تنظیمات، آدرس‌ها و فایل‌ها ذخیره شدند!';
    status.style.background = 'rgba(16, 185, 129, 0.25)';
    status.style.color = '#34d399';
    setTimeout(() => {
      status.textContent = 'تنظیمات ذخیره هستند ✓';
      status.style.background = 'rgba(16, 185, 129, 0.15)';
    }, 3000);
  }
}

// اتصال دکمه سبز ذخیره
if ($('#btnMasterSave')) {
  $('#btnMasterSave').onclick = () => saveAllState(true);
}











/* ==========================================================================
   ۳.۵ بازه خروجی (فقط زمان؛ امواج صدا دست‌نخورده می‌مانند)
   ========================================================================== */
/* ==========================================================================
   ۳.۵ سیستم برش و چسباندن چند بازه (Multi-Segment Stitching)
   ========================================================================== */

let isPlayingSegmentPreview = false;
let currentPreviewSegmentIndex = 0;

function getActiveRanges() {
  const dur = audio.duration || 0;
  if (!state.rangeEnabled || state.ranges.length === 0) {
    return [{ s: 0, e: dur }];
  }
  return state.ranges
    .map(r => ({
      s: Math.max(0, Math.min(r.s || 0, dur)),
      e: Math.max(0, Math.min(r.e || dur, dur))
    }))
    .filter(r => r.e > r.s);
}

function getTotalRangesDuration() {
  const list = getActiveRanges();
  return list.reduce((sum, r) => sum + (r.e - r.s), 0);
}

function updateRangeBadge() {
  const badge = $('#rangeBadge');
  if (!badge) return;
  const dur = audio.duration || 0;
  if (!state.rangeEnabled || !dur || state.ranges.length === 0) {
    badge.textContent = `کل فایل (${fmtTime(dur)})`;
    return;
  }
  const total = getTotalRangesDuration();
  badge.textContent = `${state.ranges.length} قطعه — مجموع: ${total.toFixed(1)} ثانیه`;
}

function renderRangesUI() {
  const box = $('#rangesList');
  if (!box) return;
  box.innerHTML = '';

  const dur = audio.duration || 0;
  if (state.ranges.length === 0 && dur > 0) {
    state.ranges.push({ s: 0, e: round1(dur) });
  }

  state.ranges.forEach((seg, idx) => {
    const row = document.createElement('div');
    row.className = 'cue ai';
    row.style.gridTemplateColumns = '70px 1fr 45px 1fr 45px 70px 30px';
    row.style.gap = '6px';
    row.style.padding = '8px';

    const segLen = Math.max(0, seg.e - seg.s).toFixed(1);

    row.innerHTML = `
      <b style="font-size:12px;display:flex;align-items:center;color:#38bdf8">قطعه ${idx + 1}:</b>
      <input type="number" step="0.1" min="0" value="${seg.s}" title="شروع به ثانیه">
      <button class="btn btn-sm" title="ثبت زمان فعلی پخش">⏱</button>
      <input type="number" step="0.1" min="0" value="${seg.e}" title="پایان به ثانیه">
      <button class="btn btn-sm" title="ثبت زمان فعلی پخش">⏱</button>
      <span style="font-size:11px;direction:ltr;color:var(--mut);display:flex;align-items:center;justify-content:center">${segLen}s</span>
      <button class="btn-del" title="حذف این قطعه">×</button>
    `;

    const [, inpS, btnS, inpE, btnE, lenSpan, btnDel] = row.children;

    inpS.oninput = () => { seg.s = +inpS.value || 0; updateRangeBadge(); persistRanges(); };
    inpE.oninput = () => { seg.e = +inpE.value || 0; updateRangeBadge(); persistRanges(); };
    btnS.onclick = () => { seg.s = round1(audio.getCurrentTime()); inpS.value = seg.s; updateRangeBadge(); persistRanges(); };
    btnE.onclick = () => { seg.e = round1(audio.getCurrentTime()); inpE.value = seg.e; updateRangeBadge(); persistRanges(); };
    btnDel.onclick = () => {
      state.ranges.splice(idx, 1);
      renderRangesUI();
      persistRanges();
      updatePlayButtons();
    };

    box.append(row);
  });

  updateRangeBadge();
}

function persistRanges() {
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
}

// دکمه فعال‌سازی
const chkRange = $('#rangeEnable');
if (chkRange) {
  chkRange.onchange = e => {
    state.rangeEnabled = e.target.checked;
    const ctl = $('#rangeControls');
    if (ctl) ctl.style.display = state.rangeEnabled ? 'block' : 'none';
    if (state.rangeEnabled && state.ranges.length === 0 && audio.duration) {
      state.ranges.push({ s: 0, e: round1(audio.duration) });
    }
    renderRangesUI();
    persistRanges();
    updatePlayButtons();
  };
}

// افزودن قطعه جدید
const btnAddSeg = $('#btnAddSegment');
if (btnAddSeg) {
  btnAddSeg.onclick = () => {
    const cur = round1(audio.getCurrentTime());
    const dur = audio.duration || (cur + 3);
    state.ranges.push({
      s: cur,
      e: Math.min(dur, round1(cur + 3.0))
    });
    renderRangesUI();
    persistRanges();
  };
}

// پخش زنجیره‌ای بازه‌ها
const btnRangePrev = $('#btnRangePreview');
if (btnRangePrev) {
  btnRangePrev.onclick = () => {
    const valid = getActiveRanges();
    if (valid.length === 0) return;
    isPlayingSegmentPreview = true;
    currentPreviewSegmentIndex = 0;
    audio.stop(true);
    audio.play(valid[0].s);
    setPlayIcon(true);
  };
}

// بازنشانی
const btnRangeRes = $('#btnRangeReset');
if (btnRangeRes) {
  btnRangeRes.onclick = () => {
    state.rangeEnabled = false;
    state.ranges = [];
    if (chkRange) chkRange.checked = false;
    const ctl = $('#rangeControls');
    if (ctl) ctl.style.display = 'none';
    isPlayingSegmentPreview = false;
    renderRangesUI();
    persistRanges();
    updatePlayButtons();
  };
}

/* ==========================================================================
   ۴. کنترل پخش و اسکرابر
   ========================================================================== */

function togglePlay() {
  if (!audio.duration || state.isExporting) return;
  isPlayingSegmentPreview = false; // لغو پخش آزمایشی در صورت کلیک دستی روی پلی
  if (audio.playing) {
    audio.stop();
    setPlayIcon(false);
  } else {
    if (audio.getCurrentTime() >= audio.duration) audio.offset = 0;
    audio.play(audio.offset);
    setPlayIcon(true);
  }
}

function setPlayIcon(isPlaying) {
  $('#ic').innerHTML = isPlaying
    ? '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>'
    : '<path d="M8 5v14l11-7z"/>';
  $('#play').setAttribute('aria-label', isPlaying ? 'توقف' : 'پخش');
}

$('#play').onclick = togglePlay;
window.addEventListener('keydown', e => {
  if (e.code === 'Space' && !/INPUT|BUTTON|SELECT|TEXTAREA/.test(e.target.tagName)) {
    e.preventDefault();
    togglePlay();
  }
});

let isDraggingScrubber = false;
const getCanvasPos = e => {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * CONFIG.video.width, (e.clientY - r.top) / r.height * CONFIG.video.height];
};

const seekFromEvent = e => {
  const [x] = getCanvasPos(e);
  const { startX, barWidth, barGap, barCount } = CONFIG.layout.waveform;
  const totalWaveWidth = barCount * (barWidth + barGap) - barGap;
  const progress = Math.min(1, Math.max(0, (x - startX) / totalWaveWidth));
  const targetTime = progress * audio.duration;
  if (audio.playing) {
    audio.play(targetTime);
  } else {
    audio.offset = targetTime;
  }
};

canvas.onpointerdown = e => {
  const [, y] = getCanvasPos(e);
  if (!audio.duration || state.isExporting) return;
  if (y < CONFIG.layout.lanes.aiY - 120 || y > CONFIG.layout.lanes.huY + 120) return;
  previewUntil = null;
  isDraggingScrubber = true;
  canvas.setPointerCapture(e.pointerId);
  seekFromEvent(e);
};
canvas.onpointermove = e => { if (isDraggingScrubber) seekFromEvent(e); };
canvas.onpointerup = () => { isDraggingScrubber = false; };

// انتقال fmtTime به بالای فایل جهت رفع خطای لود صدا
// انتقال fmtTime به بالای فایل جهت رفع خطای لود صدا
function fmtTime(s) {
  s = Math.max(0, s | 0);
  return String((s / 60) | 0).padStart(2, '0') + ':' + String((s % 60) | 0).padStart(2, '0');
}





/* ==========================================================================
   ۵. لوپ انیمیشن Canvas
   ========================================================================== */

function loop() {
  const t = audio.getCurrentTime();

  // توقف پخش آزمایشی در پایان بازه انتخابی
// مدیریت پخش پیوسته و هوشمند قطعات منتخب
  if (isPlayingSegmentPreview && audio.playing) {
    const validRanges = getActiveRanges();
    const curSeg = validRanges[currentPreviewSegmentIndex];
    if (curSeg && t >= curSeg.e) {
      currentPreviewSegmentIndex++;
      if (currentPreviewSegmentIndex < validRanges.length) {
        // پرش سریع به قطعه بعدی
        audio.play(validRanges[currentPreviewSegmentIndex].s);
      } else {
        // پایان همه قطعات
        isPlayingSegmentPreview = false;
        audio.stop(true);
        setPlayIcon(false);
      }
    }
  }

  // توقف خودکار در پایان فایل صوتی
  if (audio.playing && t >= audio.duration) {
    audio.stop(true);
    setPlayIcon(false);
  }

  renderer.render(t, {
    brand: state.brand,
    footer: state.footer,
    images: state.images,
    logoHeight: state.logoHeight,
    duration: audio.duration,
    customField1: state.customField1,
    customField2: state.customField2,
    tracksLoaded: state.tracksLoaded,
    cues: state.cues,
    emojis: state.emojis,
    dynamicTags: state.dynamicTags,
    labels: state.labels,
    audioEvents: state.emojis,
    levels: { ai: audio.getLevel('ai', t), hu: audio.getLevel('hu', t) },
    peaks: { ai: audio.tracks.ai.peaks, hu: audio.tracks.hu.peaks }
  });

  $('#time').textContent = `${fmtTime(t)} / ${fmtTime(audio.duration)}`;

  const activeIdx = state.cues.findIndex(c => t >= c.s && t < c.e);
  if (activeIdx !== lastActiveCue) {
    lastActiveCue = activeIdx;
    cueRows.forEach((r, i) => r.classList.toggle('on', i === activeIdx));
  }

  requestAnimationFrame(loop);
}

/* ==========================================================================
   ۶. پایپ‌لاین اکسپورت و ذخیره پکیج پروژه
   ========================================================================== */

$('#btnPickFolder').onclick = async () => {
  try {
    state.projectDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    $('#folderPathHint').textContent = `پوشه متصل شد: ${state.projectDirHandle.name} ✓`;
    $('#folderPathHint').style.color = '#34d399';
  } catch (e) {}
};

async function getNextProjectFolder(dirHandle) {
  let index = 1;
  while (true) {
    const folderName = `project-${index}`;
    try {
      await dirHandle.getDirectoryHandle(folderName);
      index++;
    } catch (e) {
      return await dirHandle.getDirectoryHandle(folderName, { create: true });
    }
  }
}

async function writeFileToDir(dirHandle, fileName, blobOrBuffer) {
  const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blobOrBuffer);
  await writable.close();
}

/* ==========================================================================
   ۶. پایپ‌لاین اکسپورت و ذخیره پکیج پروژه (نسخه کاملاً اصلاح‌شده و پایدار)
   ========================================================================== */

/**
 * پایپ‌لاین تولید ویدیوی MP4 با شتاب سخت‌افزاری مک (WebCodecs H.264 + AAC)
 * با پشتیبانی کامل از شعارهای پویا، متن فوتر و ایموجی‌ها
 */
async function renderVideoMP4(onProgress) {
  const { width: Wd, height: Ht, fps: FPS } = CONFIG.video;
  const SR = 48000;

  // ۱. محاسبه بازه خروجی (فقط زمان؛ امواج صدا دست نمی‌خورند)
// ۱. استخراج قطعات فعال و محاسبه مدت زمان کل خروجی
  const activeSegments = getActiveRanges();
  const totalVideoDuration = Math.max(0.1, getTotalRangesDuration());
  const totalFrames = Math.ceil(totalVideoDuration * FPS);
  const frameDurationUs = 1e6 / FPS;

  // تابع نگاشت زمان فریم خروجی به زمان فایل صوتی اصلی
  function mapOutputTimeToGlobalTime(outTime) {
    let acc = 0;
    for (const seg of activeSegments) {
      const dur = seg.e - seg.s;
      if (outTime < acc + dur) {
        return seg.s + (outTime - acc);
      }
      acc += dur;
    }
    return activeSegments[activeSegments.length - 1]?.e || 0;
  }

  // ۲. محاسبه امواج صدا برای کل فایل
  audio.computeStaticPeaks(0, audio.duration);

  // ۳. میکس چندقطعه‌ای صدا با تابع ارتقایافته
  onProgress(0.04, state.rangeEnabled
    ? `در حال میکس و چسباندن ${activeSegments.length} قطعه صوتی...`
    : 'میکس و فشرده‌سازی صدا...');
  const mixedAudioBuffer = await audio.mixOffline(activeSegments, SR);
  const audioChannelData = mixedAudioBuffer.getChannelData(0);

  // ۴. آماده‌سازی Muxer جهت ایجاد فایل استاندارد MP4
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    fastStart: 'in-memory',
    video: { codec: 'avc', width: Wd, height: Ht, frameRate: FPS },
    audio: { codec: 'aac', numberOfChannels: 1, sampleRate: SR }
  });

  let encoderError = null;

  // ۵. انکودر ویدیویی سخت‌افزاری (H.264 High Profile)
  const vEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: e => { encoderError = e; }
  });

  vEncoder.configure({
    codec: 'avc1.640033',
    width: Wd,
    height: Ht,
    bitrate: CONFIG.video.defaultBitrate,
    framerate: FPS,
    latencyMode: 'quality'
  });

  // ۶. انکودر صوتی استریو/مونو (AAC 96kbps)
  const aEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: e => { encoderError = e; }
  });

  aEncoder.configure({
    codec: 'mp4a.40.2',
    sampleRate: SR,
    numberOfChannels: 1,
    bitrate: 96e3
  });

  // ۷. انکود بسته‌های صوتی
  for (let i = 0; i < mixedAudioBuffer.length; i += 4800) {
    const len = Math.min(4800, mixedAudioBuffer.length - i);
    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate: SR,
      numberOfFrames: len,
      numberOfChannels: 1,
      timestamp: Math.round((i / SR) * 1e6),
      data: audioChannelData.slice(i, i + len)
    });
    aEncoder.encode(audioData);
    audioData.close();
  }

  // ۸. آماده‌سازی بوم رندر آفلاین
  const offCanvas = document.createElement('canvas');
  offCanvas.width = Wd;
  offCanvas.height = Ht;
  const offRenderer = new VideoRenderer(offCanvas);
  offRenderer.setTemplate(loadedTemplates[state.templateId]);

  // ۹. حلقه رندر فریم به فریم ویدیوی خروجی
  for (let f = 0; f < totalFrames; f++) {
    if (encoderError) throw encoderError;

    // زمان فریم در فایل صوتی (برای هماهنگی زیرنویس‌ها، ایموجی‌ها و انیمیشن‌ها)
// زمان دقیق فریم متناظر با قطعات چسبیده‌شده
    const outTime = f / FPS;
    const globalTime = state.rangeEnabled ? mapOutputTimeToGlobalTime(outTime) : outTime;
    offRenderer.render(globalTime, {
      brand: state.brand,
      footer: state.footer,
      images: state.images,
      logoHeight: state.logoHeight,
      duration: audio.duration,
      customField1: state.customField1,
      customField2: state.customField2,
      tracksLoaded: state.tracksLoaded,
      cues: state.cues,
      emojis: state.emojis,
      dynamicTags: state.dynamicTags,
      audioEvents: state.emojis,
      levels: { ai: audio.getLevel('ai', globalTime), hu: audio.getLevel('hu', globalTime) },
      peaks: { ai: audio.tracks.ai.peaks, hu: audio.tracks.hu.peaks }
    });

    const videoFrame = new VideoFrame(offCanvas, {
      timestamp: Math.round(f * frameDurationUs),
      duration: Math.round(frameDurationUs)
    });

    // ثبت فریم کلیدی هر ۲ ثانیه یک‌بار
    vEncoder.encode(videoFrame, { keyFrame: f % (FPS * 2) === 0 });
    videoFrame.close();

    // مدیریت صف انکودر برای حفظ روان بودن رم مک
    while (vEncoder.encodeQueueSize > 5) await sleep(4);

    if (f % 6 === 0) {
      onProgress(0.08 + (f / totalFrames) * 0.90, `رندر فریم ${f} از ${totalFrames}...`);
      await sleep(0);
    }
  }

  // ۱۰. نهایی‌سازی و بستن فایل MP4
  await vEncoder.flush();
  await aEncoder.flush();
  if (encoderError) throw encoderError;

  muxer.finalize();

  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}

/* ==========================================================================
   ۶.۵ اتصال دکمه رندر، نوار پیشرفت و ذخیره خروجی
   ========================================================================== */

function setProgress(p) {
  const pct = Math.max(0, Math.min(1, p)) * 100;
  $('#pgi').style.width = `${pct.toFixed(1)}%`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

function exportMeta() {
  return {
    createdAt: new Date().toISOString(),
    templateId: state.templateId,
    video: { ...CONFIG.video },
    range: {
      enabled: state.range.enabled,
      start: round1(state.range.start),
      end: round1(state.range.enabled ? getRangeEnd() : audio.duration)
    },
    audioDuration: round1(audio.duration),
    brand: state.brand,
    footer: state.footer,
    logoHeight: state.logoHeight,
    volumes: { ai: audio.tracks.ai.vol, hu: audio.tracks.hu.vol },
    customField1: state.customField1,
    customField2: state.customField2,
    cues: state.cues,
    emojis: state.emojis,
    dynamicTags: state.dynamicTags
  };
}

$('#exp').onclick = async () => {
  if (!audio.duration || state.isExporting) return;

  if (state.rangeEnabled) {
    const totalDur = getTotalRangesDuration();
    if (totalDur < 0.5) {
      alert('مجموع زمان قطعات انتخابی خیلی کوتاه است (حداقل ۰.۵ ثانیه لازم است).');
      return;
    }
  }

  state.isExporting = true;
  $('#exp').disabled = true;
  $('#play').disabled = true;
  previewUntil = null;
  audio.stop();
  setPlayIcon(false);
  setProgress(0.02);
  $('#st').textContent = 'آماده‌سازی رندر...';

  try {
    const blob = await renderVideoMP4((p, msg) => {
      setProgress(p);
      if (msg) $('#st').textContent = msg;
    });

    setProgress(1);

    if (state.projectDirHandle) {
      const folder = await getNextProjectFolder(state.projectDirHandle);
      await writeFileToDir(folder, 'output.mp4', blob);

      // کپی فایل‌های صوتی اصلی در کنار خروجی
      const audioNames = { ai: 'ai-audio', hu: 'human-audio' };
      for (const key of ['ai', 'hu']) {
        let media = null;
        try { media = await Storage.getMedia(`${key}_audio`); } catch (e) { media = null; }
        if (media && media.buffer) {
          const name = media.name || '';
          const ext = name.includes('.') ? name.split('.').pop() : 'mp3';
          await writeFileToDir(
            folder,
            `${audioNames[key]}.${ext}`,
            new Blob([media.buffer], { type: media.type || 'audio/mpeg' })
          );
        }
      }

      await writeFileToDir(
        folder,
        'project.json',
        new Blob([JSON.stringify(exportMeta(), null, 2)], { type: 'application/json' })
      );

      $('#st').textContent = `✓ خروجی در پوشه ${folder.name} ذخیره شد.`;
    } else {
      const s0 = state.range.enabled ? state.range.start : 0;
      const e0 = state.range.enabled ? getRangeEnd() : audio.duration;
      const tag = state.range.enabled
        ? `${fmtTime(s0)}-${fmtTime(e0)}`.replace(/:/g, '-')
        : 'full';
      downloadBlob(blob, `emma-${tag}.mp4`);
      $('#st').textContent = '✓ فایل MP4 ساخته و دانلود شد.';
    }
  } catch (err) {
    console.error('Export error:', err);
    alert('خطا در ساخت ویدیو: ' + (err.message || err));
    $('#st').textContent = 'رندر ناموفق بود.';
  } finally {
    state.isExporting = false;
    $('#exp').disabled = !audio.duration;
    $('#play').disabled = !audio.duration;
  }
};


/* ==========================================================================
   مدیریت دستی ایموجی‌های متحرک (Manual Reactions)
   ========================================================================== */

function renderEmojisUI() {
  const box = $('#emojiList');
  box.innerHTML = '';
  state.emojis.forEach((evt, idx) => {
    const r = document.createElement('div');
    r.className = `cue ${evt.speaker === 'both' ? 'ai' : evt.speaker}`;
    r.style.gridTemplateColumns = '90px 75px 1fr 30px';
    r.innerHTML = `
      <select aria-label="موقعیت">
        <option value="ai">روی AI</option>
        <option value="hu">روی کاربر</option>
        <option value="both">وسط صفحه</option>
      </select>
      <input type="number" step="0.1" min="0" value="${evt.time}" title="ثانیه">
      <input type="text" class="tx" value="${evt.emoji}" placeholder="ایموجی" style="text-align:center;font-size:18px">
      <button class="btn-del" title="حذف">×</button>
    `;

    const [sel, timeInp, emojiInp, del] = r.children;
    sel.value = evt.speaker;
    sel.onchange = () => { evt.speaker = sel.value; persistEmojis(); };
    timeInp.oninput = () => { evt.time = +timeInp.value || 0; persistEmojis(); };
    emojiInp.oninput = () => { evt.emoji = emojiInp.value.trim(); persistEmojis(); };
    del.onclick = () => { state.emojis.splice(idx, 1); renderEmojisUI(); persistEmojis(); };

    box.append(r);
  });
}

function persistEmojis() {
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
}

// اضافه کردن دستی در ثانیه فعلی
// اضافه کردن دستی ایموجی در ثانیه فعلی (هماهنگ با تمپلیت شما)
function addReactionAtCurrentTime(emoji = '😂') {
  const curTime = Math.round(audio.getCurrentTime() * 10) / 10;
  const isAiActive = audio.getLevel('ai', curTime) > audio.getLevel('hu', curTime);
  
  // تخصیص گوینده
  const speaker = emoji === '⚡' ? 'both' : (isAiActive ? 'ai' : 'hu');

  // تخصیص type برای اجرای دقیق انیمیشن در ema-temp.js
  let type = 'general';
  if (emoji === '⚡') type = 'overlap';
  else if (emoji === '😂') type = 'laugh';
  else if (emoji === '💭') type = 'think';

  state.emojis.push({
    time: curTime,
    speaker: speaker,
    emoji: emoji,
    type: type // <-- این کلید به تمپلیت شما می‌گوید چه انیمیشنی پخش کند
  });
  
  state.emojis.sort((a, b) => a.time - b.time);
  renderEmojisUI();
  persistEmojis();
}

$('#addEmojiBtn').onclick = () => addReactionAtCurrentTime('😂');

// کلیک سریع روی ایموجی‌های پرکاربرد (نوار ابزار)
$$('.quick-emoji').forEach(btn => {
  btn.onclick = () => addReactionAtCurrentTime(btn.dataset.e);
});

$('#clearEmojis').onclick = () => {
  if (confirm('آیا تمام ایموجی‌های ری‌اکشن پاک شوند؟')) {
    state.emojis = [];
    renderEmojisUI();
    persistEmojis();
  }
};









/* ==========================================================================
   مدیریت لیبل‌ها و نشانگرهای صوتی (Audio Callouts)
   ========================================================================== */

function renderLabelsUI() {
  const box = $('#labelsList');
  const badge = $('#labelsCountBadge');
  if (badge) badge.textContent = `${state.labels.length} نشانگر`;
  if (!box) return;
  box.innerHTML = '';

  state.labels.forEach((lbl, idx) => {
    const r = document.createElement('div');
    r.className = 'cue ai';
    // اضافه شدن ستون ارتفاع ۶۵ پیکسلی
    r.style.gridTemplateColumns = '1fr 75px 65px 30px';
    r.style.gap = '8px';
    
    // اگر ارتفاعی ثبت نشده بود، پیش‌فرض ۵۱۰ است
    const curY = lbl.y !== undefined ? lbl.y : 510;

    r.innerHTML = `
      <input type="text" class="tx" value="${lbl.text.replace(/"/g, '&quot;')}" placeholder="متن لیبل...">
      <input type="number" step="0.1" min="0" value="${lbl.time}" title="ثانیه وقوع">
      <input type="number" step="5" min="350" max="600" value="${curY}" title="ارتفاع عمودی Y (پیش‌فرض: ۵۱۰)">
      <button class="btn-del" title="حذف">×</button>
    `;

    const [tx, timeInp, yInp, del] = r.children;
    tx.oninput = () => { lbl.text = tx.value; persistLabels(); };
    timeInp.oninput = () => { lbl.time = +timeInp.value || 0; persistLabels(); };
    yInp.oninput = () => { lbl.y = +yInp.value || 510; persistLabels(); };
    del.onclick = () => { state.labels.splice(idx, 1); renderLabelsUI(); persistLabels(); };

    box.append(r);
  });
}

function persistLabels() {
  Storage.saveSetting(CONFIG.storageKeys.settings, getSavableSettings());
}

function addLabelAtTime(t, defaultText = 'نکته کلیدی', defaultY = 510) {
  // اگر لیبل قبلی نزدیک به این ثانیه بود، به صورت خودکار ارتفاع را کمی بالاتر می‌بریم تا تداخل نداشته باشند
  const lastNear = state.labels.find(l => Math.abs(l.time - t) < 3.0);
  const suggestedY = lastNear && (lastNear.y || 510) === 510 ? 450 : defaultY;

  state.labels.push({
    time: round1(t),
    text: defaultText,
    y: suggestedY
  });
  state.labels.sort((a, b) => a.time - b.time);
  renderLabelsUI();
  persistLabels();
}

// دکمه افزودن دستی در زمان فعلی پلیر
const btnAddLbl = $('#btnAddLabelBtn');
if (btnAddLbl) {
  btnAddLbl.onclick = () => {
    const cur = audio.getCurrentTime();
    addLabelAtTime(cur, 'جستجو در نت...');
  };
}

const btnClearLbl = $('#btnClearLabels');
if (btnClearLbl) {
  btnClearLbl.onclick = () => {
    if (confirm('آیا تمام لیبل‌ها حذف شوند؟')) {
      state.labels = [];
      renderLabelsUI();
      persistLabels();
    }
  };
}




/* ==========================================================================
   ۷. راه‌اندازی اپلیکیشن
   ========================================================================== */

init();