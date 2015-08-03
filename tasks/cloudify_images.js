var Datastore = require('nedb'),
    cloudinary = require('cloudinary');

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

    if (profiles && profiles.length > 0) {
        profiles.forEach(function(profile) {

            db_completed_profiles.find({
                mat_id: profile.mat_id,
                photos: { $exists: true }
            }, );

        });
    }
}


/*cloudinary.uploader.upload('http://m-imgs.matrimonycdn.com/photos/2015/04/04/00/M3816471_pHXPG_32867.jpg',
    function(result) {
        console.log(result)
    }, {
        folder: 'M3816471'
    });
*/
