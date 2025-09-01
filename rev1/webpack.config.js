import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all TypeScript files in src directory
const srcPath = path.resolve(__dirname, "src");
const srcFiles = fs
  .readdirSync(srcPath)
  .filter((file) => file.endsWith(".ts"))
  .reduce((entries, file) => {
    const name = path.basename(file, ".ts");
    entries[name] = path.join(srcPath, file);
    return entries;
  }, {});

export default {
  mode: "production",

  // Create separate entry points for each module
  entry: srcFiles,

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].min.js",
    library: {
      type: "module",
    },
    environment: {
      module: true,
    },
    clean: false, // Don't clean dist folder (preserve TypeScript outputs)
  },

  experiments: {
    outputModule: true,
  },

  resolve: {
    extensions: [".ts", ".js"],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                // Override some TypeScript options for webpack
                module: "esnext",
                target: "es2020",
                moduleResolution: "node",
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },

  // Mark all relative imports as external to preserve module structure
  externals: [
    "highlight.js", // Keep external dependencies external
    // Function to externalize relative imports
    ({ context, request }, callback) => {
      // Externalize all relative imports (starting with ./ or ../)
      if (/^\.\.?\//.test(request)) {
        // Convert the import to point to minified version
        const minifiedRequest =
          request.replace(/\.js$/, ".min.js") +
          (request.endsWith(".js") ? "" : ".min.js");
        return callback(null, `module ${minifiedRequest}`);
      }
      callback();
    },
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
          mangle: true,
          format: {
            comments: false,
          },
          // Ensure compatibility with all environments
          ecma: 2020,
          module: true,
        },
        extractComments: false,
      }),
    ],
  },

  // Generate source maps for debugging
  devtool: "source-map",

  // Target multiple environments
  target: ["web", "node16"],
};
