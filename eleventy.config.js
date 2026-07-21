module.exports = function(eleventyConfig) {
  // Copy static assets straight through to _site/ without processing.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/*.ico");

  // Serialize a value to a JSON string (used to inline data into pages).
  eleventyConfig.addFilter("json", function (value) {
    return JSON.stringify(value).replace(/</g, "\\u003c");
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
