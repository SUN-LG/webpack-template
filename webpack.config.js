var webpack = require('webpack');
var uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var BellOnBundleErrorPlugin = require('bell-on-bundler-error-plugin');

var HtmlwebpackPlugin = require('html-webpack-plugin');
var OpenBrowserPlugin = require('open-browser-webpack-plugin');
// css文件过大时，可以将less、sass或css单独打包成css文件
var ExtractTextPlugin = require('extract-text-webpack-plugin');
// 用于清空dist/目录的插件
// var CleanPlugin = require('clean-webpack-plugin');

// autoprefixer自动添加css前缀
var autoprefixer = require('autoprefixer');

//定义开发环境，设置全局变量__DEV__为flag。开发环境中使用webpack：env DEBUG=true webpack-dev-server
var dev = new webpack.DefinePlugin({
    __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'false'))
});

module.exports = {
    //入口模块

    //如果入口文件只有一个， entry可以是字符串，数组entry: ['./src/index.js']或者对象entry: {index: './src/index.js', }3种形式

    //多个文件入口时，一般采用数组的方式：entry: ['./src/index.js', './vendor/bootstrap.min.js']
    entry: {
        index: ['./src/index.js'],
        //a: './src/a.js',
        vendor: ['react', 'react-dom']
    },
    output: {
        path: 'dist/', //输出路径
        filename: '[name].js', //输出模块的文件名
        //publicPath: String  指定静态资源的位置，同样也可以是cdn
        publicPath: '/dist/'

        //打包多个输出模块
        /*        entry: {
         index: './src/index.js',
         a: './src/a.js'
         },
         output: {
         path: './dist/',
         filename: '[name].js'
         }*/
    },

    //require时可以省略扩展名，此时需要resolve.extensions配置
    resolve: {
        // 现在你require文件的时候可以直接使用require('file')，不用使用require('file.js')
        extensions: ['', '.js', '.json', 'coffee'],
        root: './src/',
        //模块别名
        alias: {}
    },

    //配置模块和插件
    module: {
        //加载loader模块
        loaders: [
            {
                test: /\.jsx?$/, //对匹配的文件进行处理
                exclude: /node_modules/, //排除某些文件或目录
                loader: 'babel', //匹配到的资源会应用 loader， loader 可以为 string 也可以为数组
                query: { //loader 可以配置参数
                    presets: ['es2015', 'stage-0', 'react']
}
            },
            //less-loader
            {
                test: /\.less$/,
                loader: 'style-loader!css-loader!postcss-loader!less-loader',//使用！链式调用loaders
                //
                postcss: function() {
                    return [
                        require('precss'),
                        require('autoprefixer')
                    ]
                }
                // 将less单独打包成css文件
                // loader: ExtractTextPlugin.extract(['style-loader', 'css-loader!less-loader']),
            },
            //sass-loader
            {
                test: /\.scss$/,
                loader: 'style-loader!css-loader!postcss-loader!sass-loader',//使用！链式调用loaders
                postcss: function() {
                    return [
                        require('precss'),
                        require('autoprefixer')
                    ]
                }
                // 将scss单独打包成css文件
                // loader: ExtractTextPlugin.extract(['style', 'css!sass']),
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader!postcss-loader',
                postcss: function() {
                    return [
                        require('precss'),
                        require('autoprefixer')
                    ]
                }
                // loader: ExtractTextPlugin.extract(['style-loader', 'css-loader'], {
                //     allChunks: true
                // }),
            },
            //image loader
            {
                test: /\.(png|jpg)$/,
                loader: 'url-loader?limit=8192'
            },
        ]
    },
    plugins: [
        new BellOnBundleErrorPlugin(),
        new webpack.optimize.CommonsChunkPlugin(/* chunkname */'vendor', /* filename */'vendor.bundle.js'),
        //Hot Module Replacement Plugin 用于app内容热替换
        new webpack.HotModuleReplacementPlugin(),
        // //compress js
        // new uglifyJsPlugin({
        //     compress: {
        //         warnings: false
        //     }
        // }),
	    dev,
        // webpack 自动生成html模板
        new HtmlwebpackPlugin({
            title: 'webpack-demo',
            filename: 'index.html'
        }),
        //自动打开浏览器
        new OpenBrowserPlugin({
            url: 'http://localhost:8080'
        }),
        new ExtractTextPlugin('./dist/[name].css')
    ],
    //以下及devServer的配置，实现浏览器局部热加载。 命令行只需要 --inline --hot，也就是devServer的配置内容，但会自动加载下面的一个模块。
    // devServer: {
    //     hot: true,
    //     inline: true
    // }
    //还有一种实现方式，在入口文件对象中添加如下内容
    // entry: [
    //     'webpack/hot/dev-server',
    //     'webpack-dev-server/client?http://localhost:8080',
    //     './index.js'
    // ]

}

//判断是否是开发环境，进而选择是否使用uglify插件
if (process.env.DEBUG) {
    // module.exports.devtool = 'source-map';
    module.exports.devServer = {
        hot: true,
        inline: true
    };
} else {
    module.exports.plugins = (module.exports.plugins || []).concat([
            new uglifyJsPlugin({
                compress: {
                    warnings: false
                }
            }),
            //减小打包时文件的体积
            new webpack.optimize.OccurrenceOrderPlugin()
        ]);
}