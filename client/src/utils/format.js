export const formatDate = (dateString) => {
  if (!dateString) return '';
  // Avoid time zone offsets shifting the date by parsing as local date parts
  const [year, month, day] = dateString.split('-');
  if (year && month && day) {
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

export const formatMinutes = (minutes) => {
  if (minutes === undefined || minutes === null || isNaN(minutes)) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  return `${mins}m`;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace('_', ' ');
};
