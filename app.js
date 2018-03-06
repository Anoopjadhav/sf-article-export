var express = require('express');
var nforce = require('nforce');
var _ = require('underscore');
const fs = require('fs');
// For synchronous
const Json2csvParser = require('json2csv').Parser;
// const json2csv = require('json2csv').parse;
const path = require('path');
var archiver = require('archiver');
var createHTML = require('create-html');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var oauthURI = require('./routes/oauth.js');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
//app.use('/oauth/_callback', oauthURI);


var oauth, org;

switch (process.env.NODE_ENV) {
    case 'test':
        org = nforce.createConnection({
            clientId: '3MVG9ZL0ppGP5UrAtic.j1Oafh16lEOpEJKP0RZNgl3ZpzwT_rs7jl0j5SZx.D6lvGKxfWWDtJJ8mEbrcwUW.',
            clientSecret: '8637247378348242696',
            // redirectUri: 'http://localhost:3000/oauth/_callback',
            redirectUri: 'https://sf-article-export.herokuapp.com/oauth/_callback',
            //loginUri: 'https://ap6.salesforce.com/services/oauth2/token',
            //apiVersion: 'v27.0', // optional, defaults to current salesforce API version
            environment: 'sandbox', // optional, salesforce 'sandbox' or 'production', production default
            mode: 'multi', // optional, 'single' or 'multi' user mode, multi default
            autoRefresh: true
        });
        break;

    default:
        org = nforce.createConnection({
            clientId: '3MVG9ZL0ppGP5UrAtic.j1Oafh2bm7UDUYfkqfc5UjxpCduNCiq0_B5ooocCE2JQIC7jWxUTlZKJNK273MS.u',
            clientSecret: '5269115371682466388',
            redirectUri: 'http://localhost:3000/oauth/_callback',
            // redirectUri: 'https://sf-article-export.herokuapp.com/oauth/_callback',
            //loginUri: 'https://ap6.salesforce.com/services/oauth2/token',
            //apiVersion: 'v27.0', // optional, defaults to current salesforce API version
            environment: 'sandbox', // optional, salesforce 'sandbox' or 'production', production default
            mode: 'multi', // optional, 'single' or 'multi' user mode, multi default
            autoRefresh: true
        });
}

/*org = nforce.createConnection({
    clientId: '3MVG9ZL0ppGP5UrAtic.j1Oafh2bm7UDUYfkqfc5UjxpCduNCiq0_B5ooocCE2JQIC7jWxUTlZKJNK273MS.u',
    clientSecret: '5269115371682466388',
    // redirectUri: 'http://localhost:3000/oauth/_callback',
    redirectUri: 'https://sf-article-export.herokuapp.com/oauth/_callback',
    //loginUri: 'https://ap6.salesforce.com/services/oauth2/token',
    //apiVersion: 'v27.0', // optional, defaults to current salesforce API version
    environment: 'sandbox', // optional, salesforce 'sandbox' or 'production', production default
    mode: 'multi', // optional, 'single' or 'multi' user mode, multi default
    autoRefresh: true
});
*/
// org.authenticate({ username: username, password: password, securityToken: securityToken }, function(err, resp) {
//     if (!err) {
//         console.log('Access Token: ' + resp.access_token);
//         oauth = resp;
//     } else {
//         console.log('Error: ' + err.message);
//     }
// });
app.get('/auth/sfdc', function(req, res) {
    console.log(process.cwd());
    console.log(org);
    res.redirect(org.getAuthUri());
});

app.get('/download', function(req, res) {
    console.log("send file");
    res.download(process.cwd() + '/dist/target.zip');
})

app.get('/oauth/_callback', function(req, res) {
    org.authenticate({ code: req.query.code }, function(err, resp) {
        if (!err) {
            console.log('Access Token: ' + resp.access_token);
            oauth = resp;
            //res.send(resp.access_token);
            res.redirect('/testDB');
        } else {
            console.log('Error: in _callback ' + err.message);
            res.send(err);
        }
    });
});



var createHTMLFIles = (dataArray, currentIndex, cb, hasFooterContent) => {
    console.log("INSIDE createHTMLFIles");
    console.log(dataArray.length + '--- --- --- ' + currentIndex);
    let writableContent = hasFooterContent ? dataArray[currentIndex].footer_content__c : dataArray[currentIndex].article_content__c;
    let fileName = hasFooterContent ? dataArray[currentIndex].id + '_footer' : dataArray[currentIndex].id;
    let writeStream = fs.createWriteStream(process.cwd() + '/dist/HTML files/' + fileName + '.html');

    writeStream.write(writableContent, 'utf8');

    writeStream.on('finish', () => {
        console.log('wrote all data to file');
        if (dataArray[currentIndex].footer_content__c && !hasFooterContent) {
            createHTMLFIles(dataArray, currentIndex, cb, true);
        } else {
            if (currentIndex < dataArray.length - 1) {
                console.log('file writing');
                currentIndex = currentIndex + 1;
                createHTMLFIles(dataArray, currentIndex, cb, false);
            } else {
                cb(null, true);
            }
        }
    });

    // close the stream
    writeStream.end();

    // fs.writeFileSync('/dist/HTML files/' + dataArray[currentIndex].id + '.html', dataArray[currentIndex].Article_Content__c, 
    //     function(err) {
    //         if (err) {
    //             throw err;
    //             console.log("HTML file creation err");
    //             cb(false, null);

    //         } else {
    //             console.log(dataArray.length + '---- ' + currentIndex);

    //             if (dataArray[currentIndex] < dataArray.length) {
    //                 console.log('file writing');
    //                 currentIndex = currentIndex + 1;
    //                 createHTMLFIles(dataArray, currentIndex, cb);
    //             } else {
    //                 cb(null, true);
    //             }
    //         }
    //         console.log('Saved!');
    //     });



}


var createCSVFile = (dataArray, cb) => {
    //const Json2csvParser = json2csv;
    // json2csvTransform = json2csv.Transform;

    const fields = ['Article_Content__c', 'Footer_Content__c', 'Sequence__c', 'Title', 'datacategorygroup.Life_Event'];
    const opts = { fields };

    try {
        // const csv = json2csv(dataArray, opts);
        // console.log("csv created");
        const parser = new Json2csvParser(opts);
        const csv = parser.parse(dataArray);

        console.log("CSV File is created");

        let writeStream = fs.createWriteStream(process.cwd() + '/dist/Article_details.csv');

        writeStream.write(csv, 'utf8');

        writeStream.on('finish', () => {
            console.log('wrote all CSV data to file');
            cb(null, true);
        });

        writeStream.end();
    } catch (err) {
        console.error(err);
    }

}

var prepareView = (articleArray, dataCatArray, response) => {
    console.log("Inside prepareView");


    var returnData = _.union(
        _.map(articleArray, function(obj1) {
            var same = _.find(dataCatArray, function(obj2) {
                return obj1["id"] === obj2["parentid"];
            });
            return same ? _.extend(obj1, same) : obj1;
        })
        // _.reject(dataCatArray, function(obj2) {
        //     return _.find(articleArray, function(obj1) {
        //         return obj2["id"] === obj1["parentid"];
        //     });
        // })
    );
    var csvJSON = [];
    for (let i = 0; i < returnData.length; i++) {
        csvJSON.push({
            "Article_Content__c": 'HTML files/' + returnData[i].id + '.html',
            "Footer_Content__c": (returnData[i].footer_content__c) ? 'HTML files/' + returnData[i].id + '_footer.html' : "",
            "Sequence__c": 1,
            "Title": returnData[i].title,
            "datacategorygroup.Life_Event": returnData[i].datacategoryname
        })
    }
    console.log(csvJSON.length);
    //console.log(returnData[0]);
    console.log(">>>>>>>> Calling createHTMLFIles");

    createHTMLFIles(returnData, 0, (err, success) => {
        if (err) {
            console.log("File creation cb :::" + err);
        } else {


            console.log("File Created");

            // Prepare CSV File
            createCSVFile(csvJSON, (err, resData) => {
                if (err) {
                    console.log("CSV Creation err");
                } else {
                    var output = fs.createWriteStream(process.cwd() + '/dist/target.zip');
                    var archive = archiver('zip');


                    output.on('close', function() {
                        console.log(archive.pointer() + ' total bytes');
                        console.log('archiver has been finalized and the output file descriptor has closed.');
                        //response.json({ "returnData": returnData });
                        response.download(process.cwd() + '/dist/target.zip');
                        //response.send(process.cwd() + '/dist/target.zip');

                    });

                    // output.on('end', function() {
                    //     console.log('Data has been drained');
                    //     response.json({ "returnData": returnData });
                    // });
                    archive.on('error', function(err) {
                        throw err;
                    });

                    archive.pipe(output);
                    archive.directory('dist/', false);
                    archive.finalize();
                    // response.json({ "returnData": returnData });
                }
            })


            // 
        }

    }, false);

    // mkDirByPathSync('dist/HTML files/', { isRelativeToScript: true }, function(err, success) {
    //     if (err) {
    //         console.log("folder created creation err");
    //     } else {
    //         console.log("folder created");
    //         createHTMLFIles(returnData, 0, (err, success) => {
    //             if (err) {
    //                 console.log("File creation cb :::" + err);
    //             } else {
    //                 console.log("File Created");
    //             }

    //         });
    //     }
    // })



}

app.get('/testDB', function(req, response) {
    console.log('old token: ' + oauth.access_token);

    var q = "SELECT Id, Title, Article_Content__c,Footer_Content__c FROM FAQ__kav where PublishStatus = 'Online' AND Language = 'en_US'";
    // var unique = {};
    // var distinct = [];
    var articleArray = [],
        dataCatArray = [];
    org.query({ query: q, oauth: oauth }, function(err, res) {
        if (err) {
            console.error(err);
            response.send(err);
        } else {
            //articleArray = res.records;


            array = res.records;
            console.log("res length :: " + array.length);
            // for (let i = 0; i< array.length; i++) {
            //  articleArray.push()
            // }
            //console.log(array);

            // console.log(array.length);
            // console.log(array[1]);
            // console.log(array[1].Record);
            // // console.log(array[1].attributes);

            // console.log("sad asd as dasd");

            // console.log(array[1]._fields.parentid);
            // var unique = {};
            // var distinct = [];

            // for (var i in array) {
            //     if (typeof(unique[array[i]._fields.parentid]) == "undefined") {
            //         distinct.push(array[i]._fields.parentid);
            //     }
            //     unique[array[i].parentid] = 0;
            // }

            //console.log("distinct" + distinct.length);
            var getCatQuery;
            if (array.length) {
                getCatQuery = "SELECT ParentId, DataCategoryGroupName,DataCategoryName FROM FAQ__DataCategorySelection WHERE ParentId In (";
                for (let i = 0; i < array.length; i++) {
                    articleArray.push(array[i]._fields);
                    if (i == (array.length - 1)) {
                        console.log("last elem:: " + i + '  --  ' + array[i]._fields.id);

                        getCatQuery += "'" + array[i]._fields.id + "'";
                    } else {
                        getCatQuery += "'" + array[i]._fields.id + "',";
                    }


                }
                getCatQuery += ')';
            }

            org.query({ query: getCatQuery, oauth: oauth }, function(err, res) {
                if (err) {
                    console.error(err);
                    response.send(err);
                } else {
                    var resArray = res.records;

                    for (let i = 0; i < resArray.length; i++) {
                        dataCatArray.push(resArray[i]._fields);
                    }
                    prepareView(articleArray, dataCatArray, response);
                }
            });
            console.log(getCatQuery);

        }
    });

})
// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});



// var org = nforce.createConnection({
//     clientId: '3MVG9ZL0ppGP5UrAtic.j1Oafh2bm7UDUYfkqfc5UjxpCduNCiq0_B5ooocCE2JQIC7jWxUTlZKJNK273MS.u',
//     clientSecret: '5269115371682466388',
//     redirectUri: 'http://localhost:3000/oauth/_callback',
//     loginUri: 'https://ap6.salesforce.com/services/oauth2/token',
//     //apiVersion: 'v27.0', // optional, defaults to current salesforce API version
//     //environment: 'production', // optional, salesforce 'sandbox' or 'production', production default
//     mode: 'multi' // optional, 'single' or 'multi' user mode, multi default
// });

// var oauth;
// org.authenticate({ username: 'aritrikdas@gmail.com', password: 'Barn!ta11sf73VAvZb8mdr9p7YGA1AVl8ROP' }, function(err, resp) {
//     // store the oauth object for this user
//     if (!err) oauth = resp;
//     console.log(resp);


//     if (err) {
//         console.log(err);
//     }
// });





module.exports = app;



// var mkDirByPathSync = (targetDir, opts, cb) => {
//     console.log("Inside mkDirByPathSync");
//     const isRelativeToScript = opts && opts.isRelativeToScript;
//     const sep = path.sep;
//     const initDir = path.isAbsolute(targetDir) ? sep : '';
//     const baseDir = isRelativeToScript ? __dirname : '.';

//     targetDir.split(sep).reduce((parentDir, childDir) => {
//         const curDir = path.resolve(baseDir, parentDir, childDir);
//         try {
//             fs.mkdirSync(curDir);
//             console.log(`Directory ${curDir} created!`);
//             cb(null, curDir);
//         } catch (err) {
//             if (err.code !== 'EEXIST') {
//                 throw err;
//             }

//             console.log(`Directory ${curDir} already exists!`);
//         }

//         return curDir;
//     }, initDir);
// }
