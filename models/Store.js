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
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photo: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must suppply an author!'
  }
});

storeSchema.index({
  name: 'text',
  description: 'text'
});

// this happens on every save of the store
// cannot be arrow func cuz we need 'this'
storeSchema.pre('save', async function(next) {
  console.log('saving');
  if (!this.isModified('name')) { // when does this get reached???
    next(); // skip it
    return;
    // return next(); more concise
  }
  // before saving, autogen the slug
  this.slug = slug(this.name);
  console.log(this.slug);

  // find other stores that have same slug
  // will fuzzy match with regex instead of absolute value
  const slugRegEx = new RegExp(`^(${ this.slug })((-[0-9]*$)?)$`, 'i');
  
  // need Store.find but store hasn't been made yet...
  // this.constructor accesses the model inside a models function
  // this.constructor will be equal to Store by the time it runs???
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
  	this.slug = `${ this.slug }-${ storesWithSlug.length + 1 }`;
  }

  next();
});

// unwind duplicates
storeSchema.statics.getTagsList = function() {
  return this.aggregate([
  	{ $unwind: '$tags' },
  	{ $group: { _id: '$tags', count: { $sum: 1 } } },
  	{ $sort: { count: -1 } }
  ]);
}

module.exports = mongoose.model('Store', storeSchema);

