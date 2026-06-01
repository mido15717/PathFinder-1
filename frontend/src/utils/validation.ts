export function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

export function required(value: string, label: string) {
  return value.trim() ? "" : `${label} is required`;
}

export function passwordError(value: string) {
  if (!value) return "Password is required";
  if (value.length < 6) return "Password must be at least 6 characters";
  return "";
}
