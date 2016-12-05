// Dépendances native
const path = require('path')

// Dépendances 3rd party
const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const sass = require('node-sass-middleware')
const db = require('redis')

// Constantes et initialisations
const PORT = process.PORT || 8080
const app = express()

// Mise en place des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware pour forcer un verbe HTTP
app.use(methodOverride('_method', { methods: [ 'POST', 'GET' ,'views'] }))

// Middleware pour parser le body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Préprocesseur sur les fichiers scss -> css
app.use(sass({
  src: path.join(__dirname, 'styles'),
  dest: path.join(__dirname, 'assets', 'css'),
  prefix: '/css',
  outputStyle: 'expanded'
}))

// On sert les fichiers statiques
app.use(express.static(path.join(__dirname, 'assets')))

// Middleware d'authentification
// app.use((req, res, next) => {
//   if(req.url == '/session')
//     next()
//   else
//     // Vérifier l'authentification
// })

// La liste des différents routeurs (dans l'ordre)
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))

// Erreur 404 si on n'arrive pas à joindre le serveur 
app.use(function(req, res, next) {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Gestion des erreurs
// Notez les 4 arguments !!
app.use(function(err, req, res, next) {
  // Les données de l'erreur
  let data = {
    message: err.message,
    status: err.status || 500
  }

  // En mode développement, on peut afficher les détails de l'erreur
  if (app.get('env') === 'development') {
    data.error = err.stack
  }

  // On set le status de la réponse
  res.status(data.status)

  // Réponse multi-format en HTML et en JSON
  res.format({
    html: () => { res.render('error', data) },
    json: () => { res.send(data) }
  })
})
// ouverture et manipulation de la BDD
db.open('bdd.db').then(() => {
  console.log('> BDD ouverte')
  return db.run('CREATE TABLE IF NOT EXISTS users (pseudo, firstname, lastname, email, password)')
}).then(() => {
  console.log('> Table persistée')
  app.listen(PORT, () => {
    console.log('> Serveur démarré sur le port : ', PORT)
  })
}).catch((err) => {
  console.error('ERR > ', err)
})


// API ROUTES 
// on créé une instance du router pour les routes 

var apiRoutes = express.Router();

// on créé une route pour afficher un message aléatoire 
apiRoutes.get('/',function(req, res) {
  res.json({message:"Bienvenue sur mon API! "});
});

//une route pour avoir tout les Users 

apiRoutes.get('/users', function(req, res){})
  User.find({}, function(err,users){
    res.json(users);
  });

});

app.use('/api', apiRoutes);

//Authentification et Token 
var apiRoutes = express.Router(); 

// la route pour authentifier notre utilisateur  
apiRoutes.post('/authenticate', function(req, res) {

  // on trouve l'utilisateur 
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentification impossible , utilisateur introuvable' });
    } else if (user) {

      // Comparé les mots de passe
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentification impossible , mauvais mot de passe' });
      } else {

        // si on a le bon utilisateur et le bon mdp 
        // création d'un token 
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // expire dans 24 heures 

        // on retourne les informations avec le token en JSON
        res.json({
          success: true,
          message: 'Profiter de votre token ;)',
          token: token
        });
      }   

    }

  });
});
// Protection de l'api et verification du token 
var apiRoutes = express.Router(); 

// route middleware pour vérifier le token 
apiRoutes.use(function(req, res, next) {

  // on check le header ou les paramétres de l'url et/ou du post pour le token 
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // On decode le token
  if (token) {

    // on verifie le secret 
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // Si tout marche on sauvegarde pour de futur requêtes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // Si token il n'y a pas
    // une erreur tu retourneras
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});

// on applique les routes à notre application 
app.use('/api', apiRoutes);
