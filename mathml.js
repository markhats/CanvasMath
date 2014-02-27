(function (cvm) {

var initBox = cvm.box.init;
var expr = cvm.expr;

var mathMLTransformInline = function (tagname) {
    var element, i, text;
    var root, canvas;
    var elements = document.getElementsByTagName(tagname || "math");
    initBox();
    for (i = elements.length - 1; i >= 0; i--) {
	element = elements[i];
	root = mathMLParser.parse(element.firstElementChild);
	canvas = expr.drawOnNewCanvas(root);
	element.parentNode.replaceChild(canvas, element);
    }
};

if (!window.preventAutomaticTransform) {
    window.addEventListener('load', function () {
	mathMLTransformInline();
    }, false);
}

var mathMLParser = {
    functions: {},
    registerFunction: function (name, arity, applyMethod) {
	this.functions[name] = {
	    name: name,
	    arity: arity,
	    apply: applyMethod
	};
	this[name] = function (node) {
	    if (node.firstElementChild) {
		throw "<" + name + "> should be an empty tag";
	    }
	    return expr.parameter(name);
	};
    },
    registerRelation: function (relation) {
	this.registerFunction(relation, null, function (args) {
	    var argsWithRel = args.map(function (arg, i) {
		if (!i) {
		    return arg;
		} else {
		    return expr.exprWithRelation(arg, relation);
		}
	    });
	    return expr.equation(argsWithRel);
	});
    },
    parse: function (el) {
	var tag = el.tagName.toLowerCase();
	if (this[tag]) {
	    var e = this[tag](el);
	    return e;
	} else {
	    return expr.editExpr();
	}
    },
    parseFunc: function (func, args, qualifiers) {
	if (func.arity) {
	    if (args.length !== func.arity) {
		throw ("Function " + func.name + " expects " +
		       func.arity + " arguments, got " + args.length);
	    }
	    args.push(qualifiers);
	    return func.apply.apply(func, args);
	} else {
	    return func.apply.call(func, args, qualifiers);
	}
    },
    apply: function (node) {
	var funcEl = node.firstElementChild;
	var el = funcEl.nextElementSibling;
	var args = [];
	var qualifiers = {};
	var arg;
	var func;
	while (el) {
	    arg = this.parse(el);
	    if (arg.isQualifier) {
		qualifiers[arg.name] = arg.value;
	    } else {
		args.push(this.parse(el));
	    }
	    el = el.nextElementSibling;
	}
	func = this.functions[funcEl.tagName.toLowerCase()];
	if (!func) {
	    args = expr.argumentList(args);
	    func = this.parse(funcEl);
	    return expr.applyFunction(func, args);
	}
	return this.parseFunc(func, args, qualifiers);
    },
    ci: function (el) {
	return expr.parameter(el.textContent);
    },
    cn: function (el) {
	return expr.number(el.textContent);
    },
    matrixrow: function (node) {
	var el = node.firstElementChild;
	var row = [];
	while (el) {
	    row.push(this.parse(el));
	    el = el.nextElementSibling;
	}
	return expr.argumentList(row);
    },
    matrix: function (node) {
	var el = node.firstElementChild;
	var rows = [];
	while (el) {
	    var row = this.parse(el);
	    rows.push(row.operands);
	    el = el.nextElementSibling;
	}
	return expr.matrix(rows);
    },
    piecewise: function (node) {
	var el = node.firstElementChild;
	var pieces = [];
	while (el) {
	    pieces.push(this.parse(el));
	    el = el.nextElementSibling;
	}
	return expr.piecewise(pieces);
    },
    piece: function (node) {
	var exprEl = node.firstElementChild;
	var conditionEl = exprEl.nextElementSibling;
	return expr.conditionalExpression(
	    this.parse(exprEl), this.parse(conditionEl));
    },
    otherwise: function (node) {
	var exprEl = node.firstElementChild;
	return this.parse(exprEl);
    }
};

var mathMLElements = {
    unaryStandardFunctions: [
	'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
	'sinh', 'cosh', 'tanh', 'sech', 'csch', 'coth',
	'arcsin', 'arccos', 'arctan', 'arcsec', 'arccsc', 'arccot',
	'arcsinh', 'arccosh', 'arctanh', 'arcsech', 'arccsch', 'arccoth',
	'exp', 'ln', 'log',
	'arg'
    ],
    qualifiers: [
	'bvar', 'lowlimit', 'uplimit', 'interval', 'condition',
	'domainofapplication', 'degree', 'momentabout', 'logbase'
    ]
};

mathMLElements.unaryStandardFunctions.forEach(function (fn) {
    mathMLParser.registerFunction(fn, 1, function (arg) {
	return expr.trigFunction(fn, arg);
    });
});

mathMLElements.qualifiers.forEach(function (qual) {
    mathMLParser[qual] = function (el) {
	return {
	    isQualifier: true,
	    name: qual,
	    value: this.parse(el.firstElementChild)
	};
    };
});

mathMLParser.registerFunction("plus", null, function (args) {
    return expr.sum(args);
});
mathMLParser.registerFunction("times", null, function (args) {
    return expr.product(args);
});
mathMLParser.registerFunction("power", 2, function (base, pow) {
    return expr.power(base, pow);
});
mathMLParser.registerFunction("minus", null, function (args) {
    // Minus can be unary or binary.
    if (args.length === 1) {
	return expr.neg(args[0]);
    } else if (args.length === 2) {
	return expr.sum([args[0], expr.neg(args[1])]);
    } else {
	throw "minus expects 1 or 2 arguments, got " + args.length;
    }
});
mathMLParser.registerFunction("divide", 2, function (num, den) {
    return expr.fraction(num, den);
});
mathMLParser.registerFunction("abs", 1, function (val) {
    return expr.abs(val);
});
mathMLParser.registerFunction("conjugate", 1, function (val) {
    return expr.conjugate(val);
});
mathMLParser.registerFunction("factorial", 1, function (val) {
    return expr.factorial(val);
});
mathMLParser.registerFunction("floor", 1, function (val) {
    return expr.floor(val);
});
mathMLParser.registerFunction("ceiling", 1, function (val) {
    return expr.ceiling(val);
});
mathMLParser.registerFunction("root", 1, function (val, quals) {
    return expr.sqrt(val, quals.degree);
});
mathMLParser.registerFunction("sum", 1, function (val, quals) {
    var from;
    if (quals.bvar && quals.lowlimit) {
	from = expr.equation([quals.bvar, quals.lowlimit]);
    }
    return expr.sumOf(val, from, quals.uplimit);
});
mathMLParser.registerFunction("product", 1, function (val, quals) {
    var from;
    if (quals.bvar && quals.lowlimit) {
	from = expr.equation([quals.bvar, quals.lowlimit]);
    }
    return expr.productOf(val, from, quals.uplimit);
});
mathMLParser.registerFunction("int", 1, function (val, quals) {
    if (quals.bvar) {
	val = expr.product([val, expr.differential(quals.bvar)]);
    }
    return expr.integralOf(val, quals.lowlimit, quals.uplimit);
});
mathMLParser.registerFunction("diff", 1, function (val, quals) {
    return expr.derivative(val, quals.bvar);
});
mathMLParser.registerFunction("selector", null, function (args, quals) {
    var base = args[0];
    var sub;
    if (args.length === 2) {
	sub = args[1];
    } else {
	sub = expr.argumentList(args.slice(1));
    }
    return expr.subscript(base, sub);
});
mathMLParser.registerFunction("and", null, function (args) {
    return expr.conjunction(args);
});
mathMLParser.registerFunction("or", null, function (args) {
    return expr.disjunction(args);
});
mathMLParser.registerFunction("not", 1, function (arg) {
    return expr.not(arg);
});
['eq', 'neq', 'lt', 'gt', 'geq', 'leq'].forEach(function (relation) {
    mathMLParser.registerRelation(relation);
});

cvm.mathml = {
    parser: mathMLParser
};

})(cvm);