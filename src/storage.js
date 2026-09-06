/* Progress persistence. Everything lives in this browser, on this device. */

export function loadJSON(key) {
  try {
    const v = window.localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function saveJSON(key, obj) {
  try {
    window.localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    console.error("save failed", e);
  }
}
