const BARE_NATIVE_ELEMENT = /^(?:a|button|input|select|textarea|form|label|ul|ol|li|table|thead|tbody|tr|th|td)(?=$|[\s>+~:.#\[])/;
const RULE_SELECTOR = /(?:^|})\s*([^{}]+)\s*\{/g;

function withoutComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

export function findUnsafeSharedSelectors(css) {
  return [...withoutComments(css).matchAll(RULE_SELECTOR)]
    .flatMap((match) => match[1].split(","))
    .map((selector) => selector.trim())
    .filter((selector) => BARE_NATIVE_ELEMENT.test(selector));
}

export function findUnsafeRuntimeOverrides(css) {
  return /\.ant-descriptions(?:\b|[-\s>.:#])/.test(withoutComments(css))
    ? [".ant-descriptions internal selector"]
    : [];
}

export function assertVueAntCssIsolation({ sharedCss, runtimeCss }) {
  const unsafeSharedSelectors = findUnsafeSharedSelectors(sharedCss);
  if (unsafeSharedSelectors.length) {
    throw new Error(`Shared CSS cannot use bare native element selectors because Vue/Ant components render native DOM internally: ${unsafeSharedSelectors.join(", ")}`);
  }

  if (findUnsafeRuntimeOverrides(runtimeCss).length) {
    throw new Error("Vue/Ant runtime CSS cannot override Ant Descriptions internals; use the component API and owned wrapper classes instead.");
  }
}
