const express = require('express'); // const allows for a varible to be declared but cannot be changed once it has been.//
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const sanitizeHTML = require('sanitize-html');

//Below is simply boliler plate code that you do not need to memorize, simply copy for future use of "Sessions"//
let sessionOptions = session({
  secret: 'Javascript is so cool',
  store: new MongoStore({ client: require('./db') }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
});

//--------------Session Above--------------//

app.use(sessionOptions);
app.use(flash());

app.use(function (req, res, next) {
  // Make our markdown function available within ejs template
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(markdown(content), {
      allowedTags: [
        'p',
        'br',
        'ul',
        'ol',
        'li',
        'strong',
        'bold',
        'i',
        'em',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
      ],
    });
  };

  // make all errors and flash messages avaialbe from all templates
  res.locals.errors = req.flash('errors');
  res.locals.success = req.flash('success');

  // make current user id available on the req object
  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }

  // make user session data availabe from within view templates

  res.locals.user = req.session.user;
  next();
});

const router = require('./router'); // require has two functions :1. executes said file, 2. returns what that file exports//

app.use(express.static('public'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.set('views', 'views'); //( first is the key word "views", second is the name of the folder which can be anything..in this case it is "views" also.)//
app.set('view engine', 'ejs');

app.use('/', router);

const server = require('http').createServer(app);

const io = require('socket.io')(server);

io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next);
});

io.on('connection', function (socket) {
  if (socket.request.session.user) {
    let user = socket.request.session.user;

    socket.emit('welcome', { username: user.username, avatar: user.avatar });

    socket.on('chatMessageFromBrowser', function (data) {
      socket.broadcast.emit('chatMessageFromServer', {
        message: sanitizeHTML(data.message, {
          allowedTags: [],
          allowedAttributes: {},
        }),
        username: user.username,
        avatar: user.avatar,
      });
    });
  }
});

module.exports = server;
