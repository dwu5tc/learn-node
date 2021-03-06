const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const multer = require('multer'); // handles multipart form data
const jimp = require('jimp'); // for resizing images
const uuid = require('uuid'); // makes file names unique

const multerOptions = {
  // handles upload and reads to memory, doesn't actually save to disk
  storage: multer.memoryStorage(),
  
  // ES6 short method syntax
  // next = a callback
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      // passing something = error
      // passing null and as 2nd value = it worked, 2nd value is what needs to get pased along
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

// exports.myMiddleware = (req, res, next) => {
//   console.log('here in exports MW');
//   req.name = 'Wes';
//   res.cookie('name', 'Wes is cool', { maxAge: 90000 });
//   if (req.name === 'Wes') {
//     // throw Error('that is a stupid name');
//   }
//   next();
// };

// image upload with single field called photo
exports.upload = multer(multerOptions).single('photo');

// resize MW function
exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skips to the next MW
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${ uuid.v4() }.${ extension }`;

  // resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${ req.body.photo }`);
  
  // once written to disk, continue
  next();
};

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
  req.body.author = req.user._id;
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully created ${ store.name }. Care to leave a review?`);
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
  //     res.render('storeList', { stores: storp es })
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
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page - 1) * limit;

  // query the db for a list of all stores
  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' }); // shouldn't this come before limit???

  const countPromise = Store.count();
  
  const [stores, count] = await Promise.all([storesPromise, countPromise]);
  const pages = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${ page } but that doesn't exist. So I put you on page ${ pages }.`);
    res.redirect(`/stores/page/${ pages }`);
    return;
  }
  res.render('stores', { title: 'Stores', stores, page, pages, count });
};

const confirmOwner = (store, user) => {
  // can have different permission levels
  // if (!store.author.equals(user._id) || user.level < 10)
  if (!store.author.equals(user._id)) { // .equals is required to compare objectid with string
    throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
  // 1. find the store given the id
  const store = await Store.findOne({ _id: req.params.id });
  confirmOwner(store, req.user);
  // 2. confirm they are the owner of the store

  // 3. render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${ store.name }`, store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be a point (defaults don't kick in on upate)
  req.body.location.type = 'Point';

  // find and update the store
  // what if the slug changes??? wasn't addressed in the course
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old store
    runValidators: true // force model to run require validators again
  }).exec(); // why???

  // redirect them to the store and tell them it worked
  req.flash('success', `Successfully updated <strong>${ store.name }</strong>. <a href="/store/${ store.slug }">View Store</a>`);
  res.redirect(`/stores/${ store._id }/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  if (!store) return next();

  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true };
  const tagsPromise = Store.getTagsList(); // gets tags and their counts
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]); 
  res.render('tags', { title: 'Tags', tags, stores, tag });
};

exports.searchStores = async (req, res) => {
  const stores = await Store
  // first find stores that match
  .find({
    $text: {
      $search: req.query.q
    }
  }, { // this second object is a projection
    score: { $meta: 'textScore' }
  })
  .sort({
    score: { $meta: 'textScore' } // why is this liek this???
  })
  .limit(5);
  res.json(stores); 
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };
  const stores = await Store.find(q)
  .select('slug name description location photo')
  .limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString()); // hearts are mongodb objs
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet'; // addToSet ensures unique
  const user = await User.findByIdAndUpdate(req.user._id,
    { [operator]: { hearts: req.params.id }},
    { new: true }
  );
  res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });
  res.render('stores', { title: 'Hearted Stores', stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores(); // should keep complex queries outside of the controller
  // res.json(stores);
  res.render('topStores', { stores, title: 'Top Stores' });
};