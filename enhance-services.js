// Extra predefined services list injected at runtime to ensure full catalog
(function(){
  const extra = [
    // وب و سئو
    'طراحی سایت فروشگاهی','طراحی لندینگ پیج','توسعه وب اپلیکیشن','بهینه سازی سرعت سایت','سئو تکنیکال','تولید محتوای سئو محور','پشتیبانی سایت','رفع باگ و به‌روزرسانی پلاگین',
    // شبکه و سرور
    'راه اندازی VPN','کانفیگ سرور لینوکس','امنیت شبکه','مانیتورینگ سرور','بک‌آپ گیری و بازیابی','بهینه سازی شبکه','راه اندازی فایروال','Load Balancing','DNS پیکربندی',
    // آموزش و مالی
    'آموزش تحلیل تکنیکال','آموزش تحلیل بنیادی','آموزش ترید فارکس','مشاوره سرمایه‌گذاری','آموزش ارزهای دیجیتال','راهنمایی والت و صرافی','آموزش دیفای و NFT'
  ];

  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('serviceSelect');
    if (!select) return;

    const existing = new Set(Array.from(select.options).map(o => o.value));
    extra.forEach(name => {
      if (!existing.has(name)) {
        const opt = document.createElement('option');
        opt.value = name; opt.textContent = name;
        // اضافه به آخرین optgroup در صورت وجود
        const groups = select.querySelectorAll('optgroup');
        if (groups.length) { groups[0].appendChild(opt); } else { select.appendChild(opt); }
      }
    });
  });
})();
