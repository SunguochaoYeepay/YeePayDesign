(() => {
  const selectElements = () => [...document.querySelectorAll(".ui-select")];

  const getSelectParts = (select) => ({
    trigger: select.querySelector(".ui-select-trigger"),
    menu: select.querySelector(".ui-select-menu"),
    value: select.querySelector(".ui-select-value"),
    options: [...select.querySelectorAll(".ui-option")]
  });

  const closeSelect = (select, { focus = false } = {}) => {
    const { trigger, menu } = getSelectParts(select);
    if (!trigger || !menu) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (focus) trigger.focus();
  };

  const closeOtherSelects = (current) => {
    selectElements().forEach((select) => {
      if (select !== current) closeSelect(select);
    });
  };

  const openSelect = (select) => {
    const { trigger, menu } = getSelectParts(select);
    if (!trigger || !menu || trigger.disabled) return;
    closeOtherSelects(select);
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
  };

  const chooseOption = (select, option) => {
    const { value, options } = getSelectParts(select);
    if (!option || option.disabled) return;

    const optionValue = option.dataset.value ?? option.textContent.trim();
    options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
    select.dataset.value = optionValue;
    if (value) {
      value.textContent = option.textContent.trim();
      value.classList.remove("is-placeholder", "ui-placeholder");
    }

    const hiddenInput = select.querySelector('input[type="hidden"]');
    if (hiddenInput) hiddenInput.value = optionValue;

    closeSelect(select, { focus: true });
    select.dispatchEvent(new CustomEvent("ui:select-change", {
      bubbles: true,
      detail: { value: optionValue, label: option.textContent.trim() }
    }));
  };

  const resetSelect = (select) => {
    const { value, options } = getSelectParts(select);
    options.forEach((option) => option.setAttribute("aria-selected", "false"));
    select.dataset.value = "";
    if (value) {
      value.textContent = value.dataset.placeholder || "请选择";
      value.classList.add("is-placeholder");
    }
    const hiddenInput = select.querySelector('input[type="hidden"]');
    if (hiddenInput) hiddenInput.value = "";
    closeSelect(select);
    select.dispatchEvent(new CustomEvent("ui:select-change", {
      bubbles: true,
      detail: { value: "", label: "" }
    }));
  };

  const dispatchQueryEvent = (panel, name) => {
    panel.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { panel } }));
  };

  const handleQueryAction = (button) => {
    const panel = button.closest(".ui-query-panel");
    if (!panel) return;
    const action = button.dataset.queryAction;
    if (action === "reset") {
      panel.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea').forEach((input) => { input.value = ""; });
      panel.querySelectorAll(".ui-select").forEach(resetSelect);
      dispatchQueryEvent(panel, "ui:query-reset");
      return;
    }
    if (action === "toggle") {
      const advancedFields = [...panel.querySelectorAll("[data-query-advanced]")];
      const expanded = advancedFields.some((field) => field.hidden);
      advancedFields.forEach((field) => { field.hidden = !expanded; });
      button.setAttribute("aria-expanded", String(expanded));
      dispatchQueryEvent(panel, "ui:query-toggle");
      return;
    }
    if (action === "search") dispatchQueryEvent(panel, "ui:query-search");
  };

  const syncRadioGroup = (group) => {
    const inputs = [...group.querySelectorAll('.ui-radio input[type="radio"]')];
    inputs.forEach((input) => {
      input.closest(".ui-radio")?.classList.toggle("is-checked", input.checked);
    });
  };

  const syncInitialState = () => {
    selectElements().forEach((select) => {
      const { trigger, menu, options } = getSelectParts(select);
      if (trigger && menu) {
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      }
      options.forEach((option) => {
        if (!option.hasAttribute("aria-selected")) option.setAttribute("aria-selected", "false");
      });
    });
    document.querySelectorAll(".ui-radio-group").forEach(syncRadioGroup);
  };

  document.addEventListener("click", (event) => {
    const option = event.target.closest(".ui-option");
    if (option) {
      const select = option.closest(".ui-select");
      if (select) chooseOption(select, option);
      return;
    }

    const trigger = event.target.closest(".ui-select-trigger");
    if (trigger) {
      const select = trigger.closest(".ui-select");
      if (!select) return;
      const { menu } = getSelectParts(select);
      if (menu?.hidden) openSelect(select);
      else closeSelect(select);
      return;
    }

    const queryAction = event.target.closest("[data-query-action]");
    if (queryAction) {
      handleQueryAction(queryAction);
      return;
    }

    if (!event.target.closest(".ui-select")) closeOtherSelects(null);
  });

  document.addEventListener("keydown", (event) => {
    const trigger = event.target.closest(".ui-select-trigger");
    if (trigger && ["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      openSelect(trigger.closest(".ui-select"));
      return;
    }

    if (event.key === "Escape") {
      const select = event.target.closest(".ui-select");
      if (select) closeSelect(select, { focus: true });
    }
  });

  document.addEventListener("change", (event) => {
    const input = event.target.closest('.ui-radio input[type="radio"]');
    if (!input) return;
    const group = input.closest(".ui-radio-group");
    if (!group) return;
    syncRadioGroup(group);
    group.dispatchEvent(new CustomEvent("ui:radio-change", {
      bubbles: true,
      detail: { value: input.value }
    }));
  });

  window.adminPcComponents = { closeSelect, openSelect, chooseOption, resetSelect, syncRadioGroup };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncInitialState, { once: true });
  } else {
    syncInitialState();
  }
})();
