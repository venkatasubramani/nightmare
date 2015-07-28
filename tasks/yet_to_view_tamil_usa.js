var Spooky = require('spooky'),
    queryString = require('querystring'),
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


var DIR_LOGS = 'logs',
    DIR_VIEW = 'yet_to_view_tamil_usa',
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

spooky.on('parse_query_string', function(URL) {
    if (URL.indexOf('?') >= 0) {
        var oQueryParams = queryString.parse(URL.replace(/^.*\?/, ''));
    }
    console.log(oQueryParams);
    queryParams = oQueryParams;
});

spooky.on('read_multiple_profiles', function(profiles) {
    console.log(profiles);
});

// ---------- Main Event

spooky.on('start_tamil_matrimony', function() {
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
            stepDescription: 'Clicking login button..',
            selector: '#close > center > div.hpmainwraper > div.hpmainwraper.pos-relative > div.innerwrapper.pos-relative.paddt10 > div.fright > form > div.fleft.paddl8 > input.hp-button.small'
        });

        click_link.call(this, {
            stepDescription: 'Skipping the promotion page..',
            selector: 'body > div > div:nth-child(2) > div:nth-child(4) > a'
        });


        //---------------------- Yet to view page

        click_link.call(this, {
            stepDescription: 'navigating to yet to be viewed...',
            selector: '#yettobeviewedmenuid'
        });

        // Apply filters

        click_link.call(this, {
            stepDescription: 'applying tamil language filter...',
            selector: '#Mother_tongue > dl > dd:nth-child(3) > a'
        });

        click_link.call(this, {
            stepDescription: 'applying usa filter...',
            selector: '#Country_living_in > dl > dd:nth-child(3) > a'
        });

        // Find out query string
        /*this.then(function() {
            this.emit('parse_query_string', this.getCurrentUrl());
        });*/

        // Read parameters for main processing
        this.then(function() {
            this.waitForSelector('#pagination', function pass() {
                window.cookies = this.evaluate(function() {
                    return document.cookie;
                });

                window.pageCount = this.evaluate(function() {
                    var $pageCount = $('#pagination > li:nth-child(7) > span:first').text();
                    return $pageCount;
                });

            }, function fail() {

            });
        });



        this.then(function() {
            var count = 1,
                randId = queryParams['randid'],
                cookies = window.cookies;

            /*this.each(this.pageNumbersArray, function(self, pageNumber) {
                this.waitFor(function check() {
                    return this.goToPage(pageNumber);
                }, function then() {
                    this.echo("Scraping page " + pageNumber);
                    this.scrapePage();
                });
            });*/

            this.repeat(window.pageCount, function() {

                /*read_profile_cards.call(this);

                this.wait(count * 1000, function() {
                    count++;
                    next_page.call(this, count);
                });*/

                this.waitFor(function check() {
                    count++;
                    return next_page.call(this, count);;
                }, function then() {
                    this.echo("Scraping page " + count);
                    read_profile_cards.call(this);
                });

            });
        });
    }]);
});
