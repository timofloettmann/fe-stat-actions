const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./src/index",
  output: {
    filename: "main.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: "babel-loader"
      }
    ]
  },
  plugins: [
    // Generates a report.html file during build, showing the sizes of all chunks and their included modules
    // very useful for occasional checks to make sure the bundle-size doesn't grow unexpectedly
    new BundleAnalyzerPlugin({
      // In `disabled` mode, this plugin just generates a Webpack Stats JSON file by setting `generateStatsFile` to `true`.
      analyzerMode: "disabled",
      generateStatsFile: true,
      // Name of Webpack Stats JSON file that will be generated if `generateStatsFile` is `true`.
      // Relative to bundles output directory.
      statsFilename: "stats.json",
      // Options for `stats.toJson()` method.
      // For example you can exclude sources of your modules from stats file with `source: false` option.
      // See more options here: https://github.com/webpack/webpack/blob/webpack-1/lib/Stats.js#L21
      statsOptions: { source: false, reasons: false },
      // Log level. Can be 'info', 'warn', 'error' or 'silent'.
      logLevel: "silent"
    }),

    // CompressionPlugin generates pre-gzipped chunk files,
    // the build folder will contain a .js and a .js.gz file
    // for each chunk that can be compressed with a ratio of at least 0.8
    new CompressionPlugin({
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$|\.svg$|\.json$/,
      threshold: 10240,
      minRatio: 0.8
    }),

    new CompressionPlugin({
      filename: '[path].br[query]',
      algorithm: "brotliCompress",
      test: /\.js$|\.css$|\.html$|\.svg$|\.json$/,
      threshold: 10240,
      minRatio: 0.8
    })
  ]
};
