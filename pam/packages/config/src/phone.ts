/**
 * A place's phone number as people read it (Will, 5 October, D-306: "list
 * the phone number under the call item… no need to hide info"): a US number
 * stored as "+12155550100" reads "(215) 555-0100". Anything else — an
 * extension, a number from abroad, a typo in the feed — is shown exactly as
 * stored rather than guessed at.
 */
export function displayPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  const us = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits.length === 10 ? digits : null;
  if (!us || /[a-z]/i.test(phone)) return phone.trim();
  return `(${us.slice(0, 3)}) ${us.slice(3, 6)}-${us.slice(6)}`;
}
