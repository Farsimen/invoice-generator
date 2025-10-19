class InvoiceGenerator {
    constructor() {
        this.services = [];
        this.invoiceCounter = this.getInvoiceCounter();
        this.cachedInvoiceNumber = null; // freeze per session until PDF generated
        this.initializeEventListeners();
        this.loadSavedData();
        this.loadTheme();
        this.generatePreview();
    }

    // Ensure we always compute persian date with Latin digits, not Persian numerals
    getPersianParts(date){
        // Use Gregorian date and convert via Intl but parse using Object parts
        const fmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year:'2-digit', month:'2-digit', day:'2-digit'});
        const parts = fmt.formatToParts(date);
        const y = parseInt(parts.find(p=>p.type==='year').value,10);
        const m = parseInt(parts.find(p=>p.type==='month').value,10);
        const d = parseInt(parts.find(p=>p.type==='day').value,10);
        return {y,m,d};
    }

    getInvoiceCodeForToday(){
        const {y,m,d} = this.getPersianParts(new Date());
        return `${y.toString().padStart(2,'0')}${m.toString().padStart(2,'0')}${d.toString().padStart(2,'0')}`;
    }

    generateInvoiceNumber(){
        // Freeze number for share actions so NaN from async changes won't happen
        if (this.cachedInvoiceNumber) return this.cachedInvoiceNumber;
        const dateStr = this.getInvoiceCodeForToday();
        const num = `${dateStr}-${this.invoiceCounter.toString().padStart(3,'0')}`;
        this.cachedInvoiceNumber = num;
        return num;
    }

    finalizeInvoiceNumberAfterPDF(){
        // After saving PDF increase counter and clear cache for next invoice
        this.incrementInvoiceCounter();
        this.cachedInvoiceNumber = null;
    }

    // ... keep previous functions but replace all date usage with the above helpers ...
}

// Patch sharing to include PDF link by generating a blob and using URL.createObjectURL
InvoiceGenerator.prototype.buildAndShare = async function(channel){
    // Render PDF into Blob
    const { jsPDF } = window.jspdf;
    const el = document.getElementById('invoicePreview');
    const canvas = await html2canvas(el,{scale:2,useCORS:true,allowTaint:true,backgroundColor:'#ffffff'});
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
    const w=210, ph=295, h=(canvas.height*w)/canvas.width; let left=h; pdf.addImage(img,'PNG',0,0,w,h); left-=ph; while(left>=0){pdf.addPage(); pdf.addImage(img,'PNG',0,left-h,w,h); left-=ph;}
    const fileName = `invoice-${this.generateInvoiceNumber()}.pdf`;
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);

    const summary = await this.buildInvoiceSummary();
    const text = `${summary}\nلینک PDF: ${url}`;

    if(channel==='email'){
        const email = document.getElementById('customerEmail').value||'';
        const mailto = `mailto:${email}?subject=${encodeURIComponent(summary)}&body=${encodeURIComponent(text)}`;
        window.open(mailto);
    } else if(channel==='whatsapp'){
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,'_blank');
    } else if(channel==='telegram'){
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(summary)}`,'_blank');
    }

    // Do not increment here — only when user presses Download PDF
}

// Replace share handlers
InvoiceGenerator.prototype.shareEmail = function(){ this.buildAndShare('email'); }
InvoiceGenerator.prototype.shareWhatsApp = function(){ this.buildAndShare('whatsapp'); }
InvoiceGenerator.prototype.shareTelegram = function(){ this.buildAndShare('telegram'); }

// Replace PDF generation to also finalize counter
InvoiceGenerator.prototype.generatePDF = async function(){
    try{
        const { jsPDF } = window.jspdf;
        const el = document.getElementById('invoicePreview');
        const canvas = await html2canvas(el,{scale:2,useCORS:true,allowTaint:true,backgroundColor:'#ffffff'});
        const img = canvas.toDataURL('image/png');
        const pdf = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
        const w=210, ph=295, h=(canvas.height*w)/canvas.width; let left=h; pdf.addImage(img,'PNG',0,0,w,h); left-=ph; while(left>=0){pdf.addPage(); pdf.addImage(img,'PNG',0,left-h,w,h); left-=ph;}
        const num = this.generateInvoiceNumber();
        pdf.save(`فاکتور-${num}.pdf`);
        this.finalizeInvoiceNumberAfterPDF();
    } catch(e){
        console.error(e); alert('خطا در تولید PDF');
    }
}
