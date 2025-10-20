// Cloudflare KV + LocalStorage sync for cross-device invoice persistence
(function(){
  const API_BASE = location.origin + '/api';
  const LOCAL_KEY = 'savedInvoices';

  // Enhanced localStorage with cloud backup
  const Storage = {
    get: function() {
      try {
        const data = localStorage.getItem(LOCAL_KEY);
        return data ? JSON.parse(data) : [];
      } catch(e) {
        console.warn('LocalStorage read failed:', e);
        return [];
      }
    },

    set: function(invoices) {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(invoices));
        this.syncToCloud(invoices);
      } catch(e) {
        console.warn('LocalStorage write failed:', e);
      }
    },

    syncToCloud: function(invoices) {
      // Generate simple device ID
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
      }

      // Sync to cloud (non-blocking)
      fetch(API_BASE + '/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, invoices })
      }).catch(e => console.log('Cloud sync failed:', e));
    },

    syncFromCloud: async function() {
      try {
        const deviceId = localStorage.getItem('deviceId');
        if (!deviceId) return this.get();

        const response = await fetch(API_BASE + '/invoices?device=' + deviceId);
        if (!response.ok) return this.get();

        const data = await response.json();
        if (data.invoices && Array.isArray(data.invoices)) {
          // Merge with local (prefer newer by timestamp)
          const local = this.get();
          const merged = this.mergeInvoices(local, data.invoices);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
          return merged;
        }
      } catch(e) {
        console.log('Cloud sync failed, using local:', e);
      }
      return this.get();
    },

    mergeInvoices: function(local, cloud) {
      const merged = new Map();
      
      // Add local invoices
      local.forEach(inv => merged.set(inv.id, inv));
      
      // Add cloud invoices (newer ones override)
      cloud.forEach(inv => {
        const existing = merged.get(inv.id);
        if (!existing || new Date(inv.date) > new Date(existing.date)) {
          merged.set(inv.id, inv);
        }
      });
      
      return Array.from(merged.values()).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
    }
  };

  // Hook into app when ready
  document.addEventListener('DOMContentLoaded', async () => {
    const waitForApp = () => {
      if (!window.invoiceGenerator) {
        return setTimeout(waitForApp, 300);
      }

      const app = window.invoiceGenerator;

      // Override getSavedInvoices to use enhanced storage
      const originalGetSaved = app.getSavedInvoices;
      app.getSavedInvoices = function() {
        return Storage.get();
      };

      // Override saveInvoiceToHistory to use enhanced storage
      const originalSave = app.saveInvoiceToHistory;
      app.saveInvoiceToHistory = async function(includePDF) {
        // Run original save logic
        await originalSave.call(this, includePDF);
        // Use enhanced storage
        Storage.set(this.savedInvoices);
      };

      // Initialize with cloud sync on startup
      Storage.syncFromCloud().then(invoices => {
        app.savedInvoices = invoices;
        if (typeof app.renderHistoryStats === 'function') {
          app.renderHistoryStats();
        }
      });
    };

    waitForApp();
  });
})();
