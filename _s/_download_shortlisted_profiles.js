var casper = require('casper'),
    view = 'shortlisted_profiles';

casper = require('./login').login(casper, view);
 
casper.waitForSelector('#fixed-div_search > div.fleft.paddl20 > a:nth-child(3)', function pass() {
    console.log(casper.fetchText('#fixed-div_search > div.fleft.paddl20 > a:nth-child(3)'));
    this.click('#fixed-div_search > div.fleft.paddl20 > a:nth-child(3)', 'a');
}, function fail() {
    console.error('Error: Could not find shortlisted profile link');
});

casper.wait(3000, function() {
    casper.step_capture('shortlistedProfilePage.png');
});

casper.then(function() {
    var shortlistedHref = casper.getElementAttribute('#leftpanellinkscontainer > div:nth-child(1) > div.paddt10.paddb5.fright.shortlist_download > a', "href");
    console.log(shortlistedHref);
    casper.download(shortlistedHref, 'assets/shortlistedProfiles.xls');
});


// Parse the shortlisted profile excel sheet and put entry in the db

casper.run();
