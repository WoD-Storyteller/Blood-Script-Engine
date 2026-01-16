export function saveToken(token: string) {
  localStorage.setItem('bse_token', token);
}

export function loadToken(): string | null {
  return localStorage.getItem('bse_token');
}

export function clearToken() {
  localStorage.removeItem('bse_token');
}