const mongoose = require('mongoose');

exports.loginForm = (req, res) => {
	res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
	res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
	req.sanitizeBody('name'); // express validator
	req.checkBody('name', 'You must supply a name!').notEmpty();
	req.checkBody('email', 'That email is not valid!').isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots: false,
		remove_extension: false,
		gmail_remove_subaddress: false
	});
	req.checkBody('password', 'Password cannot be blank!').notEmpty();
	req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
	req.checkBody('password-confirm', 'Oops! Your passwords do not match!').equals(req.body.password);

	const errors = req.validationErrors();
	if (errors) {
		// handle errors, don't pass onto any error handling mw
		req.flash('error', errors.map(err => err.msg));
		// don't clear the form
		// explicitly pass the flashes since they normally only get passed in the next request
		res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
		return;
	}
	next(); // no errors
};