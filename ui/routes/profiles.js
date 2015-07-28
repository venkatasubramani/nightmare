var express = require('express');
var path = require('path');
var router = express.Router();
var Datastore = require('nedb');

console.log(path.join(__dirname, '../../db/profiles'));

/* GET home page. */
router.get('/', function(req, res, next) {
    db = new Datastore({
        filename: path.join(__dirname, '../../db/profiles'),
        autoload: true
    });
    var profiles = [];

    db.find({
        profile_completed: 'N'
    }, function(err, docs) {
        profiles = docs;


        res.render('profiles', {
            profiles: profiles
                /*[{
                                mat_id: '123',
                                name: 'ewer'
                            }]*/
        });
    });


});

module.exports = router;
