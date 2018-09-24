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
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// define indexes
storeSchema.index({
  name: 'text',
  description: 'text'
});

storeSchema.index({ location: '2dsphere' });

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
  	{ $unwind: '$tags' }, // a store with an array of tags becomes multiple stores each with one of the tags
  	{ $group: { _id: '$tags', count: { $sum: 1 } } },
  	{ $sort: { count: -1 } }
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
      // can't use virtual reviews (from below) since thats mongoose specific
      // aggregate not mongoose specific, just gets passed to mongodb
      
      // look up stores and populate their reviews
      // mongodb lowercases and adds s for us (Review becomes reviews)
      { $lookup: { 
        from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' 
      }},
      // filter for only items that have 2 or more reviews
      // only where reviews.1 (index and length 2) exists
      { $match: {
        'reviews.1': { $exists: true }
      }},
      // add the average reviews field
      // this works on mongodb 3.4.x
      // why isn't this working for 3.6.3???
      // { $addField: {
      //     averageRating: { $avg: '$reviews.rating' }
      // }}
      // need to add back the fields (quirk of aggregation!!!???)
      { $project: {
          photo: '$$ROOT.photo',
          name: '$$ROOT.name',
          reviews: '$$ROOT.reviews',
          slug: '$$ROOT.slug',
          averageRating: { $avg: '$reviews.rating' }
      }},
      // sort by average field
      { $sort: { averageRating: -1 }},
      { $limit: 10 }
    ]);
};

// find reviews where the stores _id === reviews store property
// like SQL join
storeSchema.virtual('reviews', { // instead of a function returning something, go to a diff model and do a query
  ref: 'Review',
  localField: '_id',
  foreignField: 'store'
});

function autopopulate(next) {
  this.populate('reviews');
  next();
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);

