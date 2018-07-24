module.exports = {
    extends: 'loris/es6',
    root: true,
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2018
    },
    rules: {
        camelcase: 'off'
    }
};
