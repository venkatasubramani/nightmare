// <public key> - 1198f3b9e7a8856f23bcff3224b3c1ff
// get the key by going to https://trello.com/1/connect?key=<public key>&name=MyApp&response_type=token&expiration=never&scope=read,write

var trelloPublicKey = "eeb0e57e74ba4de835c90072f1156a93"; //"1198f3b9e7a8856f23bcff3224b3c1ff",
var trelloToken = "1b441c055d7603302bd4ac578c49b8f0dfbff314047187a8eb54e43f0e1f6df4";
    //"858df94d832ec6bdadd410a14e280bf3e67d7d3a906b956d84a2edd7ee5ea973";

var Trello = require("node-trello");
var Q = require('q');
var t = new Trello(trelloPublicKey, trelloToken);
var Datastore = require('nedb');

var ORGANIZATION = 'projectnighmare',
    BOARD = 'goldrush',
    NEWPROFILESLIST = 'New Profiles',
    MEMBERS = {};

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
    if (completedProfiles && completedProfiles.length > 0) {
        console.log('publishing ' + completedProfiles.length + ' profiles');
        publish_trello(completedProfiles);
    } else console.log('Nothing new to process');
});

function publish_trello(completedProfiles) {
    getBoardId(ORGANIZATION, BOARD)
        .then(function(boardId) {
            getMembers(boardId)
                .then(function(members) {
                    members.forEach(function(member) {
                        MEMBERS[member.username] = member.id;
                    });
                });
            return getList(boardId, NEWPROFILESLIST);
        })
        .then(function(listId) {
            return createCards(listId, completedProfiles);
        })
        .then(function() {
            console.log('All profiles are published in Trello.')
        })
        .catch(function(err) {
            console.log(err);
        })
}

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

function getMembers(boardId) {
    var deferred = Q.defer(),
        url = "/1/boards/" + boardId + '/members';

    t.get(url, function(err, members) {
        if (err) deferred.reject(err);

        deferred.resolve(members);
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

function createCards(newProfilesListId, profiles) {
    var deferred = Q.defer();

    if (profiles && profiles.length > 0) {
        var index = 0,
            condition = function() {
                return index < profiles.length;
            };

        return promiseWhile(condition, function() {
            var profile = profiles[index];
            index++;

            return getCardId(newProfilesListId, profile)
                .then(function(cardid) {

                    return getFullProfile(profile)
                        .then(removeAllAttachments(cardid))
                        .then(function(fullProfile) {
                            return updateCard(cardid, fullProfile);
                        });
                });
        });
    }

    return deferred.promise;
}

function removeAllAttachments(cardid) {
    var deferred = Q.defer(),
        url = "/1/cards/" + cardid + '/attachments';

    t.get(url, function(err, attachments) {
        if (err) deferred.reject(err);

        attachments.forEach(function(attachment) {
            t.del(url + '/' + attachment.id, function(err, records) {
                deferred.resolve(Q(undefined));
            })
        });
    });

    return deferred.promise;
}

function updateProfile(data) {
    var deferred = Q.defer();
    if (!data) deferred.reject('Something went wrong before saving the profile');

    var profile = data.profile;
    db_profiles.update({
        mat_id: profile.mat_id
    }, {
        $set: {
            profile_published: true
        }
    }, {}, function(err, numReplaced) {
        if (err) deferred.reject(err);
        console.log('Profile ' + profile.mat_id + ' published');
        deferred.resolve(Q(undefined));
    });
    return deferred.promise;
}

function getFullProfile(profile) {
    var deferred = Q.defer();

    db_completed_profiles.find({
        mat_id: profile.mat_id
    }, function(err, fullProfiles) {
        if (err) deferred.reject(err);

        if (fullProfiles.length > 0)
            deferred.resolve(fullProfiles[0]);
        else
            deferred.reject('Could not locate completed profile.');
    })

    return deferred.promise;
}

function getCardId(listid, profile) {
    var deferred = Q.defer();

    db_trello_profiles.find({
        mat_id: profile.mat_id
    }, function(err, trelloRecords) {
        if (err) deferred.reject(err);

        // Check if there is a card already, otherwise create it
        if (trelloRecords.length > 0) {
            var cardid = trelloRecords[0].card_id;
            console.log('Card(' + cardid + ') already available for ' + profile.mat_id)
            deferred.resolve(cardid);
        } else {
            createCard(listid, profile)
                .then(function(card) {
                    deferred.resolve(card.id);
                })
        }
    });

    return deferred.promise;
}

function createCard(listId, profile) {

    function _createCard() {
        var deferred = Q.defer(),
            url = "/1/lists/" + listId + '/cards';

        var options = {
            name: profile.mat_id
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
            }, function(err, numReplaced) {
                if (err) deferred.reject(err);
                console.log('Card (' + card.id + ') for ' + profile.mat_id + ' created');
                deferred.resolve(card);
            });
        });

        return deferred.promise;
    }

    return _createCard()
        .then(_saveCard)
        .catch(function(err) {
            console.log(err);
            console.log('Fail: Card could not be created for ' + profile.mat_id)
        });
}

function updateCard(cardid, profile) {

    return Q.all([
            updateName(cardid, profile),
            updateDescription(cardid, profile),
            addLabels(cardid, profile),
            updatePhotos(cardid, profile),
            attachMembers(cardid, profile)
        ])
        .then(function(card) {
            return updateProfile({
                card: card,
                profile: profile
            })
        })
        .catch(function(err) {
            console.log(err);
            console.log('Fail: Card could not be updated for ' + profile.mat_id)
        });
}

// Add Labels
function trello_card_updateLabel(cardid, label) {
    var deferred = Q.defer(),
        url = "/1/cards/" + cardid + '/labels';

    var options = label

    t.post(url, options, function(err, data) {
        if (err) deferred.reject(err);
        deferred.resolve(data);
    });

    return deferred.promise;
}

function trello_card_updateMember(cardid, memberid) {
    var deferred = Q.defer(),
        url = "/1/cards/" + cardid + '/idMembers';

    var options = {
        value: memberid
    };

    t.put(url, options, function(err, data) {
        if (err) deferred.reject(err);
        deferred.resolve(data);
    });

    return deferred.promise;
}

// Update card description
function trello_card_updateDesc(cardid, description) {
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

// update card name
function trello_card_updateName(cardid, name) {
    var deferred = Q.defer(),
        url = "/1/cards/" + cardid + '/name';

    var options = {
        value: name
    };

    t.put(url, options, function(err, data) {
        if (err) deferred.reject(err);
        deferred.resolve(data);
    });

    return deferred.promise;
}

// Add Attachments
function trello_card_updateAttachment(cardid, photo) {

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

    /*t.get(url, function(err, attachments) {
        if (err) deferred.reject(err);

        var available = false;
        var photoName = photo.split('/');
        photoName = photoName[photoName.length - 1];

        attachments.some(function(pName) {
            return available = photoName == pName.name;
        });

        if (!available) {
            t.post(url, options, function(err, data) {
                if (err) deferred.reject(err);
                deferred.resolve(data);
            });
        } else {
            console.log('Photo ' + photo + ' already attched.');
            deferred.resolve(Q(undefined));
        }
    });*/

    return deferred.promise;
}

// ------------------ Private functions

function updatePhotos(cardid, profile) {
    if (profile.photos && profile.photos.clouded && profile.photos.clouded.length > 0) {
        var index = 0,
            condition = function() {
                return index < profile.photos.clouded.length;
            };

        return promiseWhile(condition, function() {
            var photo = profile.photos.clouded[index];
            photo = 'http://res.cloudinary.com/dysqj6szg/image/upload/v1438580190/' + photo + '.jpg';
            index++;
            return trello_card_updateAttachment(cardid, photo);
        }).catch(function(err) {
            console.log(err);
        });
    }
}

function attachMembers(cardid, profile) {
    var memberid = '';

    switch(profile.created_by) {
        case 'Profile Created for Friend':
        case 'Profile Created for Self':
        memberid = MEMBERS.venkatvellaichamy;
            break;
        default:
            memberid = MEMBERS.kalyanivellaichamy;
            break;
    }

    return trello_card_updateMember(cardid, memberid)
        .catch(function(err) {
            console.log(err +'Member already assigned to ' + profile.mat_id)
        });;
}

function addLabels(cardid, profile) {
    return Q.all([countryLabel(cardid, profile), educationLabel(cardid, profile)])
        .catch(function() {
            console.log('Labels already added to ' + profile.mat_id)
        });
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

    return trello_card_updateLabel(cardid, options);
}

function educationLabel(cardid, profile) {
    var options = {
        color: 'black',
        name: profile.education
    };

    return trello_card_updateLabel(cardid, options);
}

function updateName(cardid, profile) {
    var name = profile.mat_id + ' - ' + profile.name + ' (' + profile.age + ', ' + profile.height_feet + '\'' + profile.height_inch + '\")';
    return trello_card_updateName(cardid, name);
}

function updateDescription(cardid, profile) {
    var description = '';

    description += '\n' + profile.city + ', ' + profile.state + ', ' + profile.country + ' (' + profile.resident_status + ')';
    if (profile.is_phone_number) {
        description += '\n```' + 'Ph: ' + profile.primary_phone + ', ' + profile.secondary_phone + '```';
    }

    description += '\n' + '**Profession**'
    description += '\n' + '*Education:* ' + profile.education + ' (' + profile.education_detail + ')'
    description += '\n' + '*Occupation:* ' + profile.occupation + ' (' + profile.occupation_detail + ')'
    description += '\n' + '*Employed in:* ' + profile.employed_in + ' (' + profile.annual_income + ')'
    description += '\n\n\n' + '**Family**'
    description += '\n' + '*Family Status:* ' + profile.family_status
    description += '\n' + '*Father:* ' + profile.father_status + ' . ' + '*Mother:* ' + profile.mom_status;
    description += '\n' + '*Brothers:* ' + profile.brothers + ' . ' + '*Sisters:* ' + profile.sisters;
    description += '\n\n\n' + '**About Her**';
    description += '\n' + profile.description;
    description += '\n\n\n' + '**About Family**';
    description += '\n' + profile.about_family;
    description += '\n\n\n' + '**Expectation**';
    description += '\n' + profile.looking_for;
    description += '\n' + '*Caste:* ' + profile.expected_caste;
    description += '\n' + '*Education:* ' + profile.expected_education;
    description += '\n' + '*Occupation:* ' + profile.expected_occupation;

    description += '\n\n';
    if (profile.photos && profile.photos.thumbnails) {
        profile.photos.thumbnails.forEach(function(thumbnail, index) {
            description += '[![' + (profile.mat_id + index) + '](' + thumbnail + ')](' + profile.photos.full_size[index] + ')' + '     '
        });
    }

    description += '\n\n\n' + profile.created_by
    description += '\n' + '[View this profile in tamilmatrimony >>](http://profile.tamilmatrimony.com/profiledetail/viewprofile.php?id=' + profile.mat_id + ')';

    return trello_card_updateDesc(cardid, description);
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
