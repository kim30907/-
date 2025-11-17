// Calculates week information assuming Monday is the start of the week.
export const getWeekInfo = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Normalize time
  
  // Sunday is 0, Monday is 1... We want Monday to be the start of the week.
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const startOfWeek = new Date(d.setDate(d.getDate() + diffToMonday));

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), 1);
  // Get day of week for start of month (0=Sun, 1=Mon...).
  const firstDayOfMonth = startOfMonth.getDay();
  // Calculate days in the first week that belong to the previous month.
  // If month starts on Mon(1), offset is 0. If Tue(2), offset is 1. If Sun(0), offset is 6.
  const daysBeforeFirstMonday = (firstDayOfMonth + 6) % 7;
  const weekNumber = Math.floor((startOfWeek.getDate() + daysBeforeFirstMonday - 1) / 7) + 1;

  return {
    startOfWeek,
    endOfWeek,
    month: startOfWeek.getMonth() + 1,
    weekNumber,
  };
};

export const formatDate = (date: Date, separator: string = '.') => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}${separator}${day}`;
};

export const getWeekRangeString = (date: Date): string => {
  const { startOfWeek, endOfWeek, month, weekNumber } = getWeekInfo(date);
  return `${month}월 ${weekNumber}주차 (${formatDate(startOfWeek)} ~ ${formatDate(endOfWeek)})`;
};
