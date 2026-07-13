(() => {
  const shell = document.querySelector(".admin-shell");
  const settings = document.querySelector("[data-menu-settings]");
  const settingsButton = document.querySelector('[data-action="toggle-menu-settings"]');
  const stateButton = document.querySelector('[data-action="cycle-secondary"]');
  const states = ["expanded", "compact", "collapsed"];

  stateButton?.addEventListener("click", () => {
    const current = shell.dataset.secondaryState || states[0];
    const next = states[(states.indexOf(current) + 1) % states.length];
    shell.dataset.secondaryState = next;
    const label = next === "expanded" ? "最小化二级导航" : next === "compact" ? "收起二级导航" : "展开二级导航";
    stateButton.setAttribute("aria-label", label);
    stateButton.title = label;
  });

  settingsButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    settings.hidden = !settings.hidden;
    settingsButton.setAttribute("aria-expanded", String(!settings.hidden));
  });

  document.addEventListener("click", (event) => {
    if (settings && !settings.hidden && !settings.contains(event.target)) {
      settings.hidden = true;
      settingsButton?.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll(".nav-pin").forEach((pin) => {
    pin.addEventListener("click", () => {
      pin.classList.toggle("is-pinned");
      pin.setAttribute("aria-pressed", String(pin.classList.contains("is-pinned")));
    });
  });
})();
