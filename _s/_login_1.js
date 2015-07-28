var DIR_LOGS = 'logs',
    step = 0,
    x = null;

exports.login = function(casper, view) {
    DIR_VIEW = view;
    x = casper.selectXPath;
    casper = casper.create();
    casper.step_capture = step_capture;
    casper.click_link = click_link;

    casper.userAgent('Chrome/43.0.2357.134');

    casper.start('http://www.tamilmatrimony.com/');

    casper.then(function() {
        console.log('Login page loaded..');

        this.fillSelectors('form[name=Login]', {
            'input#ID': 'e.kalyani.vellaichamy@gmail.com'
        });

        this.sendKeys('#TEMPPASSWD1', 'matri625020');

        console.log('Login form filled..');
        casper.step_capture('formfilled.png');
    });

    casper.thenClick(x('//*[@id="close"]/center/div[2]/div[1]/div[1]/div[3]/form/div[2]/input[2]'), function() {
        console.log('logging in page');
    });

    casper.wait(3000, function() {
        console.log('Post login page loaded..');
        casper.step_capture('afterlogin.png');
    });

    casper.waitForSelector(x('/html/body/div/div[2]/div[4]/a'), function pass() {
        console.log('showing promotion page... skipping it');
        casper.click(x('/html/body/div/div[2]/div[4]/a'));
    }, function fail() {
        console.log('no promotion');
    });

    casper.wait(3000, function() {
        console.log('Home screen loaded..');
        casper.step_capture('homescreen.png');
    });

    return casper;
}

function step_capture(image) {
    step++;
    this.capture(DIR_LOGS + '/' + DIR_VIEW + '/' + step + '_' + image);
}

function click_link(config) {
    var stepDescription = config.stepDescription,
        selector = config.selector,
        casper = this,
        isCss = config.isCss;

    if (!isCss) {
        selector = x(selector);
    }

    casper.waitForSelector(selector, function pass() {
        console.log(stepDescription);
        console.log(casper.fetchText(selector));
        this.click(selector, 'a');
    }, function fail() {
        console.error('Failed: ' + stepDescription);
    });

    casper.wait(3000, function() {
        casper.step_capture(stepDescription.replace(/ /g, "_") + '.png');
    });
}
