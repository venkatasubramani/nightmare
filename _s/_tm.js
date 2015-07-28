exports.tm = function() {
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
                }
            }
        };


    var DIR_LOGS = 'logs',
        DIR_VIEW = '',
        URL = 'http://www.tamilmatrimony.com/',
        step = 0;


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

    spooky.on('step_capture', function(imageName) {
        step++;

        this.then([{
            DIR_LOGS: DIR_LOGS,
            DIR_VIEW: DIR_VIEW,
            step: step,
            image: imageName
        }, function() {
            this.capture(DIR_LOGS + '/' + DIR_VIEW + '/' + step + '_' + image + '.png');
        }]);
    });

    spooky.on('click_link', function(config) {
        var delay = config.delay ? config.delay : 3000;

        this.then([{
                stepDescription: config.stepDescription,
                selector: config.selector,
                step: step,
                delay: delay
            },
            function() {
                this.waitForSelector(selector, function pass() {
                    console.log(step + ': ' + stepDescription);

                    console.log('Clicking the link - ' + this.fetchText(selector));
                    this.click(selector, 'a');
                    console.log('Saving screen capture to ' + stepDescription.replace(/ /g, "_"));
                }, function fail() {
                    console.error('Failed: ' + stepDescription);
                }, delay);

                //this.wait(delay, function() {
                    this.emit('step_capture', stepDescription.replace(/ /g, "_"));
                //});
            }
        ]);
    });

    spooky.on('login', function(view) {
        DIR_VIEW = view;

        this.then([{
            URL: URL,
            view: view
        }, function() {
            console.log('Loaded ' + URL);

            this.fillSelectors('form[name=Login]', {
                'input#ID': 'e.kalyani.vellaichamy@gmail.com'
            });

            this.sendKeys('#TEMPPASSWD1', 'matri625020');

            console.log('Login form filled..');
            this.emit('step_capture', 'formfilled');


            this.then(function() {
                var params = {
                    stepDescription: 'Clicking login button..',
                    selector: '#close > center > div.hpmainwraper > div.hpmainwraper.pos-relative > div.innerwrapper.pos-relative.paddt10 > div.fright > form > div.fleft.paddl8 > input.hp-button.small'
                };
                this.emit('click_link', params);
            });


            this.then(function() {
                var params = {
                    stepDescription: 'Skipping the promotion page..',
                    selector: 'body > div > div:nth-child(2) > div:nth-child(4) > a'
                };
                this.emit('click_link', params);
            });

            this.then(function() {
                this.emit(view);
            });

        }]);
    });

    return spooky;
}();
