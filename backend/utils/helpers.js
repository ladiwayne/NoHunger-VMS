const { v4: uuidv4 } = require('uuid');

const generateCheckInCode = () => {
  return uuidv4().substring(0, 8).toUpperCase();
};

const generateCheckInLink = (code) => {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkin/${code}`;
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
