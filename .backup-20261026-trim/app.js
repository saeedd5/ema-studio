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

const audio = new AudioManager();
const canvas = $('#cv');
const renderer = new VideoRenderer(canvas);

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
    trim: {
    enabled: false,
    start: 0,
    end: 30
  },
  customField1: { text: '', size: 38, x: 540, y: 440 },
  customField2: { text: '', size: 28, x: 540, y: 510 },
  images: { ai: null, hu: null, logo: null },
  imageNames: { ai: '', hu: '', logo: '' },
  logoHeight: 160,
  cues: [],
  emojis: [],
  dynamicTags: [],
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
  $('#templateSelect').value = templateId;

  if (!loadedTemplates[templateId]) {
    const tmplInfo = CONFIG.availableTemplates.find(t => t.id === templateId);
    if (tmplInfo) {
      const module = await import(tmplInfo.file);
      loadedTemplates[templateId] = module.default;
    }
  }

  renderer.setTemplate(loadedTemplates[templateId]);
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
    dynamicTags: state.dynamicTags

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
  $('#play').disabled = !hasAudio;
  $('#exp').disabled = !hasAudio;
  if (hasAudio) {
    $('#st').textContent = `آماده رندر: ۱۰۸۰×۱۹۲۰ (مدت زمان: ${fmtTime(audio.duration)})`;
  }
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
if ($('#templateSelect')) {
  $('#templateSelect').onchange = e => switchTemplate(e.target.value);
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

$('#addDynamicTagBtn').onclick = () => {
  const curTime = Math.round(audio.getCurrentTime() * 10) / 10;
  state.dynamicTags.push({
    text: 'شعار یا پیام متغیر شما...',
    s: curTime,
    e: Math.round((curTime + 3.0) * 10) / 10,
    size: 34,
    x: 540, // مرکز عرض ۱۰۸۰
    y: 345, // ارتفاع استاندارد زیرتیتر
    anim: 'slide'
  });
  renderDynamicTagsUI();
  persistDynamicTags();
};




/* ==========================================================================
   سینک آنی و زنده (Live Sync) تمام کادرها و اسلایدرها با بوم ویدیو
   ========================================================================== */

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
  if ($('#cf1Size')) state.customField1.size = +$('#cf1Size').value || 38;
  if ($('#cf1X')) state.customField1.x = +$('#cf1X').value ?? 540;
  if ($('#cf1Y')) state.customField1.y = +$('#cf1Y').value ?? 440;

  if ($('#cf2Text')) state.customField2.text = $('#cf2Text').value;
  if ($('#cf2Size')) state.customField2.size = +$('#cf2Size').value || 28;
  if ($('#cf2X')) state.customField2.x = +$('#cf2X').value ?? 540;
  if ($('#cf2Y')) state.customField2.y = +$('#cf2Y').value ?? 510;



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
$('#btnMasterSave').onclick = () => saveAllState(true);












/* ==========================================================================
   مدیریت پنل برش و گلچین هوشمند صدا (Trim & Clip)
   ========================================================================== */

function updateTrimUI() {
  const isEnabled = $('#trimEnable').checked;
  $('#trimControls').style.display = isEnabled ? 'grid' : 'none';
  state.trim.enabled = isEnabled;
  state.trim.start = +$('#trimStart').value || 0;
  state.trim.end = +$('#trimEnd').value || Math.min(audio.duration || 30, 30);

  if (isEnabled) {
    const dur = Math.max(0, state.trim.end - state.trim.start);
    $('#trimDurationBadge').textContent = `طول کلیپ: ${dur.toFixed(1)} ثانیه`;
    // زوم کردن شکل‌موج روی بازه انتخابی
    audio.computeStaticPeaks(state.trim.start, state.trim.end);
  } else {
    $('#trimDurationBadge').textContent = `طول کلیپ: کامل (${fmtTime(audio.duration)})`;
    // بازگرداندن امواج به حالت کل صدا
    audio.computeStaticPeaks(0, audio.duration);
  }
}

$('#trimEnable').onchange = updateTrimUI;

$('#trimStart').oninput = e => {
  state.trim.start = Math.max(0, +e.target.value || 0);
  if (state.trim.start >= state.trim.end) state.trim.end = state.trim.start + 5;
  $('#trimEnd').value = state.trim.end;
  updateTrimUI();
};

$('#trimEnd').oninput = e => {
  state.trim.end = Math.min(audio.duration || 9999, +e.target.value || 0);
  if (state.trim.end <= state.trim.start) state.trim.start = Math.max(0, state.trim.end - 5);
  $('#trimStart').value = state.trim.start;
  updateTrimUI();
};

$('#btnSetTrimStart').onclick = () => {
  const cur = Math.round(audio.getCurrentTime() * 10) / 10;
  $('#trimStart').value = cur;
  state.trim.start = cur;
  if (state.trim.start >= state.trim.end) {
    state.trim.end = Math.min(audio.duration, cur + 30);
    $('#trimEnd').value = state.trim.end;
  }
  updateTrimUI();
};

$('#btnSetTrimEnd').onclick = () => {
  const cur = Math.round(audio.getCurrentTime() * 10) / 10;
  $('#trimEnd').value = cur;
  state.trim.end = cur;
  if (state.trim.end <= state.trim.start) {
    state.trim.start = Math.max(0, cur - 30);
    $('#trimStart').value = state.trim.start;
  }
  updateTrimUI();
};

// پخش آزمایشی فقط همان بازه
$('#btnPreviewTrim').onclick = () => {
  audio.stop(true);
  audio.play(state.trim.start);
  setPlayIcon(true);
};





/* ==========================================================================
   ۴. کنترل پخش و اسکرابر
   ========================================================================== */

function togglePlay() {
  if (!audio.duration || state.isExporting) return;
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
  
  // اگر برش فعال است و پخش به انتهای بازه رسید، متوقف شود
  if (audio.playing && state.trim.enabled && t >= state.trim.end) {
    audio.stop(false);
    setPlayIcon(false);
  } else if (audio.playing && !state.trim.enabled && t >= audio.duration) {
    audio.stop(true);
    setPlayIcon(false);
  }

  // محاسبه بازه جهت ارسال به تمپلیت
  const clipStart = state.trim.enabled ? state.trim.start : 0;
  const clipEnd = state.trim.enabled ? state.trim.end : audio.duration;
  const clipDuration = Math.max(0.1, clipEnd - clipStart);

  renderer.render(t, {
    brand: state.brand,
    footer: state.footer,
    images: state.images,
    logoHeight: state.logoHeight,
    duration: audio.duration,
    clip: { active: state.trim.enabled, start: clipStart, end: clipEnd, duration: clipDuration }, // <-- ارسال به تمپلیت
    tracksLoaded: state.tracksLoaded,
    cues: state.cues,
    emojis: state.emojis,
    dynamicTags: state.dynamicTags,
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
 * با پشتیبانی کامل از برش بازه، شعارهای پویا، متن فوتر و ایموجی‌ها
 */
async function renderVideoMP4(onProgress) {
  const { width: Wd, height: Ht, fps: FPS } = CONFIG.video;
  const SR = 48000;

  // ۱. محاسبه زمان شروع، پایان و طول کلیپ (برش هوشمند)
  const isTrimmed = state.trim && state.trim.enabled;
  const startTime = isTrimmed ? Math.max(0, state.trim.start) : 0;
  const endTime = isTrimmed ? Math.min(audio.duration, state.trim.end) : audio.duration;
  const clipDuration = Math.max(0.1, endTime - startTime);
  const totalFrames = Math.ceil(clipDuration * FPS);
  const frameDurationUs = 1e6 / FPS;

  // ۲. زوم کردن امواج صدا روی بازه انتخابی برای شفافیت ویدیو
  if (isTrimmed) {
    audio.computeStaticPeaks(startTime, endTime);
  } else {
    audio.computeStaticPeaks(0, audio.duration);
  }

  // ۳. میکس و فشرده‌سازی صدای بازه انتخابی
  onProgress(0.04, isTrimmed ? `میکس صدای بازه برش‌خورده (${clipDuration.toFixed(1)} ثانیه)...` : 'میکس و فشرده‌سازی صدا...');
  const mixedAudioBuffer = await audio.mixOffline(startTime, endTime, SR);
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

    // زمان واقعی در فایل صوتی اصلی (برای حفظ هماهنگی زمانی زیرنویس‌ها، ایموجی‌ها و انیمیشن‌ها)
    const globalTime = startTime + (f / FPS);

    offRenderer.render(globalTime, {
      brand: state.brand,
      footer: state.footer,
      images: state.images,
      logoHeight: state.logoHeight,
      duration: audio.duration,
      clip: { active: isTrimmed, start: startTime, end: endTime, duration: clipDuration },
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

  // اگر بازه برش فعال بود، شکل‌موج زنده صفحه را مجدداً به تنظیمات فعلی برمی‌گردانیم
  if (isTrimmed) {
    audio.computeStaticPeaks(state.trim.start, state.trim.end);
  } else {
    audio.computeStaticPeaks(0, audio.duration);
  }

  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}


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
   ۷. راه‌اندازی اپلیکیشن
   ========================================================================== */

init();