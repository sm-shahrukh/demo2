(() => {
  const key = "sparrow.booking.v1";
  const page = document.body.dataset.page;
  const routes = {
    "step-travellers": "travellers.html",
    "step-addons": "add-ons.html",
    "step-payment": "payment.html",
    "step-complete": "booking-confirmation.html",
  };
  const defaults = {
    "adult-first": "Ali",
    "adult-last": "Khan",
    "child-first": "Ayesha",
    "child-last": "Khan",
    email: "ali.khan@example.com",
  };
  let state = { fields: {}, extras: {} };
  try {
    const saved = JSON.parse(sessionStorage.getItem(key) || "null");
    if (saved)
      state = { fields: saved.fields || {}, extras: saved.extras || {} };
  } catch {}
  function capture() {
    document.querySelectorAll("#traveller-form [name]").forEach((input) => {
      if (input.type !== "radio" || input.checked)
        state.fields[input.name] =
          input.type === "checkbox" ? input.checked : input.value;
    });
    document
      .querySelectorAll(".addons-panel input[data-kind]:checked")
      .forEach((input) => {
        state.extras[input.name] = {
          value: input.value,
          label: input.dataset.label || input.value,
          price: Number(input.dataset.price || 0),
        };
      });
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }
  function travelerName(person) {
    return (
      ["first", "last"]
        .map((part) => {
          const name = `${person}-${part}`;
          return (
            document
              .querySelector(`#traveller-form [name="${name}"]`)
              ?.value.trim() ??
            state.fields[name] ??
            defaults[name] ??
            ""
          );
        })
        .filter(Boolean)
        .join(" ") || (person === "adult" ? "Traveler 1" : "Traveler 2")
    );
  }
  function selection(person, kind, leg) {
    const value =
      state.extras[`${person}-${kind}${leg === "return" ? "-return" : ""}`];
    return !value || value.value === "none"
      ? kind === "seat"
        ? "No preference"
        : kind === "meal"
          ? "No meal"
          : "No extra baggage"
      : value.label || value.value;
  }
  function hydrate() {
    ["adult", "child"].forEach((person) => {
      document
        .querySelectorAll(`[data-person-name="${person}"]`)
        .forEach((el) => (el.textContent = travelerName(person)));
      ["seat", "meal", "baggage"].forEach((kind) =>
        document
          .querySelectorAll(`.extras-person [data-summary="${person}-${kind}"]`)
          .forEach((el) => {
            const a = selection(person, kind, "outbound"),
              b = selection(person, kind, "return"),
              short = (x) =>
                x === "No preference"
                  ? "—"
                  : x
                      .replace("No extra baggage", "No extra bag")
                      .replace(" extra baggage", "");
            el.textContent = el.closest(".extras-review, .confirmation-extras")
              ? `L1 ${short(a)} · L2 ${short(b)}`
              : `Leg 1: ${a} · Leg 2: ${b}`;
          }),
      );
    });
    document.querySelectorAll("[data-review]").forEach((el) => {
      const field = document.querySelector(
        `#traveller-form [name="${el.dataset.review}"]`,
      );
      if (field) el.textContent = field.value || "Not provided";
    });
    document
      .querySelectorAll("[data-contact-email]")
      .forEach((el) => (el.textContent = state.fields.email || defaults.email));
    document
      .querySelectorAll(".addons-panel input[data-kind]")
      .forEach((input) => {
        if (state.extras[input.name])
          input.checked = input.value === state.extras[input.name].value;
      });
  }
  function go(step) {
    const target = routes[step] || { payment: "payment.html" }[step];
    if (!target) return;
    const invalid = document.querySelector("#traveller-form :invalid");
    if (page === "travellers" && invalid) {
      invalid.closest("details")?.setAttribute("open", "");
      invalid.reportValidity();
      return;
    }
    if (
      step === "step-complete" &&
      !document.getElementById("consent")?.checked
    )
      return;
    capture();
    location.assign(target);
  }
  window.BookingFlow = { travelerName, go, capture, hydrate };
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    const label = event.target.closest("label[for]");
    const step = label?.htmlFor;
    if (!routes[step] || routes[step] === `${page}.html`) return;
    event.preventDefault();
    go(step);
  });
  document.addEventListener("input", (event) => {
    if (event.target.closest("#traveller-form")) {
      capture();
      hydrate();
    }
  });
  document.addEventListener("change", (event) => {
    if (
      event.target.closest("#traveller-form") ||
      event.target.matches("input[data-kind], #step-review")
    )
      queueMicrotask(() => {
        capture();
        hydrate();
      });
  });
  window.addEventListener("pagehide", capture);
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("#traveller-form [name]").forEach((input) => {
      if (!(input.name in state.fields)) return;
      if (input.type === "radio")
        input.checked = input.value === state.fields[input.name];
      else if (input.type === "checkbox")
        input.checked = Boolean(state.fields[input.name]);
      else input.value = state.fields[input.name];
    });
    hydrate();
    document.querySelectorAll("label[for]").forEach((label) => {
      if (routes[label.htmlFor]) {
        label.tabIndex = 0;
        label.setAttribute("role", "link");
      }
    });
  });
})();
