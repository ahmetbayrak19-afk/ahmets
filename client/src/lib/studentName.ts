/** Keep the full name in storage; abbreviate only when displaying it. */
export function normalizeStudentFullName(value: string = ''): string {
  const parts = value.normalize('NFC').trim().split(/\s+/).filter(Boolean);
  return parts.map((part, index) => {
    if (parts.length > 1 && index === parts.length - 1) return part.toLocaleUpperCase('tr-TR');
    return part.toLocaleLowerCase('tr-TR').replace(/(^|[-'’])\p{L}/gu, letter => letter.toLocaleUpperCase('tr-TR'));
  }).join(' ');
}

export function formatStudentName(value: string = ''): string {
  const parts = normalizeStudentFullName(value).split(' ');
  if (parts.length >= 3) parts[0] = `${parts[0].charAt(0)}.`;
  return parts.join(' ');
}
