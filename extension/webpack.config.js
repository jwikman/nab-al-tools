//@ts-check

"use strict";

const path = require("path");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
  stats: {
    errorDetails: true,
  },
  entry: {
    extension: {
      import: "./src/extension.ts",
      filename: "nab-al-tools.js",
    },
    cliCreateDocumentation: {
      import: "./src/cli/CreateDocumentation.ts",
      filename: "cli/CreateDocumentation.js",
    },
    cliRefreshXlf: {
      import: "./src/cli/RefreshXLF.ts",
      filename: "cli/RefreshXLF.js",
    },
    mcpServer: {
      import: "./src/mcp/server.ts",
      filename: "mcp/server.js",
    },
  }, // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "nab-al-tools.js",
    libraryTarget: "commonjs2",
  },
  devtool: "nosources-source-map",
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    "applicationinsights-native-metrics":
      "commonjs applicationinsights-native-metrics", // ignored because we don't ship native module
    "@opentelemetry/instrumentation": "commonjs @opentelemetry/instrumentation",
    "@azure/opentelemetry-instrumentation-azure-sdk":
      "commonjs @azure/opentelemetry-instrumentation-azure-sdk",
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};
module.exports = config;
