var path = require('path');

module.exports = {
    entry: './static/src/js/main.js',
    output: {
        path: path.resolve(__dirname, 'static/dist'),
        publicPath: 'http://localhost:5000/resources/', // This is used to generate URLs to e.g. images
        filename: 'bundle.js' 
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.less$/,
          use: [
            'style-loader',
            { loader: 'css-loader', options: { importLoaders: 2 } },
            'less-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['babel-preset-es2015']
            }
          }
        },
        {
          test: /\.(png|jpg|svg)$/, 
          use: ['url-loader?limit=8192']
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          use: [
          'file-loader'
          ]
        }
      ]
    }
};