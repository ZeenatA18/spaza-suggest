const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');
const app = express();

const spaza = require('./spaza-suggest');
// const routes = require('./routes/routes')
const pgp = require('pg-promise')();

let useSSL = false;
let local = process.env.LOCAL || false;
if (process.env.DATABASE_URL && !local) {
    useSSL = true;
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:pg123@localhost:5432/coffee_shop';

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

const PORT = process.env.PORT || 3003;

app.listen(PORT, function () {
    console.log("App started at port:", PORT)
});