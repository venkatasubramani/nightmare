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

            console.log(queryParams);
            var count = 1,
                randId = queryParams['randid'],
                cookies = window.cookies;

            this.repeat(window.pageCount, function() {

                /*read_profile_cards.call(this);
        
                        this.wait(6000, function() {
                            count++;
                            next_page.call(this, count);
                        });*/

                var epochTime = this.evaluate(function() {
                    return (new Date().valueOf());
                });

                var url = 'http://profile.tamilmatrimony.com/matchsummary/fetchresultprofiles.php?randid=' + randId + '&time=' + epochTime,
                    request = {
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
                    };

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
        });