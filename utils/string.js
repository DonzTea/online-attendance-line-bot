/**
 * * Transforming regular text into title case format
 * ? example: 'title case' become 'Title Case'
 * @param {string} string
 * @return {string}
 */
const formatStringToTitleCase = (string) => {
  const splittedString = string.toLowerCase().split(' ');
  for (let i = 0; i < splittedString.length; i++) {
    splittedString[i] =
      splittedString[i].charAt(0).toUpperCase() +
      splittedString[i].substring(1);
  }
  return splittedString.join(' ');
};

module.exports = {
  formatStringToTitleCase,
};
