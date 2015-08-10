var trelloPublicKey = "eeb0e57e74ba4de835c90072f1156a93";
trelloToken = "1b441c055d7603302bd4ac578c49b8f0dfbff314047187a8eb54e43f0e1f6df4"


var Trello = require("node-trello");
var Q = require('q');
var Datastore = require('nedb');


var ORGANIZATION = 'projectnighmare',
    BOARD = 'goldrush_testbed',
    NEWPROFILESLIST = 'New Profiles';

var t = new Trello(trelloPublicKey, trelloToken);
var db_profiles = new Datastore({
        filename: 'db/profiles',
        autoload: true
    }),
    db_trello_profiles = new Datastore({
        filename: 'db/trello_profiles',
        autoload: true
    });

db_trello_profiles.find({}, function(err, trelloProfiles) {
    if (trelloProfiles && trelloProfiles.length > 0) {

        trelloProfiles.forEach(function(trelloProfile) {
            getCardList(trelloProfile.card_id)
                .then(function(list) {
                    return updateState(trelloProfile, list)
                })
        });
    } else console.log('Nothing new to process');
});



function getCardList(cardid) {

    var deferred = Q.defer(),
        url = "/1/cards/" + cardid + '/list';

    t.get(url, function(err, list) {
        if (err) deferred.reject(err);

        deferred.resolve(list);
    });

    return deferred.promise;
}

function updateState(trelloProfile, list) {
    var deferred = Q.defer(),
        value = {};

    switch (list.name) {
        case 'Rejected':
            value = {
                profile_rejected: true,
                state: list.name
            }
            break;
        default:
            value = {
                state: list.name
            }
            break;
    }

    db_profiles.find({
        'mat_id': trelloProfile.mat_id
    }, function(err, profiles) {
        if (err) deferred.reject(err);

        if (profiles && profiles.length > 0) {
            var profile = profiles[0];

            db_profiles.update({
                mat_id: profile.mat_id
            }, {
                $set: value
            }, {}, function(err, numReplaced) {
                if (err) console.log(err);
                console.log('Profile ' + profile.mat_id + ' synced');
                deferred.resolve(Q(undefined));
            });
        }
    })

    return deferred.promise;
}
