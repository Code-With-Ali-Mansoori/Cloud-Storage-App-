export const getDayRemaining = (futureDate: string | number | Date) => {
  const fDate = new Date(futureDate);
  const today = new Date();
  // Difference in milliseconds
  const diffMs = fDate.getTime() - today.getTime();
  // Convert ms → days
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};