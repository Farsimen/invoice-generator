class InvoiceGenerator {
  constructor() {
    this.services = [];
    this.invoiceCounter = this.getInvoiceCounter();
    this.currentInvoiceNumber = null; // freeze until PDF saved
    this.bind();
    this.restore();
    this.applyTheme();
    this.render();
  }

  // ---------- SAFE PERSIAN DATE HELPERS ----------
  getPersianParts(date) {
    const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
      year: '2-digit', month: '2-digit', day: '2-digit'
    });
    const parts = fmt.formatToParts(date);
    const y = parseInt(parts.find(p=>p.type==='year').value,10);
    const m = parseInt(parts.find(p=>p.type==='month').value,10);
    const d = parseInt(parts.find(p=>p.type==='day').value,10);
    return { y, m, d };
  }
  getDateStr() {
    const {y,m,d} = this.getPersianParts(new Date());
    return y.toString().padStart(2,'0') + m.toString().padStart(2,'0') + d.toString().padStart(2,'0');
  }

  // ---------- INVOICE NUMBER ----------
  getInvoiceNumber() {
    if (this.currentInvoiceNumber) return this.currentInvoiceNumber;
    const code = this.getDateStr();
    this.currentInvoiceNumber = `${code}-${this.invoiceCounter.toString().padStart(3,'0')}`;
    return this.currentInvoiceNumber;
  }
  finalizeAfterPDF() {
    this.invoiceCounter++;
    localStorage.setItem('invoiceCounter', String(this.invoiceCounter));
    this.currentInvoiceNumber = null;
  }

  // ---------- BIND & RESTORE ----------
  bind() {
    const $ = sel => document.querySelector(sel);
    this.$ = $;
    $('#themeToggle').addEventListener('click', ()=>this.toggleTheme());
    $('#addService').addEventListener('click', ()=>this.addService());
    $('#serviceSelect').addEventListener('change', ()=>{
      const s = $('#serviceSelect'); const c = $('#customService'); if (s.value) { c.value = s.value; s.value=''; }
    });
    document.querySelectorAll('input,textarea,select').forEach(i=>{
      i.addEventListener('input', ()=>this.render());
    });
    $('#cardNumber').addEventListener('input', e=>{ let v=e.target.value.replace(/\D/g,''); v=v.replace(/(\d{4})(?=\d)/g,'$1-'); e.target.value=v.slice(0,19); });
    $('#ibanNumber').addEventListener('input', e=>{ let v=e.target.value.replace(/[^A-Z0-9]/gi,'').toUpperCase(); if(!v.startsWith('IR')) v='IR'+v; if(v.length>2) v=v.slice(0,2)+v.slice(2).replace(/(\d{4})(?=\d)/g,'$1-'); e.target.value=v.slice(0,26); });
    $('#generatePDF').addEventListener('click', ()=>this.downloadPDF());
    $('#shareEmail').addEventListener('click', ()=>this.share('email'));
    $('#shareWhatsApp').addEventListener('click', ()=>this.share('whatsapp'));
    $('#shareTelegram').addEventListener('click', ()=>this.share('telegram'));
    setInterval(()=>this.persist(), 10000);
  }

  restore() {
    try{ const s=localStorage.getItem('invoiceData'); if(!s) return; const d=JSON.parse(s);
      ['companyName','companyPhone','companyEmail','companyAddress','cardNumber','accountNumber','ibanNumber','customerName','customerPhone','customerEmail','customerAddress'].forEach(k=>{ if(d[k]) this.$('#'+k).value=d[k]; });
      if (Array.isArray(d.services)) { this.services=d.services; }
    }catch(e){ console.warn('restore failed', e); }
  }
  persist() {
    const d={};
    ['companyName','companyPhone','companyEmail','companyAddress','cardNumber','accountNumber','ibanNumber','customerName','customerPhone','customerEmail','customerAddress'].forEach(k=> d[k]=this.$('#'+k).value);
    d.services=this.services; localStorage.setItem('invoiceData', JSON.stringify(d));
  }

  // ---------- THEME ----------
  toggleTheme(){ const b=document.body, i=this.$('#themeToggle i'); if(b.hasAttribute('data-theme')){b.removeAttribute('data-theme'); localStorage.setItem('theme','light'); i.className='fas fa-moon';} else { b.setAttribute('data-theme','dark'); localStorage.setItem('theme','dark'); i.className='fas fa-sun'; } }
  applyTheme(){ const t=localStorage.getItem('theme'); if(t==='dark'){ document.body.setAttribute('data-theme','dark'); this.$('#themeToggle i').className='fas fa-sun'; } }

  // ---------- SERVICES ----------
  addService(){
    const name=(this.$('#customService').value.trim()||this.$('#serviceSelect').value);
    const qty=parseInt(this.$('#serviceQuantity').value||'1',10);
    const price=parseFloat(this.$('#servicePrice').value||'0');
    const disc=parseFloat(this.$('#serviceDiscount').value||'0');
    if(!name || price<=0) { alert('نام خدمت و قیمت را وارد کنید'); return; }
    const base=qty*price, discAmt=base*disc/100, total=base-discAmt;
    this.services.push({id:Date.now(),name,quantity:qty,price,discount:disc,total});
    this.$('#customService').value=''; this.$('#serviceSelect').value=''; this.$('#serviceQuantity').value='1'; this.$('#servicePrice').value=''; this.$('#serviceDiscount').value='0';
    this.render();
  }
  removeService(id){ this.services=this.services.filter(s=>s.id!==id); this.render(); }

  // ---------- CALC ----------
  nf(n){ return new Intl.NumberFormat('fa-IR').format(n); }
  subtotal(){ return this.services.reduce((t,s)=>t+s.total,0); }
  totalDiscount(){ const p=parseFloat(this.$('#totalDiscount').value||'0'); return this.subtotal()*p/100; }
  tax(){ return (this.subtotal()-this.totalDiscount())*0.10; }
  grand(){ return this.subtotal()-this.totalDiscount()+this.tax(); }

  // ---------- RENDER ----------
  render(){
    const ivn=this.getInvoiceNumber();
    const today=new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const cName=this.$('#companyName').value||'نام شرکت';
    const cPhone=this.$('#companyPhone').value, cEmail=this.$('#companyEmail').value, cAddr=this.$('#companyAddress').value;
    const card=this.$('#cardNumber').value, acc=this.$('#accountNumber').value, iban=this.$('#ibanNumber').value;
    const uName=this.$('#customerName').value||'نام مشتری', uPhone=this.$('#customerPhone').value, uEmail=this.$('#customerEmail').value, uAddr=this.$('#customerAddress').value;

    const rows=this.services.map((s,i)=>`<tr><td>${i+1}</td><td>${s.name}</td><td>${s.quantity}</td><td>${this.nf(s.price)}</td><td>${s.discount>0?s.discount+'%':'-'}</td><td>${this.nf(s.total)}</td></tr>`).join('');

    const bank=(card||acc||iban)?`<div class="company-info"><div class="info-title">اطلاعات بانکی</div><div class="banking-info">${card?`<div class='bank-item'><span class='bank-label'>شماره کارت:</span><span>${card}</span></div>`:''}${acc?`<div class='bank-item'><span class='bank-label'>شماره حساب:</span><span>${acc}</span></div>`:''}${iban?`<div class='bank-item'><span class='bank-label'>شماره شبا:</span><span>${iban}</span></div>`:''}</div>`:'';

    const html=`<div class="invoice-header grid-2">
      <div class="right-col">
        <div class="invoice-title">فاکتور</div>
        <div class="invoice-number">شماره: ${ivn}</div>
        <div class="invoice-date">تاریخ: ${today}</div>
        <div class="company-info"><div class="info-title">اطلاعات فروشنده</div><div class="info-content"><strong>${cName}</strong><br>${cPhone?`تلفن: ${cPhone}<br>`:''}${cEmail?`ایمیل: ${cEmail}<br>`:''}${cAddr?`آدرس: ${cAddr}`:''}</div></div>
      </div>
      <div class="left-col">${bank}</div>
    </div>
    <div class="customer-info"><div class="info-title">اطلاعات خریدار</div><div class="info-content"><strong>${uName}</strong><br>${uPhone?`تلفن: ${uPhone}<br>`:''}${uEmail?`ایمیل: ${uEmail}<br>`:''}${uAddr?`آدرس: ${uAddr}`:''}</div></div>
    ${this.services.length?`<table class='services-table'><thead><tr><th>ردیف</th><th>شرح خدمات</th><th>تعداد</th><th>قیمت واحد (تومان)</th><th>تخفیف</th><th>مبلغ (تومان)</th></tr></thead><tbody>${rows}</tbody></table><div class='invoice-calculations'><div class='calculations-box'><div class='calc-row'><span>جمع کل:</span><span>${this.nf(this.subtotal())} تومان</span></div>${this.totalDiscount()>0?`<div class='calc-row discount-calc'><span>تخفیف کلی:</span><span>-${this.nf(this.totalDiscount())} تومان</span></div>`:''}<div class='calc-row tax-calc'><span>مالیات (10%):</span><span>+${this.nf(this.tax())} تومان</span></div><div class='calc-row'><span>مبلغ کل قابل پرداخت:</span><span>${this.nf(this.grand())} تومان</span></div></div></div>`:"<p style='text-align:center;color:#666;font-style:italic;'>هیچ خدمتی اضافه نشده است</p>"}`;

    this.$('#invoicePreview').innerHTML=html;
  }

  // ---------- PDF & SHARE ----------
  async makeCanvas(){ return await html2canvas(document.getElementById('invoicePreview'),{scale:2,useCORS:true,allowTaint:true,backgroundColor:'#ffffff'}); }
  async downloadPDF(){ try{ const {jsPDF}=window.jspdf; const canvas=await this.makeCanvas(); const img=canvas.toDataURL('image/png'); const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'}); const w=210, ph=295, h=(canvas.height*w)/canvas.width; let left=h; pdf.addImage(img,'PNG',0,0,w,h); left-=ph; while(left>=0){pdf.addPage(); pdf.addImage(img,'PNG',0,left-h,w,h); left-=ph;} const n=this.getInvoiceNumber(); pdf.save(`فاکتور-${n}.pdf`); this.finalizeAfterPDF(); }catch(e){ console.error(e); alert('خطا در تولید PDF'); } }

  async share(channel){
    const n=this.getInvoiceNumber(); const total=this.nf(this.grand()); const company=this.$('#companyName').value||'شرکت'; const summary=`فاکتور ${n} از ${company}\nمبلغ قابل پرداخت: ${total} تومان`;
    if(channel==='email'){ const email=this.$('#customerEmail').value||''; const mailto=`mailto:${email}?subject=${encodeURIComponent(`فاکتور ${n} از ${company}`)}&body=${encodeURIComponent(summary+"\n\nلطفاً فایل PDF را از دکمه دانلود در سامانه دریافت کنید." )}`; window.open(mailto); }
    if(channel==='whatsapp'){ window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summary)}`,'_blank'); }
    if(channel==='telegram'){ window.open(`https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(summary)}`,'_blank'); }
  }

  // ---------- STORAGE ----------
  getInvoiceCounter(){ const s=localStorage.getItem('invoiceCounter'); return s?parseInt(s,10):1; }
}

let invoiceGenerator; document.addEventListener('DOMContentLoaded',()=>{ invoiceGenerator=new InvoiceGenerator(); });
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('/sw.js').catch(()=>{}); }); }
