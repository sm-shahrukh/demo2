// Keep both travellers' seat maps synchronized within this booking.
(() => {
  const people = ['adult', 'child'];
  const originalInputs = [...document.querySelectorAll('.seat-choice input')];
  const occupied = new Set(originalInputs.filter(input => input.disabled).map(input => input.value));
  const inputs = [];
  const rowCount = 29;
  const firstSeatY = 162;
  const rowPitch = 32;
  const exitGap = 18;
  const passengerIcon = '<svg class="seat-passenger-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.5"/><path d="M10 9h4l1 7h4v3h-7a2 2 0 0 1-2-2L9 12a2 2 0 0 1 1-3Z"/><path d="M6 9v8a4 4 0 0 0 4 4h8v-2h-8a2 2 0 0 1-2-2V9Z"/></svg>';
  const name = person => {
    const first = document.querySelector(`[name="${person}-first"]`)?.value;
    const last = document.querySelector(`[name="${person}-last"]`)?.value;
    return [first, last].filter(Boolean).join(' ') || (person === 'adult' ? 'Traveller 1' : 'Traveller 2');
  };
  document.querySelectorAll('.seat-map').forEach(map => {
    const person = map.closest('.traveller-options').classList.contains('child-options') ? 'child' : 'adult';
    const originalSeats = new Map([...map.querySelectorAll('.seat-choice input')].map(input => [input.value, input.closest('.seat-choice')]));
    const defaultPrice = originalSeats.values().next().value?.querySelector('input').dataset.price || '3500';
    const cabin = document.createElement('div');
    cabin.className = 'aircraft-cabin';
    const letters = document.createElement('div');
    letters.className = 'seat-row seat-letters';
    letters.innerHTML = '<span>A</span><span>B</span><span>C</span><span></span><span>D</span><span>E</span><span>F</span>';
    cabin.append(letters);
    for (let rowNumber = 1; rowNumber <= rowCount; rowNumber++) {
      const row = document.createElement('div');
      row.className = 'seat-row';
      row.dataset.seatRow = rowNumber;
      for (const letter of 'ABCDEF') {
        if (letter === 'D') {
          const aisleNumber = document.createElement('span');
          aisleNumber.className = 'seat-row-number';
          aisleNumber.textContent = rowNumber;
          row.append(aisleNumber);
        }
        const value = `${rowNumber}${letter}`;
        let seat = originalSeats.get(value);
        if (!seat) {
          seat = document.createElement('label');
          seat.className = `seat-choice${rowNumber === 1 || rowNumber === 13 ? ' extra-legroom' : ''}`;
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = `${person}-seat`;
          input.value = value;
          Object.assign(input.dataset, { price:defaultPrice, label:value, person, kind:'seat' });
          seat.append(input, document.createElement('span'));
        }
        inputs.push(seat.querySelector('input'));
        row.append(seat);
      }
      cabin.append(row);
    }
    const rear = firstSeatY + rowCount * rowPitch + exitGap;
    const aircraftHeight = rear + 184;
    const wingY = firstSeatY + Math.floor(rowCount * .4) * rowPitch;
    const exitY = firstSeatY + 12 * rowPitch + exitGap / 2;
    const windows = Array.from({ length:rowCount }, (_, index) => {
      const y = firstSeatY + index * rowPitch + (index >= 12 ? exitGap : 0) + 5;
      return `<rect x="88" y="${y}" width="4" height="12" rx="2"/><rect x="308" y="${y}" width="4" height="12" rx="2"/>`;
    }).join('');
    const outline = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    outline.classList.add('aircraft-outline');
    outline.setAttribute('viewBox', `0 0 400 ${aircraftHeight}`);
    outline.setAttribute('aria-hidden', 'true');
    outline.innerHTML = `
      <defs>
        <linearGradient id="cabin-${person}">
          <stop stop-color="var(--color-border)"/>
          <stop offset=".09" stop-color="var(--color-selected-bg)"/>
          <stop offset=".23" stop-color="var(--color-surface)"/>
          <stop offset=".77" stop-color="var(--color-surface)"/>
          <stop offset=".91" stop-color="var(--color-selected-bg)"/>
          <stop offset="1" stop-color="var(--color-border)"/>
        </linearGradient>
      </defs>
      <g class="aircraft-wings">
        <path d="M91 ${wingY} 15 ${wingY + 181} 5 ${wingY + 237} 91 ${wingY + 176}Z M309 ${wingY} 385 ${wingY + 181} 395 ${wingY + 237} 309 ${wingY + 176}Z"/>
        <path d="M126 ${rear + 55} 46 ${rear + 124} 38 ${rear + 148} 143 ${rear + 113}Z M274 ${rear + 55} 354 ${rear + 124} 362 ${rear + 148} 257 ${rear + 113}Z"/>
        <path class="aircraft-wing-detail" d="M84 ${wingY + 41} 22 ${wingY + 208} 84 ${wingY + 153}M316 ${wingY + 41} 378 ${wingY + 208} 316 ${wingY + 153}"/>
      </g>
      <g class="aircraft-engines"><rect x="45" y="${wingY + 97}" width="22" height="58" rx="10"/><rect x="333" y="${wingY + 97}" width="22" height="58" rx="10"/></g>
      <path class="aircraft-fuselage" fill="url(#cabin-${person})" d="M200 10 C151 25 81 70 81 131 L81 ${rear + 38} C81 ${rear + 99} 151 ${aircraftHeight - 32} 200 ${aircraftHeight - 10} C249 ${aircraftHeight - 32} 319 ${rear + 99} 319 ${rear + 38} L319 131 C319 70 249 25 200 10Z"/>
      <path class="aircraft-cabin-edge" d="M98 133V${rear + 27}M302 133V${rear + 27}"/>
      <g class="aircraft-cockpit"><path d="m195 55-31 9-23 23 19 10 35-18Z"/><path d="m205 55 31 9 23 23-19 10-35-18Z"/></g>
      <g class="aircraft-windows">${windows}</g>
      <g class="aircraft-facilities"><rect x="105" y="109" width="75" height="17" rx="3"/><rect x="220" y="109" width="75" height="17" rx="3"/><text x="142" y="121">WC</text><text x="258" y="121">GALLEY</text><rect x="109" y="${rear + 11}" width="182" height="20" rx="3"/><text x="200" y="${rear + 25}">REAR GALLEY</text></g>
      <g class="aircraft-exits"><path d="M76 137H63l5-5m-5 5 5 5m256-5h13l-5-5m5 5-5 5M76 ${exitY}H63l5-5m-5 5 5 5m256-5h13l-5-5m5 5-5 5M76 ${rear + 21}H63l5-5m-5 5 5 5m256-5h13l-5-5m5 5-5 5"/></g>
      <path class="aircraft-tail-fin" d="M200 ${rear + 56} C184 ${rear + 88} 184 ${aircraftHeight - 43} 200 ${aircraftHeight - 10} C216 ${aircraftHeight - 43} 216 ${rear + 88} 200 ${rear + 56}Z"/>
      <path class="aircraft-tail-stripe" d="M200 ${rear + 81}V${aircraftHeight - 28}"/>`;
    map.replaceChildren(outline, cabin);
    map.style.setProperty('--aircraft-height', aircraftHeight);
    const scroll = document.createElement('div');
    scroll.className = 'plane-scroll';
    scroll.tabIndex = 0;
    scroll.setAttribute('aria-label', 'Aircraft seat map. Scroll to view all seats.');
    map.before(scroll);
    scroll.append(map);
    map.classList.add('interactive-plane');
    // Begin a mouse drag only after movement, so a normal click selects a seat.
    let drag = null;
    let suppressClick = false;
    scroll.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary) return;
      drag = { id:event.pointerId, y:event.clientY, top:scroll.scrollTop, moved:false };
    });
    scroll.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.id) return;
      const distance = event.clientY - drag.y;
      if (!drag.moved && Math.abs(distance) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        scroll.setPointerCapture(event.pointerId);
        scroll.classList.add('is-seat-dragging');
      }
      event.preventDefault();
      scroll.scrollTop = drag.top - distance;
    });
    const stopDrag = event => {
      if (!drag || event.pointerId !== drag.id) return;
      if (drag.moved) {
        suppressClick = true;
        // The click following pointerup must not activate the seat underneath.
        setTimeout(() => { suppressClick = false; }, 0);
      }
      drag = null;
      scroll.classList.remove('is-seat-dragging');
      if (scroll.hasPointerCapture(event.pointerId)) scroll.releasePointerCapture(event.pointerId);
    };
    scroll.addEventListener('pointerup', stopDrag);
    scroll.addEventListener('pointercancel', stopDrag);
    scroll.addEventListener('lostpointercapture', stopDrag);
    scroll.addEventListener('pointerleave', () => { if (drag && !drag.moved) drag = null; });
    scroll.addEventListener('click', event => {
      if (!suppressClick || event.detail === 0) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }, true);
    const legend = document.createElement('div');
    legend.className = 'seat-owners';
    legend.setAttribute('aria-live', 'polite');
    scroll.before(legend);
  });
  function sync() {
    const selected = {};
    people.forEach(person => {
      const checked = document.querySelector(`input[name="${person}-seat"]:checked`);
      if (checked && checked.value !== 'none') {
        if (occupied.has(checked.value) || selected[checked.value]) {
          checked.checked = false;
          document.querySelector(`input[name="${person}-seat"][value="none"]`).checked = true;
        } else selected[checked.value] = person;
      }
    });
    inputs.forEach(input => {
      const label = input.closest('.seat-choice');
      const owner = selected[input.value];
      input.disabled = occupied.has(input.value) || Boolean(owner && owner !== input.dataset.person);
      label.classList.toggle('occupied', occupied.has(input.value));
      label.dataset.owner = owner || '';
      const message = owner ? `${input.value} — Selected by ${name(owner)}${owner !== input.dataset.person ? '. Unavailable until they change seats.' : ''}` : `${input.value} — ${input.disabled ? 'Occupied' : 'Available'}`;
      label.title = message;
      input.setAttribute('aria-label', message);
      label.tabIndex = input.disabled ? 0 : -1;
      label.setAttribute('aria-label', message);
      const face = label.querySelector('span');
      if (owner) face.innerHTML = passengerIcon;
      else face.textContent = input.disabled ? '×' : input.value;
    });
    document.querySelectorAll('.seat-owners').forEach(legend => {
      legend.replaceChildren(...people.map(person => {
        const item = document.createElement('span');
        item.dataset.owner = person;
        const seat = Object.keys(selected).find(value => selected[value] === person);
        item.textContent = `${person === 'adult' ? '1' : '2'} · ${name(person)}: ${seat || 'No seat'}`;
        return item;
      }));
    });
    people.forEach(person => {
      const checked = document.querySelector(`input[name="${person}-seat"]:checked`);
      document.querySelectorAll(`[data-summary="${person}-seat"]`).forEach(el => {
        el.classList.add('live-seat-value');
        el.textContent = checked && checked.value !== 'none' ? checked.value : 'No preference';
      });
      document.querySelectorAll(`[data-person-seat-price="${person}"]`).forEach(el => {
        el.classList.add('live-seat-value');
        el.textContent = `PKR ${Number(checked?.dataset.price || 0).toLocaleString('en-PK')}`;
      });
    });
  }
  document.addEventListener('change', event => {
    if (event.target.matches('input[data-kind="seat"], input[name$="-first"], input[name$="-last"]')) sync();
  });
  sync();
})();
