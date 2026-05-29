const { v4: uuidv4 } = require('uuid');

const generateCheckInCode = () => {
  return uuidv4().substring(0, 8).toUpperCase();
};

// Generates check-in links using FRONTEND_URL environment variable
// Ensures event links use the live domain instead of localhost
const generateCheckInLink = (code) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://volunteer.nohungerfoodbank.org';
  return `${frontendUrl.replace(/\/+$/, '')}/checkin/${code}`;
};

const calculateHoursDifference = (startTime, endTime) => {
  const diffMs = new Date(endTime) - new Date(startTime);
  return diffMs / (1000 * 60 * 60); // Convert to hours
};

module.exports = {
  generateCheckInCode,
  generateCheckInLink,
  calculateHoursDifference,
};
