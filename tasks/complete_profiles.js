var Spooky = require('spooky'),
    spookyConfig = {
        child: {
            transport: 'http'
        },
        casper: {
            logLevel: 'debug',
            verbose: true,
            options: {
                clientScripts: ['https://code.jquery.com/jquery-2.1.4.js']
            },
            pageSettings: {
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.137 Safari/537.36'
            },
            waitTimeout: 30000
        }
    };


var DIR_LOGS = 'logs',
    DIR_VIEW = 'complete_profiles',
    URL = 'http://www.tamilmatrimony.com/',
    step = 0,
    queryParams = {},
    incompleteProfiles = [];
/*incompleteProfiles.push({
    mat_id: 'T2898073',
    url: 'http://profile.tamilmatrimony.com/profiledetail/viewprofile.php?id=' + 'T2898073'
});*/


var Datastore = require('nedb'),
    db = new Datastore({
        filename: 'db/profiles',
        autoload: true
    });

db.find({
    //profile_completed: false,
    rejected: false
}, function(err, docs) {
    incompleteProfiles = docs;
    console.log('Loaded '+ incompleteProfiles.length + ' Incomplete Profiles')
});

var spooky = new Spooky(spookyConfig, function(err) {
    if (err) {
        e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        throw e;
    }

    spooky.start('http://www.tamilmatrimony.com/');
    spooky.emit('start_tamil_matrimony');
    spooky.run();
});

// ---------- Public Events

spooky.on('console', function(line) {
    console.log(line);
});

spooky.on('update_profile', function(profile) {
    console.log(profile);

    profile.profile_completed = true;

    db.update({
        mat_id: profile.mat_id
    }, {
        $set: profile
    }, {
        multi: true
    }, function(err, numReplaced) {
        console.log(profile.mat_id + ' completed');
    });
});

spooky.on('delete_profile', function(mat_id) {
    db.update({
        mat_id: mat_id
    }, {
        $set: {
            rejected: true
        }
    }, {
        multi: true
    }, function(err, numReplaced) {
        console.log(mat_id + ' rejected');
    });
});

// ---------- Main Event

spooky.on('start_tamil_matrimony', function() {
    this.then([{
        URL: URL,
        DIR_VIEW: DIR_VIEW,
        DIR_LOGS: DIR_LOGS,
        step: step,
        queryParams: queryParams,
        incompleteProfiles: incompleteProfiles,
        profileSelectors: profileSelectors
    }, function() {
        var baseProfileURL = 'http://profile.tamilmatrimony.com/profiledetail/viewprofile.php?id=',
            phoneNumberURL = 'http://profile.tamilmatrimony.com/assuredcontact/assuredinsertphonerequest.php',
            photoURL = 'http://profile.tamilmatrimony.com/photo/enlargephoto.php';

        function step_capture(image) {
            step++;
            var imagePath = DIR_LOGS + '/' + DIR_VIEW + '/' + step + '_' + image + '.png';
            console.log('Saving screen capture to ' + imagePath);
            this.capture(imagePath);
        }

        function click_link(config) {
            var delay = config.delay ? config.delay : 2000,
                stepDescription = config.stepDescription,
                selector = config.selector,
                delay = delay;

            return this.waitForSelector(selector, function pass() {
                console.log(step + ': ' + stepDescription);

                console.log('Clicking the link - ' + this.fetchText(selector));
                this.click(selector, 'a');

                return this.wait(delay, function() {
                    step_capture.call(this, stepDescription.replace(/ /g, "_"));
                    return true;
                })
            }, function fail() {
                console.log('Failed: ' + stepDescription);
                step_capture.call(this, stepDescription.replace(/ /g, "_"));
                return false;
            });
        }

        function delete_profile(url) {
            var mat_id = url.split('=')[1];
            mat_id = mat_id ? mat_id.trim() : null;
            if (mat_id) {
                this.emit('delete_profile', mat_id);
            }
        }

        function read_profile() {
            var profile = {},
                keys = Object.keys(profileSelectors),
                casper = this,
                viewPhoneNumber = false,
                getPhotoLinks = false;

            keys.forEach(function(key) {
                var selector = profileSelectors[key],
                    value = '';

                switch (key) {
                    case 'is_phone_number':
                        viewPhoneNumber = value =
                            (casper.fetchText(selector).trim() == "You viewed this member's phone number.");
                        break;
                    case 'is_photo':
                        getPhotoLinks = value = casper.exists(selector);
                    case 'last_login':
                        value = casper.fetchText(selector);
                        value = value.indexOf(':') == -1 ? value : value.split(':')[1].trim();
                        break;
                    default:
                        value = casper.fetchText(selector).trim();
                        break;
                }
                console.log(value);
                profile[key] = value;
            });

            if (viewPhoneNumber) {

                var options = {
                    method: 'post',
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
                    data: {
                        matid: profile.mat_id,
                        PageName: 'VP',
                        PageNo: '',
                        pagetype: '',
                        placeholder: '',
                        userphoneavailable: 0,
                        FROMVP: 1
                    }
                }

                this.thenOpen(phoneNumberURL, options).then(function() {
                    profile.primary_phone = this.fetchText('body > div > div > div.hdtxt1 > span.boldtxt.hdtxt1').trim();
                    profile.secondary_phone = this.fetchText('body > div > div > div.hdtxt1 > div').split(':')[1].trim();
                });
            }

            if (getPhotoLinks) {
                var random = this.getElementAttribute(profileSelectors['is_photo'], "onClick");
                random = random ? random.split(',')[2] : null
                random = random ? random.substring(1, random.length - 1) : null; // remove double quotes from the random id

                if (random) {
                    var options = {
                        method: 'post',
                        headers: {
                            'Content-type': 'application/x-www-form-urlencoded'
                        },
                        data: {
                            photono: 1,
                            ID: profile.mat_id,
                            PID: random,
                            pagename: 'VP',
                            arguments: 'undefined',
                            ppwd: 'undefined'
                        }
                    }

                    this.thenOpen(photoURL, options).then(function() {
                        profile.photos = {};
                        profile.photos.thumbnails = this.getElementsAttribute('#gallery > div:nth-child(1) > div.ad-nav.fleft > div.ad-thumbs > ul a img', 'src');
                        profile.photos.full_size = this.getElementsAttribute('#gallery > div:nth-child(1) > div.ad-nav.fleft > div.ad-thumbs > ul a', 'href');
                    });
                }
            }

            this.then(function() {
                step_capture.call(casper, profile.mat_id);
                casper.emit('update_profile', profile);
            });
        }

        //---------------------- Login Page


        console.log('Loaded ' + URL);

        this.fillSelectors('form[name=Login]', {
            'input#ID': 'e.kalyani.vellaichamy@gmail.com'
        });

        this.sendKeys('#TEMPPASSWD1', 'matri625020');

        console.log('Login form filled..');
        step_capture.call(this, 'formfilled');

        click_link.call(this, {
            stepDescription: 'Clicking login button',
            selector: '#close > center > div.hpmainwraper > div.hpmainwraper.pos-relative > div.innerwrapper.pos-relative.paddt10 > div.fright > form > div.fleft.paddl8 > input.hp-button.small'
        });

        click_link.call(this, {
            stepDescription: 'Skipping the promotion page',
            selector: 'body > div > div:nth-child(2) > div:nth-child(4) > a'
        });

        //---------------------- Shortlisted Profiles

        this.then(function() {
            var urls = [];
            incompleteProfiles.forEach(function(profile, i) {
                urls.push(profile.url);
            });

            this.each(urls, function(self, link) {
                console.log('Opening the link ' + link);
                self.thenOpen(link, function() {
                    this.echo(this.getTitle());
                    if (this.getTitle() == 'profile.tamilmatrimony.com') {
                        delete_profile.call(this, link);
                    } else
                        read_profile.call(this);
                });
            });
        });
    }]);
});

var profileSelectors = {
    mat_id: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.printvpbg.vpbgprint > div.hdtxt11.fleft.paddt10 > ul > li:nth-child(1)',
    created_by: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.printvpbg.vpbgprint > div.hdtxt11.fleft.paddt10 > ul > li:nth-child(3)',

    last_login: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.fleft.mediumtxt1 > div.fright > div.padd5.fright.vp-chatoffline > div > div.fleft > ul > li:nth-child(1) > div', //last_login).text().split(':')[1].trim()

    description: '#profilecompletedesc',

    // Profile
    name: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(1) > div.fleft.colon.paddl15.width175',

    age: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.fleft.mediumtxt1 > div.fleft.paddb10 > ul > li:nth-child(1) > span:nth-child(2)',
    height_feet: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.fleft.mediumtxt1 > div.fleft.paddb10 > ul > li:nth-child(1) > span:nth-child(4)',
    height_inch: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.fleft.mediumtxt1 > div.fleft.paddb10 > ul > li:nth-child(1) > span:nth-child(5)',
    weight: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(10) > div.fleft.colon.paddl15.width175',

    mother_tongue: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(13) > div.fleft.colon.paddl15.width175 > span',
    maritial_status: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(16) > div.fleft.colon.paddl15.width175',

    // Body
    body_type: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(2) > div.fleft.colon.paddl15',
    complexion: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(5) > div.fleft.colon.paddl15',
    physical_status: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(8) > div.fleft.colon.paddl15',
    eating_habit: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(11) > div.fleft.colon.paddl15',
    drinking_habit: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(14) > div.fleft.colon.paddl15',
    smoking_habit: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(17) > div.fleft.colon.paddl15',

    religion: '#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(16) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(1) > div.fleft.colon.paddl15 > span',
    caste: '#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(16) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(2) > div.fleft.colon.paddl15 > span',

    // location
    country: '#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(1) > div.fleft.colon.paddl15.width175 > div',
    state: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(4) > div.fleft.colon.paddl15.width175 > div',
    city: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(7) > div.fleft.colon.paddl15.width175 > div > span',
    citizenship: '#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(2) > div.fleft.colon.paddl15 > div',
    resident_status: '#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(5) > div.fleft.colon.paddl15 > div',

    // Education
    education: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(1) > div.fleft.colon.paddl15.width400 > span',
    education_detail: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(2) > div.fleft.colon.paddl15.width400 > span > span',
    occupation: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(3) > div.fleft.colon.paddl15.width400 > span > span',
    occupation_detail: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(4) > div.fleft.colon.paddl15.width400 > span > span',
    annual_income: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(6) > div.fleft.colon.paddl15.width400 > span > span > span',

    // Family status
    family_status: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(7) > div.fleft.colon.paddl15.width175 > span',
    father_status: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(10) > div.fleft.colon.paddl15.width175 > span',
    mom_status: '#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(11) > div.fleft.colon.paddl15 > span',
    brothers: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(5) > div.fleft.colon.paddl15 > span',
    sisters: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(8) > div.fleft.colon.paddl15 > span',

    about_family: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.paddt10 > div.txt-justify.lheight18 > span',

    expected_caste: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(24) > div:nth-child(5) > div > div:nth-child(3) > div.fleft > div > div:nth-child(2) > div.fleft.colon.paddl20 > div',
    expected_education: '#moredivEducation',
    expected_occupation: '#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(24) > div:nth-child(5) > div > div:nth-child(4) > div.fleft > div > div:nth-child(2) > div.fleft.colon.paddl20 > div',

    is_phone_number: '#titleDisp > div.boldtxt.paddb10.ignblkpositive',
    is_photo: '#useracticonsimgs > div > a'
}
