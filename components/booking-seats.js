// Keep both travellers' seat maps synchronized within this booking.
(() => {
  const people = ["adult", "child"];
  const originalInputs = [...document.querySelectorAll(".seat-choice input")];
  const occupiedByLeg = new Map();
  originalInputs
    .filter((input) => input.disabled)
    .forEach((input) => {
      const leg =
        input.closest(".traveller-options")?.dataset.flightLeg || "outbound";
      if (!occupiedByLeg.has(leg)) occupiedByLeg.set(leg, new Set());
      occupiedByLeg.get(leg).add(input.value);
    });
  const inputs = [];
  const rowCount = 29;
  const passengerIcon =
    '<svg class="seat-passenger-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.5"/><path d="M10 9h4l1 7h4v3h-7a2 2 0 0 1-2-2L9 12a2 2 0 0 1 1-3Z"/><path d="M6 9v8a4 4 0 0 0 4 4h8v-2h-8a2 2 0 0 1-2-2V9Z"/></svg>';
  const name = (person) => {
    const first = document.querySelector(`[name="${person}-first"]`)?.value;
    const last = document.querySelector(`[name="${person}-last"]`)?.value;
    return (
      [first, last].filter(Boolean).join(" ") ||
      (person === "adult" ? "Traveller 1" : "Traveller 2")
    );
  };
  document.querySelectorAll(".seat-map").forEach((map) => {
    const person = map
      .closest(".traveller-options")
      .classList.contains("child-options")
      ? "child"
      : "adult";
    const leg =
      map.closest(".traveller-options").dataset.flightLeg || "outbound";
    const seatName = `${person}-seat${leg === "return" ? "-return" : ""}`;
    const originalSeats = new Map(
      [...map.querySelectorAll(".seat-choice input")].map((input) => [
        input.value,
        input.closest(".seat-choice"),
      ]),
    );
    const defaultPrice =
      originalSeats.values().next().value?.querySelector("input").dataset
        .price || "3500";
    const cabin = document.createElement("div");
    cabin.className = "aircraft-cabin";
    const letters = document.createElement("div");
    letters.className = "seat-row seat-letters";
    letters.innerHTML =
      "<span>A</span><span>B</span><span>C</span><span></span><span>D</span><span>E</span><span>F</span>";
    cabin.append(letters);
    for (let rowNumber = 1; rowNumber <= rowCount; rowNumber++) {
      const row = document.createElement("div");
      row.className = "seat-row";
      row.dataset.seatRow = rowNumber;
      for (const letter of "ABCDEF") {
        if (letter === "D") {
          const aisleNumber = document.createElement("span");
          aisleNumber.className = "seat-row-number";
          aisleNumber.textContent = rowNumber;
          row.append(aisleNumber);
        }
        const value = `${rowNumber}${letter}`;
        let seat = originalSeats.get(value);
        if (!seat) {
          seat = document.createElement("label");
          seat.className = `seat-choice${rowNumber === 1 || rowNumber === 13 ? " extra-legroom" : ""}`;
          const input = document.createElement("input");
          input.type = "radio";
          input.name = seatName;
          input.value = value;
          Object.assign(input.dataset, {
            price: defaultPrice,
            label: value,
            person,
            kind: "seat",
            flightLeg: leg,
          });
          seat.append(input, document.createElement("span"));
        }
        const input = seat.querySelector("input");
        input.dataset.flightLeg = leg;
        inputs.push(input);
        row.append(seat);
      }
      cabin.append(row);
    }
    const aircraftShell = map.querySelector(".aircraft-shell");
    map.replaceChildren(aircraftShell, cabin);
    const scroll = document.createElement("div");
    scroll.className = "plane-scroll";
    scroll.tabIndex = 0;
    scroll.setAttribute(
      "aria-label",
      "Aircraft seat map. Scroll to view all seats.",
    );
    map.before(scroll);
    scroll.append(map);
    map.classList.add("interactive-plane");
    // Begin a mouse drag only after movement, so a normal click selects a seat.
    let drag = null;
    let suppressClick = false;
    scroll.addEventListener("pointerdown", (event) => {
      if (
        event.pointerType === "touch" ||
        event.button !== 0 ||
        !event.isPrimary
      )
        return;
      drag = {
        id: event.pointerId,
        y: event.clientY,
        top: scroll.scrollTop,
        moved: false,
      };
    });
    scroll.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const distance = event.clientY - drag.y;
      if (!drag.moved && Math.abs(distance) < 5) return;
      if (!drag.moved) {
        drag.moved = true;
        scroll.setPointerCapture(event.pointerId);
        scroll.classList.add("is-seat-dragging");
      }
      event.preventDefault();
      scroll.scrollTop = drag.top - distance;
    });
    const stopDrag = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      if (drag.moved) {
        suppressClick = true;
        // The click following pointerup must not activate the seat underneath.
        setTimeout(() => {
          suppressClick = false;
        }, 0);
      }
      drag = null;
      scroll.classList.remove("is-seat-dragging");
      if (scroll.hasPointerCapture(event.pointerId))
        scroll.releasePointerCapture(event.pointerId);
    };
    scroll.addEventListener("pointerup", stopDrag);
    scroll.addEventListener("pointercancel", stopDrag);
    scroll.addEventListener("lostpointercapture", stopDrag);
    scroll.addEventListener("pointerleave", () => {
      if (drag && !drag.moved) drag = null;
    });
    scroll.addEventListener(
      "click",
      (event) => {
        if (!suppressClick || event.detail === 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
      },
      true,
    );
    const legend = document.createElement("div");
    legend.className = "seat-owners";
    legend.setAttribute("aria-live", "polite");
    scroll.before(legend);
  });
  function sync() {
    const selected = {};
    people.forEach((person) => {
      ["outbound", "return"].forEach((leg) => {
        const suffix = leg === "return" ? "-return" : "";
        const checked = document.querySelector(
          `input[name="${person}-seat${suffix}"]:checked`,
        );
        if (!checked || checked.value === "none") return;
        if (!selected[leg]) selected[leg] = {};
        const occupied = occupiedByLeg.get(leg) || new Set();
        if (occupied.has(checked.value) || selected[leg][checked.value]) {
          checked.checked = false;
          document.querySelector(
            `input[name="${person}-seat${suffix}"][value="none"]`,
          ).checked = true;
        } else selected[leg][checked.value] = person;
      });
    });
    inputs.forEach((input) => {
      const label = input.closest(".seat-choice");
      const leg = input.dataset.flightLeg || "outbound";
      const occupied = occupiedByLeg.get(leg) || new Set();
      const owner = selected[leg]?.[input.value];
      input.disabled =
        occupied.has(input.value) ||
        Boolean(owner && owner !== input.dataset.person);
      label.classList.toggle("occupied", occupied.has(input.value));
      label.dataset.owner = owner || "";
      const message = owner
        ? `${input.value} — Selected by ${name(owner)}${owner !== input.dataset.person ? ". Unavailable until they change seats." : ""}`
        : `${input.value} — ${input.disabled ? "Occupied" : "Available"}`;
      label.title = message;
      input.setAttribute("aria-label", message);
      label.tabIndex = input.disabled ? 0 : -1;
      label.setAttribute("aria-label", message);
      const face = label.querySelector("span");
      if (owner) face.innerHTML = passengerIcon;
      else face.textContent = input.disabled ? "×" : input.value;
    });
    document.querySelectorAll(".seat-owners").forEach((legend) => {
      const leg =
        legend.closest(".traveller-options")?.dataset.flightLeg || "outbound";
      legend.replaceChildren(
        ...people.map((person) => {
          const item = document.createElement("span");
          item.dataset.owner = person;
          const seat = Object.keys(selected[leg] || {}).find(
            (value) => selected[leg][value] === person,
          );
          item.textContent = `${person === "adult" ? "1" : "2"} · ${name(person)}: ${seat || "No seat"}`;
          return item;
        }),
      );
    });
    people.forEach((person) =>
      ["outbound", "return"].forEach((leg) => {
        const suffix = leg === "return" ? "-return" : "";
        const checked = document.querySelector(
          `input[name="${person}-seat${suffix}"]:checked`,
        );
        document
          .querySelectorAll(
            `.traveller-options.${person}-options[data-flight-leg="${leg}"] [data-summary="${person}-seat${suffix}"]`,
          )
          .forEach((el) => {
            el.classList.add("live-seat-value");
            el.textContent =
              checked && checked.value !== "none"
                ? checked.value
                : "No preference";
          });
        document
          .querySelectorAll(
            `.traveller-options.${person}-options[data-flight-leg="${leg}"] [data-person-seat-price="${person}${suffix}"]`,
          )
          .forEach((el) => {
            el.classList.add("live-seat-value");
            el.textContent = `PKR ${Number(checked?.dataset.price || 0).toLocaleString("en-PK")}`;
          });
      }),
    );
  }
  document.addEventListener("change", (event) => {
    if (
      event.target.matches(
        'input[data-kind="seat"], input[name$="-first"], input[name$="-last"]',
      )
    )
      sync();
  });
  sync();
})();
