class InvoiceGenerator {
    constructor() {
        this.services = [];
        this.invoiceCounter = this.getInvoiceCounter();
        this.initializeEventListeners();
        this.loadSavedData();
        this.generatePreview();
    }

    initializeEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));
        document.getElementById('addService').addEventListener('click', this.addService.bind(this));
        document.getElementById('serviceSelect').addEventListener('change', this.onServiceSelect.bind(this));
        document.querySelectorAll('input, textarea, select').forEach(el=>el.addEventListener('input', this.generatePreview.bind(this)));
        document.getElementById('cardNumber').addEventListener('input', this.formatCardNumber.bind(this));
        document.getElementById('ibanNumber').addEventListener('input', this.formatIBAN.bind(this));
        document.getElementById('generatePDF').addEventListener('click', this.generatePDF.bind(this));
        document.getElementById('shareEmail').addEventListener('click', this.shareEmail.bind(this));
        document.getElementById('shareWhatsApp').addEventListener('click', this.shareWhatsApp.bind(this));
        document.getElementById('shareTelegram').addEventListener('click', this.shareTelegram.bind(this));
        setInterval(this.saveData.bind(this), 10000);
    }

    // Format helpers
    formatCardNumber(e){let v=e.target.value.replace(/\D/g,'');v=v.replace(/(\d{4})(?=\d)/g,'$1-');e.target.value=v.slice(0,19);}    
    formatIBAN(e){let v=e.target.value.replace(/[^A-Z0-9]/gi,'').toUpperCase();if(!v.startsWith('IR'))v='IR'+v; if(v.length>2){v=v.slice(0,2)+v.slice(2).replace(/(\d{4})(?=\d)/g,'$1-')} e.target.value=v.slice(0,26);}    

    toggleTheme(){const b=document.body,i=document.getElementById('themeToggle').querySelector('i');if(b.hasAttribute('data-theme')){b.removeAttribute('data-theme');i.className='fas fa-moon';localStorage.setItem('theme','light')}else{b.setAttribute('data-theme','dark');i.className='fas fa-sun';localStorage.setItem('theme','dark')}}
    loadTheme(){const t=localStorage.getItem('theme');if(t==='dark'){document.body.setAttribute('data-theme','dark');document.getElementById('themeToggle').querySelector('i').className='fas fa-sun'}}

    onServiceSelect(){const s=document.getElementById('serviceSelect'), c=document.getElementById('customService'); if(s.value){c.value=s.value;s.value='';}}

    addService(){
        const name=(document.getElementById('customService').value.trim()||document.getElementById('serviceSelect').value);
        const qty=parseInt(document.getElementById('serviceQuantity').value)||1;
        const price=parseFloat(document.getElementById('servicePrice').value)||0;
        const disc=parseFloat(document.getElementById('serviceDiscount').value)||0;
        if(!name||price<=0){alert('نام خدمت و قیمت را وارد کنید');return;}
        const base=qty*price; const discAmt=base*disc/100; const total=base-discAmt;
        this.services.push({id:Date.now(),name,quantity:qty,price,discount:disc,baseTotal:base,discountAmount:discAmt,total});
        this.renderServices(); this.clearServiceInputs(); this.generatePreview();
    }

    removeService(id){this.services=this.services.filter(s=>s.id!==id);this.renderServices();this.generatePreview();}

    renderServices(){
        const c=document.getElementById('servicesList'); c.innerHTML='';
        this.services.forEach((s)=>{
            const el=document.createElement('div'); el.className='service-item';
            el.innerHTML=`<div class="service-details"><div class="service-name">${s.name}</div><div class="service-info">${s.quantity} × ${this.formatPrice(s.price)} تومان${s.discount>0?` (تخفیف ${s.discount}%)`:''}</div></div><div class="service-total">${this.formatPrice(s.total)} تومان</div><button class="remove-btn" onclick="invoiceGenerator.removeService(${s.id})"><i class='fas fa-trash'></i></button>`;
            c.appendChild(el);
        })
    }

    clearServiceInputs(){document.getElementById('serviceSelect').value='';document.getElementById('customService').value='';document.getElementById('serviceQuantity').value='1';document.getElementById('servicePrice').value='';document.getElementById('serviceDiscount').value='0'}

    // Persian date invoice code YYMMDD-XXX (e.g., 404727-001)
    generateInvoiceNumber(){const d=new Date(); const p=this.getPersianDate(d); const dateStr=((p.year%100).toString().padStart(2,'0'))+p.month.toString().padStart(2,'0')+p.day.toString().padStart(2,'0'); return `${dateStr}-${this.invoiceCounter.toString().padStart(3,'0')}`}
    getPersianDate(date){const f=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return{year:parseInt(f.find(x=>x.type==='year').value),month:parseInt(f.find(x=>x.type==='month').value),day:parseInt(f.find(x=>x.type==='day').value)}}

    formatPrice(n){return new Intl.NumberFormat('fa-IR').format(n)}
    calculateSubtotal(){return this.services.reduce((t,s)=>t+s.total,0)}
    calculateTotalDiscount(){const p=parseFloat(document.getElementById('totalDiscount').value)||0; return this.calculateSubtotal()*p/100}
    calculateTax(){const taxable=this.calculateSubtotal()-this.calculateTotalDiscount(); return taxable*0.10}
    calculateFinalTotal(){return this.calculateSubtotal()-this.calculateTotalDiscount()+this.calculateTax()}

    buildHeaderBlock(invoiceNumber,currentDate,companyBlock,bankBlock){
        // two-column header: right column title+seller; left column banking
        return `<div class="invoice-header grid-2">
            <div class="right-col">
                <div class="invoice-title">فاکتور</div>
                <div class="invoice-number">شماره: ${invoiceNumber}</div>
                <div class="invoice-date">تاریخ: ${currentDate}</div>
                ${companyBlock}
            </div>
            <div class="left-col">${bankBlock}</div>
        </div>`
    }

    generatePreview(){
        const preview=document.getElementById('invoicePreview');
        const invoiceNumber=this.generateInvoiceNumber();
        const currentDate=new Date().toLocaleDateString('fa-IR');
        const companyName=document.getElementById('companyName').value||'نام شرکت';
        const companyPhone=document.getElementById('companyPhone').value; const companyEmail=document.getElementById('companyEmail').value; const companyAddress=document.getElementById('companyAddress').value;
        const cardNumber=document.getElementById('cardNumber').value; const accountNumber=document.getElementById('accountNumber').value; const ibanNumber=document.getElementById('ibanNumber').value;
        const customerName=document.getElementById('customerName').value||'نام مشتری'; const customerPhone=document.getElementById('customerPhone').value; const customerEmail=document.getElementById('customerEmail').value; const customerAddress=document.getElementById('customerAddress').value;
        const subtotal=this.calculateSubtotal(); const totalDiscount=this.calculateTotalDiscount(); const tax=this.calculateTax(); const finalTotal=this.calculateFinalTotal();

        const companyBlock=`<div class="company-info"><div class="info-title">اطلاعات فروشنده</div><div class="info-content"><strong>${companyName}</strong><br>${companyPhone?`تلفن: ${companyPhone}<br>`:''}${companyEmail?`ایمیل: ${companyEmail}<br>`:''}${companyAddress?`آدرس: ${companyAddress}`:''}</div></div>`;
        const bankBlock=(cardNumber||accountNumber||ibanNumber)?`<div class="company-info"><div class="info-title">اطلاعات بانکی</div><div class="banking-info">${cardNumber?`<div class='bank-item'><span class='bank-label'>شماره کارت:</span><span>${cardNumber}</span></div>`:''}${accountNumber?`<div class='bank-item'><span class='bank-label'>شماره حساب:</span><span>${accountNumber}</span></div>`:''}${ibanNumber?`<div class='bank-item'><span class='bank-label'>شماره شبا:</span><span>${ibanNumber}</span></div>`:''}</div></div>`:'';

        let rows=''; this.services.forEach((s,i)=>{rows+=`<tr><td>${i+1}</td><td>${s.name}</td><td>${s.quantity}</td><td>${this.formatPrice(s.price)}</td><td>${s.discount>0?s.discount+'%':'-'}</td><td>${this.formatPrice(s.total)}</td></tr>`});

        const headerHTML=this.buildHeaderBlock(invoiceNumber,currentDate,companyBlock,bankBlock);

        preview.innerHTML = `${headerHTML}
            <div class="customer-info"><div class="info-title">اطلاعات خریدار</div><div class="info-content"><strong>${customerName}</strong><br>${customerPhone?`تلفن: ${customerPhone}<br>`:''}${customerEmail?`ایمیل: ${customerEmail}<br>`:''}${customerAddress?`آدرس: ${customerAddress}`:''}</div></div>
            ${this.services.length>0?`<table class='services-table'><thead><tr><th>ردیف</th><th>شرح خدمات</th><th>تعداد</th><th>قیمت واحد (تومان)</th><th>تخفیف</th><th>مبلغ (تومان)</th></tr></thead><tbody>${rows}</tbody></table>
            <div class='invoice-calculations'><div class='calculations-box'>
                <div class='calc-row'><span>جمع کل:</span><span>${this.formatPrice(subtotal)} تومان</span></div>
                <div class='calc-row discount-calc'><span>تخفیف:</span><span>-${this.formatPrice(totalDiscount)} تومان</span></div>
                <div class='calc-row tax-calc'><span>مالیات (10%):</span><span>+${this.formatPrice(tax)} تومان</span></div>
                <div class='calc-row'><span>مبلغ کل قابل پرداخت:</span><span>${this.formatPrice(finalTotal)} تومان</span></div>
            </div></div>`:"<p style='text-align:center;color:#666;font-style:italic;'>هیچ خدمتی اضافه نشده است</p>";
    }

    async generatePDF(){
        const { jsPDF }=window.jspdf; const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
        const el=document.getElementById('invoicePreview'); const canvas=await html2canvas(el,{scale:2,useCORS:true,allowTaint:true,backgroundColor:'#ffffff'});
        const img=canvas.toDataURL('image/png'); const w=210; const ph=295; const h=(canvas.height*w)/canvas.width; let left=h; let pos=0; pdf.addImage(img,'PNG',0,pos,w,h); left-=ph; while(left>=0){pos=left-h; pdf.addPage(); pdf.addImage(img,'PNG',0,pos,w,h); left-=ph;} const num=this.generateInvoiceNumber(); pdf.save(`فاکتور-${num}.pdf`); this.incrementInvoiceCounter();
    }

    // Share: attach PDF and include summary text (fallback to text with link if blocked)
    async buildInvoiceSummary(){
        const num=this.generateInvoiceNumber(); const total=this.formatPrice(this.calculateFinalTotal()); const name=document.getElementById('companyName').value||'شرکت';
        return `فاکتور ${num} از ${name}\nمبلغ قابل پرداخت: ${total} تومان`;
    }

    async shareEmail(){
        const subject=await this.buildInvoiceSummary();
        const body=subject+"\n\nجهت دریافت فایل PDF از سامانه استفاده کنید.";
        const mailto=`mailto:${encodeURIComponent(document.getElementById('customerEmail').value||'')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; window.open(mailto);
    }

    async shareWhatsApp(){
        const text=await this.buildInvoiceSummary();
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,'_blank');
    }

    async shareTelegram(){
        const text=await this.buildInvoiceSummary();
        window.open(`https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(text)}`,'_blank');
    }

    getInvoiceCounter(){const s=localStorage.getItem('invoiceCounter'); return s?parseInt(s):1}
    incrementInvoiceCounter(){this.invoiceCounter++; localStorage.setItem('invoiceCounter',this.invoiceCounter.toString())}

    saveData(){const d={companyName:companyName.value,companyPhone:companyPhone.value,companyEmail:companyEmail.value,companyAddress:companyAddress.value,cardNumber:cardNumber.value,accountNumber:accountNumber.value,ibanNumber:ibanNumber.value,services:this.services}; localStorage.setItem('invoiceData',JSON.stringify(d))}
    loadSavedData(){try{const s=localStorage.getItem('invoiceData'); if(s){const d=JSON.parse(s); ['companyName','companyPhone','companyEmail','companyAddress','cardNumber','accountNumber','ibanNumber'].forEach(k=>{if(d[k]) document.getElementById(k).value=d[k]}); if(d.services){this.services=d.services; this.renderServices();}}}catch(e){console.error(e)}}
}
let invoiceGenerator; document.addEventListener('DOMContentLoaded',()=>{invoiceGenerator=new InvoiceGenerator(); invoiceGenerator.loadTheme();});
if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}
