var Datastore = require('nedb'),
    cloudinary = require('cloudinary');
_ = require('lodash');

var API_KEY = '467712173355381',
    API_SECRET = 'ArU58r4jqVpuHadg-SegWSRKr8o',
    CLOUD_NAME = 'dysqj6szg';

var db_profiles = new Datastore({
        filename: 'db/profiles',
        autoload: true
    }),
    db_completed_profiles = new Datastore({
        filename: 'db/completed_profiles',
        autoload: true
    });

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
});

cloudinary.api.delete_all_resources();

db_profiles.find({
    is_clouded: true
}, resetProfile);

function resetProfile(err, profiles) {
    profiles.forEach(function(profile) {
        db_profiles.update({
            mat_id: profile.mat_id
        }, {
            $unset: {
                is_clouded: true
            }
        }, {}, function(err, numReplaced) {
            if (err) console.log(err);


            db_completed_profiles.update({
                mat_id: profile.mat_id
            }, {
                $unset: {
                    'photos.clouded': []
                }
            }, {}, function(err, numReplaced) {
                if (err) console.log(err);
                console.log('Profile ' + profile.mat_id + ' unclouded');
            });
        });
    })
}
