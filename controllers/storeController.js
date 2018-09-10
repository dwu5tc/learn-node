const mongoose = require('mongoose');
const Store = mongoose.model('Store');

// exports.myMiddleware = (req, res, next) => {
//   console.log('here in exports MW');
//   req.name = 'Wes';
//   res.cookie('name', 'Wes is cool', { maxAge: 90000 });
//   if (req.name === 'Wes') {
//     // throw Error('that is a stupid name');
//   }
//   next();
// };

exports.homePage = (req, res) => {
  console.log(req.name);
  res.render('index');
};

exports.addStore = (req, res) => {
  // same template for adding/editig store
  // minimize num of templates and keeps code DRY
  res.render('editStore', { title: 'Add Store' });
};

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${ store.slug }`);

  // const store = new Store(req.body);

  // used to be with callbacks
  // store.save(function(err, document) {
  //   if (!err) {
  //     console.log('it worked!');
  //     res.redirect('/');
  //   }
  // });

  // store
  //   .save()
  //   .then(store => {
  //     return Store.find()
  //   })
  //   .then(stores => {
  //     res.render('storeList', { stores: stores })
  //   })
  //   .catch(err => {
  //     throw Error(err);
  //   })

  // necessary if not wrapping with catch errors handler func
  // try {
  //   const store = new Store(req.body);
  //   await store.save();
  //   console.log('it worked');
  // } catch (err) {
  //   close();
  // }

};

exports.getStores = async (req, res) => {
  // query the db for a list of all stores
  const stores = await Store.find();
  // console.log(stores);
  res.render('stores', { title: 'Stores', stores });
};


