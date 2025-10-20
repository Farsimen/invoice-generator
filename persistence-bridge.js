// Cross-browser sync for saved invoices using localStorage backup + optional KV mirror
(function(){
  const KEY = 'savedInvoices';
  const BACKUP_KEY = 'savedInvoicesBackup';

  function load() {
    try {
      const primary = localStorage.getItem(KEY);
      if (primary) return JSON.parse(primary);
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) return JSON.parse(backup);
    } catch(_){}
    return [];
  }

  function save(data) {
    try {
      const str = JSON.stringify(data);
      localStorage.setItem(KEY, str);
      localStorage.setItem(BACKUP_KEY, str);
    } catch(_){}
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // On first load, if savedInvoices empty but backup exists, restore
    const hasPrimary = !!localStorage.getItem(KEY);
    const hasBackup = !!localStorage.getItem(BACKUP_KEY);
    if (!hasPrimary && hasBackup) {
      localStorage.setItem(KEY, localStorage.getItem(BACKUP_KEY));
    }

    // Hook into app if available
    const tryHook = () => {
      if (!window.invoiceGenerator) return setTimeout(tryHook, 300);
      const app = window.invoiceGenerator;
      // Override getSavedInvoices to use our loader
      app.getSavedInvoices = function(){ return load(); };
      // Wrap saveInvoiceToHistory to persist to both keys
      const origSave = app.saveInvoiceToHistory.bind(app);
      app.saveInvoiceToHistory = async function(includePDF){
        await origSave(includePDF);
        const data = app.savedInvoices || [];
        save(data);
      };
    };
    tryHook();
  });
})();
