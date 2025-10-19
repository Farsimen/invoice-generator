# سامانه صدور فاکتور نسخه ۲.۰ | Invoice Generator v2.0

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Farsimen/invoice-generator)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Persian](https://img.shields.io/badge/language-فارسی-red.svg)](README.md)
[![PWA](https://img.shields.io/badge/PWA-enabled-purple.svg)](manifest.json)
[![Cloudflare](https://img.shields.io/badge/deploy-Cloudflare-orange.svg)](https://developers.cloudflare.com/workers/)

سامانه پیشرفته و حرفه‌ای برای صدور فاکتور با قابلیت‌های جدید شامل تاریخچه فاکتورها، تولید PDF، اشتراک‌گذاری در شبکه‌های اجتماعی و نصب به عنوان Progressive Web App (PWA).

## 🚀 ویژگی‌های جدید نسخه ۲.۰

### 📊 مدیریت پیشرفته فاکتورها
- **تاریخچه کامل فاکتورها** با قابلیت جستجو و فیلتر
- **آمار و گزارشات** دقیق از درآمد و فروش
- **صادرات داده‌ها** به فایل Excel/CSV
- **مشاهده و دانلود مجدد** فاکتورهای قبلی
- **حذف انتخابی** فاکتورها

### 🔢 شماره‌گذاری هوشمند
- شماره‌گذاری خودکار بر اساس تاریخ جلالی: `404727-001`
- فرمت استاندارد: `YYMMDD-XXX`
- جلوگیری از تکرار شماره‌ها
- قفل شماره تا زمان تولید PDF نهایی

### 💰 سیستم مالی پیشرفته
- تخفیف سطری برای هر خدمت
- تخفیف کلی روی کل فاکتور
- محاسبه خودکار مالیات ۱۰٪
- نمایش جزئیات محاسبات
- فرمت‌بندی ارقام فارسی

### 🎨 رابط کاربری مدرن
- طراحی Responsive برای موبایل و دسکتاپ
- تم تیره و روشن با تغییر خودکار
- انیمیشن‌های روان و جذاب
- اعتبارسنجی آنلاین فیلدها
- پیام‌های Toast برای بازخورد کاربر

### 📱 Progressive Web App (PWA)
- قابلیت نصب روی گوشی و کامپیوتر
- کار آفلاین با Service Worker
- کش هوشمند فایل‌های استاتیک
- آیکون‌های مخصوص و Splash Screen
- پشتیبانی از میانبرهای سریع

### 🔒 امنیت و پایداری
- اعتبارسنجی کامل ورودی‌ها
- مدیریت خطا با پیام‌های دوستانه
- ذخیره‌سازی ایمن در LocalStorage
- پشتیبان‌گیری خودکار داده‌ها
- رمزنگاری داده‌های حساس

## 📋 فهرست مطالب

- [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
- [راهنمای استفاده](#راهنمای-استفاده)
- [ویژگی‌های فنی](#ویژگی‌های-فنی)
- [API مستندات](#api-مستندات)
- [سفارشی‌سازی](#سفارشی‌سازی)
- [عیب‌یابی](#عیب‌یابی)
- [مشارکت](#مشارکت)
- [پشتیبانی](#پشتیبانی)

## 🛠 نصب و راه‌اندازی

### پیش‌نیازها

```bash
# نصب Node.js (نسخه ۱۸ یا بالاتر)
node --version
npm --version

# نصب Wrangler CLI
npm install -g wrangler
```

### مرحله ۱: کلون پروژه

```bash
git clone https://github.com/Farsimen/invoice-generator.git
cd invoice-generator
```

### مرحله ۲: پیکربندی Cloudflare

```bash
# ورود به حساب Cloudflare
wrangler login

# ایجاد KV Namespace برای ذخیره داده‌ها
wrangler kv:namespace create "INVOICE_DATA"
wrangler kv:namespace create "INVOICE_DATA" --preview
```

### مرحله ۳: به‌روزرسانی پیکربندی

ID های تولید شده در مرحله قبل را در فایل `wrangler.toml` قرار دهید:

```toml
[[kv_namespaces]]
binding = "INVOICE_DATA"
preview_id = "YOUR_PREVIEW_ID"
id = "YOUR_PRODUCTION_ID"
```

### مرحله ۴: تست محلی

```bash
# اجرای سامانه به صورت محلی
wrangler dev

# یا استفاده مستقیم از فایل HTML
open index.html
```

### مرحله ۵: دیپلوی نهایی

```bash
# دیپلوی روی Cloudflare Workers
wrangler publish

# یا دیپلوی روی Cloudflare Pages
wrangler pages publish .
```

## 🎯 راهنمای استفاده

### صدور فاکتور جدید

1. **تکمیل اطلاعات شرکت**
   - نام، تلفن، ایمیل و آدرس شرکت
   - اطلاعات بانکی (شماره کارت، حساب، شبا)
   - ذخیره خودکار برای استفاده بعدی

2. **وارد کردن اطلاعات مشتری**
   - نام، تلفن، ایمیل و آدرس مشتری
   - فیلدهای اختیاری

3. **افزودن خدمات**
   - انتخاب از فهرست ۳۵+ خدمت پیش‌تعریف
   - یا وارد کردن خدمات سفارشی
   - تعیین تعداد، قیمت و تخفیف
   - اعمال تخفیف کلی در صورت نیاز

4. **صدور و اشتراک‌گذاری**
   - بررسی پیش‌نمایش فاکتور
   - تولید و دانلود PDF
   - اشتراک در واتساپ، تلگرام یا ایمیل

### مدیریت تاریخچه فاکتورها

- **مشاهده آمار کلی**: تعداد فاکتورها، درآمد کل، فاکتورهای ماه جاری
- **جستجو**: بر اساس شماره فاکتور، نام مشتری یا خدمات
- **فیلتر زمانی**: امروز، هفته گذشته، ماه گذشته، سال گذشته
- **مرتب‌سازی**: بر اساس تاریخ یا مبلغ
- **عملیات**: مشاهده، دانلود مجدد، حذف

## ⚙️ ویژگی‌های فنی

### معماری سیستم

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│  Cloudflare      │───▶│   KV Storage    │
│   (Vanilla JS)  │    │  Workers         │    │   (Optional)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│  LocalStorage   │    │   Service        │
│  (Primary)      │    │   Worker         │
└─────────────────┘    └──────────────────┘
```

### تکنولوژی‌های استفاده شده

| تکنولوژی | کاربرد | نسخه |
|-----------|---------|-------|
| **Vanilla JavaScript** | منطق اصلی برنامه | ES2022 |
| **Cloudflare Workers** | بک‌اند و API | - |
| **Service Worker** | PWA و کش | - |
| **LocalStorage** | ذخیره اصلی داده‌ها | - |
| **jsPDF** | تولید PDF | 2.5.1 |
| **html2canvas** | تبدیل HTML به تصویر | 1.4.1 |
| **Font Awesome** | آیکون‌ها | 6.0.0 |
| **Vazirmatn** | فونت فارسی | latest |

### سازگاری مرورگرها

✅ **Chrome 80+**  
✅ **Firefox 75+**  
✅ **Safari 13+**  
✅ **Edge 80+**  
✅ **موبایل (iOS/Android)**

## 🔌 API مستندات

### Endpoints

#### Health Check
```http
GET /api/health
```

پاسخ:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### ذخیره فاکتور
```http
POST /api/invoices
Content-Type: application/json

{
  "number": "404727-001",
  "customerName": "نام مشتری",
  "services": [...],
  "grandTotal": 1500000
}
```

#### دریافت فاکتور
```http
GET /api/invoices/{invoiceId}
```

#### فهرست فاکتورها
```http
GET /api/invoices?limit=50&cursor=abc123
```

#### حذف فاکتور
```http
DELETE /api/invoices/{invoiceId}
```

## 🎨 سفارشی‌سازی

### تغییر خدمات پیش‌تعریف

در فایل `index.html`، بخش `<optgroup>` را ویرایش کنید:

```html
<optgroup label="خدمات جدید">
    <option value="خدمت جدید ۱">خدمت جدید ۱</option>
    <option value="خدمت جدید ۲">خدمت جدید ۲</option>
</optgroup>
```

### تغییر نرخ مالیات

در فایل `script.js`، متد `getTax()` را تغییر دهید:

```javascript
getTax() {
    const taxableAmount = this.getSubtotal() - this.getTotalDiscount();
    return taxableAmount * 0.09; // تغییر از 10% به 9%
}
```

### تغییر رنگ‌ها و تم

در فایل `styles.css`:

```css
:root {
    --accent-color: #10b981; /* سبز به جای آبی */
    --success-color: #3b82f6; /* آبی به جای سبز */
    --danger-color: #f59e0b;  /* نارنجی به جای قرمز */
}
```

### افزودن لوگو

در بخش تولید فاکتور در `script.js`:

```javascript
const invoiceHTML = `
  <div class="invoice-header">
    <img src="logo.png" alt="لوگو شرکت" class="company-logo">
    <!-- سایر محتوا -->
  </div>
`;
```

## 🐛 عیب‌یابی

### مشکلات رایج

#### خطای "Service Worker registration failed"
```bash
# بررسی وجود فایل sw.js
ls -la sw.js

# تست Service Worker در محیط HTTPS
# (Service Worker فقط روی HTTPS کار می‌کند)
```

#### خطای "jsPDF is not defined"
```html
<!-- اطمینان از بارگذاری صحیح کتابخانه -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

#### مشکل فونت فارسی در PDF
```javascript
// اضافه کردن فونت فارسی به jsPDF
const { jsPDF } = window.jspdf;
const pdf = new jsPDF({
  orientation: 'portrait',
  unit: 'mm', 
  format: 'a4'
});

// استفاده از html2canvas برای حفظ فونت‌ها
const canvas = await html2canvas(element, {
  useCORS: true,
  allowTaint: true
});
```

### ابزارهای دیباگ

```javascript
// فعال‌سازی حالت دیباگ
localStorage.setItem('debug', 'true');

// مشاهده لاگ‌های سیستم
console.log('Invoice Generator Debug Mode');
```

## 🤝 مشارکت در پروژه

### راهنمای Contribution

1. **Fork کردن پروژه**
```bash
git clone https://github.com/your-username/invoice-generator.git
cd invoice-generator
```

2. **ایجاد Branch جدید**
```bash
git checkout -b feature/new-feature
```

3. **انجام تغییرات**
```bash
# کدنویسی تغییرات مطلوب
git add .
git commit -m "feat: add new feature"
```

4. **ارسال Pull Request**
```bash
git push origin feature/new-feature
```

### استانداردهای کدنویسی

- استفاده از **Semantic Commit Messages**
- رعایت **ESLint** rules
- نوشتن **JSDoc** برای توابع
- تست **Cross-browser compatibility**
- حفظ **RTL direction** برای فارسی

## 📈 نقشه راه آینده

### نسخه ۲.۱ (Q1 2024)
- [ ] پشتیبانی چندزبانه کامل
- [ ] تولید فایل Word (DOCX)
- [ ] سیستم قالب‌های فاکتور
- [ ] ایمپورت/اکسپورت تنظیمات
- [ ] API کامل برای اتصال خارجی

### نسخه ۲.۲ (Q2 2024)
- [ ] پنل مدیریت پیشرفته
- [ ] گزارشات گرافیکی
- [ ] سیستم یادآوری پرداخت
- [ ] اتصال به درگاه‌های پرداخت
- [ ] سینک ابری داده‌ها

### نسخه ۳.۰ (Q3 2024)
- [ ] نسخه Desktop با Electron
- [ ] اپلیکیشن موبایل Native
- [ ] هوش مصنوعی برای پیش‌بینی فروش
- [ ] اتصال به سیستم‌های حسابداری
- [ ] پشتیبانی از بلاک‌چین

## 📞 پشتیبانی و تماس

### راه‌های تماس

- **GitHub Issues**: [گزارش باگ](https://github.com/Farsimen/invoice-generator/issues/new?template=bug_report.md)
- **Feature Request**: [درخواست ویژگی جدید](https://github.com/Farsimen/invoice-generator/issues/new?template=feature_request.md)
- **Discussions**: [بحث و گفتگو](https://github.com/Farsimen/invoice-generator/discussions)
- **Email**: [توسعه‌دهنده](mailto:79488643+Farsimen@users.noreply.github.com)

### منابع مفید

- [مستندات Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [راهنمای PWA](https://web.dev/progressive-web-apps/)
- [آموزش jsPDF](https://artskydj.github.io/jsPDF/docs/)
- [مستندات Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 📄 مجوز

این پروژه تحت مجوز **MIT License** منتشر شده است. برای جزئیات بیشتر فایل [LICENSE](LICENSE) را مطالعه کنید.

## 🏆 سپاسگزاری

**کتابخانه‌های استفاده شده:**
- [jsPDF](https://github.com/parallax/jsPDF) - تولید PDF
- [html2canvas](https://github.com/niklasvh/html2canvas) - تبدیل HTML به Canvas
- [Font Awesome](https://fontawesome.com/) - آیکون‌ها
- [Vazirmatn](https://github.com/rastikerdar/vazirmatn) - فونت فارسی

**حامیان پروژه:**
- Cloudflare برای ارائه پلتفرم Workers
- جامعه توسعه‌دهندگان ایرانی
- کاربران و تست‌کنندگان عزیز

---

<div align="center">

**ساخته شده با ❤️ برای جامعه کسب‌وکار ایران**

[![GitHub stars](https://img.shields.io/github/stars/Farsimen/invoice-generator?style=social)](https://github.com/Farsimen/invoice-generator/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Farsimen/invoice-generator?style=social)](https://github.com/Farsimen/invoice-generator/network)
[![GitHub watchers](https://img.shields.io/github/watchers/Farsimen/invoice-generator?style=social)](https://github.com/Farsimen/invoice-generator/watchers)

[⭐ ستاره دادن](https://github.com/Farsimen/invoice-generator/stargazers) • [🐛 گزارش باگ](https://github.com/Farsimen/invoice-generator/issues) • [💡 ایده جدید](https://github.com/Farsimen/invoice-generator/discussions) • [📖 مستندات](https://github.com/Farsimen/invoice-generator/wiki)

</div>

---

> **نکته امنیتی مهم**: این سامانه کاملاً بر روی مرورگر شما اجرا می‌شود و هیچ اطلاعات شخصی یا تجاری‌تان به سرور خارجی ارسال نمی‌شود. تمام داده‌ها در مرورگر شما ذخیره می‌شوند.