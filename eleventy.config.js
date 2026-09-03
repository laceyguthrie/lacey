module.exports = function(eleventyConfig) {
  // Copy static assets straight through to _site/ without processing.
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/*.ico");
  eleventyConfig.addPassthroughCopy("src/.htaccess");

  // Explicit glob keeps this to just the blog post markdown files, so the
  // page that renders the collection (src/mind/index.html) never ends up
  // as a member of its own collection.
  eleventyConfig.addCollection("mind", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/mind/*.md")
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
