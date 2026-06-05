const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email).trim());
}

export function validateEmailField(email, { required = true } = {}) {
  const trimmed = String(email ?? '').trim();
  if (!trimmed) return required ? 'Email is required' : '';
  if (!isValidEmail(trimmed)) return 'Enter a valid email';
  return '';
}

export function validateNameField(name, { min = 2, max = 80 } = {}) {
  const trimmed = String(name ?? '').trim();
  if (trimmed.length < min) return `Name must be at least ${min} characters`;
  if (trimmed.length > max) return `Name must be at most ${max} characters`;
  return '';
}
