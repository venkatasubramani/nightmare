var trelloPublicKey = "eeb0e57e74ba4de835c90072f1156a93";
trelloToken = "1b441c055d7603302bd4ac578c49b8f0dfbff314047187a8eb54e43f0e1f6df4"

var Trello = require("node-trello");
var Q = require('q');
var t = new Trello(trelloPublicKey, trelloToken);

var Datastore = require('nedb');

var ORGANIZATION = 'projectnighmare',
    BOARD = 'goldrush';

var db_trello_profiles = new Datastore({
    filename: 'db/trello_profiles',
    autoload: true
});


getBoardId(ORGANIZATION, BOARD)
    .then(getCards)
    .then(function(cards) {
        console.log(cards.length + ' cards found.');
        cards.forEach(function(card) {
            var mat_id = card.name;
            mat_id = mat_id.length > 0 ? mat_id : null;
            mat_id = mat_id ? mat_id.split('-') : null;
            mat_id = mat_id ? mat_id[0] : null;
            mat_id = mat_id ? mat_id.trim() : null;

            db_trello_profiles.ensureIndex({
                fieldName: 'mat_id',
                unique: true
            }, function(err) {
                db_trello_profiles.insert({
                    mat_id: mat_id,
                    card_id: card.id
                }, function(err, insertedDocs) {
                    if (err) console.log(err);
                });
            });
        });
    })
    .catch(function(err) {
        console.log(err);
    });



// ---- Private functions

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


function getCards(boardId) {

    var deferred = Q.defer(),
        url = "/1/boards/" + boardId + '/cards';

    t.get(url, function(err, cards) {
        if (err) deferred.reject(err);

        deferred.resolve(cards);
    });

    return deferred.promise;
}
