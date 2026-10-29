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

  const bindDrawer = () => {
    const drawer = frame.contentDocument?.getElementById("mobile-auth-drawer");
    if (!drawer || drawer.dataset.frameResizeBound) return Boolean(drawer);
    drawer.dataset.frameResizeBound = "true";

    const syncFrame = () => {
      if (!matchMedia("(max-width: 767px)").matches) return;
      if (drawer.matches(":popover-open")) {
        Object.entries(expandedStyles).forEach(([name, value]) =>
          frame.style.setProperty(name, value, "important"),
        );
      } else {
        Object.keys(expandedStyles).forEach(name => frame.style.removeProperty(name));
      }
    };

    drawer.addEventListener("toggle", syncFrame);
    frame.contentDocument.addEventListener("click", event => {
      const link = event.target.closest('a[target="_top"][href]');
      if (link && drawer.contains(link)) {
        event.preventDefault();
        if (drawer.matches(":popover-open")) drawer.hidePopover();
        Object.keys(expandedStyles).forEach(name => frame.style.removeProperty(name));
        window.location.assign(link.href);
        return;
      }
      if (event.target.closest('[popovertarget="mobile-auth-drawer"]')) {
        requestAnimationFrame(syncFrame);
      }
    });
    frame.contentDocument.addEventListener("keydown", event => {
      if (event.key === "Escape") setTimeout(syncFrame);
    });
    return true;
  };

  frame.addEventListener("load", bindDrawer);
  if (!bindDrawer()) {
    const retry = setInterval(() => {
      if (bindDrawer()) clearInterval(retry);
    }, 100);
    setTimeout(() => clearInterval(retry), 10000);
  }
})();
