/**
 * Enhanced Invoice Generator with History, Validation, and PWA Support
 * Author: Farsimen
 * Version: 2.0.2
 */

class InvoiceGenerator {
  constructor() {
    this.services = [];
    this.invoiceCounter = this.getInvoiceCounter();
    this.currentInvoiceNumber = null;
    this.savedInvoices = this.getSavedInvoices();
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.filteredInvoices = [];
    this.autoSaveInterval = null;
    
    this.init();
  }

  // ========== INITIALIZATION ==========
  init() {
    this.bindEvents();
    this.restoreData();
    this.applyTheme();
    this.render();
    this.startAutoSave();
    this.setupValidation();
    this.setupPWA();
  }

  bindEvents() {
    const $ = sel => document.querySelector(sel);
    const $$ = sel => document.querySelectorAll(sel);
    this.$ = $;
    this.$$ = $$;

    // Navigation
    $('#viewHistoryBtn')?.addEventListener('click', () => this.showHistory());
    $('#backToMainBtn')?.addEventListener('click', () => this.showMain());
    
    // Theme
    $('#themeToggle')?.addEventListener('click', () => this.toggleTheme());
    
    // Services
    $('#addService')?.addEventListener('click', () => this.addService());
    $('#serviceSelect')?.addEventListener('change', () => this.handleServiceSelect());
    
    // Input validation and formatting
    $('#cardNumber')?.addEventListener('input', this.formatCardNumber.bind(this));
    $('#ibanNumber')?.addEventListener('input', this.formatIban.bind(this));
    
    // Real-time rendering
    $$('input, textarea, select').forEach(el => {
      el.addEventListener('input', this.debounce(() => this.render(), 300));
    });
    
    // Invoice actions
    $('#saveInvoice')?.addEventListener('click', () => this.saveInvoice());
    $('#generatePDF')?.addEventListener('click', () => this.downloadPDF());
    $('#shareEmail')?.addEventListener('click', () => this.share('email'));
    $('#shareWhatsApp')?.addEventListener('click', () => this.share('whatsapp'));
    $('#shareTelegram')?.addEventListener('click', () => this.share('telegram'));
    
    // History management
    $('#clearHistoryBtn')?.addEventListener('click', () => this.clearHistory());
    $('#exportHistoryBtn')?.addEventListener('click', () => this.exportHistory());
    $('#searchInvoices')?.addEventListener('input', this.debounce(() => this.filterInvoices(), 300));
    $('#filterPeriod')?.addEventListener('change', () => this.filterInvoices());
    $('#sortBy')?.addEventListener('change', () => this.filterInvoices());
    
    // Pagination
    $('#prevPageBtn')?.addEventListener('click', () => this.changePage(-1));
    $('#nextPageBtn')?.addEventListener('click', () => this.changePage(1));

    // Global error handler
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleGlobalError.bind(this));
  }

  // ... (rest of unchanged code)

  // ========== INVOICE RENDERING ==========
  render() {
    try {
      const invoiceNumber = this.getInvoiceNumber();
      const today = this.getPersianDate();
      
      // Company info
      const companyName = this.$('#companyName')?.value || 'نام شرکت';
      const companyPhone = this.$('#companyPhone')?.value;
      const companyEmail = this.$('#companyEmail')?.value;
      const companyAddress = this.$('#companyAddress')?.value;
      
      // Banking info
      const cardNumber = this.$('#cardNumber')?.value;
      const accountNumber = this.$('#accountNumber')?.value;
      const ibanNumber = this.$('#ibanNumber')?.value;
      
      // Customer info
      const customerName = this.$('#customerName')?.value || 'نام مشتری';
      const customerPhone = this.$('#customerPhone')?.value;
      const customerEmail = this.$('#customerEmail')?.value;
      const customerAddress = this.$('#customerAddress')?.value;

      // Notes
      const notes = this.$('#invoiceNotes')?.value || '';
      
      // Header rows (per request): row1 customer vs invoice info, row2 seller vs banking
      const headerRow1Right = `
        <div class="customer-info">
          <div class="info-title">اطلاعات خریدار</div>
          <div class="info-content">
            <strong>${customerName}</strong><br>
            ${customerPhone ? `تلفن: ${customerPhone}<br>` : ''}
            ${customerEmail ? `ایمیل: ${customerEmail}<br>` : ''}
            ${customerAddress ? `آدرس: ${customerAddress}` : ''}
          </div>
        </div>`;

      const headerRow1Left = `
        <div class="invoice-info-section">
          <div class="invoice-title">فاکتور</div>
          <div class="invoice-number">شماره: ${invoiceNumber}</div>
          <div class="invoice-date">تاریخ: ${today}</div>
        </div>`;

      const headerRow2Right = `
        <div class="company-info">
          <div class="info-title">اطلاعات فروشنده</div>
          <div class="info-content">
            <strong>${companyName}</strong><br>
            ${companyPhone ? `تلفن: ${companyPhone}<br>` : ''}
            ${companyEmail ? `ایمیل: ${companyEmail}<br>` : ''}
            ${companyAddress ? `آدرس: ${companyAddress}` : ''}
          </div>
        </div>`;

      const headerRow2Left = (cardNumber || accountNumber || ibanNumber) ? `
        <div class="banking-section">
          <div class="info-title">اطلاعات بانکی</div>
          <div class="banking-info">
            ${cardNumber ? `<div class='bank-item'><span class='bank-label'>شماره کارت:</span><span>${cardNumber}</span></div>` : ''}
            ${accountNumber ? `<div class='bank-item'><span class='bank-label'>شماره حساب:</span><span>${accountNumber}</span></div>` : ''}
            ${ibanNumber ? `<div class='bank-item'><span class='bank-label'>شماره شبا:</span><span>${ibanNumber}</span></div>` : ''}
          </div>
        </div>` : '';

      // Generate services table
      const servicesRows = this.services.map((service, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${service.name}</td>
          <td>${service.quantity}</td>
          <td>${this.formatNumber(service.price)}</td>
          <td>${service.discount > 0 ? service.discount + '%' : '-'}</td>
          <td>${this.formatNumber(service.total)}</td>
        </tr>
      `).join('');

      const notesHTML = notes ? `
        <div class="invoice-notes">
          <div class="notes-title"><i class="fas fa-info-circle"></i> توضیحات</div>
          <div class="notes-content">${notes}</div>
        </div>` : '';
      
      const invoiceHTML = `
        <div class="invoice-header">
          <div class="customer-section">${headerRow1Right}</div>
          <div class="invoice-info-section">${headerRow1Left}</div>
        </div>

        <div class="invoice-secondary">
          <div class="seller-section">${headerRow2Right}</div>
          <div class="banking-section">${headerRow2Left}</div>
        </div>
        
        ${this.services.length ? `
          <table class='services-table'>
            <thead>
              <tr>
                <th>ردیف</th>
                <th>شرح خدمات</th>
                <th>تعداد</th>
                <th>قیمت واحد (تومان)</th>
                <th>تخفیف</th>
                <th>مبلغ (تومان)</th>
              </tr>
            </thead>
            <tbody>
              ${servicesRows}
            </tbody>
          </table>

          ${notesHTML}
          
          <div class='invoice-calculations'>
            <div class='calculations-box'>
              <div class='calc-row'>
                <span>جمع کل:</span>
                <span>${this.formatNumber(this.getSubtotal())} تومان</span>
              </div>
              ${this.getTotalDiscount() > 0 ? `
                <div class='calc-row discount-calc'>
                  <span>تخفیف کلی:</span>
                  <span>-${this.formatNumber(this.getTotalDiscount())} تومان</span>
                </div>
              ` : ''}
              <div class='calc-row tax-calc'>
                <span>مالیات (10%):</span>
                <span>+${this.formatNumber(this.getTax())} تومان</span>
              </div>
              <div class='calc-row'>
                <span>مبلغ کل قابل پرداخت:</span>
                <span>${this.formatNumber(this.getGrandTotal())} تومان</span>
              </div>
            </div>
          </div>
        ` : `
          <div class="empty-state">
            <i class="fas fa-shopping-cart"></i>
            <h3>هیچ خدمتی اضافه نشده است</h3>
            <p>برای شروع، خدمت مورد نظر خود را از لیست انتخاب کنید یا به صورت سفارشی وارد کنید</p>
          </div>
        `}
      `;
      
      const previewElement = this.$('#invoicePreview');
      if (previewElement) {
        previewElement.innerHTML = invoiceHTML;
      }
      
      // Render services list in form
      this.renderServicesList();
      
    } catch (error) {
      this.handleError('خطا در رندر فاکتور', error);
    }
  }

  // ... rest of previous script (saveInvoice, downloadPDF, etc.) remains unchanged
}

// Global toast function
function hideToast(toastId) {
  if (window.invoiceGenerator) {
    window.invoiceGenerator.hideToast(toastId);
  }
}

let invoiceGenerator;

document.addEventListener('DOMContentLoaded', () => {
  try {
    invoiceGenerator = new InvoiceGenerator();
    window.invoiceGenerator = invoiceGenerator;
    console.log('Invoice Generator v2.0.2 initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Invoice Generator:', error);
    alert('خطا در بارگذاری برنامه. لطفاً صفحه را مجدداً بارگذاری کنید.');
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  });
}

window.addEventListener('beforeunload', () => {
  if (invoiceGenerator) {
    invoiceGenerator.persistData();
    invoiceGenerator.destroy();
  }
});