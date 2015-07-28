var spooky = require('./tm').tm,
    queryString = require('querystring'),
    VIEW = 'yet_to_view_tamil_usa',
    queryParams = {};

spooky.on('start_tamil_matrimony', function() {
    this.then([{
        view: VIEW
    }, function() {
        this.emit('login', view);
    }]);
});

spooky.on(VIEW, function() {

    this.then(function() {
        var params = {
            stepDescription: 'navigating to yet to be viewed...',
            selector: '#yettobeviewedmenuid'
        };
        this.emit('click_link', params);
    });

    // Apply Filters

    this.then(function() {
        var params = {
            stepDescription: 'applying tamil language filter...',
            selector: '#Mother_tongue > dl > dd:nth-child(3) > a'
        };
        this.emit('click_link', params);
    });

    this.then(function() {
        this.emit('parse_query_string', this.getCurrentUrl());
    });

    this.then(function() {
        var params = {
            stepDescription: 'applying usa filter...',
            selector: '#Country_living_in > dl > dd:nth-child(3) > a'
        };
        this.emit('click_link', params);
    });

    this.then([{
        queryParams: queryParams
    }, function() {
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

        console.log(queryParams);
    }]);
});

spooky.on('read_profile_cards', function(pageNumber) {
    this.then([{
        pageNumber: pageNumber
    }, function() {
        console.log('going to read profile cards');
    }]);
});

spooky.on('next_page', function(pageNumber) {
    this.then([{
        pageNumber: pageNumber
    }, function() {
        var page = (pageNumber == 2 ? 8 : 9),
            params = {
                stepDescription: 'Navigating to next page (' + pageNumber + ')',
                selector: '#pagination > li:nth-child(' + page + ') > a',
                delay: 9000
            };
        this.emit('click_link', params);
    }]);
});

spooky.on('apply_filters', function() {

});

spooky.on('parse_query_string', function(URL) {
    if (URL.indexOf('?') >= 0) {
        var oQueryParams = queryString.parse(URL.replace(/^.*\?/, ''));
    }
    console.log(oQueryParams);
    queryParams = oQueryParams;
});
