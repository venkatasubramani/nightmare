var Datastore = require('nedb');

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


unpublish_profiles();

function unpublish_profiles() {
    // remove profile_published in profiles
    // delete document in trello_profiles

    db_profiles.update({}, {
        $set: {
            profile_published: false
        }
    }, {}, function(err, numReplaced) {
        if (err) throw err;

        db_trello_profiles.remove({}, {}, function(err, numReplaced) {
            console.log('All Profiles un published');
        });
    });
}
