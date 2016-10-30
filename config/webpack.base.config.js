
'use strict';

//nodejs 核心模块
const path = require('path');
const fs = require('fs');

//npm 包
const webpack = require('webpack')
// const _ = require('lodash');
const glob = require('glob');

//常用webpack plugin
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

//webpack 自带的plugin
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
const DefinePlugin = webpack.DefinePlugin;

//配置生产和开发目录
const srcDir = path.resolve(process.cwd(), 'src');
const assets = path.resolve(process.cwd(), 'assets');
//手动指定模块路径,
const nodeModPath = path.resolve(process.cwd(), '../node_modules');
const pathMap = require('../src/pathmap.json');

//自带生成入口文件,
let entries = (() => {
    let jsDir = path.resolve(srcDir, 'js');
    //使用glob匹配jsDir下的js和jsx文件,返回匹配到的文件组成的数组
    let entryFiles = glob.sync(jsDir + '/*.{js, jsx}');
    let map = {};

    //entryFiles: ['./a.js', './b.js', './c.js']
    entryFiles.forEach((filePath) => {
        let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
        //填充map,生产一个以文件名为key,以文件路径为value的map结构
        map[filename] = filePath;
    });

    return map;
});

module.exports = (options) => {
    options = options || {};

    let dev = options.dev !== undefined ? options.dev : true;
    //publicPath 需要使用绝对路径
    let publicPath = '/';
    let extractCSS;
    let cssLoader;
    let sassLoader;

    //generate entry html files
    //自动生成html入口文件, js文件名必须和html文件名相同
    //eg: 在src下有一个a.html,那么会在assets目录下生成一个a.html,如果js/下有a.js,那么assets下生成的a.html会引用vender和common两个chunks
    let plugins = (() => {
        let entryHtml = glob.sync(srcDir + '/*.html');
        let r = [];

        entryHtml.forEach((filePath) => {
            let filename = filename.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
            // HtmlWebpackPlugin 的config
            let conf = {
                template: 'html!' + filePath,
                filename: filename + '.html'
            };

            //如果有同名的js文件, 那么给conf增加一个inject和chunks
            //更多配置选项,查看github
            if(filename in entries) {
                //inject值为'body'或true时,js文件会在body元素末尾被引入. 值为'head'时,js会被在head标签中引入
                conf.inject = 'body';
                //手动指定生成的html,会引入哪些chunks. 引入顺序不是按数组中的依次引入.
                //会根据multiCommonChunks的依赖关系,进行排序,然后再引入
                conf.chunks = ['vender', 'common', filename];
            }

            if ('b' === filename || 'c' === filename) {
                //如果有b或者c html文件,那么引用common-b-c chunks
                conf.chunks.splice(2, 0, 'common-b-c');
            }

            r.push(new HtmlWebpackPlugin(conf));
        });

        return r;
    })();

    // 没有真正引用也会加载到runtime，如果没安装这些模块会导致报错，有点坑
    /*plugins.push(
    //在模块中,使用了$或react等关键字,会自动require相应的第三方lib, 如果有resolve配置, 优先引入resolve配置的第三方lib
    //注意不是将$或react等暴露为全局变量, external配置,才是暴露为全局变量
     new webpack.ProvidePlugin({
     React: 'react',
     ReactDOM: 'react-dom',
     _: 'lodash', 按需引用
     $: 'jquery'
     })
     )*/

    if (dev) {
        //创建一个ExtrantTextPlugin的实例, 调用实例的extract方法对不同css文件处理
        extractCSS = new ExtractTextPlugin('css/[name].css?[contenthash]');
        cssLoader = extractCSS.extract('style', ['css']);
        sassLoader = extractCSS.extract('style', ['css', 'sass']);
        plugins.push(extractCSS, new webpack.HotModuleReplacementPlugin());
    } else {
        extractCSS = new ExtractTextPlugin('css/[contenthash:8].[name].min.css', {
            //当allChunks 指定为false时,css Loader必须指定怎么处理
            allChunks: false
        });

        cssLoader = extractCSS.extract('style', ['css?minimize']);
        sassLoader = extractCSS.extract('style', ['css?minimize', 'sass']);

        plugins.push(
            //打包并压缩css
            extractCSS,
            //打包压缩js
            new UglifyJsPlugin({
                compress: {
                    warnings: false
                },
                output: {
                    comments: false
                },
                //不对$, exports, 和require进行混淆压缩
                mangle: {
                    except: ['$', 'exports', 'require']
                }
            }),
            //感觉这里定义一个plugin没有什么意义,process.env本来就是全局变量
            //这里可以参考webpack howto
            new DefinePlugin({
                'process.env': {'NODE_ENV': JSON.stringify('production')}
            }),
            //参考webpack documention,减小生产环境的打包文件
            new webpack.optimize.DedupePlugin(),
            //
            new webpack.NoErrorsPlugin()
        )
    }

    let config = {
        entry: Object.assign(entries, {
            //添加一个vender,用于打包公共lib,例如jquery, reactjs等
            'vender': ['jquery'],
        }),

        output: {
            //打包路径
            path: assets,
            filename: dev ? '[name].js' : 'js/[chunkhash:8].[name].min.js',
            //需要打包,但没有在entry中的chunk, 一般是按需加载的打包文件
            chunkFilename: dev ? '[chunkhash:8].chunk.js' : 'js/[chunkhash:8].chunk.min.js',
            //热更新,打包的chunk
            hotUpdateChunkFilename: dev ? '[id].js' : 'js/[id].[chunkhash:8].min.js',
            //静态资源文件的路径
            publicPath: publicPath
        },

        resolve: {
            //指定资源的根目录
            root: [srcDir, nodeModPath],
            //定义别名
            alias: pathMap,
            //require模块时,如果没有后缀名,自动添加一下后缀
            extensions: ['', '.js', 'jsx', '.css', '.scss']
        },

        module: {
            loaders: [
                {
                    test: /.((woff2?|svg)(\?v=[0-9]\.[0-9]\.[0-9]))|(woff2?|svg|jpe?g|png|gif|ico)$/,
                    loaders: [
                        //url-loder 当图片大小小于10k时,自动转换为base64
                        'url?limit=10000&name=img/[hash:8].[name].[ext]',
                        'image?{bypassOnDebug:true, progressive:true, optimizationLevel:3, pngquant:{quality:"65-80", speed:4}}'
                    ]
                },
                {
                    test: /\.((ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9]))|(ttf|eot)$/,
                    loader: 'url?limit=10000&name=fonts/[hash:8].[name].[ext]'
                },
                {
                    test: /\.(tpl|ejs)$/, loader: 'ejs'
                },
                {
                    test: /\.css$/, loader: cssLoader
                },
                {
                    test: /\.scss$/, loader: sassLoader
                },
                {
                    test: /\.jsx?$/, loader: 'babel?presets[]=react,presets[]=es2015'
                }
            ],
            //在使用压缩的第三方lib时,webpack会尝试将其解压缩,这是不必要的,所以阻止webpack解压缩下面的lib
            noParse: ['jquery']
        },

        plugins: [
            /*new webpack.DllReferencePlugin({
             context: process.cwd(),
             manifest: require(path.join(assets, 'dll', 'js', 'reactStuff-manifest.json')),
             sourceType: 'var',
             // name: 'assets/dll/js/reactStuff.js'
             }),*/
            //提取b,c两个入口文件公共的代码
            new CommonsChunkPlugin({
                name: 'common-b-c',
                chunks: ['b', 'c']
            }),
            //提取a,b,c3个文件的公共代码
            new CommonsChunkPlugin({
                name: 'common',
                chunks: ['common-b-c', 'a']
            }),
            //此处是将runtime提取到vender中
            //注意入口文件中有vender,所以此处是将runtime提取出来,添加到vender中,不是单独打包出一个文件
            new CommonsChunkPlugin({
                name: 'vender',
                chunks: ['common']
            })
        ].concat(plugins),

        //webpack-dev-server 配置
        devServer: {
            // hot: true
            noInfo: false,
            inline: true,
            publicPath: publicPath,
            stats: {
                cached: false,
                colors: true
            }
        }
    }

    if (dev) {
        // 为实现webpack-hot-middleware做相关配置
        // @see https://github.com/glenjamin/webpack-hot-middleware
        ((entry) => {
            for (let key of Object.keys(entry)) {
                if (! Array.isArray(entry[key])) {
                    entry[key] = Array.of(entry[key])
                }
                entry[key].push('webpack-hot-middleware/client?reload=true')
            }
        })(config.entry)

        config.plugins.push( new webpack.HotModuleReplacementPlugin() )
        config.plugins.push( new webpack.NoErrorsPlugin() )
    }

    return config
}
