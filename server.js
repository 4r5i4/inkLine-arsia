var express = require('express');
var app = express();
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var users = [{
    firstName: 'amsen',
    email: 'amsen@me.com',
    password: 'amsen',
    id: 0
}];

//a few static messages to initially populate the message board
var messages = [
    {
        text: 'I\'m the lead dev',
        owner: 'Brandin',
        timestamp: 'new Date()',
    },
    {
        text: 'WHAT IS the meaning of all this?',
        owner: 'John',
        timestamp: new Date()
    },
    {
        text: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
        owner: 'Ashley',
        timestamp: new Date()
    }
];

app.use(bodyParser.json());

//middleware to allow CORS since our API end point will most likely be at a different port/URL as our front-end
app.use(function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-type, Accept, Authorization');
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    //let express know we're done:
    next();
});

// a simple logger middleware
app.use(function(req, res, next){
    console.log(new Date(), req.method, req.url);
    next();
});

//routers
var api = express.Router();
var auth = express.Router();


api.get('/messages', function(req, res) {
    res.json(messages);
});

api.delete('/delete', function(req, res) {
    messages = [];
    console.log('hello');
    res.json(req.body);
});

api.get('/messages/:user', function(req, res) {
    var user = req.params.user;
    var result = messages.filter(message => message.owner == user);
    res.json(result);
});

api.post('/messages', function(req, res) {
    messages.push(req.body);
    res.json(req.body);
});

api.get('/users/me', checkAuthenticated, (req, res) => {
    console.log('@@@@@@@@@@@@@@', req.user);
    res.json(users[req.user]);
})

auth.post('/login', (req, res)=>{
    var user = users.find(user => user.email == req.body.email);
    if(!user) sendAuthError(res);
    if(user.password == req.body.password){
        sendToken(user, res);
    }else{
        sendAuthError(res);
    }
});

auth.post('/register', function(req, res) {

    let newUser = req.body;

    // TODO: Need to make sure that we have the required data in the backend in case there is bypassing of it in the front-end validation:
    // before "saving" the new user, make sure that it doesn't already exist. if so TODO: return something saying hey you already exist
    if(_.some(users, newUser)){
        console.log('WARNING: user already exists')
    }else{
        // Acknowledge the new user
        // console.log(newUser);

        users.push(newUser);

        // create a token. Since we dont have the user.id for a database, we will use the index of that user instead:
        let index = _.indexOf(users, newUser)
        newUser.id = index;

        console.log(newUser);

        // for learning sake, we are using the secret 123, but never ever do this in production
        sendToken(newUser, res);
    }
    // res.json(token);
});

function sendAuthError(res){
    return res.json({success: false, message: 'email or password incorrect'});
}

function sendToken(newUser, res){
    var token = jwt.sign(newUser.id, '123');
    console.log(token);
    res.json({firstName: newUser.firstName, token});
}

function checkAuthenticated(req, res, next) {
    if(!req.header('authorization'))
        return res.status(401).send({message: 'Unauthorized request. Missing authentication header'});

    var token = req.header('authorization').split(' ')[1];
    var payload = jwt.decode(token, '123');
    if(!payload)
        return res.status(401).send({message: 'unauthorized request. Authentication header is invalid'});
    req.user = payload;
    next();
}
app.use('/api', api);
app.use('/auth', auth);

app.listen(3000);