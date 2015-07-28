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
    //var cookies = null;

    this.then([{
        queryParams: queryParams
    }, function() {
        var params = {
            stepDescription: 'navigating to yet to be viewed...',
            selector: '#yettobeviewedmenuid'
        };
        this.emit('click_link', params);

        this.then(function() {
            this.emit('apply_filters');
        });

        this.then(function() {
            this.emit('parse_query_string', this.getCurrentUrl());
        });

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


        this.then(function() {
            var count = 1,
                page = 1,
                randId = queryParams['randid'] ? queryParams['randid'] : null,
                cookies = window.cookies;

            if (randId) {
                this.repeat(window.pageCount, function() {
                    var epochTime = this.evaluate(function() {
                        return (new Date().valueOf());
                    });

                    var url = 'http://profile.tamilmatrimony.com/matchsummary/fetchresultprofiles.php?randid=' + randId + '&time=' + epochTime;
                    /*request = {
                        'method': 'POST',
                        'data': "GENDER=F&STAGE=20&ENDAGE=28&STHEIGHT=13&ENDHEIGHT=19&MARITAL_STATUS=1&PHYSICAL_STATUS=0&MOTHERTONGUERIGHT=48~47&RELIGION=1&MANGLIK=0&CASTERIGHT=0&CITIZENSHIP=0&COUNTRYRIGHT=98~222&RESIDENTSTATUS=&GOTHRARIGHT=0&STANNUALINCOME=0&ENDANNUALINCOME=0&OCCUPATIONRIGHT=0&SUBCASTERIGHT=0&HAVECHILDREN=0&DRINKING=1&SMOKING=1&RESIDINGCITYRIGHT=&STARRIGHT=0&req=1&extended=&facetstr=&LATEST=&reqtype=1&RESIDINGSTATERIGHT=&EDUCATIONRIGHT=2~17~18~15~16~1&EDUCATIONRIGHTID=&EDUCATIONFACETID=&EDUCATIONMOREID=&O=0&debug=&PHOTO_OPT=&HOROSCOPE_OPT=&EATINGHABITS=0&ppage=&BYWHOM=&BODYTYPE=&COMPLEXION=&OCCUPATIONCATEGORY=&ACTIVE=&SEARCH_TYPE=MS&INCOMENOTSPECIFIED=&IncludeOtherReligionAlso=0&MSCURPAGE=page_MS_110_631853591&SOFTTAGS=&DISPLAY_FORMAT=&FROMMYHOME=&glang=&showclearall=&PhotoAvail=&daterange=&ts=&wherefrom=frmpaging&facet=N&STLIMIT=11&run=a618228s&uniqid=",
                        'headers': {
                            'Accept-Encoding': 'gzip, deflate',
                            'Accept-Language': 'en-US,en;q=0.8',
                            'Connection': 'keep-alive',
                            'Content-Length': '850',
                            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                            'Cookie': cookies
                        }
                    };*/

                    console.log(url);

                    /*this.thenOpen(url, request, function(response) {
                        //dump response header
                        require(utils).dump(response);

                        //echo response body
                        this.echo(this.page.content);

                        //echo response body with no tags added (useful for JSON)
                        this.echo(this.page.plainText);
                    });*/
                });
            } else {
                console.log('wrong seq');
            }
        });
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
    this.then(function() {
        var params = {
            stepDescription: 'applying tamil language filter...',
            selector: '#Mother_tongue > dl > dd:nth-child(3) > a'
        };
        this.emit('click_link', params);
    });

    this.then(function() {
        var params = {
            stepDescription: 'applying usa filter...',
            selector: '#Country_living_in > dl > dd:nth-child(3) > a'
        };
        this.emit('click_link', params);
    });
});

spooky.on('parse_query_string', function(URL) {
    if (URL.indexOf('?') >= 0) {
        var oQueryParams = queryString.parse(URL.replace(/^.*\?/, ''));
    }
    console.log(oQueryParams);
    queryParams = oQueryParams;
});
