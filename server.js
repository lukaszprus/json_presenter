var express = require('express'),
    http = require('http'),
    app = express();

// app.set('title', 'Tech Test');
// app.set('author', 'Lucas Prus');

app.use(express.compress());
app.use(express.static(__dirname + '/public'));
// app.use(express.logger());
// app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + '/my_files' }));

http.createServer(app).listen(3000, function () {
    console.log('Listening on port 3000');
});