module.exports = ({ file, options, env }) => ({
    parser: file.extname === '.css' ? 'sugarss' : false,
    plugins: {
        autoprefixer: { browsers: ['last 2 versions', 'iOS >= 8'] }
    }
});