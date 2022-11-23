const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');
const app = express();

const spaza = require('./spaza-suggest');
const spazaSuggest = require('./spaza-suggest');
// const routes = require('./routes/routes')
const pgp = require('pg-promise')();

let useSSL = false;
let local = process.env.LOCAL || false;
if (process.env.DATABASE_URL && !local) {
    useSSL = true;
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:pg123@localhost:5432/spaza_suggest';

const config = {
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
}

const db = pgp(config);

const SpazaSuggest = spaza(db);
// const spazaRoutes = routes(SpazaSuggest);

app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(session({
    secret: "This is my long String that is used for session",
    resave: false,
    saveUninitialized: true
}));

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(flash());

app.get('/',  async function home(req, res) {

    res.render('index', {
        codex: req.session.codex
    })
})

app.post('/register', async function (req, res) {
    let user = req.body.uname.charAt(0).toUpperCase() + req.body.uname.slice(1).toLowerCase();
    let alphabet = /^[a-z A-Z]+$/
    let results = await SpazaSuggest.duplicate(user)

    const ShortUniqueId = require("short-unique-id");
    const uid = new ShortUniqueId({ length: 5 });
    

    if (results.length !== 0) {
        req.flash('sukuna', `${user}, Username already exists`);
    }
    else if (alphabet.test(user) == false) {
        req.flash('sukuna', 'Please use Alphabets only')
    }
    else if (results.length === 0) {
        // let password = uid();
        let uniqCode = uid();
        req.flash('sukuna', "Hi, here is you code to login - " + uniqCode)
        await SpazaSuggest.registerClient(user, uniqCode)
    }

    res.redirect('back')

})

app.post('/login',  async function (req, res) {
    let user = req.body.uname.charAt(0).toUpperCase() + req.body.uname.slice(1).toLowerCase();
    let code = req.body.psw

    let alphabet = /^[a-z A-Z]+$/
    var username = await SpazaSuggest.getUser(user)
    var codex = await SpazaSuggest.clientLogin(code)

    if (alphabet.test(user) == false) {
        req.flash('sukuna', 'Please use Alphabets only')
        res.redirect("/")
    } else if (!username) {
        req.flash('sukuna', 'Please register first')
    } else if (username, codex) {
        req.session.codex = codex
        res.redirect(`usersuggest/${user}`)
    } else {
        req.flash('sukuna', 'Please check if you typed the correct Username or Code')
        res.redirect('/')
    }
})

app.get('/usersuggest/:uname',  async function (req, res) {
    
})

const PORT = process.env.PORT || 3003;

app.listen(PORT, function () {
    console.log("App started at port:", PORT)
});