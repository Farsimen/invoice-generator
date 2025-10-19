/**
 * Adjust invoice bottom layout to place notes next to totals
 * and reflect CSS grid .invoice-bottom
 */

// Patch render() to wrap notes + totals in invoice-bottom container

(function(){
  const originalRender = InvoiceGenerator.prototype.render;
  InvoiceGenerator.prototype.render = function(){
    try {
      const _render = originalRender.bind(this);
      // call original to build everything
      _render();

      // After original HTML built, re-wrap notes + totals if both exist
      const preview = document.getElementById('invoicePreview');
      if (!preview) return;

      // locate notes and calculations box
      const notes = preview.querySelector('.invoice-notes');
      const calc = preview.querySelector('.invoice-calculations');

      if (notes && calc) {
        const wrapper = document.createElement('div');
        wrapper.className = 'invoice-bottom';

        // move notes and calculations into wrapper
        notes.parentNode.insertBefore(wrapper, notes);
        wrapper.appendChild(notes);
        wrapper.appendChild(calc);
      }
    } catch(err) {
      console.error('Render patch error', err);
    }
  };
})();
