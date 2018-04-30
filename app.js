var express = require('express');
var nforce = require('nforce');
var _ = require('underscore');
var session = require('express-session');
const fs = require('fs');
const fsExt = require('fs-extra');
// For synchronous
const Json2csvParser = require('json2csv').Parser;
// const json2csv = require('json2csv').parse;
const path = require('path');
const https = require('https');
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
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'hhiiiiisssshhhhhhh',
    resave: false,
    saveUninitialized: true,
}));

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
            apiVersion: 'v41.0', // optional, defaults to current salesforce API version
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
app.get('/test', (req, res) => {
    org.getSObjects({
        oauth: req.session.oauth
    }, function (err, allObj) {
        if (err) {
            res.send("Err while fetching obj list");

        } else {
            res.json(allObj);
        }
    })
    //res.json({ "oauth": oauth, "express-session": req.session.oauth });
});
app.get('/auth/sfdc', function (req, res) {
    // console.log(process.cwd());
    //console.log(org);

    // Clean directory
    fsExt.emptyDirSync(process.cwd() + '/dist/HTML files');
    fsExt.ensureDirSync(process.cwd() + '/dist/HTML files');
    //res.send("done");
    res.redirect(org.getAuthUri());
});

app.get('/download', function (req, res) {
    console.log("ENT ERR! Permisson to access taarget.zip not granted. Provide folder permission 777.");
    //res.send("ENT ERR! Permisson to access taarget.zip not granted. Provide folder permission 777.");
    // response.download(process.cwd() + '/dist/target.zip');
    res.download(process.cwd() + '/dist/target.zip');
});

app.get('/oauth/_callback', function (req, res) {
    org.authenticate({
        code: req.query.code
    }, function (err, resp) {
        if (!err) {
            console.log('Access Token: ' + resp.access_token);
            req.session.oauth = resp;
            oauth = resp;
            //res.send(resp.access_token);
            //res.redirect('/test');
            res.redirect('/testDB');
        } else {
            console.log('Error: in _callback ' + err.message);
            res.send(err);
        }
    });
});



/*
var createHTMLFIles = (dataArray, currentIndex, cb, hasFooterContent) => {
    // console.log("INSIDE createHTMLFIles");
     //console.log(dataArray.length + '--- --- --- ' + currentIndex);
     let writableContent = hasFooterContent ? dataArray[currentIndex].footer_content__c : dataArray[currentIndex].article_content__c;
     let fileName = hasFooterContent ? dataArray[currentIndex].id + '_footer' : dataArray[currentIndex].id;
     let writeStream = fs.createWriteStream(process.cwd() + '/dist/HTML files/' + fileName + '.html');
 
     let isMasterLanguage= (dataArray[currentIndex].ismasterlanguage == 1) ? true : false;
     let dir = process.cwd() + '/dist/HTML files/';
     let language = dataArray[currentIndex].language;
     let fileName = dataArray[currentIndex].id;
     let filePath = dir + fileName;
     
 
     writeStream.write(writableContent, 'utf8');
 
     writeStream.on('finish', () => {
 
         if (dataArray[currentIndex].footer_content__c && !hasFooterContent) {
             //Article has footer content
             createHTMLFIles(dataArray, currentIndex, cb, true);
         } else {
             //proceed to next article
             if (currentIndex < dataArray.length - 1) {
                 currentIndex = currentIndex + 1;
                 createHTMLFIles(dataArray, currentIndex, cb, false);
             } else {
                 cb(null, true);
             }
         }
     });
 
     // close the stream
     writeStream.end();
}*/

var createHTMLFIles = (dataArray, currentIndex, cb) => {
    try {

        dataArray.forEach(function (currentValue, index, dataArray) {

            var bFooterContent = (currentValue.footer_content__c == '' || currentValue.footer_content__c == undefined) ? false : true;
            var bArticleContent = (currentValue.article_content__c == '' || currentValue.article_content__c == undefined) ? false : true;
            var isMasterLanguage = (currentValue.ismasterlanguage == 1) ? true : false;
            var dir = process.cwd() + '/dist/HTML files/';
            var language = currentValue.language;
            var fileName = currentValue.id;
            var filePath = dir + fileName;
            var writeStream;
            var writableContent;

            if (!isMasterLanguage) {
                //spanish or arabic
                dir = process.cwd() + '/dist/HTML files/' + currentValue.id;
                filePath = dir + '/' + language;
                //create a directory with the name same as ID of the article
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                } else {
                    console.log("Directory already exist");
                }
            }

            //english
            if (bArticleContent) {
                //Write the Article content
                writableContent = currentValue.article_content__c;
                fs.writeFile(filePath + '.html', writableContent, 'utf8', function (err) {
                    if (err) throw err;
                });
                
            }
            //if footer Present write the footer content
            if (bFooterContent) {
                writableContent = currentValue.footer_content__c;
                fs.writeFile(filePath + '__footer.html', writableContent, 'utf8', function (err) {
                    if (err) throw err;
                });
                
            }

            if (index == dataArray.length - 1) {
                cb(null, true);
            }


        });
    } catch (err) {
        console.log('error while creating HTML');
    }
}

var createCSVFile = (dataArray, cb) => {
    //const Json2csvParser = json2csv;
    // json2csvTransform = json2csv.Transform;

    const fields = ['IsMasterLanguage', 'Article_Content__c', 'Footer_Content__c', 'Sequence__c', 'Title', 'datacategorygroup.Life_Event', 'Channels', 'Language'];
    const opts = {
        fields
    };

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
        _.map(articleArray, function (obj1) {
            var same = _.find(dataCatArray, function (obj2) {
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
            "IsMasterLanguage": returnData[i].ismasterlanguage,
            "Article_Content__c": 'HTML files/' + returnData[i].id + '.html',
            "Footer_Content__c": (returnData[i].footer_content__c) ? 'HTML files/' + returnData[i].id + '_footer.html' : "",
            "Sequence__c": returnData[i].sequence__c,
            "Title": returnData[i].title,
            "datacategorygroup.Life_Event": returnData[i].datacategoryname,
            "Channels": 'application+sites+csp',
            "Language": returnData[i].language
        })
    }
    //console.log(csvJSON.length);
    //console.log(returnData[0]);
    //console.log(">>>>>>>> Calling createHTMLFIles");

    createHTMLFIles(returnData, 0, (err, success) => {
        if (err) {
            console.log("File creation cb :::" + err);
        } else {


            //console.log("File Created");

            // Prepare CSV File
            createCSVFile(csvJSON, (err, resData) => {
                if (err) {
                    console.log("CSV Creation err");
                } else {
                    var output = fs.createWriteStream(process.cwd() + '/dist/target.zip');
                    var archive = archiver('zip');


                    output.on('close', function () {
                        console.log(archive.pointer() + ' total bytes');
                        console.log('archiver has been finalized and the output file descriptor has closed.');
                        //response.json({ "returnData": returnData });
                        //response.download(process.cwd() + '/dist/target.zip');
                        //response.send(process.cwd() + '/dist/target.zip');
                        //response.redirect('/');
                        response.render('index', {
                            title: 'Zip file is created in /dist/target.zip, click below link to download.'
                        });
                    });

                    // output.on('end', function() {
                    //     console.log('Data has been drained');
                    //     response.json({ "returnData": returnData });
                    // });
                    archive.on('error', function (err) {
                        throw err;
                    });

                    archive.pipe(output);
                    archive.directory('dist/', false);
                    archive.finalize();
                    // response.json({ "returnData": returnData });
                    console.log('CSV & ZIP complete');
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

app.get('/testDB', function (req, response) {
    console.log('old token: ' + oauth.access_token);

    var q = "SELECT Id, Title, Article_Content__c,Footer_Content__c, Sequence__c, IsMasterLanguage, Language FROM FAQ__kav where PublishStatus = 'Online' AND Language = 'en_US'";
    var q_es = "SELECT Id, Title, Article_Content__c,Footer_Content__c, Sequence__c, IsMasterLanguage, Language FROM FAQ__kav where PublishStatus = 'Online' AND Language = 'es'";
    var q_ar = "SELECT Id, Title, Article_Content__c,Footer_Content__c, Sequence__c, IsMasterLanguage, Language FROM FAQ__kav where PublishStatus = 'Online' AND Language = 'ar'";

    //var q = "SELECT Id, Title, Article_Content__c,Footer_Content__c FROM FAQ__kav where PublishStatus = 'Online' AND Language = 'en_US'";
    // var unique = {};
    // var distinct = [];
    var articleArray = [],
        dataCatArray = [];
    // org.query({ query: q, oauth: oauth }, function(err, res) { req.session.oauth
    var array = [];
    //english
    org.query({
        query: q,
        oauth: req.session.oauth
    }, function (err, res) {

        if (err) {
            console.error(err);
            response.send(err);
        } else {
            //articleArray = res.records;
            array = res.records;
            console.log("records after english: ------------ > " + array.length + "--------" + res.records.length + "------ Type : " + typeof(res.records));
            //spanish
            org.query({
                query: q_es,
                oauth: req.session.oauth
            }, function (err, res) {
                if (err) {
                    console.error(err);
                    response.send(err);
                } else {
                    array = array.concat(res.records);
                    
                    console.log("records after spanish: ------------ > " + array.length + "--------" + res.records.length + "------ type : "+typeof(res.records));
                    //arabic
                    org.query({
                        query: q_ar,
                        oauth: req.session.oauth
                    }, function (err, res) {
                        if (err) {
                            console.error(err);
                            response.send(err);
                        } else {
                            array  = array.concat(res.records);

                            console.log("records : ------------ > " + array.length + "--------" + res.records.length);
                            var getCatQuery;
                            if (array.length) {
                                getCatQuery = "SELECT ParentId, DataCategoryGroupName,DataCategoryName FROM FAQ__DataCategorySelection WHERE ParentId In (";
                                for (let i = 0; i < array.length; i++) {
                                    articleArray.push(array[i]._fields);
                                    if (i == (array.length - 1)) {
                                        //console.log("last elem:: " + i + '  --  ' + array[i]._fields.id);

                                        getCatQuery += "'" + array[i]._fields.id + "'";
                                    } else {
                                        getCatQuery += "'" + array[i]._fields.id + "',";
                                    }


                                }
                                getCatQuery += ')';
                            }

                            org.query({
                                query: getCatQuery,
                                oauth: req.session.oauth
                            }, function (err, res) {
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
                        }
                    });
                }
            });
        }
    });
    //console.log(getCatQuery);
})


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
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