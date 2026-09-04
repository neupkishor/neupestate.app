const errorMessages: Record<string, string> = {
  'auth.signin.request.failed': 'We could not start sign-in. Please try again.',
  'auth.signin.request.invalid': 'This sign-in request is no longer valid. Please start again.',
  'auth.signin.jwt.required': 'Your sign-in session is missing. Please start again.',
  'auth.signin.jwt.invalid': 'Your sign-in session is invalid. Please start again.',
  'auth.signin.jwt.expired': 'Your sign-in session has expired. Please start again.',
  'auth.signin.neupid.empty': 'Please enter your NeupID.',
  'auth.signin.neupid.missing': 'Please submit your NeupID before entering your password.',
  'auth.signin.neupid.invalid': 'We could not find an account with that NeupID.',
  'auth.signin.password.empty': 'Please enter your password.',
  'auth.signin.password.invalid': 'The password is incorrect.',
  'auth.signin.terms.empty': 'Please approve the terms to continue.',
  'auth.signin.terms.not_approved': 'You must approve the terms to continue.',
  'auth.signin.session.failed': 'We could not complete sign-in. Please try again.',
  'auth.signin.token.invalid': 'Your account token is invalid. Please sign in again.',
  'auth.signin.token.expired': 'Your account session has expired. Please sign in again.',
  'notification.auth.invalid': 'Your session is invalid. Please sign in again.',
  'notification.request.invalid': 'The notification request is invalid.',
  'notification.id.empty': 'Please select a notification.',
  'notification.not_found': 'Notification not found.',
};

export function getErrorMessage(error: unknown, fallback: string): string {
  return typeof error === 'string' ? errorMessages[error] ?? error : fallback;
}
