class InvoiceGenerator {
    constructor() {
        this.services = [];
        this.invoiceCounter = this.getInvoiceCounter();
        this.initializeEventListeners();
        this.loadSavedData();
        this.generatePreview();
    }

    initializeEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));
        
        // Service management
        document.getElementById('addService').addEventListener('click', this.addService.bind(this));
        document.getElementById('serviceSelect').addEventListener('change', this.onServiceSelect.bind(this));
        
        // Form inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', this.generatePreview.bind(this));
        });
        
        // Card number formatting
        document.getElementById('cardNumber').addEventListener('input', this.formatCardNumber.bind(this));
        document.getElementById('ibanNumber').addEventListener('input', this.formatIBAN.bind(this));
        
        // Action buttons
        document.getElementById('generatePDF').addEventListener('click', this.generatePDF.bind(this));
        document.getElementById('shareEmail').addEventListener('click', this.shareEmail.bind(this));
        document.getElementById('shareWhatsApp').addEventListener('click', this.shareWhatsApp.bind(this));
        document.getElementById('shareTelegram').addEventListener('click', this.shareTelegram.bind(this));
        
        // Auto-save
        setInterval(this.saveData.bind(this), 10000); // Save every 10 seconds
    }

    formatCardNumber(event) {
        let value = event.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1-');
        if (value.length > 19) value = value.slice(0, 19);
        event.target.value = value;
    }

    formatIBAN(event) {
        let value = event.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (!value.startsWith('IR')) {
            value = 'IR' + value;
        }
        if (value.length > 2) {
            value = value.slice(0, 2) + value.slice(2).replace(/(\d{4})(?=\d)/g, '$1-');
        }
        if (value.length > 26) value = value.slice(0, 26);
        event.target.value = value;
    }

    toggleTheme() {
        const body = document.body;
        const themeBtn = document.getElementById('themeToggle');
        const icon = themeBtn.querySelector('i');
        
        if (body.hasAttribute('data-theme')) {
            body.removeAttribute('data-theme');
            icon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const themeBtn = document.getElementById('themeToggle');
        const icon = themeBtn.querySelector('i');
        
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-sun';
        }
    }

    onServiceSelect() {
        const select = document.getElementById('serviceSelect');
        const customInput = document.getElementById('customService');
        
        if (select.value) {
            customInput.value = select.value;
            select.value = '';
        }
    }

    addService() {
        const serviceSelect = document.getElementById('serviceSelect');
        const customService = document.getElementById('customService');
        const quantity = document.getElementById('serviceQuantity');
        const price = document.getElementById('servicePrice');
        const discount = document.getElementById('serviceDiscount');
        
        const serviceName = customService.value.trim() || serviceSelect.value;
        const serviceQuantity = parseInt(quantity.value) || 1;
        const servicePrice = parseFloat(price.value) || 0;
        const serviceDiscount = parseFloat(discount.value) || 0;
        
        if (!serviceName || servicePrice <= 0) {
            alert('لطفاً نام خدمت و قیمت را وارد کنید');
            return;
        }
        
        const baseTotal = serviceQuantity * servicePrice;
        const discountAmount = (baseTotal * serviceDiscount) / 100;
        const finalTotal = baseTotal - discountAmount;
        
        const service = {
            id: Date.now(),
            name: serviceName,
            quantity: serviceQuantity,
            price: servicePrice,
            discount: serviceDiscount,
            baseTotal: baseTotal,
            discountAmount: discountAmount,
            total: finalTotal
        };
        
        this.services.push(service);
        this.renderServices();
        this.clearServiceInputs();
        this.generatePreview();
    }

    removeService(id) {
        this.services = this.services.filter(service => service.id !== id);
        this.renderServices();
        this.generatePreview();
    }

    renderServices() {
        const container = document.getElementById('servicesList');
        container.innerHTML = '';
        
        this.services.forEach(service => {
            const serviceElement = document.createElement('div');
            serviceElement.className = 'service-item';
            
            let discountInfo = '';
            if (service.discount > 0) {
                discountInfo = ` (تخفیف ${service.discount}%)`;
            }
            
            serviceElement.innerHTML = `
                <div class="service-details">
                    <div class="service-name">${service.name}</div>
                    <div class="service-info">${service.quantity} × ${this.formatPrice(service.price)} تومان${discountInfo}</div>
                </div>
                <div class="service-total">${this.formatPrice(service.total)} تومان</div>
                <button class="remove-btn" onclick="invoiceGenerator.removeService(${service.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(serviceElement);
        });
    }

    clearServiceInputs() {
        document.getElementById('serviceSelect').value = '';
        document.getElementById('customService').value = '';
        document.getElementById('serviceQuantity').value = '1';
        document.getElementById('servicePrice').value = '';
        document.getElementById('serviceDiscount').value = '0';
    }

    // Generate Persian date-based invoice number: 404727-001
    generateInvoiceNumber() {
        const now = new Date();
        const persianDate = this.getPersianDate(now);
        
        // Format: YYMMDD-XXX (404727-001)
        const dateStr = (persianDate.year % 100).toString().padStart(2, '0') + 
                       persianDate.month.toString().padStart(2, '0') + 
                       persianDate.day.toString().padStart(2, '0');
        
        return `${dateStr}-${this.invoiceCounter.toString().padStart(3, '0')}`;
    }

    getPersianDate(date) {
        const persianCalendar = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        
        const parts = persianCalendar.formatToParts(date);
        return {
            year: parseInt(parts.find(part => part.type === 'year').value),
            month: parseInt(parts.find(part => part.type === 'month').value),
            day: parseInt(parts.find(part => part.type === 'day').value)
        };
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fa-IR').format(price);
    }

    calculateSubtotal() {
        return this.services.reduce((total, service) => total + service.total, 0);
    }

    calculateTotalDiscount() {
        const totalDiscountPercent = parseFloat(document.getElementById('totalDiscount').value) || 0;
        const subtotal = this.calculateSubtotal();
        return (subtotal * totalDiscountPercent) / 100;
    }

    calculateTax() {
        const subtotal = this.calculateSubtotal();
        const totalDiscount = this.calculateTotalDiscount();
        const taxableAmount = subtotal - totalDiscount;
        return (taxableAmount * 10) / 100; // 10% tax
    }

    calculateFinalTotal() {
        const subtotal = this.calculateSubtotal();
        const totalDiscount = this.calculateTotalDiscount();
        const tax = this.calculateTax();
        return subtotal - totalDiscount + tax;
    }

    generatePreview() {
        const preview = document.getElementById('invoicePreview');
        const invoiceNumber = this.generateInvoiceNumber();
        const currentDate = new Date().toLocaleDateString('fa-IR');
        
        const companyName = document.getElementById('companyName').value || 'نام شرکت';
        const companyPhone = document.getElementById('companyPhone').value;
        const companyEmail = document.getElementById('companyEmail').value;
        const companyAddress = document.getElementById('companyAddress').value;
        
        const cardNumber = document.getElementById('cardNumber').value;
        const accountNumber = document.getElementById('accountNumber').value;
        const ibanNumber = document.getElementById('ibanNumber').value;
        
        const customerName = document.getElementById('customerName').value || 'نام مشتری';
        const customerPhone = document.getElementById('customerPhone').value;
        const customerEmail = document.getElementById('customerEmail').value;
        const customerAddress = document.getElementById('customerAddress').value;
        
        const subtotal = this.calculateSubtotal();
        const totalDiscount = this.calculateTotalDiscount();
        const tax = this.calculateTax();
        const finalTotal = this.calculateFinalTotal();
        
        let servicesTableRows = '';
        this.services.forEach((service, index) => {
            servicesTableRows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${service.name}</td>
                    <td>${service.quantity}</td>
                    <td>${this.formatPrice(service.price)}</td>
                    <td>${service.discount > 0 ? service.discount + '%' : '-'}</td>
                    <td>${this.formatPrice(service.total)}</td>
                </tr>
            `;
        });
        
        // Banking information section
        let bankingInfo = '';
        if (cardNumber || accountNumber || ibanNumber) {
            bankingInfo = `
                <div class="banking-info">
                    <div class="info-title">اطلاعات بانکی</div>
                    ${cardNumber ? `<div class="bank-item"><span class="bank-label">شماره کارت:</span> <span>${cardNumber}</span></div>` : ''}
                    ${accountNumber ? `<div class="bank-item"><span class="bank-label">شماره حساب:</span> <span>${accountNumber}</span></div>` : ''}
                    ${ibanNumber ? `<div class="bank-item"><span class="bank-label">شماره شبا:</span> <span>${ibanNumber}</span></div>` : ''}
                </div>
            `;
        }
        
        preview.innerHTML = `
            <div class="invoice-header">
                <div>
                    <div class="invoice-title">فاکتور</div>
                    <div class="invoice-number">شماره: ${invoiceNumber}</div>
                    <div class="invoice-date">تاریخ: ${currentDate}</div>
                </div>
                <div>
                    <div class="company-info">
                        <div class="info-title">اطلاعات فروشنده</div>
                        <div class="info-content">
                            <strong>${companyName}</strong><br>
                            ${companyPhone ? `تلفن: ${companyPhone}<br>` : ''}
                            ${companyEmail ? `ایمیل: ${companyEmail}<br>` : ''}
                            ${companyAddress ? `آدرس: ${companyAddress}` : ''}
                        </div>
                        ${bankingInfo}
                    </div>
                </div>
            </div>
            
            <div class="customer-info">
                <div class="info-title">اطلاعات خریدار</div>
                <div class="info-content">
                    <strong>${customerName}</strong><br>
                    ${customerPhone ? `تلفن: ${customerPhone}<br>` : ''}
                    ${customerEmail ? `ایمیل: ${customerEmail}<br>` : ''}
                    ${customerAddress ? `آدرس: ${customerAddress}` : ''}
                </div>
            </div>
            
            ${this.services.length > 0 ? `
                <table class="services-table">
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
                        ${servicesTableRows}
                    </tbody>
                </table>
                
                <div class="invoice-calculations">
                    <div class="calculations-box">
                        <div class="calc-row">
                            <span>جمع کل:</span>
                            <span>${this.formatPrice(subtotal)} تومان</span>
                        </div>
                        ${totalDiscount > 0 ? `
                        <div class="calc-row discount-calc">
                            <span>تخفیف کلی:</span>
                            <span>-${this.formatPrice(totalDiscount)} تومان</span>
                        </div>
                        ` : ''}
                        <div class="calc-row tax-calc">
                            <span>مالیات (10%):</span>
                            <span>+${this.formatPrice(tax)} تومان</span>
                        </div>
                        <div class="calc-row">
                            <span>مبلغ کل قابل پرداخت:</span>
                            <span>${this.formatPrice(finalTotal)} تومان</span>
                        </div>
                    </div>
                </div>
            ` : '<p style="text-align: center; color: #666; font-style: italic;">هیچ خدمتی اضافه نشده است</p>'}
        `;
    }

    async generatePDF() {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Add Persian font support
            const element = document.getElementById('invoicePreview');
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 210;
            const pageHeight = 295;
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
            
            const invoiceNumber = this.generateInvoiceNumber();
            pdf.save(`فاکتور-${invoiceNumber}.pdf`);
            
            // Increment counter after successful PDF generation
            this.incrementInvoiceCounter();
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('خطا در تولید فایل PDF');
        }
    }

    shareEmail() {
        const customerEmail = document.getElementById('customerEmail').value;
        const companyName = document.getElementById('companyName').value || 'شرکت';
        const invoiceNumber = this.generateInvoiceNumber();
        const total = this.formatPrice(this.calculateFinalTotal());
        
        const subject = `فاکتور ${invoiceNumber} از ${companyName}`;
        const body = `سلام،\n\nفاکتور شماره ${invoiceNumber} به مبلغ ${total} تومان آماده شده است.\n\nبا تشکر\n${companyName}`;
        
        const mailto = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailto);
    }

    shareWhatsApp() {
        const companyName = document.getElementById('companyName').value || 'شرکت';
        const invoiceNumber = this.generateInvoiceNumber();
        const total = this.formatPrice(this.calculateFinalTotal());
        
        const message = `سلام،\n\nفاکتور شماره ${invoiceNumber} از ${companyName} به مبلغ ${total} تومان آماده شده است.\n\nبا تشکر`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    shareTelegram() {
        const companyName = document.getElementById('companyName').value || 'شرکت';
        const invoiceNumber = this.generateInvoiceNumber();
        const total = this.formatPrice(this.calculateFinalTotal());
        
        const message = `سلام،\n\nفاکتور شماره ${invoiceNumber} از ${companyName} به مبلغ ${total} تومان آماده شده است.\n\nبا تشکر`;
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
    }

    getInvoiceCounter() {
        const saved = localStorage.getItem('invoiceCounter');
        return saved ? parseInt(saved) : 1;
    }

    incrementInvoiceCounter() {
        this.invoiceCounter++;
        localStorage.setItem('invoiceCounter', this.invoiceCounter.toString());
    }

    saveData() {
        const data = {
            companyName: document.getElementById('companyName').value,
            companyPhone: document.getElementById('companyPhone').value,
            companyEmail: document.getElementById('companyEmail').value,
            companyAddress: document.getElementById('companyAddress').value,
            cardNumber: document.getElementById('cardNumber').value,
            accountNumber: document.getElementById('accountNumber').value,
            ibanNumber: document.getElementById('ibanNumber').value,
            services: this.services
        };
        localStorage.setItem('invoiceData', JSON.stringify(data));
    }

    loadSavedData() {
        try {
            const saved = localStorage.getItem('invoiceData');
            if (saved) {
                const data = JSON.parse(saved);
                
                if (data.companyName) document.getElementById('companyName').value = data.companyName;
                if (data.companyPhone) document.getElementById('companyPhone').value = data.companyPhone;
                if (data.companyEmail) document.getElementById('companyEmail').value = data.companyEmail;
                if (data.companyAddress) document.getElementById('companyAddress').value = data.companyAddress;
                if (data.cardNumber) document.getElementById('cardNumber').value = data.cardNumber;
                if (data.accountNumber) document.getElementById('accountNumber').value = data.accountNumber;
                if (data.ibanNumber) document.getElementById('ibanNumber').value = data.ibanNumber;
                
                if (data.services) {
                    this.services = data.services;
                    this.renderServices();
                }
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// Initialize the application
let invoiceGenerator;

document.addEventListener('DOMContentLoaded', () => {
    invoiceGenerator = new InvoiceGenerator();
    invoiceGenerator.loadTheme();
});

// Service worker registration for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}