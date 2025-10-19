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

  // ========== PWA SETUP ==========
  setupPWA() {
    let deferredPrompt;
    const installPrompt = this.$('#pwaInstallPrompt');
    const installBtn = this.$('#installPWA');
    const dismissBtn = this.$('#dismissPWA');

    // Handle beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show custom install prompt after 5 seconds
      setTimeout(() => {
        if (installPrompt && !localStorage.getItem('pwa-dismissed')) {
          installPrompt.style.display = 'block';
        }
      }, 5000);
    });

    // Handle install button click
    installBtn?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
          this.showToast('برنامه با موفقیت نصب شد', 'success');
        }
        
        deferredPrompt = null;
        installPrompt.style.display = 'none';
      }
    });

    // Handle dismiss button click
    dismissBtn?.addEventListener('click', () => {
      localStorage.setItem('pwa-dismissed', 'true');
      installPrompt.style.display = 'none';
    });

    // Handle app installation
    window.addEventListener('appinstalled', () => {
      this.showToast('برنامه با موفقیت نصب شد', 'success');
      installPrompt.style.display = 'none';
    });
  }

  // ========== VALIDATION ==========
  setupValidation() {
    const validationRules = {
      companyName: { required: false, minLength: 2 },
      companyPhone: { required: false, pattern: /^[0-9+\-\s()]+$/ },
      companyEmail: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      customerName: { required: false, minLength: 2 },
      customerPhone: { required: false, pattern: /^[0-9+\-\s()]+$/ },
      customerEmail: { required: false, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      cardNumber: { required: false, pattern: /^[0-9\-]+$/, length: 19 },
      ibanNumber: { required: false, pattern: /^IR[0-9\-]+$/, maxLength: 26 }
    };

    Object.keys(validationRules).forEach(fieldId => {
      const field = this.$(`#${fieldId}`);
      if (field) {
        field.addEventListener('blur', () => this.validateField(fieldId, validationRules[fieldId]));
      }
    });
  }

  validateField(fieldId, rules) {
    const field = this.$(`#${fieldId}`);
    const value = field?.value?.trim();
    
    if (!field) return true;

    let isValid = true;
    let errorMessage = '';

    if (rules.required && !value) {
      isValid = false;
      errorMessage = 'این فیلد الزامی است';
    } else if (value) {
      if (rules.minLength && value.length < rules.minLength) {
        isValid = false;
        errorMessage = `حداقل ${rules.minLength} کاراکتر وارد کنید`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        isValid = false;
        errorMessage = `حداکثر ${rules.maxLength} کاراکتر مجاز است`;
      }
      if (rules.length && value.length !== rules.length) {
        isValid = false;
        errorMessage = `باید دقیقاً ${rules.length} کاراکتر باشد`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        isValid = false;
        errorMessage = 'فرمت وارد شده صحیح نیست';
      }
    }

    this.showFieldValidation(field, isValid, errorMessage);
    return isValid;
  }

  showFieldValidation(field, isValid, message) {
    field.classList.toggle('valid', isValid && field.value.trim());
    field.classList.toggle('invalid', !isValid);
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.validation-error');
    if (existingError) {
      existingError.remove();
    }

    // Show error message
    if (!isValid && message) {
      const errorEl = document.createElement('div');
      errorEl.className = 'validation-error';
      errorEl.textContent = message;
      errorEl.style.color = 'var(--danger-color)';
      errorEl.style.fontSize = '0.85rem';
      errorEl.style.marginTop = '4px';
      field.parentNode.appendChild(errorEl);
    }
  }

  // ========== PERSIAN DATE UTILITIES ==========
  getPersianParts(date) {
    try {
      const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
        year: '2-digit', month: '2-digit', day: '2-digit'
      });
      const parts = fmt.formatToParts(date);
      const y = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
      const m = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
      const d = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
      return { y, m, d };
    } catch (error) {
      this.handleError('خطا در تبدیل تاریخ', error);
      const now = new Date();
      return { y: now.getFullYear() % 100, m: now.getMonth() + 1, d: now.getDate() };
    }
  }

  getDateStr() {
    const { y, m, d } = this.getPersianParts(new Date());
    return y.toString().padStart(2, '0') + 
           m.toString().padStart(2, '0') + 
           d.toString().padStart(2, '0');
  }

  getPersianDate(date = new Date()) {
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch (error) {
      return new Date().toLocaleDateString('fa-IR');
    }
  }

  // ========== INVOICE NUMBER MANAGEMENT ==========
  getInvoiceNumber() {
    if (this.currentInvoiceNumber) return this.currentInvoiceNumber;
    
    const code = this.getDateStr();
    this.currentInvoiceNumber = `${code}-${this.invoiceCounter.toString().padStart(3, '0')}`;
    return this.currentInvoiceNumber;
  }

  finalizeInvoiceNumber() {
    if (this.currentInvoiceNumber) {
      this.invoiceCounter++;
      localStorage.setItem('invoiceCounter', String(this.invoiceCounter));
      this.currentInvoiceNumber = null;
      return true;
    }
    return false;
  }

  getInvoiceCounter() {
    try {
      const counter = localStorage.getItem('invoiceCounter');
      return counter ? parseInt(counter, 10) : 1;
    } catch (error) {
      this.handleError('خطا در بارگذاری شمارنده فاکتور', error);
      return 1;
    }
  }

  // ========== DATA PERSISTENCE ==========
  restoreData() {
    try {
      const data = localStorage.getItem('invoiceData');
      if (!data) return;
      
      const parsed = JSON.parse(data);
      
      // Restore form fields
      const fields = [
        'companyName', 'companyPhone', 'companyEmail', 'companyAddress',
        'cardNumber', 'accountNumber', 'ibanNumber',
        'customerName', 'customerPhone', 'customerEmail', 'customerAddress',
        'totalDiscount', 'invoiceNotes'
      ];
      
      fields.forEach(field => {
        const element = this.$(`#${field}`);
        if (element && parsed[field]) {
          element.value = parsed[field];
        }
      });
      
      // Restore services
      if (Array.isArray(parsed.services)) {
        this.services = parsed.services;
      }
      
      this.showToast('اطلاعات بازیابی شد', 'success');
    } catch (error) {
      this.handleError('خطا در بازیابی اطلاعات', error);
    }
  }

  persistData() {
    try {
      const data = {
        timestamp: Date.now(),
        services: this.services
      };
      
      // Save form fields
      const fields = [
        'companyName', 'companyPhone', 'companyEmail', 'companyAddress',
        'cardNumber', 'accountNumber', 'ibanNumber',
        'customerName', 'customerPhone', 'customerEmail', 'customerAddress',
        'totalDiscount', 'invoiceNotes'
      ];
      
      fields.forEach(field => {
        const element = this.$(`#${field}`);
        if (element) {
          data[field] = element.value;
        }
      });
      
      localStorage.setItem('invoiceData', JSON.stringify(data));
    } catch (error) {
      this.handleError('خطا در ذخیره اطلاعات', error);
    }
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      this.persistData();
    }, 10000); // Every 10 seconds
  }

  // ========== THEME MANAGEMENT ==========
  toggleTheme() {
    const body = document.body;
    const themeIcon = this.$('#themeToggle i');
    
    if (body.hasAttribute('data-theme')) {
      body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      themeIcon.className = 'fas fa-moon';
    } else {
      body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      themeIcon.className = 'fas fa-sun';
    }
  }

  applyTheme() {
    const theme = localStorage.getItem('theme');
    const themeIcon = this.$('#themeToggle i');
    
    if (theme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
      if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
  }

  // ========== INPUT FORMATTING ==========
  formatCardNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1-');
    e.target.value = value.slice(0, 19);
  }

  formatIban(e) {
    let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (!value.startsWith('IR')) {
      value = 'IR' + value;
    }
    if (value.length > 2) {
      value = value.slice(0, 2) + value.slice(2).replace(/(\d{4})(?=\d)/g, '$1-');
    }
    e.target.value = value.slice(0, 26);
  }

  // ========== SERVICE MANAGEMENT ==========
  handleServiceSelect() {
    const serviceSelect = this.$('#serviceSelect');
    const customService = this.$('#customService');
    
    if (serviceSelect?.value && customService) {
      customService.value = serviceSelect.value;
      serviceSelect.value = '';
      customService.focus();
    }
  }

  addService() {
    try {
      const serviceName = (this.$('#customService')?.value?.trim() || this.$('#serviceSelect')?.value);
      const quantity = parseInt(this.$('#serviceQuantity')?.value || '1', 10);
      const price = parseFloat(this.$('#servicePrice')?.value || '0');
      const discount = parseFloat(this.$('#serviceDiscount')?.value || '0');
      
      // Validation
      if (!serviceName) {
        this.showToast('نام خدمت را وارد کنید', 'error');
        return;
      }
      
      if (price <= 0) {
        this.showToast('قیمت باید بیشتر از صفر باشد', 'error');
        return;
      }
      
      if (quantity <= 0) {
        this.showToast('تعداد باید بیشتر از صفر باشد', 'error');
        return;
      }
      
      if (discount < 0 || discount > 100) {
        this.showToast('تخفیف باید بین ۰ تا ۱۰۰ درصد باشد', 'error');
        return;
      }
      
      const baseAmount = quantity * price;
      const discountAmount = baseAmount * discount / 100;
      const total = baseAmount - discountAmount;
      
      this.services.push({
        id: Date.now() + Math.random(),
        name: serviceName,
        quantity,
        price,
        discount,
        baseAmount,
        discountAmount,
        total
      });
      
      // Clear form
      ['#customService', '#serviceSelect', '#servicePrice'].forEach(id => {
        const el = this.$(id);
        if (el) el.value = '';
      });
      
      const quantityEl = this.$('#serviceQuantity');
      const discountEl = this.$('#serviceDiscount');
      if (quantityEl) quantityEl.value = '1';
      if (discountEl) discountEl.value = '0';
      
      this.render();
      this.showToast('خدمت اضافه شد', 'success');
      
    } catch (error) {
      this.handleError('خطا در افزودن خدمت', error);
    }
  }

  removeService(id) {
    try {
      this.services = this.services.filter(s => s.id !== id);
      this.render();
      this.showToast('خدمت حذف شد', 'success');
    } catch (error) {
      this.handleError('خطا در حذف خدمت', error);
    }
  }

  // ========== CALCULATIONS ==========
  formatNumber(num) {
    try {
      return new Intl.NumberFormat('fa-IR').format(Math.round(num));
    } catch (error) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
  }

  getSubtotal() {
    return this.services.reduce((total, service) => total + service.total, 0);
  }

  getTotalDiscount() {
    const percentage = parseFloat(this.$('#totalDiscount')?.value || '0');
    return this.getSubtotal() * percentage / 100;
  }

  getTax() {
    const taxableAmount = this.getSubtotal() - this.getTotalDiscount();
    return taxableAmount * 0.10; // 10% tax
  }

  getGrandTotal() {
    return this.getSubtotal() - this.getTotalDiscount() + this.getTax();
  }

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

  renderServicesList() {
    const servicesListEl = this.$('#servicesList');
    if (!servicesListEl) return;
    
    if (this.services.length === 0) {
      servicesListEl.innerHTML = '';
      return;
    }
    
    const servicesHTML = this.services.map(service => `
      <div class="service-item">
        <div class="service-details">
          <div class="service-name">${service.name}</div>
          <div class="service-info">
            ${service.quantity} × ${this.formatNumber(service.price)} تومان
            ${service.discount > 0 ? ` - ${service.discount}% تخفیف` : ''}
          </div>
        </div>
        <div class="service-total">${this.formatNumber(service.total)} تومان</div>
        <button class="remove-btn" onclick="invoiceGenerator.removeService(${service.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `).join('');
    
    servicesListEl.innerHTML = servicesHTML;
  }

  // ========== SAVE INVOICE ==========
  async saveInvoice() {
    if (this.services.length === 0) {
      this.showToast('لطفاً حداقل یک خدمت اضافه کنید', 'error');
      return;
    }
    
    try {
      this.showLoading(true);
      
      // Save invoice to history without generating PDF
      await this.saveInvoiceToHistory(false);
      
      // Finalize invoice number
      this.finalizeInvoiceNumber();
      
      // Clear current invoice
      this.clearCurrentInvoice();
      
      this.showToast('فاکتور با موفقیت ثبت شد', 'success');
      
    } catch (error) {
      this.handleError('خطا در ثبت فاکتور', error);
    } finally {
      this.showLoading(false);
    }
  }

  clearCurrentInvoice() {
    // Clear customer info (keep company info)
    ['customerName', 'customerPhone', 'customerEmail', 'customerAddress'].forEach(field => {
      const element = this.$(`#${field}`);
      if (element) element.value = '';
    });
    
    // Clear services, total discount, and notes
    this.services = [];
    const totalDiscountEl = this.$('#totalDiscount');
    const notesEl = this.$('#invoiceNotes');
    if (totalDiscountEl) totalDiscountEl.value = '0';
    if (notesEl) notesEl.value = '';
    
    this.render();
  }

  // ========== PDF GENERATION ==========
  async downloadPDF() {
    if (this.services.length === 0) {
      this.showToast('لطفاً حداقل یک خدمت اضافه کنید', 'error');
      return;
    }
    
    try {
      this.showLoading(true);
      
      const canvas = await this.generateCanvas();
      const pdf = await this.generatePDFFromCanvas(canvas);
      
      const invoiceNumber = this.getInvoiceNumber();
      pdf.save(`فاکتور-${invoiceNumber}.pdf`);
      
      // Save invoice to history
      await this.saveInvoiceToHistory(true);
      
      // Finalize invoice number
      this.finalizeInvoiceNumber();
      
      this.showToast('فایل PDF با موفقیت تولید شد', 'success');
      
    } catch (error) {
      this.handleError('خطا در تولید PDF', error);
    } finally {
      this.showLoading(false);
    }
  }

  async generateCanvas() {
    const previewElement = this.$('#invoicePreview');
    if (!previewElement) {
      throw new Error('المان پیش‌نمایش فاکتور یافت نشد');
    }
    
    // Temporarily enhance watermark for PDF
    this.enhanceWatermarkForPDF(true);
    
    const canvas = await html2canvas(previewElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    // Restore normal watermark
    this.enhanceWatermarkForPDF(false);
    
    return canvas;
  }

  enhanceWatermarkForPDF(enhance = true) {
    const previewElement = this.$('#invoicePreview');
    if (!previewElement) return;
    
    if (enhance) {
      previewElement.classList.add('pdf-watermark');
    } else {
      previewElement.classList.remove('pdf-watermark');
    }
  }

  async generatePDFFromCanvas(canvas) {
    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf;
  }

  // ========== INVOICE HISTORY ==========
  async saveInvoiceToHistory(includePDF = false) {
    try {
      const invoiceData = {
        id: Date.now(),
        number: this.getInvoiceNumber(),
        date: new Date().toISOString(),
        persianDate: this.getPersianDate(),
        companyName: this.$('#companyName')?.value || 'شرکت',
        customerName: this.$('#customerName')?.value || 'مشتری',
        services: [...this.services],
        subtotal: this.getSubtotal(),
        totalDiscount: this.getTotalDiscount(),
        tax: this.getTax(),
        grandTotal: this.getGrandTotal(),
        servicesCount: this.services.length,
        servicesText: this.services.map(s => s.name).join('، '),
        notes: this.$('#invoiceNotes')?.value || '',
        hasPDF: includePDF,
        companyInfo: {
          phone: this.$('#companyPhone')?.value || '',
          email: this.$('#companyEmail')?.value || '',
          address: this.$('#companyAddress')?.value || ''
        },
        customerInfo: {
          phone: this.$('#customerPhone')?.value || '',
          email: this.$('#customerEmail')?.value || '',
          address: this.$('#customerAddress')?.value || ''
        },
        bankingInfo: {
          cardNumber: this.$('#cardNumber')?.value || '',
          accountNumber: this.$('#accountNumber')?.value || '',
          ibanNumber: this.$('#ibanNumber')?.value || ''
        }
      };
      
      this.savedInvoices.unshift(invoiceData);
      
      // Keep only last 1000 invoices to prevent storage overflow
      if (this.savedInvoices.length > 1000) {
        this.savedInvoices = this.savedInvoices.slice(0, 1000);
      }
      
      localStorage.setItem('savedInvoices', JSON.stringify(this.savedInvoices));
      
    } catch (error) {
      this.handleError('خطا در ذخیره فاکتور', error);
    }
  }

  getSavedInvoices() {
    try {
      const data = localStorage.getItem('savedInvoices');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      this.handleError('خطا در بارگذاری تاریخچه فاکتورها', error);
      return [];
    }
  }

  // ========== NAVIGATION ==========
  showHistory() {
    const mainContent = this.$('#mainContent');
    const historySection = this.$('#historySection');
    
    if (mainContent && historySection) {
      mainContent.style.display = 'none';
      historySection.style.display = 'block';
      
      this.renderHistoryStats();
      this.filterInvoices();
    }
  }

  showMain() {
    const mainContent = this.$('#mainContent');
    const historySection = this.$('#historySection');
    
    if (mainContent && historySection) {
      mainContent.style.display = 'block';
      historySection.style.display = 'none';
      this.render();
    }
  }

  // ========== HISTORY MANAGEMENT ==========
  renderHistoryStats() {
    const totalInvoices = this.savedInvoices.length;
    const totalRevenue = this.savedInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    
    const thisMonth = new Date();
    const thisMonthInvoices = this.savedInvoices.filter(inv => {
      const invDate = new Date(inv.date);
      return invDate.getMonth() === thisMonth.getMonth() && 
             invDate.getFullYear() === thisMonth.getFullYear();
    }).length;
    
    const totalEl = this.$('#totalInvoices');
    const revenueEl = this.$('#totalRevenue');
    const monthEl = this.$('#thisMonthInvoices');
    
    if (totalEl) totalEl.textContent = this.formatNumber(totalInvoices);
    if (revenueEl) revenueEl.textContent = this.formatNumber(totalRevenue);
    if (monthEl) monthEl.textContent = this.formatNumber(thisMonthInvoices);
  }

  filterInvoices() {
    const searchTerm = this.$('#searchInvoices')?.value?.toLowerCase() || '';
    const period = this.$('#filterPeriod')?.value || 'all';
    const sortBy = this.$('#sortBy')?.value || 'date-desc';
    
    let filtered = [...this.savedInvoices];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.number.toLowerCase().includes(searchTerm) ||
        inv.customerName.toLowerCase().includes(searchTerm) ||
        inv.companyName.toLowerCase().includes(searchTerm) ||
        inv.servicesText.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply period filter
    if (period !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(inv => new Date(inv.date) >= startDate);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'date-desc':
          return new Date(b.date) - new Date(a.date);
        case 'amount-asc':
          return a.grandTotal - b.grandTotal;
        case 'amount-desc':
          return b.grandTotal - a.grandTotal;
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
    
    this.filteredInvoices = filtered;
    this.currentPage = 1;
    this.renderHistoryList();
  }

  renderHistoryList() {
    const historyList = this.$('#historyList');
    if (!historyList) return;
    
    if (this.filteredInvoices.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>فاکتوری یافت نشد</h3>
          <p>برای مشاهدع فاکتورها، ابتدا فاکتور جدیدی ایجاد کنید</p>
        </div>
      `;
      this.updatePagination();
      return;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const pageInvoices = this.filteredInvoices.slice(startIndex, endIndex);
    
    const historyHTML = pageInvoices.map(invoice => `
      <div class="history-item">
        <div class="history-item-info">
          <div class="history-item-number">${invoice.number}</div>
          <div class="history-item-customer">${invoice.customerName}</div>
          <div class="history-item-date">${invoice.persianDate}</div>
          <div class="history-item-services">${invoice.servicesCount} خدمت: ${invoice.servicesText}</div>
          ${!invoice.hasPDF ? '<div class="history-item-status">فقط ثبت شده (بدون PDF)</div>' : ''}
        </div>
        <div class="history-item-amount">${this.formatNumber(invoice.grandTotal)} تومان</div>
        <div class="history-item-actions">
          <button class="history-btn" onclick="invoiceGenerator.viewInvoice(${invoice.id})" title="مشاهده">
            <i class="fas fa-eye"></i>
          </button>
          <button class="history-btn success" onclick="invoiceGenerator.downloadInvoiceAgain(${invoice.id})" title="دانلود PDF">
            <i class="fas fa-download"></i>
          </button>
          <button class="history-btn danger" onclick="invoiceGenerator.deleteInvoice(${invoice.id})" title="حذف">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
    
    historyList.innerHTML = historyHTML;
    this.updatePagination();
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
    
    const prevBtn = this.$('#prevPageBtn');
    const nextBtn = this.$('#nextPageBtn');
    const pageInfo = this.$('#pageInfo');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= totalPages;
    }
    
    if (pageInfo) {
      pageInfo.textContent = totalPages > 0 ? 
        `صفحه ${this.currentPage} از ${totalPages}` : 'صفحه 1 از 1';
    }
  }

  changePage(direction) {
    const totalPages = Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
    const newPage = this.currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
      this.currentPage = newPage;
      this.renderHistoryList();
    }
  }

  viewInvoice(invoiceId) {
    const invoice = this.savedInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      this.showToast('فاکتور یافت نشد', 'error');
      return;
    }
    
    // Load invoice data to form
    this.services = [...invoice.services];
    
    // Load customer and company info if available
    if (invoice.companyInfo) {
      Object.keys(invoice.companyInfo).forEach(key => {
        const element = this.$(`#company${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (element) element.value = invoice.companyInfo[key];
      });
    }
    
    if (invoice.customerInfo) {
      Object.keys(invoice.customerInfo).forEach(key => {
        const element = this.$(`#customer${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (element) element.value = invoice.customerInfo[key];
      });
    }
    
    if (invoice.bankingInfo) {
      Object.keys(invoice.bankingInfo).forEach(key => {
        const element = this.$(`#${key}`);
        if (element) element.value = invoice.bankingInfo[key];
      });
    }

    // Load notes
    const notesEl = this.$('#invoiceNotes');
    if (notesEl && invoice.notes) {
      notesEl.value = invoice.notes;
    }
    
    // Switch to main view
    this.showMain();
    this.showToast('فاکتور بارگذاری شد', 'success');
  }

  async downloadInvoiceAgain(invoiceId) {
    const invoice = this.savedInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      this.showToast('فاکتور یافت نشد', 'error');
      return;
    }
    
    // Temporarily load the invoice to generate PDF
    const originalServices = [...this.services];
    const originalFields = {};
    
    // Backup current form state
    const formFields = [
      'companyName', 'companyPhone', 'companyEmail', 'companyAddress',
      'customerName', 'customerPhone', 'customerEmail', 'customerAddress',
      'cardNumber', 'accountNumber', 'ibanNumber', 'totalDiscount', 'invoiceNotes'
    ];
    
    formFields.forEach(field => {
      originalFields[field] = this.$(`#${field}`)?.value || '';
    });
    
    try {
      // Load invoice data temporarily
      this.services = [...invoice.services];
      
      // Load form fields
      this.$('#companyName').value = invoice.companyName;
      this.$('#customerName').value = invoice.customerName;
      
      if (invoice.companyInfo) {
        Object.keys(invoice.companyInfo).forEach(key => {
          const element = this.$(`#company${key.charAt(0).toUpperCase() + key.slice(1)}`);
          if (element) element.value = invoice.companyInfo[key];
        });
      }
      
      if (invoice.customerInfo) {
        Object.keys(invoice.customerInfo).forEach(key => {
          const element = this.$(`#customer${key.charAt(0).toUpperCase() + key.slice(1)}`);
          if (element) element.value = invoice.customerInfo[key];
        });
      }
      
      if (invoice.bankingInfo) {
        Object.keys(invoice.bankingInfo).forEach(key => {
          const element = this.$(`#${key}`);
          if (element) element.value = invoice.bankingInfo[key];
        });
      }

      // Load notes
      const notesEl = this.$('#invoiceNotes');
      if (notesEl) {
        notesEl.value = invoice.notes || '';
      }
      
      this.render();
      
      const canvas = await this.generateCanvas();
      const pdf = await this.generatePDFFromCanvas(canvas);
      pdf.save(`فاکتور-${invoice.number}.pdf`);
      
      // Update invoice to mark it has PDF
      invoice.hasPDF = true;
      localStorage.setItem('savedInvoices', JSON.stringify(this.savedInvoices));
      
      this.showToast('فایل PDF مجدداً دانلود شد', 'success');
      
    } catch (error) {
      this.handleError('خطا در دانلود مجدد PDF', error);
    } finally {
      // Restore original form state
      this.services = originalServices;
      formFields.forEach(field => {
        const element = this.$(`#${field}`);
        if (element) element.value = originalFields[field];
      });
      this.render();
    }
  }

  deleteInvoice(invoiceId) {
    if (!confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
      return;
    }
    
    try {
      this.savedInvoices = this.savedInvoices.filter(inv => inv.id !== invoiceId);
      localStorage.setItem('savedInvoices', JSON.stringify(this.savedInvoices));
      
      this.renderHistoryStats();
      this.filterInvoices();
      this.showToast('فاکتور حذف شد', 'success');
      
    } catch (error) {
      this.handleError('خطا در حذف فاکتور', error);
    }
  }

  clearHistory() {
    if (!confirm('آیا از پاک کردن تمام فاکتورها اطمینان دارید؟ این عمل قابل بازگشت نیست.')) {
      return;
    }
    
    try {
      this.savedInvoices = [];
      localStorage.removeItem('savedInvoices');
      
      this.renderHistoryStats();
      this.filterInvoices();
      this.showToast('تمام فاکتورها پاک شدند', 'success');
      
    } catch (error) {
      this.handleError('خطا در پاک کردن تاریخچه', error);
    }
  }

  exportHistory() {
    if (this.savedInvoices.length === 0) {
      this.showToast('فاکتوری برای صادرات وجود ندارد', 'error');
      return;
    }
    
    try {
      const csvContent = this.generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `فاکتورها-${this.getPersianDate()}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showToast('فایل Excel با موفقیت صادر شد', 'success');
      
    } catch (error) {
      this.handleError('خطا در صادرات فایل', error);
    }
  }

  generateCSV() {
    const headers = ['شماره فاکتور', 'تاریخ', 'نام شرکت', 'نام مشتری', 'تعداد خدمات', 'مبلغ کل (تومان)', 'وضعیت PDF', 'توضیحات'];
    const rows = this.savedInvoices.map(inv => [
      inv.number,
      inv.persianDate,
      inv.companyName,
      inv.customerName,
      inv.servicesCount,
      inv.grandTotal,
      inv.hasPDF ? 'دارد' : 'ندارد',
      inv.notes || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    // Add BOM for proper UTF-8 encoding in Excel
    return '\uFEFF' + csvContent;
  }

  // ========== SHARING ==========
  async share(platform) {
    if (this.services.length === 0) {
      this.showToast('لطفاً حداقل یک خدمت اضافه کنید', 'error');
      return;
    }
    
    try {
      const invoiceNumber = this.getInvoiceNumber();
      const total = this.formatNumber(this.getGrandTotal());
      const companyName = this.$('#companyName')?.value || 'شرکت';
      
      const message = `فاکتور ${invoiceNumber} از ${companyName}\nمبلغ قابل پرداخت: ${total} تومان\n\nجهت دریافت فایل PDF لطفاً با ما تماس بگیرید.`;
      
      switch (platform) {
        case 'email': {
          const email = this.$('#customerEmail')?.value || '';
          const subject = `فاکتور ${invoiceNumber} از ${companyName}`;
          const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
          window.open(mailtoUrl);
          break;
        }
        
        case 'whatsapp': {
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
          break;
        }
        
        case 'telegram': {
          const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(message)}`;
          window.open(telegramUrl, '_blank');
          break;
        }
      }
      
      this.showToast('لینک اشتراک‌گذاری باز شد', 'success');
      
    } catch (error) {
      this.handleError('خطا در اشتراک‌گذاری', error);
    }
  }

  // ========== UI HELPERS ==========
  showLoading(show = true) {
    const spinner = this.$('#loadingSpinner');
    if (spinner) {
      spinner.style.display = show ? 'flex' : 'none';
    }
  }

  showToast(message, type = 'info') {
    const toastId = type === 'error' ? 'errorToast' : 'successToast';
    const messageId = type === 'error' ? 'errorMessage' : 'successMessage';
    
    const toast = this.$(`#${toastId}`);
    const messageEl = this.$(`#${messageId}`);
    
    if (toast && messageEl) {
      messageEl.textContent = message;
      toast.style.display = 'flex';
      
      setTimeout(() => {
        this.hideToast(toastId);
      }, 4000);
    }
  }

  hideToast(toastId) {
    const toast = this.$(`#${toastId}`);
    if (toast) {
      toast.style.display = 'none';
    }
  }

  // ========== ERROR HANDLING ==========
  handleError(message, error = null) {
    console.error(message, error);
    this.showToast(message, 'error');
    this.showLoading(false);
  }

  handleGlobalError(event) {
    console.error('Global error:', event);
    this.showToast('خطای غیرمنتظره‌ای رخ داده است', 'error');
  }

  // ========== UTILITY FUNCTIONS ==========
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ========== CLEANUP ==========
  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }
}

// Global toast function
function hideToast(toastId) {
  if (window.invoiceGenerator) {
    window.invoiceGenerator.hideToast(toastId);
  }
}

// Initialize app when DOM is ready
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

// Service Worker registration for PWA
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

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (invoiceGenerator) {
    invoiceGenerator.persistData();
    invoiceGenerator.destroy();
  }
});

// Handle PWA installation prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Handle shortcuts from PWA
if (new URL(location).searchParams.get('action') === 'history') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (invoiceGenerator) {
        invoiceGenerator.showHistory();
      }
    }, 1000);
  });
}