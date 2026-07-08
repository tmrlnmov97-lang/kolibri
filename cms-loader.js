// ============================================================
//  Загрузчик контента: подставляет тексты и фото из базы.
//  Как пометить элемент на странице:
//    <h1 data-cms="hero_title">...</h1>        — заменит текст
//    <img data-cms="hero_image" src="...">      — заменит фото
//    <a data-cms="contacts_phone" data-cms-tel> — заменит текст и ссылку tel:
//    <div data-cms="hero_image" data-cms-bg>    — заменит фон (background-image)
//  Страница задаётся на <body data-cms-page="home">.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY } from './supabase-config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  const page = document.body.dataset.cmsPage;
  if (!page) return;
  try {
    const { data, error } = await sb.from('site_content')
      .select('block_key,type,value').eq('page', page);
    if (error || !data) return;                 // база недоступна — оставляем как в HTML

    const map = {};
    for (const row of data) map[row.block_key] = row.value;

    // разрешаем только безопасные ссылки (блокируем javascript:, data: и прочее)
    const safeUrl = (u) => {
      if (u == null) return null;
      const s = String(u).trim();
      return /^(https?:\/\/|tel:|mailto:|\/|assets\/|#)/i.test(s) ? s : null;
    };

    document.querySelectorAll('[data-cms]').forEach((el) => {
      const val = map[el.dataset.cms];
      if (val == null || val === '') return;    // нет значения — не трогаем

      if (el.hasAttribute('data-cms-bg')) {
        el.style.backgroundImage = `url('${val}')`;
      } else if (el.tagName === 'IMG') {
        el.src = val;
      } else {
        el.textContent = val;
        if (el.hasAttribute('data-cms-tel')) el.href = 'tel:' + val.replace(/[^\d+]/g, '');
      }
    });

    // ссылки: лайтбокс-картинки и CTA-кнопки: <a data-cms-href="key">
    document.querySelectorAll('[data-cms-href]').forEach((el) => {
      const val = safeUrl(map[el.dataset.cmsHref]);
      if (val) el.setAttribute('href', val);
    });
  } catch (e) {
    /* тихо игнорируем — страница покажет содержимое из HTML */
  }
})();
