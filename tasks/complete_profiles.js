var incompleteProfiles = [];
/*incompleteProfiles.push({
    mat_id: 'T2898073',
    url: 'http://profile.tamilmatrimony.com/profiledetail/viewprofile.php?id=' + 'T2898073'
});*/
var Datastore = require('nedb'),
    fs = require('fs');

var db_profiles = new Datastore({
        filename: 'db/profiles',
        autoload: true
    }),
    db_completed_profiles = new Datastore({
        filename: 'db/completed_profiles',
        autoload: true
    });

var selectXPath = 'xPath = function(expression) {\
  return {\
    type: "xpath",\
    path: expression,\
    toString: function() {\
      return this.type + " selector: " + this.path;\
    }\
  };\
};';

db_profiles.find({
    profile_completed: false,
    profile_rejected: false
}, function(err, docs) {
    incompleteProfiles = docs;
    /*incompleteProfiles.push({
        mat_id: 'M3814022',
        url: 'http://profile.tamilmatrimony.com/profiledetail/viewprofile.php?id=' + 'M3814022'
    });*/

    if (incompleteProfiles.length > 0) {
        console.log('processing ' + incompleteProfiles.length + ' incomplete profiles');
        processIncompleteProfiles();
    } else console.log('Nothing to process');
});

function processIncompleteProfiles() {

    var Spooky = require('spooky'),
        spookyConfig = {
            child: {
                transport: 'http'
            },
            casper: {
                logLevel: 'error',
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


    var DIR_SCREENSHOTS = 'logs/screenshots',
        DIR_PAGECONTENTS = 'logs/pagecontents',
        DIR_VIEW = 'complete_profiles',
        URL = 'http://www.tamilmatrimony.com/',
        step = 0,
        queryParams = {};

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

        function markProfileComplete() {
            db_profiles.update({
                mat_id: profile.mat_id
            }, {
                $set: {
                    profile_completed: true
                }
            }, {}, function(err, numReplaced) {
                console.log(profile.mat_id + ' marked completed');
            });
        }

        db_completed_profiles.ensureIndex({
            fieldName: 'mat_id',
            unique: true
        }, function(err) {
            db_completed_profiles.insert(profile, function(err) {
                if (err) {
                    db_completed_profiles.update({
                        mat_id: profile.mat_id
                    }, {
                        $set: profile
                    }, {}, function(err, numReplaced) {
                        if (err) console.log(profile.mat_id + ' could not be inserted/ updated.')
                        console.log(profile.mat_id + ' updated');
                        markProfileComplete();
                    });
                } else {
                    markProfileComplete();
                    console.log(profile.mat_id + ' completed');
                }
            });
        });

    });

    spooky.on('delete_profile', function(mat_id) {
        db_profiles.update({
            mat_id: mat_id
        }, {
            $set: {
                profile_rejected: true
            }
        }, {}, function(err, numReplaced) {
            console.log(mat_id + ' rejected');
        });
    });

    spooky.on('write_file', function(params) {
        var mat_id = params.mat_id,
            pageContent = params.page_content;

        if (!fs.existsSync(DIR_PAGECONTENTS)) {
            fs.mkdirSync(DIR_PAGECONTENTS);
        }
        fs.writeFile(DIR_PAGECONTENTS + '/' + mat_id + '.html', pageContent, function() {});
    });

    // ---------- Main Event

    spooky.on('start_tamil_matrimony', function() {
        this.then([{
            URL: URL,
            DIR_VIEW: DIR_VIEW,
            DIR_SCREENSHOTS: DIR_SCREENSHOTS,
            step: step,
            queryParams: queryParams,
            incompleteProfiles: incompleteProfiles,
            profileSelectors: profileSelectors,
            x: selectXPath
        }, function() {
            eval(x);

            var baseProfileURL = 'http://profile.tamilmatrimony.com/profiledetail/viewprofile.php?id=',
                phoneNumberURL = 'http://profile.tamilmatrimony.com/assuredcontact/assuredinsertphonerequest.php',
                photoURL = 'http://profile.tamilmatrimony.com/photo/enlargephoto.php';

            function step_capture(image) {
                step++;
                var imagePath = DIR_SCREENSHOTS + '/' + DIR_VIEW + '/' + step + '_' + image + '.png';
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
                    return this.thenClick(selector, function() {
                        this.wait(delay, function() {
                            step_capture.call(this, stepDescription.replace(/ /g, "_"));
                        });
                    });
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
                    getPhotoLinks = false,
                    i = 0;

                this.repeat(keys.length, function() {
                    this.then(function() {
                        var value = '',
                            key = keys[i],
                            selector = profileSelectors[key];

                        switch (key) {
                            case 'is_phone_number':
                                viewPhoneNumber = value =
                                    (this.fetchText(selector).trim() == "You viewed this member's phone number.");
                                break;
                            case 'is_photo':
                                getPhotoLinks = value = this.exists(selector) ? true : false;
                                break;
                            case 'last_login':
                                selector = xPath(selector);
                                value = this.fetchText(selector);
                                value = value.indexOf(':') == -1 ? value : value.split(':')[1].trim();
                                break;
                            case 'mat_id':
                                value = this.fetchText(selector).trim();
                                break;
                            default:
                                selector = xPath(selector);
                                value = this.fetchText(selector).trim();
                                break;
                        }
                        console.log(key, value);
                        profile[key] = value;
                        i++;
                    });
                });

                this.then(function() {
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
                            profile.secondary_phone = this.fetchText('body > div > div > div.hdtxt1 > div');
                            profile.secondary_phone = profile.secondary_phone ? profile.secondary_phone.split(':') : null;
                            profile.secondary_phone = profile.secondary_phone && profile.secondary_phone.length > 0 ? profile.secondary_phone[1].trim() : '';
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

                                this.emit('write_file', {
                                    mat_id: profile.mat_id + 'photos',
                                    page_content: this.getPageContent()
                                });


                                profile.photos = {};
                                profile.photos.thumbnails = this.getElementsAttribute('#gallery > div:nth-child(1) > div.ad-nav.fleft > div.ad-thumbs > ul a img', 'src');
                                profile.photos.full_size = this.getElementsAttribute('#gallery > div:nth-child(1) > div.ad-nav.fleft > div.ad-thumbs > ul a', 'href');
                            });
                        }
                    }
                });

                this.wait(2000, function() {
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

            this.then(function() {
                if (this.exists('body > div > div:nth-child(2) > div:nth-child(4) > a')) {
                    click_link.call(this, {
                        stepDescription: 'Skipping the promotion page',
                        selector: 'body > div > div:nth-child(2) > div:nth-child(4) > a'
                            //'body > center > div.wrapper-max > div > div.paddt10 > div.fright > div > a'
                    });
                } else {
                    console.log('Going to home page!')
                    this.thenOpen('http://profile.tamilmatrimony.com/login/myhome.php?MS=1&gaact=addselfie&gasrc=INTRMDTMH', function(){
                        this.wait(3000, function() {
                            step_capture.call(this, 'homepage');
                        })
                    });
                }
            });

            //---------------------- Shortlisted Profiles

            this.then(function() {
                var urls = [];
                incompleteProfiles.forEach(function(profile, i) {
                    urls.push(profile.url);
                });

                this.each(urls, function(self, link) {
                    var matid = link.split('=')[1].trim();

                    self.thenOpen(link, function() {
                        console.log('Opening the link ' + link);
                        this.echo(this.getTitle());
                        this.emit('write_file', {
                            mat_id: matid,
                            page_content: this.getPageContent()
                        });
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
        //'//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[1]/div[2]/ul/li[1]',

        created_by: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[1]/div[2]/ul/li[3]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.printvpbg.vpbgprint > div.hdtxt11.fleft.paddt10 > ul > li:nth-child(3)',

        last_login: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[3]/div[2]/div[3]/div/div[1]/ul/li[1]/div',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.fleft.mediumtxt1 > div.fright > div.padd5.fright.vp-chatoffline > div > div.fleft > ul > li:nth-child(1) > div', //last_login).text().split(':')[1].trim()

        description: '//*[@id="profilecompletedesc"]',
        //'#profilecompletedesc',

        // Profile
        name: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[1]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(1) > div.fleft.colon.paddl15.width175',

        age: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[3]/div[1]/ul/li[1]/span[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.fleft.mediumtxt1 > div.fleft.paddb10 > ul > li:nth-child(1) > span:nth-child(2)',
        height_feet: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[3]/div[1]/ul/li[1]/span[4]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.fleft.mediumtxt1 > div.fleft.paddb10 > ul > li:nth-child(1) > span:nth-child(4)',
        height_inch: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[3]/div[1]/ul/li[1]/span[5]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div.fleft.mediumtxt1 > div.fleft.paddb10 > ul > li:nth-child(1) > span:nth-child(5)',
        weight: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[10]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(10) > div.fleft.colon.paddl15.width175',

        mother_tongue: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[13]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(13) > div.fleft.colon.paddl15.width175 > span',
        maritial_status: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[16]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(16) > div.fleft.colon.paddl15.width175',

        // Body
        body_type: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[2]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(2) > div.fleft.colon.paddl15',
        complexion: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[5]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(5) > div.fleft.colon.paddl15',
        physical_status: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[8]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(8) > div.fleft.colon.paddl15',
        eating_habit: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[11]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(11) > div.fleft.colon.paddl15',
        drinking_habit: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[14]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(14) > div.fleft.colon.paddl15',
        smoking_habit: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[9]/div[2]/div[2]/div/div[17]/div[2]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(15) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(17) > div.fleft.colon.paddl15',

        religion: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[10]/div[2]/div[2]/div/div[1]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(16) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(1) > div.fleft.colon.paddl15 > span',
        caste: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[10]/div[2]/div[2]/div/div[2]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(16) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(2) > div.fleft.colon.paddl15 > span',

        // location
        country: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[11]/div[2]/div[2]/div/div[1]/div[2]/div',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(1) > div.fleft.colon.paddl15.width175 > div',
        state: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[11]/div[2]/div[2]/div/div[4]/div[2]/div',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(4) > div.fleft.colon.paddl15.width175 > div',
        city: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[11]/div[2]/div[2]/div/div[7]/div[2]/div/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(7) > div.fleft.colon.paddl15.width175 > div > span',
        citizenship: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[11]/div[2]/div[2]/div/div[2]/div[2]/div',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(2) > div.fleft.colon.paddl15 > div',
        resident_status: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[11]/div[2]/div[2]/div/div[5]/div[2]/div',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(18) > div:nth-child(2) > div.fleft.hdtxt > div > div:nth-child(5) > div.fleft.colon.paddl15 > div',

        // Education
        education: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[12]/div[2]/div[2]/div[1]/div[1]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(1) > div.fleft.colon.paddl15.width400 > span',
        education_detail: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[12]/div[2]/div[2]/div[1]/div[2]/div[2]/span[1]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(2) > div.fleft.colon.paddl15.width400 > span > span',
        occupation: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[12]/div[2]/div[2]/div[1]/div[3]/div[2]/span/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(3) > div.fleft.colon.paddl15.width400 > span > span',
        occupation_detail: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[12]/div[2]/div[2]/div[1]/div[4]/div[2]/span[1]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(4) > div.fleft.colon.paddl15.width400 > span > span',
        employed_in: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[12]/div[2]/div[2]/div[1]/div[5]/div[2]/span/span',
        annual_income: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[12]/div[2]/div[2]/div[1]/div[6]/div[2]/span/span[1]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(19) > div:nth-child(2) > div.fleft.hdtxt > div.paddl2.paddt5 > div:nth-child(6) > div.fleft.colon.paddl15.width400 > span > span > span',

        // Family status
        family_status: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[13]/div[2]/div[2]/div[1]/div[7]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(7) > div.fleft.colon.paddl15.width175 > span',
        father_status: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[13]/div[2]/div[2]/div[1]/div[10]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(10) > div.fleft.colon.paddl15.width175 > span',
        mom_status: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[13]/div[2]/div[2]/div[1]/div[11]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div.fleft > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(11) > div.fleft.colon.paddl15 > span',
        brothers: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[13]/div[2]/div[2]/div[1]/div[5]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(5) > div.fleft.colon.paddl15 > span',
        sisters: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[13]/div[2]/div[2]/div[1]/div[8]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.relative > div:nth-child(8) > div.fleft.colon.paddl15 > span',

        //tamil_matrimony_calculation: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div[1]/div[15]/div[2]/div[2]/div',

        about_family: '//*[@id="vpcontent"]/table/tbody/tr/td[1]/div/div[13]/div[2]/div[2]/div[3]/div[2]/span',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(21) > div:nth-child(2) > div.fleft.hdtxt > div.paddt10 > div.txt-justify.lheight18 > span',

        expected_caste: '//*[@id="moredivCaste"]',
        //'//*[@id="vpcontent"]/table/tbody/tr/td[1]/div/div[15]/div[6]/div/div[3]/div[2]/div/div[2]/div[2]/div',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(24) > div:nth-child(5) > div > div:nth-child(3) > div.fleft > div > div:nth-child(2) > div.fleft.colon.paddl20 > div',
        expected_education: '//*[@id="moredivEducation"]',
        //'#moredivEducation',
        expected_occupation: '//*[@id="moredivOccupation"]',
        //'#vpcontent > table > tbody > tr > td:nth-child(1) > div > div:nth-child(24) > div:nth-child(5) > div > div:nth-child(4) > div.fleft > div > div:nth-child(2) > div.fleft.colon.paddl20 > div',

        is_phone_number: '#titleDisp > div.boldtxt.paddb10.ignblkpositive',
        //'//*[@id="titleDisp"]/div[1]',
        is_photo: '#useracticonsimgs > div > a'
            //'//*[@id="useracticonsimgs"]/div[1]/a'
    }
}
