var whitelist = [];

module.exports = function(dirname) {

    if (~dirname.indexOf('node_modules') && !require.extensions['.es6']) {
        throw new Error('module-babel must be initialized in the parent app before any dependencies');
    }

    whitelist.push(new RegExp(dirname + '(?!/node_modules)'));

    var opts  = {};
    opts.only = whitelist;

    require('babel/register')(opts);
};
