export const phonePattern = /^1[3-9]\d{9}$/;

export function isValidChineseMobile(value: string) {
  return phonePattern.test(value.trim());
}
