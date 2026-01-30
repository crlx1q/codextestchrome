const isProbablyUrl = (input: string) => {
  try {
    const value = input.trim();
    if (value.includes(' ') || value.length === 0) return false;
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return Boolean(url.hostname.includes('.')) || url.hostname === 'localhost';
  } catch {
    return false;
  }
};

export const parseUrlInput = (input: string) => {
  const trimmed = input.trim();
  if (trimmed.startsWith('uma://')) {
    return trimmed;
  }
  if (isProbablyUrl(trimmed)) {
    return trimmed.includes('://') ? trimmed : `https://${trimmed}`;
  }
  return trimmed;
};

export const normalizeUrl = (input: string) => {
  if (input.startsWith('uma://')) return input;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  if (input.length === 0) return 'uma://newtab';
  return input;
};
