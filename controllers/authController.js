const passport = require('passport');

// look into strategies in passport
exports.login = passport.authentication('local', {
	failureRedirect: '/login',
	failureFlash: 'Failed Login',
	successRedirect: '/',
	successFlash: 'You are now logged in!'
});