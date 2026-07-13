(() => {
  const shell = document.querySelector(".admin-shell");
  const settings = document.querySelector("[data-menu-settings]");
  const settingsButton = document.querySelector('[data-action="toggle-menu-settings"]');
  const stateButton = document.querySelector('[data-action="cycle-secondary"]');
  const accountMenu = document.querySelector("[data-account-menu]");
  const accountButton = document.querySelector('[data-action="toggle-account-menu"]');
  const tabList = document.querySelector("[data-tab-list]");
  const tabViewport = document.querySelector("[data-tab-viewport]");
  const tabContext = document.querySelector("[data-tab-context]");
  let contextTab = null;

  const tabs = () => [...tabList.querySelectorAll(".workspace-tab")];
  const activeTab = () => tabList.querySelector(".workspace-tab.active");
  const tabTitle = (tab) => tab.querySelector(".workspace-tab-trigger").textContent.trim();

  const updateTabScroll = () => {
    const hasOverflow = tabViewport.scrollWidth > tabViewport.clientWidth + 1;
    document.querySelectorAll('[data-action="scroll-tabs"]').forEach((button) => {
      button.hidden = !hasOverflow;
    });
  };

  const setActiveTab = (tab) => {
    if (!tab) return;
    tabs().forEach((item) => item.classList.toggle("active", item === tab));
    tab.querySelector(".workspace-tab-trigger").scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const createTab = (key, label) => {
    const existing = tabList.querySelector(`[data-tab-key="${key}"]`);
    if (existing) {
      setActiveTab(existing);
      return;
    }

    const tab = document.createElement("div");
    tab.className = "workspace-tab";
    tab.dataset.tabKey = key;
    tab.innerHTML = `<button class="workspace-tab-trigger" type="button" title="${label}">${label}</button><button class="workspace-tab-close" type="button" aria-label="关闭${label}">×</button>`;
    tabList.append(tab);
    setActiveTab(tab);
    updateTabScroll();
  };

  const closeTab = (tab) => {
    if (!tab || tab.dataset.fixed === "true") return;
    const allTabs = tabs();
    const index = allTabs.indexOf(tab);
    const wasActive = tab === activeTab();
    tab.remove();
    if (wasActive) setActiveTab(tabs()[Math.max(0, index - 1)]);
    updateTabScroll();
  };

  const closeContext = () => {
    tabContext.hidden = true;
    contextTab = null;
  };

  const closeAccountMenu = () => {
    accountMenu.hidden = true;
    accountButton?.setAttribute("aria-expanded", "false");
  };

  stateButton?.addEventListener("click", () => {
    const current = shell.dataset.secondaryState || "expanded";
    const next = current === "collapsed" ? "expanded" : "collapsed";
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

  accountButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    accountMenu.hidden = !accountMenu.hidden;
    accountButton.setAttribute("aria-expanded", String(!accountMenu.hidden));
  });

  document.querySelectorAll("[data-global-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.globalAction;
      if (action === "theme") {
        const dark = document.body.dataset.theme !== "dark";
        document.body.dataset.theme = dark ? "dark" : "light";
        button.setAttribute("aria-pressed", String(dark));
        button.dataset.tooltip = dark ? "亮色" : "暗色";
        window.localStorage.setItem("shell-theme", document.body.dataset.theme);
      }
      window.dispatchEvent(new CustomEvent("shell:global-action", { detail: { action } }));
    });
  });

  document.querySelectorAll(".sub-menu-item[data-tab-key]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelectorAll(".sub-menu-item").forEach((menuItem) => menuItem.classList.toggle("active", menuItem === item));
      document.querySelectorAll(".sub-menu-item").forEach((menuItem) => menuItem.removeAttribute("aria-current"));
      item.setAttribute("aria-current", "page");
      createTab(item.dataset.tabKey, item.textContent.trim());
    });
  });

  tabList.addEventListener("click", (event) => {
    const tab = event.target.closest(".workspace-tab");
    if (!tab) return;
    if (event.target.closest(".workspace-tab-close")) {
      closeTab(tab);
      return;
    }
    setActiveTab(tab);
  });

  tabList.addEventListener("contextmenu", (event) => {
    const tab = event.target.closest(".workspace-tab");
    if (!tab) return;
    event.preventDefault();
    contextTab = tab;
    const isHome = tab.dataset.fixed === "true";
    const isLast = tabs().indexOf(tab) === tabs().length - 1;
    tabContext.querySelector('[data-tab-action="close"]').disabled = isHome;
    tabContext.querySelector('[data-tab-action="close-others"]').disabled = isHome;
    tabContext.querySelector('[data-tab-action="close-right"]').disabled = isHome || isLast;
    tabContext.style.left = `${Math.min(event.clientX, window.innerWidth - 200)}px`;
    tabContext.style.top = `${Math.min(event.clientY, window.innerHeight - 180)}px`;
    tabContext.hidden = false;
  });

  tabContext.addEventListener("click", (event) => {
    const action = event.target.dataset.tabAction;
    if (!action || !contextTab || event.target.disabled) return;
    if (action === "refresh") {
      const refreshedTab = contextTab;
      refreshedTab.classList.remove("is-refreshing");
      requestAnimationFrame(() => refreshedTab.classList.add("is-refreshing"));
      window.setTimeout(() => refreshedTab.classList.remove("is-refreshing"), 650);
    }
    if (action === "close") closeTab(contextTab);
    if (action === "close-others") tabs().filter((tab) => tab !== contextTab && tab.dataset.fixed !== "true").forEach(closeTab);
    if (action === "close-right") {
      const index = tabs().indexOf(contextTab);
      tabs().slice(index + 1).filter((tab) => tab.dataset.fixed !== "true").forEach(closeTab);
    }
    closeContext();
  });

  document.querySelectorAll('[data-action="scroll-tabs"]').forEach((button) => {
    button.addEventListener("click", () => tabViewport.scrollBy({ left: Number(button.dataset.direction) * 220, behavior: "smooth" }));
  });

  tabViewport.addEventListener("scroll", updateTabScroll);
  window.addEventListener("resize", updateTabScroll);
  document.addEventListener("click", (event) => {
    if (settings && !settings.hidden && !settings.contains(event.target) && event.target !== settingsButton) {
      settings.hidden = true;
      settingsButton?.setAttribute("aria-expanded", "false");
    }
    if (!tabContext.contains(event.target)) closeContext();
    if (accountMenu && !accountMenu.hidden && !accountMenu.contains(event.target) && event.target !== accountButton) closeAccountMenu();
  });

  const storedTheme = window.localStorage.getItem("shell-theme");
  if (storedTheme === "dark") {
    document.body.dataset.theme = "dark";
    document.querySelector('[data-global-action="theme"]')?.setAttribute("aria-pressed", "true");
    const themeButton = document.querySelector('[data-global-action="theme"]');
    if (themeButton) themeButton.dataset.tooltip = "亮色";
  }

  updateTabScroll();
})();
