/**
 * config.js
 * تنظیمات پایه و ساختار استودیوی ویدیوی اِما
 */

export const CONFIG = {
  video: {
    width: 1080,
    height: 1920,
    fps: 30,
    defaultBitrate: 4.5 * 1e6
  },

  audio: {
    hopSize: 60,
    minVolume: 0,
    maxVolume: 3.0,     // تقویت ولوم تا ۳۰۰٪
    defaultAiVolume: 1.0,
    defaultHuVolume: 1.8
  },

  layout: {
    header: { yName: 290, yTag: 355 },
    avatar: { radius: 74, x: 145 },
    lanes: {
      aiY: 700,
      huY: 950,
      cardWidth: 1000,
      cardHeight: 210,
      cardRadius: 105
    },
    waveform: {
      startX: 250,
      barWidth: 7,      // عرض ظریف‌تر برای رزولوشن بالاتر
      barGap: 5,        // فاصله تمیزتر
      barCount: 60,     // ۶۰ میله با دقت بالای زمانی
      maxHeight: 75
    },
    subtitles: {
      boxY: 1210,
      boxWidth: 920,
      maxWidthText: 840,
      fontSize: 46
    },
    logo: {
      defaultHeight: 160,
      bottomY: 1810
    }
  },

  storageKeys: {
    settings: 'emma_studio_settings_v1',
    cues: 'emma_studio_cues_v1'
  },

  // ۳ تمپلیت اصلی
// ۵ تمپلیت استودیو
  availableTemplates: [
    { id: 'ema-temp', name: '۱. اِما اورجینال (آبی #0a91d5 و مینیمال سفید)', file: './templates/ema-temp.js' },
    { id: 'chat-messenger', name: '۲. چت پیام‌رسان تلگرامی (Messenger UI)', file: './templates/chat-messenger.js' },
    { id: 'dark-cyber', name: '۳. دارک نئونی (Dark Cyber)', file: './templates/dark-cyber.js' },
    { id: 'podcast-split', name: '۴. پادکست استودیویی (Studio Split)', file: './templates/podcast-split.js' },
    { id: 'silver-luxury', name: '۵. نقره‌ای متالیک لوکس (Silver Luxury)', file: './templates/silver-luxury.js' }
  ]
};