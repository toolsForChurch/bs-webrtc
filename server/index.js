'use strict';

/**
 * Load Twilio configuration from .env config file - the following environment
 * variables should be set:
 * process.env.TWILIO_ACCOUNT_SID
 * process.env.TWILIO_API_KEY
 * process.env.TWILIO_API_SECRET
 */
require('dotenv').load();

var fs = require('fs');
var http = require('http');
var path = require('path');
var AccessToken = require('twilio').jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;
var express = require('express');


// Create Express webapp.
var app = express();

// Set up the paths for the examples.
[
  'bandwidthconstraints',
  'localvideofilter',
  'localvideosnapshot',
  'mediadevices'
].forEach(function(example) {
  var examplePath = path.join(__dirname, `../examples/${example}/public`);
  app.use(`/webrtc/${example}`, express.static(examplePath));
});

// Set up the path for the quickstart.
var quickstartPath = path.join(__dirname, '../quickstart/public');
 app.use('/webrtc/call', express.static(quickstartPath));
// // app.get('/webrtc/call', function(request, response) {
// //
// //     var query = request.query;
// //
// //     if(query.id!=undefined){
// //         response.sendFile(quickstartPath);
// //     }
// //     else{
// //
// //         response.sendFile(path.join(__dirname,'../quickstart/public/404.html'));
// //     }
// //
// // });
// app.use('/webrtc/call/',function(request, response,next) {
//     var query = request.query;
//
//     if(query.id!=undefined){
//         response.sendFile(quickstartPath);
//     }
//     else{
//
//         response.sendFile(path.join(__dirname,'../quickstart/public/404.html'));
//     }
//     next();
// });

// Set up the path for the examples page.
var examplesPath = path.join(__dirname, '../examples');
app.use('/webrtc/examples', express.static(examplesPath));

/**
 * Default to the Quick Start application.
 */
app.get('/webrtc', function(request, response) {

    var query = request.query;

   if(query.id!=undefined){
       response.redirect('/webrtc/call/?id='+query.id);
   }
   else{

       response.sendFile(path.join(__dirname,'../quickstart/public/404.html'));
   }

});

/**
 * Generate an Access Token for a chat application user - it generates a random
 * username for the client requesting a token, and takes a device ID as a query
 * parameter.
 */
app.get('/webrtc/token', function(request, response) {
    var query = require('url').parse(request.url,true).query;
  var identity = query.name;
  console.log(identity)



  // Create an access token which we will sign and return to the client,
  // containing the grant we just created.
  var token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET
  );

  // Assign the generated identity to the token.
  token.identity = identity;

  // Grant the access token Twilio Video capabilities.
  var grant = new VideoGrant();
  token.addGrant(grant);

  // Serialize the token to a JWT string and include it in a JSON response.
  response.send({
    identity: identity,
    token: token.toJwt()
  });
});

// Create http server and run it.
var server = http.createServer(app);
var port = process.env.PORT || 3000;
server.listen(port, function() {
  console.log('Express server running on *:' + port);
});
