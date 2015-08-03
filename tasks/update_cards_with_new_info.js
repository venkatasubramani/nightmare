var Trello = require("node-trello");
var Datastore = require('nedb');

var db_completed_profiles = new Datastore({
        filename: 'db/completed_profiles',
        autoload: true
    }),
    db_trello_profiles = new Datastore({
        filename: 'db/trello_profiles',
        autoload: true
    });
