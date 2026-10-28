// Give every traveller an independent set of add-ons for each flight leg.
(() => {
  const options = [...document.querySelectorAll('.addons-panel > .traveller-options')];
  const personSwitches = ['adult', 'child'].map(person => document.getElementById(`person-${person}`));
  const legSwitches = ['outbound', 'return'].map(leg => document.getElementById(`leg-${leg}`));
  if (!options.length || legSwitches.some(input => !input)) return;

  options.forEach(outbound => {
    outbound.dataset.flightLeg = 'outbound';
    const person = outbound.classList.contains('child-options') ? 'child' : 'adult';
    const returning = outbound.cloneNode(true);
    returning.dataset.flightLeg = 'return';
    returning.setAttribute('aria-label', `${outbound.getAttribute('aria-label') || `${person} add-ons`}, leg 2`);

    const ids = new Map();
    returning.querySelectorAll('[id]').forEach(element => {
      const oldId = element.id;
      const newId = `return-${oldId}`;
      ids.set(oldId, newId);
      element.id = newId;
    });
    returning.querySelectorAll('label[for]').forEach(label => {
      if (ids.has(label.htmlFor)) label.htmlFor = ids.get(label.htmlFor);
    });
    returning.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach(element => {
      ['aria-labelledby', 'aria-describedby'].forEach(attribute => {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, value.split(/\s+/).map(id => ids.get(id) || id).join(' '));
      });
    });
    returning.querySelectorAll('input[name]').forEach(input => { input.name = `${input.name}-return`; });
    returning.querySelectorAll('[data-summary]').forEach(element => {
      element.dataset.summary = `${element.dataset.summary}-return`;
    });
    returning.querySelectorAll('[data-person-seat-price]').forEach(element => {
      element.dataset.personSeatPrice = `${element.dataset.personSeatPrice}-return`;
    });
    returning.querySelectorAll('input[data-kind="seat"]').forEach(input => {
      input.checked = input.value === 'none';
    });
    returning.querySelectorAll('.seat-choice').forEach(label => {
      label.classList.remove('occupied');
      label.removeAttribute('data-owner');
      const input = label.querySelector('input');
      if (input && input.disabled) label.classList.add('occupied');
    });
    outbound.after(returning);
    returning.querySelectorAll('.meal-panel, .baggage-panel').forEach(panel => window.attachAddonPanelDrag?.(panel));
  });

  const activeName = document.querySelector('[data-active-person-label]');
  const activeLeg = document.querySelector('[data-active-leg-label]');
  const people = ['adult', 'child'];
  let activeCategory = 'seats';
  const travelerName = person => {
    const first = document.querySelector(`[name="${person}-first"]`)?.value.trim();
    const last = document.querySelector(`[name="${person}-last"]`)?.value.trim();
    return [first, last].filter(Boolean).join(' ') || (person === 'adult' ? 'Traveler 1' : 'Traveler 2');
  };
  const selectionLabel = (person, kind, leg) => {
    const suffix = leg === 'return' ? '-return' : '';
    const input = document.querySelector(`input[name="${person}-${kind}${suffix}"]:checked`);
    if (!input || input.value === 'none') {
      return kind === 'seat' ? 'No preference' : kind === 'meal' ? 'No meal' : 'No extra baggage';
    }
    return input.dataset.label || input.value;
  };

  function updateSummary() {
    document.querySelectorAll('#traveller-review [data-review]').forEach(element => {
      const field = document.querySelector(`#traveller-form [name="${element.dataset.review}"]`);
      if (field) element.textContent = field.value.trim() || 'Not provided';
    });
    people.forEach(person => {
      ['seat', 'meal', 'baggage'].forEach(kind => {
        ['outbound', 'return'].forEach(leg => {
          const suffix = leg === 'return' ? '-return' : '';
          document.querySelectorAll(`.traveller-options[data-flight-leg="${leg}"] [data-summary="${person}-${kind}${suffix}"]`).forEach(element => {
            element.classList.add('live-extra-value');
            element.textContent = selectionLabel(person, kind, leg);
          });
          document.querySelectorAll(`[data-review-person="${person}"][data-review-leg="${leg}"] [data-review-extra="${kind}"]`).forEach(element => {
            element.textContent = selectionLabel(person, kind, leg);
          });
        });
        document.querySelectorAll(`.extras-person [data-summary="${person}-${kind}"]`).forEach(element => {
          const outbound = selectionLabel(person, kind, 'outbound');
          const returning = selectionLabel(person, kind, 'return');
          element.classList.add('live-extra-value');
          const fullSummary = `Leg 1: ${outbound} · Leg 2: ${returning}`;
          if (element.closest('.extras-review, .confirmation-extras')) {
            const compactLabel = label => label === 'No preference' ? '—' : label.replace('No extra baggage', 'No extra bag').replace(' extra baggage', '');
            const first = compactLabel(outbound);
            const second = compactLabel(returning);
            element.textContent = `L1 ${first} · L2 ${second}`;
            element.title = fullSummary;
            element.setAttribute('aria-label', `${kind}: ${fullSummary}`);
          } else {
            element.textContent = fullSummary;
          }
        });
      });
    });
    const selectedExtras = [...document.querySelectorAll('.addons-panel input[data-kind]:checked')].filter(input => input.value !== 'none');
    const total = selectedExtras.reduce((sum, input) => sum + Number(input.dataset.price || 0), 0);
    document.querySelectorAll('[data-extras-total]').forEach(element => { element.textContent = `PKR ${total.toLocaleString('en-PK')}`; });
    document.querySelectorAll('[data-extras-count]').forEach(element => { element.textContent = `${selectedExtras.length} ${selectedExtras.length === 1 ? 'item' : 'items'} · Total`; });
  }

  function updateActiveContext() {
    const person = document.getElementById('person-child').checked ? 'child' : 'adult';
    const leg = document.getElementById('leg-return').checked ? 'return' : 'outbound';
    people.forEach(traveler => {
      const name = travelerName(traveler);
      const initials = name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();
      document.querySelectorAll(`[data-person-name="${traveler}"]`).forEach(element => { element.textContent = name; });
      document.querySelectorAll(`[data-person-initials="${traveler}"]`).forEach(element => { element.textContent = initials; });
      document.querySelectorAll(`[data-review-person="${traveler}"]`).forEach(section => {
        section.setAttribute('aria-label', `${name}, leg ${section.dataset.reviewLeg === 'return' ? '2' : '1'} extras`);
      });
    });
    document.querySelectorAll('.addons-panel > .traveller-options').forEach(section => {
      section.hidden = !(section.classList.contains(`${person}-options`) && section.dataset.flightLeg === leg);
      if (!section.hidden) {
        const category = section.querySelector(`input[id$="-${activeCategory}"]`);
        if (category) category.checked = true;
      }
    });
    if (activeName) activeName.textContent = travelerName(person);
    if (activeLeg) activeLeg.textContent = leg === 'return' ? 'Leg 2 · DXB → ISB' : 'Leg 1 · ISB → DXB';
  }

  [...personSwitches, ...legSwitches].forEach(input => input.addEventListener('change', updateActiveContext));
  document.addEventListener('change', event => {
    if (event.target.matches('input[name$="-category"], input[name$="-category-return"]')) activeCategory = event.target.id.split('-').pop();
    if (event.target.matches('input[data-kind="seat"], input[data-kind="meal"], input[data-kind="baggage"], #step-review, #step-payment, #step-complete, #traveller-form input, #traveller-form select')) {
      // Seat availability is synchronized by another change listener first.
      queueMicrotask(updateSummary);
    }
  });
  document.querySelectorAll('.extras-review, .payment-extras').forEach(review => {
    review.addEventListener('toggle', () => {
      if (review.open) updateSummary();
    });
  });
  const extrasConfirmation = document.getElementById('addons-confirmation');
  extrasConfirmation?.addEventListener('beforetoggle', event => {
    if (event.newState === 'open') updateSummary();
  });
  // Final actions in the mobile panels and Skip extras use the same review.
  document.querySelector('.addons-panel').addEventListener('click', event => {
    if (!event.target.closest('label[for="step-payment"]') || !extrasConfirmation) return;
    event.preventDefault();
    updateSummary();
    extrasConfirmation.showPopover();
  });
  document.querySelector('[data-confirm-extras]')?.addEventListener('click', () => {
    const paymentStep = document.getElementById('step-payment');
    paymentStep.checked = true;
    paymentStep.dispatchEvent(new Event('change', { bubbles:true }));
    extrasConfirmation.hidePopover();
    document.getElementById('payment-title')?.focus();
  });
  document.addEventListener('input', event => {
    if (event.target.matches('[name="adult-first"], [name="adult-last"], [name="child-first"], [name="child-last"]')) updateActiveContext();
    if (event.target.matches('#traveller-form input, #traveller-form select')) updateSummary();
  });
  updateActiveContext();
  updateSummary();
})();
