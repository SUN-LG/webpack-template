var webpack = require('webpack');
var BellOnBundleErrorPlugin = require('bell-on-bundler-error-plugin');

module.exports = {
    //入口模块

    //如果入口文件只有一个， entry可以是字符串，数组entry: ['./src/index.js']或者对象entry: {index: './src/index.js', }3种形式

    //多个文件入口时，一般采用数组的方式：entry: ['./src/index.js', './vendor/bootstrap.min.js']
    entry: {
        index: ['./src/index.js', './src/style.css'],
        a: './src/a.js',
        vendor: ['react', 'react-dom']
    },
    output: {
        path: 'dist/', //输出路径
        filename: '[name].js', //输出模块的文件名
        //publicPath: String  指定静态资源的位置
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
    //配置模块和插件
    module: {
        //加载loader模块
        loaders: [{
            test: /\.jsx?$/, //对匹配的文件进行处理
            exclude: /node_modules/, //排除某些文件或目录
            loader: 'babel', //匹配到的资源会应用 loader， loader 可以为 string 也可以为数组
            query: { //loader 可以配置参数
                presets: ['es2015', 'stage-0', 'react']
            }
        },
        {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
        }]
    },
    plugins: [
        new BellOnBundleErrorPlugin(),
        new webpack.optimize.CommonsChunkPlugin(/* chunkname */'vendor', /* filename */'vendor.bundle.js'),
        //以下及devServer的配置，实现浏览器局部热加载， 命令行只需要 --inline --hot，也就是devServer的配置内容，但会自动加载下面的一个模块。
        new webpack.HotModuleReplacementPlugin()
    ],
    devServer: {
        hot: true,
        inline: true
    }

}