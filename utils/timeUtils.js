/**
 * Utility functions for handling time operations
 */

/**
 * Validate time format (HH:MM in 24-hour format)
 * @param {string} time - Time string in HH:MM format
 * @returns {boolean} - True if valid, false otherwise
 */
const validateTimeFormat = (time) => {
  // Regular expression for HH:MM format
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
};

/**
 * Check if end time is after start time
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} - True if end time is after start time, false otherwise
 */
const isEndTimeAfterStartTime = (startTime, endTime) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  if (startHour < endHour) {
    return true;
  }

  if (startHour === endHour) {
    return startMinute < endMinute;
  }

  return false;
};

/**
 * Convert time string to minutes since midnight
 * @param {string} time - Time string in HH:MM format
 * @returns {number} - Minutes since midnight
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - Time string in HH:MM format
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Generate time slots in a range with a specified interval
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @param {number} intervalMinutes - Interval in minutes
 * @returns {Array} - Array of time strings
 */
const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const slots = [];

  for (let time = startMinutes; time < endMinutes; time += intervalMinutes) {
    slots.push(minutesToTime(time));
  }

  return slots;
};

/**
 * Format a date object to a date string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} - Date string in YYYY-MM-DD format
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Format a date object to a time string (HH:MM)
 * @param {Date} date - Date object
 * @returns {string} - Time string in HH:MM format
 */
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Convert date and time strings to a Date object
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {Date} - Date object
 */
const dateTimeToDate = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

/**
 * Get the day name from a date
 * @param {Date} date - Date object
 * @returns {string} - Day name
 */
const getDayName = (date) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
};

/**
 * Check if two time periods overlap
 * @param {Date} start1 - Start of first period
 * @param {Date} end1 - End of first period
 * @param {Date} start2 - Start of second period
 * @param {Date} end2 - End of second period
 * @returns {boolean} - True if periods overlap, false otherwise
 */
const doPeriodsOverlap = (start1, end1, start2, end2) => {
  return (
    (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start1 <= start2 && end1 >= end2)
  );
};

module.exports = {
  validateTimeFormat,
  isEndTimeAfterStartTime,
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  formatDate,
  formatTime,
  dateTimeToDate,
  getDayName,
  doPeriodsOverlap,
};
