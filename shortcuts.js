var twiddleargs = function (args) {
    if (args.length === 1) {
	args = args[0];
    } else {
	var filter = Array.prototype.filter;
	args = filter.call(args, function () { return true; });
    }
    return args.map(i);
};

var i = function (n) {
    switch (typeof n) {
    case "number":
	if (n < 0) {
	    return expr.neg(expr.integer(-n));
	} else {
	    return expr.integer(n);
	}
    case "string":
	return expr.parameter(n);
    default:
	return n;
    }
};

var root = function (x) {
    return expr.root(x);
};

var sum = function () {
    return expr.sum(twiddleargs(arguments));
};

var prod = function () {
    return expr.product(twiddleargs(arguments));
};

var neg = function (x) {
    return expr.neg(i(x));
};

var frac = function (x, y) {
    return expr.fraction(i(x), i(y));
};

var pow = function (x, y) {
    return expr.power(i(x), i(y));
};

var br = function (x) {
    return expr.brackets(i(x));
};