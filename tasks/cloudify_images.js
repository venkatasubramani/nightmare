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

/*cloudinary.uploader.upload('http://m-imgs.matrimonycdn.com/photos/3/1/M3114165_wegah_4128.jpg',
    function(result) {
        console.log(result);
    }, {
        folder: 'M3114165',
        use_filename: true,
        public_id: 'M3114165' + "/" + 'M3114165_wegah_4128',
        tag: ['tamilmatrimony', 'M3114165']
    });*/

db_profiles.find({
    profile_completed: true,
    profile_rejected: false
}, getFullProfile);


function getFullProfile(err, profiles) {
    if (err) console.log(err);

    console.log('Processing ' + profiles.length + ' profiles');
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
            if (fullProfile.length > 0) cloudify(profile.is_clouded, fullProfile[0]);
        });
    }
}

function cloudify(is_clouded, profile) {
    var photos = profile.photos ? profile.photos.full_size : null;
    if (!photos) return;

    photos.forEach(function(photo) {
        var photoName = photo.split('/');
        photoName = photoName && photoName.length > 0 ? photoName[photoName.length - 1] : null;
        photoName = photoName ? photoName.split('.') : null;
        photoName = photoName && photoName.length > 0 ? photoName[0] : '';

        var public_id = profile.mat_id + "/" + photoName,
            existsAlready = false;

        if (is_clouded && profile.photos.clouded) {
            profile.photos.clouded.some(function(cloudedPhoto) {
                if (public_id == cloudedPhoto) {
                    existsAlready = true;
                    return true;
                }
            });
        }
        
        if (existsAlready) {
            console.log(photo + 'is in cloud already');
            return
        } else {
            cloudinary.uploader.upload(photo,
                function(result) {
                    console.log(result);
                    updateProfileWithImageAddress(profile.mat_id, result);
                }, {
                    use_filename: true,
                    public_id: public_id,
                    tag: ['tamilmatrimony'].push(profile.mat_id)
                });
        }
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

        db_profiles.update({
            mat_id: mat_id
        }, {
            $set: {
                'is_clouded': true
            }
        }, {}, function(err, numReplaced) {
            if(err) console.log(err);
        });
    });
}
