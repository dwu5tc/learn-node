const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    // pass an error message cuz default provided by mongodb is ugly
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String]
});

// this happens on every save of the store
// cannot be arrow func cuz we need 'this'
storeSchema.pre('save', function(next) {
  // before saving, autogen the slug 
  if (!this.isModified('name')) {
    next(); // skip it
    return;
    // return next(); more concise
  }
  this.slug = slug(this.name);
  next();
});

module.exports = mongoose.model('Store', storeSchema);

