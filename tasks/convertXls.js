/*node_xj = require("xls-to-json");
  node_xj({
    input: "assets/shortlistedProfiles.xls",  // input xls 
    output: "output.json", // output json 
    sheet: "sheet1",  // specific sheetname 
  }, function(err, result) {
    if(err) {
      console.error(err);
    } else {
      console.log(result);
    }
  });*/

var time = Date.now() / 1000 | 0;
console.log(time);

var cloudinary = require('cloudinary'),
    _ = require('underscore'),
    crypto = require('crypto');

var API_KEY = '467712173355381';
var API_SECRET = 'ArU58r4jqVpuHadg-SegWSRKr8o';
cloudinary.config({
    cloud_name: 'dysqj6szg',
    api_key: API_KEY,
    api_secret: API_SECRET
});

/*var sign = "crypto.createHash('sha1').update(public_id=&timestamp=" + time + " + " + "dfggabagcceecha" + ").digest('hex')",
    public_id = "M3816471_pHXPG_32867";
*/
var cloudinary = require('cloudinary');
/*cloudinary.api.resource('sample',
    function(result) {
        console.log(result)
    });*/
var sign = process_request_params({
    folder: 'M3816471',
    public_id: 'M3816471_pHXPG_32867',
    timestamp: time
}, {})

console.log(sign);

cloudinary.uploader.upload('http://m-imgs.matrimonycdn.com/photos/2015/04/04/00/M3816471_pHXPG_32867.jpg',
    function(result) {
        console.log(result)
    }, sign);


function api_sign_request(params_to_sign, api_secret) {
    var k, shasum, to_sign, v;
    to_sign = _.sortBy((function() {
        var results;
        results = [];
        for (k in params_to_sign) {
            v = params_to_sign[k];
            if (v != null) {
                results.push(k + "=" + (build_array(v).join(",")));
            }
        }
        return results;
    })(), _.identity).join("&");
    shasum = crypto.createHash('sha1');
    shasum.update(utf8_encode(to_sign + api_secret));
    return shasum.digest('hex');
};

function sign_request(params, options) {
    var api_key, api_secret, ref, ref1;
    if (options == null) {
        options = {};
    }
    api_key = (function() {
        var ref1;
        if ((ref = (ref1 = options.api_key) != null ? ref1 : API_KEY) != null) {
            return ref;
        } else {
            throw "Must supply api_key";
        }
    })();
    api_secret = (function() {
        var ref2;
        if ((ref1 = (ref2 = options.api_secret) != null ? ref2 : API_SECRET) != null) {
            return ref1;
        } else {
            throw "Must supply api_secret";
        }
    })();
    params = clear_blank(params);
    params.signature = api_sign_request(params, api_secret);
    params.api_key = api_key;
    return params;
};

function process_request_params(params, options) {
    if ((options.unsigned != null) && options.unsigned) {
        params = clear_blank(params);
        delete params["timestamp"];
    } else {
        params = sign_request(params, options);
    }
    return params;
};

function clear_blank(hash) {
    var filtered_hash, k, v;
    filtered_hash = {};
    for (k in hash) {
        v = hash[k];
        if (present(v)) {
            filtered_hash[k] = hash[k];
        }
    }
    return filtered_hash;
};

function present(value) {
    return !_.isUndefined(value) && ("" + value).length > 0;
};

function build_array(arg) {
    if (arg == null) {
        return [];
    } else if (_.isArray(arg)) {
        return arg;
    } else {
        return [arg];
    }
};

function utf8_encode(argString) {
    var c1, enc, end, n, start, string, stringl, utftext;
    if (argString == null) {
        return "";
    }
    string = argString + "";
    utftext = "";
    start = void 0;
    end = void 0;
    stringl = 0;
    start = end = 0;
    stringl = string.length;
    n = 0;
    while (n < stringl) {
        c1 = string.charCodeAt(n);
        enc = null;
        if (c1 < 128) {
            end++;
        } else if (c1 > 127 && c1 < 2048) {
            enc = String.fromCharCode((c1 >> 6) | 192, (c1 & 63) | 128);
        } else {
            enc = String.fromCharCode((c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128);
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.slice(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
        n++;
    }
    if (end > start) {
        utftext += string.slice(start, stringl);
    }
    return utftext;
};
