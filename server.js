const express = require('express');
const app = express();
const mysql = require('mysql2');

// Configuration de la base de données MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'actu_db'
});

// Connexion à la base de données MySQL
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données MySQL :', err);
    throw err;
  }
  console.log('Connecté à la base de données MySQL...');
});

// Configuration d'Express
app.set('view engine', 'ejs'); // Utilisation du moteur de template EJS
app.use(express.static('public')); // Dossier pour les fichiers statiques (CSS, JS, images)
app.use(express.urlencoded({ extended: true })); // Middleware pour traiter les données des formulaires

// Route principale pour afficher la page d'accueil avec pagination des articles
app.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  // Récupération des articles avec pagination et calcul du nombre total de pages
  db.query('SELECT * FROM articles ORDER BY date DESC LIMIT ? OFFSET ?', [limit, offset], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des articles :', err);
      throw err;
    }

    db.query('SELECT COUNT(*) AS count FROM articles', (err, countResults) => {
      if (err) {
        console.error('Erreur lors du comptage des articles :', err);
        throw err;
      }

      const totalArticles = countResults[0].count;
      const totalPages = Math.ceil(totalArticles / limit);

      // Récupération des catégories pour affichage dans le menu
      db.query('SELECT * FROM categories', (err, categories) => {
        if (err) {
          console.error('Erreur lors de la récupération des catégories :', err);
          throw err;
        }

        // Rendu de la vue index.ejs avec les données récupérées
        res.render('index', { articles: results, page, totalPages, categories });
      });
    });
  });
});

// Route pour afficher les articles par catégorie avec pagination
app.get('/categories/:id', (req, res) => {
  const categoryId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  // Récupération des articles d'une catégorie spécifique avec pagination
  db.query('SELECT * FROM articles WHERE category_id = ? ORDER BY date DESC LIMIT ? OFFSET ?', [categoryId, limit, offset], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des articles par catégorie :', err);
      throw err;
    }

    db.query('SELECT COUNT(*) AS count FROM articles WHERE category_id = ?', [categoryId], (err, countResults) => {
      if (err) {
        console.error('Erreur lors du comptage des articles par catégorie :', err);
        throw err;
      }

      const totalArticles = countResults[0].count;
      const totalPages = Math.ceil(totalArticles / limit);

      // Rendu de la vue category_articles.ejs avec les articles de la catégorie spécifiée
      res.render('category_articles', { articles: results, page, totalPages, categoryId });
    });
  });
});

// Route pour afficher les détails d'un article en fonction de son ID
app.get('/articles/:id', (req, res) => {
    const articleId = req.params.id;

    // Requête pour récupérer les détails de l'article depuis la base de données
    db.query('SELECT * FROM articles WHERE id = ?', [articleId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des détails de l\'article :', err);
            throw err;
        }

        // Vérifier si l'article existe
        if (results.length === 0) {
            res.status(404).send('Article non trouvé');
            return;
        }

        // Rendu de la vue article_details.ejs avec les détails de l'article récupérés
        res.render('article_details', { article: results[0] });
    });
});


// Port d'écoute pour le serveur Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Serveur en écoute sur le port ${PORT}...');
});

