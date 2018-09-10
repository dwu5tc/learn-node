const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
// router.get('/', (req, res) => {
//   // res.send('Hey! It works!');
//   res.render('hello', {
//   	name: 'wes',
//   	dog: req.query.dog,
//   	title: 'I love food'
//   });
// });

// router.get('/reverse/:name', (req, res) => {
//   const reverse = [...req.params.name].reverse().join('');
//   res.send(reverse);
// });

router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);

// composition with higher function to catch errors nicely
router.post('/add', catchErrors(storeController.createStore));

module.exports = router;
