// Ensure history view toggling works and section is rendered
(function(){
  const proto = InvoiceGenerator && InvoiceGenerator.prototype;
  if (!proto) return;

  const showHistoryOrig = proto.showHistory;
  proto.showHistory = function(){
    const mainContent = document.getElementById('mainContent');
    const historySection = document.getElementById('historySection');
    if (mainContent) mainContent.style.display = 'none';
    if (historySection) historySection.style.display = 'block';
    try {
      this.renderHistoryStats();
      this.filterInvoices();
    } catch(e){ console.error(e); }
  };

  const showMainOrig = proto.showMain;
  proto.showMain = function(){
    const mainContent = document.getElementById('mainContent');
    const historySection = document.getElementById('historySection');
    if (mainContent) mainContent.style.display = 'block';
    if (historySection) historySection.style.display = 'none';
    try {
      this.render();
    } catch(e){ console.error(e); }
  };
})();
