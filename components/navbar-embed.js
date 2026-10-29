(() => {
  const frame = [...document.querySelectorAll("iframe")].find(iframe =>
    (iframe.getAttribute("src") || "").includes("navbar.html"),
  );
  if (!frame) return;

  const expandedStyles = {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100dvh",
    "max-height": "100dvh",
    "z-index": "10000",
    border: "0",
  };

  let headerObserver;
  let syncFrame = () => {};
  const bindDrawer = () => {
    const doc = frame.contentDocument;
    const header = doc?.querySelector(".travel-header");
    const drawer = doc?.getElementById("mobile-auth-drawer");
    if (!header || !drawer || drawer.dataset.frameResizeBound) return;
    drawer.dataset.frameResizeBound = "true";

    const sizeHeader = () => {
      const height = Math.ceil(header.getBoundingClientRect().bottom);
      document.documentElement.style.setProperty("--site-header-height", `${height}px`);
      if (!drawer.matches(":popover-open")) frame.style.height = `${height}px`;
    };
    const collapseFrame = () => {
      document.body.classList.remove("site-menu-open");
      Object.keys(expandedStyles).forEach(name => frame.style.removeProperty(name));
      sizeHeader();
    };
    syncFrame = () => {
      const open = matchMedia("(max-width: 767px)").matches && drawer.matches(":popover-open");
      doc.querySelector(".mobile-auth-menu-trigger")?.setAttribute("aria-expanded", String(open));
      if (open) {
        document.body.classList.add("site-menu-open");
        Object.entries(expandedStyles).forEach(([name, value]) =>
          frame.style.setProperty(name, value, "important"),
        );
      } else {
        if (drawer.matches(":popover-open")) drawer.hidePopover();
        collapseFrame();
      }
    };

    headerObserver?.disconnect();
    headerObserver = new ResizeObserver(sizeHeader);
    headerObserver.observe(header);
    const strip = doc.querySelector(".welcome-strip");
    if (strip) headerObserver.observe(strip);
    sizeHeader();
    drawer.addEventListener("toggle", syncFrame);
    doc.addEventListener("click", event => {
      const link = event.target.closest('a[target="_top"][href]');
      if (link && drawer.contains(link)) {
        event.preventDefault();
        if (drawer.matches(":popover-open")) drawer.hidePopover();
        collapseFrame();
        window.location.assign(link.href);
        return;
      }
      if (event.target.closest('[popovertarget="mobile-auth-drawer"]')) {
        requestAnimationFrame(syncFrame);
      }
    });
    doc.addEventListener("keydown", event => {
      if (event.key === "Escape") setTimeout(syncFrame);
    });
  };

  frame.addEventListener("load", bindDrawer);
  window.addEventListener("resize", () => syncFrame());
  bindDrawer();
})();
