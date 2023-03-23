const path = require("path");
const webpack = require("webpack");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const isDevMode = process.env.NODE_ENV === "development";


let config = {
    mode: isDevMode ? "development" : "production",
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "./public"),
        filename: "./main.js"
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader"
        },
        {
            test: /\.scss$/,
            use: [
                MiniCssExtractPlugin.loader,
                "css-loader",
                "sass-loader",
                "postcss-loader",
            ],
        }]
    },
    optimization: {
        concatenateModules: !isDevMode,
        minimize: !isDevMode,
        minimizer: isDevMode ? [] : [new TerserPlugin()],
    },
    plugins: [
        new MiniCssExtractPlugin({filename: "styles.css"}),
        new webpack.DefinePlugin({
            'process.env.GITHUB_PERSONAL_ACCESS_TOKEN': JSON.stringify(process.env.GITHUB_PERSONAL_ACCESS_TOKEN),
        })
    ].concat(isDevMode ? [new BundleAnalyzerPlugin()] : []),
}

module.exports = config;