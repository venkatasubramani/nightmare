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
    profile_published: false
}, function(err, completedProfiles) {
    var dummy = [];
    dummy.push(completedProfiles[0]);
    if (completedProfiles && completedProfiles.length > 0) {
        console.log('publishing ' + completedProfiles.length + ' profiles');
        publish_trello(dummy);
    } else console.log('Nothing to process');
});

function publish_trello(completedProfiles) {
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

// --- Promise functions
function getBoardId(organization, boardName) {

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

function getList(boardId, listName) {
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

function createCards(newProfilesListId, completedProfiles) {
    var deferred = Q.defer();

    if (completedProfiles && completedProfiles.length > 0) {
        var index = 0,
            condition = function() {
                console.log(index < completedProfiles.length);
                return index < completedProfiles.length;
            };

        return promiseWhile(condition, function() {
            var completedProfile = completedProfiles[index];
            index++;

            return getTrelloAction(newProfilesListId, completedProfile)
                .then(function(action) {
                    return action();
                });
        });
    }
}

function getTrelloAction(listid, profile) {
    var deferred = Q.defer();

    // Check if there is a card already
    db_trello_profiles.find({
        mat_id: completeProfile.mat_id
    }, processCard);

    function processCard(err, trelloRecord) {
        if (trelloRecord.length > 0) {
            deferred.resolve(updateCard(trelloRecord.card_id, completeProfile));
        } else {
            return createCard(listid, completeProfile)
                .then(function(card) {
                    deferred.resolve(updateCard(card.id, completeProfile));
                });
        }
    }

    return deferred.promise;
}

function createCard(listId, profile) {

    function _createCard() {
        var deferred = Q.defer(),
            url = "/1/lists/" + listId + '/cards';

        var name = profile.mat_id + ' - ' + profile.name + ' (' + profile.age + ', ' + profile.height_feet + '\'' + profile.height_inch + '\")';
        var options = {
            name: name
        }

        t.post(url, options, function(err, card) {
            if (err) deferred.reject(err);
            deferred.resolve(card);
        });

        return deferred.promise;
    }

    function _saveCard(card) {
        var deferred = Q.defer();

        db_trello_profiles.ensureIndex({
            fieldName: 'mat_id',
            unique: true
        }, function(err) {
            db_trello_profiles.insert({
                mat_id: profile.mat_id,
                card_id: card.id
            }, function(err, data) {
                if (err) {
                    console.log('Card exists already. Updating the card');

                    db_trello_profiles.update({
                        mat_id: profile.mat_id
                    }, {
                        $set: {
                            card_id: card.id
                        }
                    }, {}, function(err, numReplaced) {
                        if (err) deferred.reject(err);
                        console.log('card for ' + profile.mat_id + ' updated');
                    });
                } else {
                    console.log('card for ' + profile.mat_id + ' generated');
                    deferred.resolve(card);
                }
            });
        });

        return deferred.promise;
    }

    return _createCard()
        .then(_saveCard);
}

function updateCard(cardid, profile) {

    /*return Q.all([updateCardDetails(), addLabels()]).then(function() {
        console.log('Card updated');
    }).catch(function(err) {
        console.log('ERROR:' + err);
    });; //, updatePhotos()]);*/
    return updateCardDetails(cardid, profile);
}

// Add Labels
function addLabel(cardid, label) {
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
        if (err) deferred.reject(err);
        deferred.resolve(data);
    });

    return deferred.promise;
}

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

// ------------------ Private functions

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

function addLabels(cardid, profile) {
    return Q.all([countryLabel(cardid, profile), educationLabel(cardid, profile)]);
}

function countryLabel(cardid, profile) {
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

    return addLabel(cardid, options);
}

function educationLabel(cardid, profile) {
    var options = {
        color: 'black',
        name: profile.education
    };

    return addLabel(cardid, options);
}

function updateCardDetails(cardid, profile) {
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

    return updateDesc(cardid, description);
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
