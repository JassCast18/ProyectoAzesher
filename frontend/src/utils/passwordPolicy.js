export const passwordHint = 'Mínimo 8 caracteres, con letras, números y al menos un símbolo.';

export const isStrongPassword = password =>
  password.length >= 8 && /\p{L}/u.test(password) && /\p{N}/u.test(password) &&
  /[^\p{L}\p{N}\s]/u.test(password);
