/*this.repeat(window.pageCount, function() {
                    page = this.evaluate(function() {
                        return $('#pagination .active:first').text();
                    });
        
                    console.log(count, ' ', page);
        
                    if (count == page) {
                        this.then(function() {
                            count++;
                            this.wait(2000, function() {
                                this.emit('next_page', count);
                            });
                        });
                    } else {
                        // make call the previous page and get data
                        //GENDER=F&STAGE=20&ENDAGE=28&STHEIGHT=13&ENDHEIGHT=19&MARITAL_STATUS=1&PHYSICAL_STATUS=0&MOTHERTONGUERIGHT=48~47&RELIGION=1&MANGLIK=0&CASTERIGHT=0&CITIZENSHIP=0&COUNTRYRIGHT=98~222&RESIDENTSTATUS=&GOTHRARIGHT=0&STANNUALINCOME=0&ENDANNUALINCOME=0&OCCUPATIONRIGHT=0&SUBCASTERIGHT=0&HAVECHILDREN=0&DRINKING=1&SMOKING=1&RESIDINGCITYRIGHT=&STARRIGHT=0&req=1&extended=&facetstr=&LATEST=&reqtype=1&RESIDINGSTATERIGHT=&EDUCATIONRIGHT=2~17~18~15~16~1&EDUCATIONRIGHTID=&EDUCATIONFACETID=&EDUCATIONMOREID=&O=0&debug=&PHOTO_OPT=&HOROSCOPE_OPT=&EATINGHABITS=0&ppage=&BYWHOM=&BODYTYPE=&COMPLEXION=&OCCUPATIONCATEGORY=&ACTIVE=&SEARCH_TYPE=MS&INCOMENOTSPECIFIED=&IncludeOtherReligionAlso=0&MSCURPAGE=page_MS_110_1346541977&SOFTTAGS=&DISPLAY_FORMAT=&FROMMYHOME=&glang=&showclearall=&PhotoAvail=&daterange=&ts=&wherefrom=frmpaging&facet=N&STLIMIT=21&run=a398637s&uniqid=
                        console.log('use cookies: '); // + JSON.stringify(cookies));
                    }
                });*/


    /*var elasticRequest = {
        method: 'POST',
        data: "GENDER=F&STAGE=20&ENDAGE=28&STHEIGHT=13&ENDHEIGHT=19&MARITAL_STATUS=1&PHYSICAL_STATUS=0&MOTHERTONGUERIGHT=48~47&RELIGION=1&MANGLIK=0&CASTERIGHT=0&CITIZENSHIP=0&COUNTRYRIGHT=98~222&RESIDENTSTATUS=&GOTHRARIGHT=0&STANNUALINCOME=0&ENDANNUALINCOME=0&OCCUPATIONRIGHT=0&SUBCASTERIGHT=0&HAVECHILDREN=0&DRINKING=1&SMOKING=1&RESIDINGCITYRIGHT=&STARRIGHT=0&req=1&extended=&facetstr=&LATEST=&reqtype=1&RESIDINGSTATERIGHT=&EDUCATIONRIGHT=2~17~18~15~16~1&EDUCATIONRIGHTID=&EDUCATIONFACETID=&EDUCATIONMOREID=&O=0&debug=&PHOTO_OPT=&HOROSCOPE_OPT=&EATINGHABITS=0&ppage=&BYWHOM=&BODYTYPE=&COMPLEXION=&OCCUPATIONCATEGORY=&ACTIVE=&SEARCH_TYPE=MS&INCOMENOTSPECIFIED=&IncludeOtherReligionAlso=0&MSCURPAGE=page_MS_110_631853591&SOFTTAGS=&DISPLAY_FORMAT=&FROMMYHOME=&glang=&showclearall=&PhotoAvail=&daterange=&ts=&wherefrom=frmpaging&facet=N&STLIMIT=11&run=a618228s&uniqid=",
        headers: {
            'Accept-Encoding': 'gzip, deflate'
            'Accept-Language': 'en-US,en;q=0.8'
            'Connection': 'keep-alive'
            'Content-Length': '850'
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'Cookie': window.cookies
        }
    }

    this.thenOpen( << YOUR URL >> , elasticRequest, function(response) {
        //dump response header
        require(utils).dump(response);

        //echo response body
        this.echo(this.page.content);

        //echo response body with no tags added (useful for JSON)
        this.echo(this.page.plainText);
    });*/




    /*this.then(function() {
        var Count = 0;
        console.log(window.pageCount);

        this.repeat(window.pageCount, function() {
            console.log('!!' + window.pageCount);

            this.evaluate(function(i) {
                $('select#month_select').get(0).selectedIndex = i;
                // Refresh the page using one of the two ways below
                $('#month_selection_form').submit(); // If the select is within a form
                $('select#month_select').change(); // If the page has a trigger on the select
                return true;
            }, {
                i: Count
            });

            this.then(function() {
                Count = Count + 1;
                this.emit('next_page', Count);
            });
        });
    });*/


    /*spooky.then(function() {
        var Count = 0;

        this.repeat(window.pageCount, function() {

            this.evaluate(function(i) {
                $('select#month_select').get(0).selectedIndex = i;
                // Refresh the page using one of the two ways below
                $('#month_selection_form').submit(); // If the select is within a form
                $('select#month_select').change(); // If the page has a trigger on the select
                return true;
            }, {
                i: Count
            });

            this.then(function() {
                Count = Count + 1;
                this.emit('next_page', Count);
            });
        });
    });*/


    /*this.then(function() {
        this.evaluate(function() {
            // Get the page count
            var pageCount = $('#pagination > li:nth-child(7)').text(),
                i = 0;

            try {
                pageCount = parseInt(pageCount);
            } catch (e) {
                console.log('Coluld not find the page count. :(');
                return null;
            }

            alert('Page count parsed to int: ' + pageCount);

        });
        if (pageCount > 1) {
            for (i = 1; i <= pageCount; i++) {
                //Read the profile cards
                this.then([{
                    i: i
                }, function() {
                    this.emit('read_profile_cards', i);
                }]);

                // Navigate the page
                this.then([{
                    i: i
                }, function() {
                    this.emit('next_page', i + 1);
                }]);
            }
        }
    });*/