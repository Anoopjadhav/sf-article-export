var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log("I");
    console.log(req.query.code);
    org.authenticate({ code: req.query.code }, function(err, resp) {
        if (!err) {
            console.log('Access Token: ' + resp.access_token);
            res.send(resp.access_token);
        } else {
            console.log('Error: ' + err.message);
        }
    });
    //res.send(req.query.code);
});

module.exports = router;
