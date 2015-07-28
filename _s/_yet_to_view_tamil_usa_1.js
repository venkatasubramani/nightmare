var casper = require('casper'),
    x = casper.selectXPath,
    view = 'yet_to_view_tamil_usa',
    stepDescription = '',
    selector = '';

casper = require('./login').login(casper, view);

casper.click_link({
    stepDescription: 'navigating to yet to be viewed',
    selector: '#yettobeviewedmenuid',
    isCss: true
});

casper.click_link({
    stepDescription: 'applying tamil language filter',
    selector: '#Mother_tongue > dl > dd:nth-child(3) > a',
    isCss: true
});

casper.click_link({
    stepDescription: 'applying usa filter',
    selector: '#Country_living_in > dl > dd:nth-child(3) > a',
    isCss: true
});

casper.run();
