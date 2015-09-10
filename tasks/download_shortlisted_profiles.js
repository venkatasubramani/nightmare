var Spooky = require('spooky'),
    //queryString = require('querystring'),
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
    DIR_VIEW = 'download_shortlisted_profiles',
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

/*spooky.on('parse_query_string', function(URL) {
    if (URL.indexOf('?') >= 0) {
        var oQueryParams = queryString.parse(URL.replace(/^.*\?/, ''));
    }
    console.log(oQueryParams);
    queryParams = oQueryParams;
});*/

spooky.on('read_multiple_profiles', function(profiles) {
    console.log(profiles);
});

// ---------- Main Event

spooky.on('start_tamil_matrimony', function() {
console.log('1');
    this.then([{
        URL: URL,
        DIR_VIEW: DIR_VIEW,
        DIR_LOGS: DIR_LOGS,
        step: step,
        queryParams: queryParams
    }, function() {

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

        function next_page(pageNumber) {
            var page = (pageNumber == 2 ? 8 : 9),
                params = {
                    stepDescription: 'Navigating to next page (' + pageNumber + ')',
                    selector: '#pagination > li:nth-child(' + page + ') > a',
                    delay: 30000,
                    timeout: 15000
                };

            return click_link.call(this, params);
        }

        function read_profile_cards() {
            var profiles = [],
                profileBaseURL = 'http://profile.tamilmatrimony.com/profiledetail/viewprofile.php?id=';

            this.evaluate(function() {
                var cards = $('div.paddl10.paddr10.paddt15.paddb10.mediumtxt');
                this.echo(cards.size() + ' profiles found');

                cards.each(function(count, card) {
                    var profile = {};

                    var idLink = $(card).find('div.fleft > div > span:nth-child(3) > a');
                    profile.id = idLink.text();
                    profile.url = profileBaseURL + profile.id;

                    profiles.push(profile);
                });

                this.emit('read_multiple_profiles', profiles);
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
                this.thenOpen('http://profile.tamilmatrimony.com/login/myhome.php?MS=1&gaact=addselfie&gasrc=INTRMDTMH');
                step_capture.call(this, 'homepage');
            }
        });

        //---------------------- Shortlisted Profiles

        click_link.call(this, {
            stepDescription: 'Navigate to Shortlisted profiles page',
            selector: '#fixed-div_search > div.fleft.paddl20 > a:nth-child(3)'
        });

        this.then(function() {
            var shortlistedHref = this.getElementAttribute('#leftpanellinkscontainer > div:nth-child(1) > div.paddt10.paddb5.fright.shortlist_download > a', "href");
            console.log(shortlistedHref);
            this.download(shortlistedHref, 'assets/shortlistedProfiles.xls');
        });
    }]);
});
