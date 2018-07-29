const path = require('path');
const glob = require('glob');

module.exports = glob.sync('translations/**/*.js').reduce((result, filepath) => {
    const {name: lang, dir} = path.parse(filepath);
    const ns = dir.split('/').slice(-1)[0];
    return {
        ...result,
        [lang]: {
            ...(result[lang] || {}),
            [ns]: require('../../' + filepath)
        }
    };
}, {});
