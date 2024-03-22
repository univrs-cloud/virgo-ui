const dotenv = require('dotenv').config();
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WepackPwaManifest = require('webpack-pwa-manifest');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
	let upstream = '';
	if (env.WEBPACK_SERVE) {
		if ((dotenv.error || !dotenv.parsed.upstream) && !env.upstream) {
			console.log('Missing options:\n');
			return false;
		}
		
		if (env.upstream) {
			upstream = env.upstream;
		} else if (!dotenv.error && dotenv.parsed.upstream) {
			upstream = dotenv.parsed.upstream;
		}
	}
		
	return {
		devtool: (argv.mode === 'production' ? 'source-map' : 'eval'),
		devServer: {
			server: 'https',
			port: 443,
			compress: true,
			historyApiFallback: true,
			open: true,
			hot: false,
			devMiddleware: {
				writeToDisk: true
			},
			client: {
				overlay: false,
				progress: false,
				reconnect: true
			},
			static: {
				directory: './dist',
				publicPath: '/'
			},
			proxy: [
				{
					context: ['/'],
					secure: false,
					target: `https://${upstream}/`,
					wss: true,
					changeOrigin: true,
					headers: { connection: 'keep-alive' }
				},
				{
					context: ['/api'],
					secure: false,
					target: `https://${upstream}/api`,
					pathRewrite: { '^/api': '' }
				}
			]
		},
		entry: {
			app: './src/index.js'
		},
		output: {
			publicPath: '/',
			path: path.resolve(__dirname, 'dist'),
			filename: 'assets/js/[name].[fullhash].js',
			chunkFilename: 'assets/js/[name].[chunkhash].js',
			// assetModuleFilename: 'assets/img/[name].[hash].[ext][query]',
			clean: true
		},
		plugins: [
			new CleanWebpackPlugin(),
			new webpack.ProvidePlugin({
				'_': 'lodash',
				'axios': ['axios', 'default'],
				'popper': '@popperjs/core',
				'bootstrap': 'bootstrap',
				'morphdom': ['morphdom', 'default'],
				'prettyBytes': [path.join(__dirname, 'node_modules/pretty-bytes/index.js'), 'default']
			}),
			new HtmlWebpackPlugin({
				minify: false,
				scriptLoading: 'defer',
				inject: true,
				chunks: ['app'],
				filename: path.resolve(__dirname, './dist/index.html'),
				template: './src/index.html'
			}),
			new WepackPwaManifest({
				name: 'univrs',
				short_name: 'univrs',
				start_url: '/?utm_source=pwa',
				background_color: '#e2e3e5',
				theme_color: '#658ffc',
				orientation: 'any',
				icons: [
					{
						src: path.resolve(__dirname, './src/img/virgo.png'),
						destination: 'assets/icons/',
						sizes: [36, 48, 72, 96, 144, 192, 512]
					}
				]
			}),
			new MiniCssExtractPlugin({
				filename: 'assets/css/[name].[contenthash].css',
				chunkFilename: 'assets/css/[name].[contenthash].css',
			}),
			new CopyWebpackPlugin({'patterns': [
				{ from: './src/img', to: 'assets/img' }
			]})
		],
		externals: {
			window: 'window',
			document: 'document'
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					include: path.resolve(__dirname, 'src'),
					use: {
						loader: 'babel-loader'
					}
				},
				{
					test: /\.(sa|sc|c)ss$/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader',
							options: {
								url: false
							}
						},
						'postcss-loader',
						'sass-loader'
					]
				},
				{
					test: /\.html$/,
					use: {
						loader: 'raw-loader'
					}
				},
				{
					test: /\.svg$/,
					include: path.resolve(__dirname, 'src/img/weather'),
					use: {
						loader: 'raw-loader'
					}
				}
			]
		},
		optimization: {
			minimize: true,
			runtimeChunk: 'single',
			splitChunks: {
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: 'vendors',
						chunks: 'all'
					}
				}
			},
			minimizer: [
				new CssMinimizerPlugin()
			]
		}
	}
};
