const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("_redirects");

  eleventyConfig.addFilter("nextWeekday", function(input, targetWeekday = 2) {
    let baseDate = input === "now"
      ? DateTime.now()
      : DateTime.fromISO(input);

    let daysUntil = (targetWeekday + 7 - baseDate.weekday) % 7 || 7;

    return baseDate.plus({ days: daysUntil }).toJSDate();
  });
};
