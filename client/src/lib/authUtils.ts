export function isUnauthorizedError(error: Error): boolean {
  return /Unauthorized|غير مصرح|انتهت صلاحية الجلسة/i.test(error.message);
}
