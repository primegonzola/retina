import path from "path";
import { Configuration } from "webpack";

const getConfig = (
    env: { [key: string]: string },
    argv: { [key: string]: string }
): Configuration => {
    require("dotenv").config({
        path: path.resolve(__dirname, `.env.${env.mode}`),
    });
    return {
        entry: "./src/client/main.ts",
        target: "web",
        mode: argv.mode === "production" ? "production" : "development",
        module: {
            rules: [
                {
                    test: /\.(js|jsx|tsx|ts)$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader'
                }
            ]
        },
        resolve: {
            extensions: ['*', '.js', '.jsx', '.tsx', '.ts'],
            alias: {
                src: path.resolve(__dirname, "src/client"),
            },
        },
        output: {
            path: path.join(__dirname, "build"),
            filename: "[name].js",
        },
        optimization: {
            moduleIds: "deterministic",
            splitChunks: {
                chunks: "all",
            },
        },
    };
};
export default getConfig;
