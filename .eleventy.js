const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');

// Extend Day.js with the advancedFormat plugin for ordinals (1st, 2nd, 3rd, etc.)
dayjs.extend(advancedFormat);

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("_redirects");

  // Smart date formatter - only formats valid dates, returns text as-is for invalid dates
  eleventyConfig.addFilter("formatDate", function(dateInput, format = 'dddd Do MMMM, YYYY') {
    // Return empty string for blank/null/undefined dates
    if (!dateInput || dateInput.trim() === '') {
      return '';
    }
    
    // Try to parse the date
    const parsed = dayjs(dateInput);
    
    // If it's a valid date, format it; otherwise return the original text
    return parsed.isValid() ? parsed.format(format) : dateInput;
  });
};