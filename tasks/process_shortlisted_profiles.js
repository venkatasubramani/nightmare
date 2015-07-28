var Excel = require("exceljs");
var Datastore = require('nedb');


var workbook = new Excel.Workbook();

var db = new Datastore({
    filename: 'db/profiles'
});


db.loadDatabase(function(err) {
    if (err) {
        console.log('Could not load db');
    }

    db.ensureIndex({
        fieldName: 'mat_id',
        unique: true
    }, function(err) {

        if (err) {
            console.log('Something went wronk when ensuging Index');
        }

        workbook.xlsx.readFile('assets/?.xlsx')
            .then(function() {
                workbook.eachSheet(function(worksheet, sheetId) {
                    var idCol = worksheet.getColumn("A");
                    idCol.eachCell({
                        includeEmpty: false
                    }, function(cell, rowNumber) {

                        var cellValue = cell.value,
                            profile = {};
                        profile.mat_id = cellValue.text;
                        profile.url = cellValue.hyperlink;
                        profile.profile_completed = false;
                        profile.rejected = false;

                        if (profile.mat_id) {
                            db.insert(profile, function(err, newRecords) {
                                if (err) {
                                    console.log(profile.mat_id + ' already exists.')
                                } else {
                                    console.log('Profile ' + profile.mat_id + ' got inserted');
                                }
                            });
                        }
                    });
                });
            });
    });

});
