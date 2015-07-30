// <public key> - 1198f3b9e7a8856f23bcff3224b3c1ff
// get the key by going to https://trello.com/1/connect?key=<public key>&name=MyApp&response_type=token&expiration=never&scope=read,write

var trelloPublicKey = "eeb0e57e74ba4de835c90072f1156a93"; //"1198f3b9e7a8856f23bcff3224b3c1ff",
trelloToken = "1b441c055d7603302bd4ac578c49b8f0dfbff314047187a8eb54e43f0e1f6df4"
    //"858df94d832ec6bdadd410a14e280bf3e67d7d3a906b956d84a2edd7ee5ea973";

var Trello = require("node-trello");
var Q = require('q');
var t = new Trello(trelloPublicKey, trelloToken);
var Datastore = require('nedb');

var ORGANIZATION = 'projectnighmare',
    BOARD = 'testbed',
    NEWPROFILESLIST = 'New Profiles';

var db_profiles = new Datastore({
        filename: 'db/profiles',
        autoload: true
    }),
    db_completed_profiles = new Datastore({
        filename: 'db/completed_profiles',
        autoload: true
    }),
    db_trello_profiles = new Datastore({
        filename: 'db/trello_profiles',
        autoload: true
    });


db_profiles.find({
    profile_rejected: false,
    profile_completed: true,
    profile_publised: false
}, function(err, completedProfiles) {
    if (completedProfiles && completedProfiles.length > 0) {
        console.log('publishing ' + completedProfiles.length + ' profiles');
        publish_trello(completedProfiles);
    } else console.log('Nothing to process');
});

function publish_trello(completedProfiles) {

    var getBoardId = function(organization, boardName) {

        var deferred = Q.defer(),
            url = "/1/organizations/" + organization + '/boards/organization';

        t.get(url, function(err, boards) {
            if (err) deferred.reject(err);

            boards.some(function(board) {
                if (board.name == boardName) {
                    deferred.resolve(board.id);
                    return;
                }
            });
        });

        return deferred.promise;
    }

    var getList = function(boardId, listName) {
        var deferred = Q.defer(),
            url = "/1/boards/" + boardId + '/lists/all';

        t.get(url, function(err, lists) {
            if (err) deferred.reject(err);

            lists.some(function(list) {
                if (list.name == listName) {
                    deferred.resolve(list.id);
                    return;
                }
            });
        });

        return deferred.promise;
    }

    var createCard = function(listId, profile) {
        var deferred = Q.defer(),
            url = "/1/lists/" + listId + '/cards';

        function _createCard(completeProfile) {
            var name = completeProfile.mat_id + ' - ' + completeProfile.name + ' (' + completeProfile.age + ', ' + completeProfile.height_feet + '\'' + completeProfile.height_inch + '\")';
            var options = {
                name: name
            }

            t.post(url, options, function(err, card) {
                if (err) deferred.reject(err);

                if (card) {
                    _updateCardId(card);
                    return updateCard(card.id, completeProfile);
                }
            });
        }

        function _updateCardId(card) {
            db_trello_profiles.ensureIndex({
                fieldName: 'mat_id',
                unique: true
            }, function(err) {
                db_trello_profiles.insert({
                    mat_id: completeProfile.mat_id,
                    card_id: card.id
                }, function(err, data) {
                    if (err) {
                        console.log('trying to update');
                        db_trello_profiles.update({
                            mat_id: mat_id
                        }, {
                            $set: {
                                card_id: card.id
                            }
                        }, {}, function(err, numReplaced) {
                            if (err) deferred.reject(err);
                            console.log('card for ' + completeProfile.mat_id + ' updated');
                        });
                    }
                    console.log('card for ' + completeProfile.mat_id + ' generated');
                });
            });
        }

        db_completed_profiles.find({
            mat_id: profile.id
        }, function(err, completeProfile) {
            if (err) deferred.reject(err);

            if (completeProfile) {
                return _createCard(completeProfile)
            }
        });

        return deferred.promise;
    }

    var updateCard = function(cardid, profile) {

        // Add Attachments
        function updatePhoto(photo) {

            var deferred = Q.defer(),
                url = "/1/cards/" + cardid + '/attachments';

            var options = {
                url: photo,
                mimeType: 'image/jpeg'
            }

            t.post(url, options, function(err, data) {
                if (err) deferred.reject(err);
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        // Add Labels
        function addLabel(label) {
            var deferred = Q.defer(),
                url = "/1/cards/" + cardid + '/labels';

            var options = label

            t.post(url, options, function(err, data) {
                if (err) deferred.reject(err);
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        // Add detailed description
        function updateDesc(description) {
            var deferred = Q.defer(),
                url = "/1/cards/" + cardid + '/desc';

            var options = {
                value: description
            };

            t.put(url, options, function(err, data) {
                console.log(arguments);
                if (err) deferred.reject(err);
                deferred.resolve(data);
            });

            return deferred.promise;
        }

        function updatePhotos() {
            if (profile.photos && profile.photos.full_size && profile.photos.full_size.length > 0) {
                var index = 0,
                    condition = function() {
                        return index < profile.photos.full_size.length;
                    };

                return promiseWhile(condition, function() {
                    var photo = profile.photos.full_size[index];
                    index++;
                    return updatePhoto(photo);
                }).then(function() {
                    console.log("All photos uploaded");
                }).done();
            }
        }

        function addLabels() {

            function countryLabel() {
                var options = {};
                if (profile.country == 'United States of America') {
                    options = {
                        color: 'orange',
                        name: 'USA'
                    }
                } else if (profile.country != 'India') {
                    options = {
                        color: 'purple',
                        name: profile.country
                    }
                }

                return addLabel(options);
            }

            function educationLabel() {
                var options = {
                    color: 'black',
                    name: profile.education
                };

                return addLabel(options);
            }

            return Q.all([countryLabel(), educationLabel()]);
        }

        function updateCardDetails() {
            var description = '';

            description += '\n' + profile.city + ', ' + profile.state + ', ' + profile.country + ' (' + profile.resident_status + ')';
            if (profile.is_phone_number) {
                description += '\n' + 'Ph: ' + profile.primary_phone + ', ' + profile.secondary_phone;
            }

            description += '\n\n';
            if (profile.photos && profile.photos.thumbnails) {
                profile.photos.thumbnails.forEach(function(thumbnail, index) {
                    description += '[![' + (profile.mat_id + index) + '](' + thumbnail + ')](' + profile.photos.full_size[index] + ')' + '     '
                });
            }

            description += '\n' + '*Father:* ' + profile.family_status + ' . ' + '*Mother:* ' + profile.mom_status;
            description += '\n' + '*Brothers:* ' + profile.brothers + ' . ' + '*Sisters:* ' + profile.sisters;
            description += '\n\n' + 'About Her';
            description += '\n' + profile.description;
            description += '\n\n' + 'About Family';
            description += '\n' + profile.about_family;

            return updateDesc(description);
        }

        return Q.all([updateCardDetails(), addLabels()]); //, updatePhotos()]);
    }


    function createCards(newProfilesListId) {
        if (completedProfiles && completedProfiles.length > 0) {
            var index = 0,
                condition = function() {
                    return index < completedProfiles.length;
                };

            return promiseWhile(condition, function() {
                var profile = completedProfiles[index];
                index++;
                return createCard(newProfilesListId, profile);
            }).then(function() {
                console.log("All profiles are published");
            }).done();
        }
    }

    getBoardId(ORGANIZATION, BOARD)
        .then(function(boardId) {
            return getList(boardId, NEWPROFILESLIST)
        })
        .then(createCards)
        .then(function(data) {
            console.log(data)
        })
        .catch(function(err) {
            console.log(err);
        })
}

// `condition` is a function that returns a boolean
// `body` is a function that returns a promise
// returns a promise for the completion of the loop
function promiseWhile(condition, body) {
    var done = Q.defer();

    function loop() {
        // When the result of calling `condition` is no longer true, we are
        // done.
        if (!condition()) return done.resolve();
        // Use `when`, in case `body` does not return a promise.
        // When it completes loop again otherwise, if it fails, reject the
        // done promise
        Q.when(body(), loop, done.reject);
    }

    // Start running the loop in the next tick so that this function is
    // completely async. It would be unexpected if `body` was called
    // synchronously the first time.
    Q.nextTick(loop);

    // The promise
    return done.promise;
}
