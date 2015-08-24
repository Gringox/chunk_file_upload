process.env.TMPDIR = 'tmp'; // to avoid the EXDEV rename error, see http://stackoverflow.com/q/21071303/76173

// Must change to new express
var express = require('express');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var flow = require('./flow-node.js')('tmp');
var app = express();
var fs = require('fs');

// Host most stuff in the public folder
app.use(express.static(__dirname + '/public'));

// Create dir uploads and serve as public
fs.mkdir('./uploads', function(error) {
  app.use(express.static(__dirname + '/uploads'));
});

// Handle uploads through Flow.js
app.post('/upload', multipartMiddleware, function(req, res) {
  flow.post(req, function(status, filename, original_filename, identifier, currentTestChunk, numberOfChunks) {
    console.log('POST', status, original_filename, identifier);
    res.status(200).send();

    if (status === 'done' && currentTestChunk > numberOfChunks) {
      var stream = fs.createWriteStream('./uploads/' + filename);

      //EDIT: I removed options {end: true} because it isn't needed
      //and added {onDone: flow.clean} to remove the chunks after writing
      //the file.
      flow.write(identifier, stream, { onDone: flow.clean });
    }
  });
});

// Handle status checks on chunks through Flow.js
app.get('/upload', function(req, res) {
    flow.get(req, function(status, filename, original_filename, identifier) {
        console.log('GET', status);
        res.send(200, (status == 'found' ? 200 : 404));
    });
});

var server = app.listen(3000, function() {
  console.log('Express started at port %d', server.address().port);
});
