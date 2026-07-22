(() => {
  const iconSelector = ".ui-icon[data-icon], .ui-state-icon[data-icon]";

  const spritePath = () => document.body?.dataset.iconSprite || "";

  const renderIcon = (host) => {
    if (host.dataset.iconRendered === "true") return;
    const icon = host.dataset.icon;
    if (!icon) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    svg.setAttribute("viewBox", "0 0 1024 1024");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    const source = spritePath();
    use.setAttribute("href", source ? `${source}#${icon}` : `#${icon}`);
    svg.append(use);
    host.replaceChildren(svg);
    host.dataset.iconRendered = "true";
  };

  const renderAntIcons = (root = document) => root.querySelectorAll(iconSelector).forEach(renderIcon);

  window.renderAntIcons = renderAntIcons;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderAntIcons(), { once: true });
  } else {
    renderAntIcons();
  }
})();
