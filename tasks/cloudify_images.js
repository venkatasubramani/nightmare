var Datastore = require('nedb'),
    cloudinary = require('cloudinary');
_ = require('lodash');

var API_KEY = '467712173355381',
    API_SECRET = 'ArU58r4jqVpuHadg-SegWSRKr8o',
    CLOUD_NAME = 'dysqj6szg';

cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
});

var db_profiles = new Datastore({
        filename: 'db/profiles',
        autoload: true
    }),
    db_completed_profiles = new Datastore({
        filename: 'db/completed_profiles',
        autoload: true
    });

db_profiles.find({
    profile_completed: true,
    profile_rejected: false
}, getFullProfile);


function getFullProfile(err, profiles) {
    if (err) console.log(err);

    db_completed_profiles.find({
        is_photo: true
    }, function(err, completed_profiles) {
        if (err) console.log(err);

        processCompletedProfiles(profiles, completed_profiles)
    });
}

function processCompletedProfiles(profiles, completed_profiles) {
    if (profiles && profiles.length > 0) {
        profiles.forEach(function(profile) {
            var fullProfile = _.filter(completed_profiles, _.matches({
                'mat_id': profile.mat_id
            }));
            if (fullProfile.length > 0) cloudify(fullProfile[0]);
        });
    }
}

function cloudify(profile) {
    /*cloudinary.api.delete_resources_by_prefix(profile.mat_id + '/', function(result) {
        console.log(result)
    });*/
    var photos = profile.photos ? profile.photos.full_size : null;
    if (!photos) return;

    photos.forEach(function(photo) {
        cloudinary.uploader.upload(photo,
            function(result) {
                console.log(result);
                updateProfileWithImageAddress(profile.mat_id, result);
            }, {
                folder: profile.mat_id,
                use_filename: true
            });
    })
}

function updateProfileWithImageAddress(mat_id, cloudResult) {
    db_completed_profiles.update({
        mat_id: mat_id
    }, {
        $addToSet: {
            'photos.clouded': cloudResult.public_id
        }
    }, {}, function(err, numReplaced) {
        if (err) console.log(mat_id + ' could not be inserted/ updated.')
        console.log(mat_id + ' updated');
        console.log(arguments);
        
        db_profiles.update({
            mat_id: mat_id
        }, {
            $set: {
                'is_clouded': true
            }
        }, {}, function(err, numReplaced) {
            console.log(arguments);
        });
    });
}
