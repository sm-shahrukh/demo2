(() => {
  const serviceNames = new Set(["flights", "umrah", "visa"]);
  const applyActiveService = (service) => {
    if (!serviceNames.has(service)) return;

    document.querySelectorAll(".travel-nav .nav-service").forEach((link) => {
      const active = link.dataset.service === service;
      link.classList.toggle("is-current", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  if (window.parent !== window) {
    let parentHasServiceControls = false;

    window.addEventListener("message", (event) => {
      if (event.source !== window.parent) return;
      if (event.data?.type === "booking-service-change") {
        parentHasServiceControls = true;
        applyActiveService(event.data.service);
      }
    });

    document.querySelectorAll(".travel-nav .nav-service").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!parentHasServiceControls) return;
        event.preventDefault();
        window.parent.postMessage(
          {
            type: "booking-service-request",
            service: link.dataset.service,
          },
          "*",
        );
      });
    });
    return;
  }

  const syncNavbar = () => {
    const selected = document.querySelector(
      'input.service-choice[name="service"]:checked',
    );
    const iframe = document.querySelector(".shared-navbar-frame");
    if (!selected || !iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
      {
        type: "booking-service-change",
        service: selected.id.replace(/^service-/, ""),
      },
      "*",
    );
  };

  document.addEventListener("change", (event) => {
    if (event.target.matches('input.service-choice[name="service"]')) {
      syncNavbar();
    }
  });

  const iframe = document.querySelector(".shared-navbar-frame");
  iframe?.addEventListener("load", syncNavbar);

  window.addEventListener("message", (event) => {
    if (event.source !== iframe?.contentWindow) return;
    if (event.data?.type !== "booking-service-request") return;

    const service = event.data.service;
    if (!serviceNames.has(service)) return;

    const control = document.getElementById(`service-${service}`);
    if (!(control instanceof HTMLInputElement) || control.type !== "radio") return;

    control.checked = true;
    control.dispatchEvent(new Event("change", { bubbles: true }));
  });

  syncNavbar();
})();
