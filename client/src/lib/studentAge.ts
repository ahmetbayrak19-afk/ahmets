/** Calendar-year age, not a birthday calculation. Stored age remains the baseline. */
export function getStudentAge(student: any, year = new Date().getFullYear()): string {
  if (!student || student.age === '' || student.age == null) return '';
  const age = Number(student.age);
  if (!Number.isFinite(age) || age < 0) return String(student.age);
  const created = student.createdAt?.toDate?.() ?? student.createdAt;
  const createdYear = created ? new Date(created).getFullYear() : NaN;
  const referenceYear = Number.isInteger(student.ageReferenceYear)
    ? student.ageReferenceYear : createdYear;
  return String(age + (Number.isFinite(referenceYear) ? Math.max(0, year - referenceYear) : 0));
}
