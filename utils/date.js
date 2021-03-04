// get date of this day with dd-MM-yyyy format
const getFormattedDateOfThisDay = () => {
  const today = new Date();
  const date = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
  const year = today.getFullYear();
  const formattedDateOfThisDay = date + '-' + month + '-' + year;
  return formattedDateOfThisDay;
};

// get date of yesterday with dd-MM-yyyy format
const getFormattedDateOfYesterday = () => {
  const yesterday = new Date(Date.now() - 86400000);
  const date = String(yesterday.getDate()).padStart(2, '0');
  const month = String(yesterday.getMonth() + 1).padStart(2, '0'); // January is 0!
  const year = yesterday.getFullYear();
  const formattedDateOfYesterday = date + '-' + month + '-' + year;
  return formattedDateOfYesterday;
};

// get last date in a specific month
const getLastDateOfMonth = (month, year) => {
  const date = new Date(`${year}-${String(month).padStart(2, '0')}`);
  const lastDateOfMonth = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  ).getDate();

  return lastDateOfMonth;
};

module.exports = {
  getFormattedDateOfThisDay,
  getFormattedDateOfYesterday,
  getLastDateOfMonth,
};
