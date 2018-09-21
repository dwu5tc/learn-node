const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise; // shouldnt need this???

const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
	email: {
		type: String,
		unique: true,
		lowercase: true, // always saved as lowercase
		trim: true,
		validate: [validator.isEmail, 'Invalid email address'],
		required: 'Please submit an email address'		
	},
	name: {
		type: String,
		required: 'Please supply a name',
		trim: true
	} 
});

userSchema.virtual('gravatar').get(function() {
  const hash = md5(this.email); // used function because we needed this (which equals user)
  return `https://gravatar.com/avatar/${ hash }?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler); // provides nicer error messages

module.exports = mongoose.model('User', userSchema);

