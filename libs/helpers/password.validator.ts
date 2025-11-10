export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export function validatePassword(
  password: string,
  t?: any,
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push(
      t?.auth?.passwordReset?.validation?.minLength ||
        'Password must be at least 8 characters long',
    );
  } else {
    score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(
      t?.auth?.passwordReset?.validation?.uppercase ||
        'Password must contain at least one uppercase letter',
    );
  } else {
    score += 15;
  }

  if (!/[a-z]/.test(password)) {
    errors.push(
      t?.auth?.passwordReset?.validation?.lowercase ||
        'Password must contain at least one lowercase letter',
    );
  } else {
    score += 15;
  }

  if (!/[0-9]/.test(password)) {
    errors.push(
      t?.auth?.passwordReset?.validation?.number ||
        'Password must contain at least one number',
    );
  } else {
    score += 15;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(
      t?.auth?.passwordReset?.validation?.specialChar ||
        'Password must contain at least one special character',
    );
  } else {
    score += 15;
  }

  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
  }

  if (
    /^(.*)(012|123|234|345|456|567|678|789|890|abc|bcd|cde)(.*)$/i.test(
      password,
    )
  ) {
    score -= 10;
  }

  const commonPasswords = [
    'password',
    'Password123',
    '12345678',
    'qwerty',
    'abc123',
    'password1',
    '123456789',
    'admin123',
    'welcome',
    'letmein',
  ];

  if (
    commonPasswords.some(common =>
      password.toLowerCase().includes(common.toLowerCase()),
    )
  ) {
    errors.push(
      t?.auth?.passwordReset?.validation?.commonPassword ||
        'Password is too common. Please choose a more unique password',
    );
    score -= 20;
  }

  score = Math.max(0, Math.min(100, score));

  let strength: 'weak' | 'medium' | 'strong';
  if (score < 40) {
    strength = 'weak';
  } else if (score < 70) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score,
  };
}
