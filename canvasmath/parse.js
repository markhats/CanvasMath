if (window.cvm === undefined) {
    cvm = {};
}

(function (cvm) {

var expr = cvm.expr;

if (cvm.expr === undefined) {
    throw "expr module must be loaded";
}


var operations = {
    priorityMode: true,
    binop: function (Op, e, rhs) {
	if (!rhs) {
	    rhs = expr.editExpr();
	}
	if (this.priorityMode || Op.isProposition) {
	    while (!e.parent.isRoot && !e.parent.isBracket &&
		e.parent.priority > Op.priority) {
		/*if (e === e.parent.from) {
		    break;
		}*/
		e = e.parent;
	    }
	} else {
	    if (Op == expr.Sum && e.parent.isProduct) {
		e = e.parent;
	    }
	    if (Op == expr.Sum && e.parent.isPrefixOperation) {
		e = e.parent;
	    }
	}
	// The next two lines are a hack to allow e.g. sin^2x to mean sin^2(x)
	if (
		this.priorityMode && Op === expr.Product &&
		e.parent.isTrigFunction && e === e.parent.power
	   ) {
	    e.parent.replaceChild(e.parent.arg, rhs);
	} else // end of hack XXX
	// Now a hack to allow sum from(i=1) to (n) (1/n)
	if (this.priorityMode && Op === expr.Product && e.parent.isOpOf &&
		(e === e.parent.to || e === e.parent.from)) {
	    e.parent.replaceChild(e.parent.arg, rhs);
	} else // end of hack XXX
	if (e.__proto__ === Op && !e.isGroup) {
	    e.insertAfter(e.lastChild, rhs);
	} else {
	    var p = e.parent;
	    var s = Op.instanciate(e.copy(), rhs);
	    e.parent.replaceChild(e, s);
	}
	return rhs;
    },
    add: function (e, rhs) {
	return operations.binop(expr.Sum, e, rhs);
    },
    mult: function (e, rhs) {
	return operations.binop(expr.Product, e, rhs);
    },
    addRelation: function (rel) {
	return function (e, rhs) {
	    if (!rhs) {
		rhs = expr.editExpr();
	    }
	    var relRhs = expr.ExprWithRelation.instanciate(rhs, rel);
	    operations.binop(expr.Equation, e, relRhs);
	    return rhs;
	};
    },
    and: function (e, rhs) {
	return operations.binop(expr.Conjunction, e, rhs);
    },
    or: function (e, rhs) {
	return operations.binop(expr.Disjunction, e, rhs);
    },
    conditional: function (e, rhs) {
	return operations.binop(expr.ConditionalExpression, e, rhs);
    },
    piecewise: function (e, rhs) {
	return operations.binop(expr.Piecewise, e, rhs);
    },
    multByBracket: function (e) {
	var rhs = expr.editExpr();
	operations.mult(e, expr.brackets(rhs));
	return rhs;
    },
    openArgList: function (e) {
	var rhs = expr.editExpr();
	var func = expr.applyFunction(e.copy(), expr.argumentList([rhs]));
	e.parent.replaceChild(e, func);
	return rhs;
    },
    openCoordsList: function (e) {
       var rhs = expr.editExpr();
       var func =  expr.coordsList([rhs]);
       e.parent.replaceChild(e, func);
       return rhs;
    },
    addprefixop: function (maker) {
	return function (e) {
	    var rhs = expr.editExpr();
	    operations.add(e, maker(rhs));
	    return rhs;
	};
    },
    pow: function (e) {
	var p = e.parent;
	var pow = expr.editExpr();
	p.replaceChild(e, expr.power(e.copy(), pow));
	return pow;
    },
    frac: function (e) {
	var rhs = expr.editExpr();
	if (operations.priorityMode) {
	    while (!e.parent.isRoot && !e.parent.isBracket &&
		e.parent.priority > expr.Fraction.priority) {
		e = e.parent;
	    }
	}
	e.parent.replaceChild(e, expr.fraction(e.copy(), rhs));
	return rhs;
    },
    prefixop: function (maker) {
	return function (e) {
	    var p = e.parent;
	    var ce = e.copy();
	    var cex = maker(ce);
	    p.replaceChild(e, maker(ce));
	    return ce;
	};
    },
    closeBracket: function (e) {
	var p;
	for (p = e.parent; !p.isRoot; p = p.parent) {
	    if (p.isBracket) {
		e = p.expr;
		e.isGroup = true;
		p.parent.replaceChild(p, e);
		break;
	    }
	}
	return e;
    },
    closeArgList: function (e) {
	var p;
	for (p = e.parent; !p.isRoot; p = p.parent) {
	    if (p.insertAfterInRow || p.insertRowAfter) {
		return p.parent;
	    }
	}
	return e;
    },
    closeCoordsList: function (e) {
   var p;
   for (p = e.parent; !p.isRoot; p = p.parent) {
       if (p.insertAfterInRow || p.insertRowAfter) {
      return p.parent;
       }
   }
   return e;
    },
    factorial: function (e) {
	var p = e.parent;
	var fac_e = expr.factorial(e.copy());
	p.replaceChild(e, fac_e);
	return fac_e;
    },
    differentiate: function (e) {
	var p = e.parent;
	var diff_e = expr.derivative(e.copy());
	p.replaceChild(e, diff_e);
	return diff_e;
    },
    nthRoot: function (e, rhs) {
	var p = e.parent;
	if (!rhs) {
	    rhs = expr.editExpr();
	}
	p.replaceChild(e, expr.sqrt(rhs, e.copy()));
	return rhs;
    },
    subscript: function (e, rhs) {
	var p = e.parent;
	if (!rhs) {
	    rhs = expr.editExpr();
	}
	p.replaceChild(e, expr.subscript(e.copy(), rhs));
	return rhs;
    },
    subscriptList: function (e) {
	var p = e.parent;
	var rhs = expr.editExpr();
	operations.subscript(e, expr.argumentList([rhs]));
	return rhs;
    },
    addColumn: function (e, rhs) {
	rhs = expr.editExpr();
	if (operations.priorityMode) {
	    while (!e.parent.isRoot &&
		   !e.parent.insertAfterInRow &&
		   !e.parent.isBracket) {
		e = e.parent;
	    }
	}
	if (e.parent.insertAfterInRow) {
	    e.parent.insertAfterInRow(e, rhs);
	} else {
	    e.parent.replaceChild(e, expr.matrix([[e.copy(), rhs]]));
	}
	return rhs;
    },
    addRow: function (e, rhs) {
	rhs = expr.editExpr();
	if (operations.priorityMode) {
	    while (!e.parent.isRoot && !e.parent.insertRowAfter && !e.parent.isBracket) {
		e = e.parent;
	    }
	}
	if (e.parent.insertRowAfter) {
	    e.parent.insertRowAfter(e, [rhs]);
	} else {
	    e.parent.replaceChild(e, expr.matrix([[e.copy()], [rhs]]));
	}
	return rhs;
    },
    fromOp: function(e, rhs) {
	var target = e;
	rhs = expr.editExpr();
	if (true || operations.priorityMode) {
	    while (!target.isRoot && !target.setFrom && !target.isBracket) {
		target = target.parent;
	    }
	}
	if (target.setFrom) {
	    target.setFrom(rhs);
	    return rhs;
	}
	return e;
    },
    toOp: function(e, rhs) {
	var target = e;
	rhs = expr.editExpr();
	if (true || operations.priorityMode) {
	    while (!target.isRoot && !target.setTo && !target.isBracket) {
		target = target.parent;
	    }
	}
	if (target !== e && e.isEditExpr && e.operand) {
	    e.parent.replaceChild(e, e.operand);
	}
	if (target.setTo) {
	    target.setTo(rhs);
	    return rhs;
	}
	return e;
    }
};

var infixBinaryOps = {
    "+": operations.add,
    "*": operations.mult,
    "-": operations.addprefixop(expr.neg),
    "±": operations.addprefixop(expr.plusMinus),
    "+-": operations.addprefixop(expr.plusMinus),
    "-+": operations.addprefixop(expr.minusPlus),
    "/": operations.frac,
    "^": operations.pow,
    "(": operations.multByBracket,
    "[": operations.openArgList,
    "=": operations.addRelation('eq'),
    "<": operations.addRelation('lt'),
    ">": operations.addRelation('gt'),
    "<=": operations.addRelation('leq'),
    ">=": operations.addRelation('geq'),
    ",": operations.addColumn,
    ";": operations.addRow,
    "root": operations.nthRoot,
    "_": operations.subscript,
    "_[": operations.subscriptList,
    "and": operations.and,
    "or": operations.or,
    "if": operations.conditional,
    "else": operations.piecewise
};

var prefixUnaryOps = {
    "-": operations.prefixop(expr.neg),
    "±": operations.prefixop(expr.plusMinus),
    "+-": operations.prefixop(expr.plusMinus),
    "-+": operations.prefixop(expr.minusPlus),
    "not": operations.prefixop(expr.not),
    "(": operations.prefixop(expr.brackets),
    "{": operations.openCoordsList,
    "d.": operations.prefixop(expr.differential),
    "from": operations.fromOp,
    "to": operations.toOp
};

var postfixUnaryOps = {
    ")": operations.closeBracket,
    "]": operations.closeArgList,
    "}": operations.closeCoordsList,
    "!": operations.factorial,
    "'": operations.differentiate
};

var greekLowercase = [
    {name:"alpha", code:"\u03b1"},
    {name:"beta", code:"\u03b2"},
    {name:"gamma", code:"\u03b3"},
    {name:"delta", code:"\u03b4"},
    {name:"epsilon", code:"\u03b5"},
    {name:"zeta", code:"\u03b6"},
    {name:"eta", code:"\u03b7"},
    {name:"theta", code:"\u03b8"},
    {name:"iota", code:"\u03b9"},
    {name:"kappa", code:"\u03ba"},
    {name:"lambda", code:"\u03bb"},
    {name:"mu", code:"\u03bc"},
    {name:"nu", code:"\u03bd"},
    {name:"xi", code:"\u03be"},
    {name:"omicron", code:"\u03bf"},
    {name:"pi", code:"\u03c0"},
    {name:"rho", code:"\u03c1"},
    {name:"sigma", code:"\u03c3"},
    {name:"tau", code:"\u03c4"},
    {name:"upsilon", code:"\u03c5"},
    {name:"phi", code:"\u03c6"},
    {name:"chi", code:"\u03c7"},
    {name:"psi", code:"\u03c8"},
    {name:"omega", code:"\u03c9"}
];

var greekUppercase = [
    {name:"Alpha", code:"\u0391"},
    {name:"Beta", code:"\u0392"},
    {name:"Gamma", code:"\u0393"},
    {name:"Delta", code:"\u0394"},
    {name:"Epsilon", code:"\u0395"},
    {name:"Zeta", code:"\u0396"},
    {name:"Eta", code:"\u0397"},
    {name:"Theta", code:"\u0398"},
    {name:"Iota", code:"\u0399"},
    {name:"Kappa", code:"\u039a"},
    {name:"Lambda", code:"\u039b"},
    {name:"Mu", code:"\u039c"},
    {name:"Nu", code:"\u039d"},
    {name:"Xi", code:"\u039e"},
    {name:"Omicron", code:"\u039f"},
    {name:"Pi", code:"\u03a0"},
    {name:"Rho", code:"\u03a1"},
    {name:"Sigma", code:"\u03a3"},
    {name:"Tau", code:"\u03a4"},
    {name:"Upsilon", code:"\u03a5"},
    {name:"Phi", code:"\u03a6"},
    {name:"Chi", code:"\u03a7"},
    {name:"Psi", code:"\u03a8"},
    {name:"Omega", code:"\u03a9"}
];

var constants = {
    // Exponential

    exp: "\u212f"
};

[greekLowercase, greekUppercase].forEach(function (list) {
    list.forEach(function (item) {
	constants[item.name] = item.code;
    });
});

var functions = {
};

[
   {name: "sqrt", expr: expr.sqrt},
   {name: "abs", expr: expr.abs},
   {name: "ceil", expr: expr.ceiling},
   {name: "conj", expr: expr.conjugate},
   {name: "floor", expr: expr.floor},
   {name: "sum", expr: expr.sumOf},
   {name: "prod", expr: expr.productOf},
   {name: "integral", expr: expr.integralOf}
].forEach(function (fdata) {
    functions[fdata.name] = fdata.expr;
});

[
    "sin", "cos", "tan", "cosec", "sec", "cot",
    "sinh", "cosh", "tanh", "cosech", "sech", "coth"
].forEach(function (f) {
    functions[f] = function (arg) {
	return expr.trigFunction(f, arg);
    };
    functions[f + "^"] = function (arg) {
	return expr.trigFunction(f, expr.editExpr(), arg);
    };
});

[
    "arcsin", "arccos", "arctan",
    "arcsinh", "arccosh", "arctanh"
].forEach(function (f) {
    functions[f] = function (arg) {
	return expr.trigFunction(f, arg);
    };
});

var Keywords = Prototype.specialise({
    __init__: function () {
	this.list = [];
	this.map = {};
    },
    updateWithObject: function (obj, type) {
	var kw, info;
	for (kw in obj) {
	    if (obj.hasOwnProperty(kw)) {
		info = {kw: kw, type: type, value: obj[kw]};
		this.list.push(info);
		this.map[kw] = info;
	    }
	}
	this.list.sort(function (x, y) {
	    return x.kw.localeCompare(y.kw);
	});
    },
    getCompletions: function (word) {
	var completions = [];
	var maxlen = 0;
	var wordlen = word.length;
	var longestPrefix = null;
	this.list.forEach(function (item) {
	    if (word.length <= item.kw.length && !item.kw.lastIndexOf(word, 0)) {
		completions.push(item.kw.substr(wordlen));
	    }
	    if (!word.lastIndexOf(item.kw, 0) && item.kw.length > maxlen) {
		maxlen = item.kw.length;
		longestPrefix = item;
	    }
	});
	return {completions: completions, longestPrefix: longestPrefix};
    },
    contains: function (kw) {
	return this.map.hasOwnProperty(kw);
    }
});

var prefixKeywords = Keywords.instanciate();
var postfixKeywords = Keywords.instanciate();

prefixKeywords.updateWithObject(constants, "Constant");
prefixKeywords.updateWithObject(functions, "Function");
prefixKeywords.updateWithObject(prefixUnaryOps, "PrefixOp");

postfixKeywords.updateWithObject(infixBinaryOps, "InfixOp");
postfixKeywords.updateWithObject(postfixUnaryOps, "PostfixOp");

var directives = {
    color: function (color, target) {
	var colorExpr;
	if (target.operand) {
	    colorExpr = expr.color(target.operand, color);
	    target.parent.replaceChild(target, colorExpr);
	    return colorExpr;
	} else {
	    var editExpr = expr.editExpr();
	    colorExpr = expr.color(editExpr, color);
	    target.parent.replaceChild(target, colorExpr);
	    return editExpr;
	}
    }
};

var parser = {
    interpretNumber: function (input, target) {
	var numberExpr = expr.number(parseFloat(input));
	if (target.operand) {
	    target.parent.replaceChild(target, target.operand);
	    operations.mult(target.operand, numberExpr);
	} else {
	    target.parent.replaceChild(target, numberExpr);
	}
	return numberExpr;
    },
    interpretDirective: function (input, target) {
	input = input.substring(1, input.length - 1);
	var parts = input.split(":", 2);
	var cmd, args;
	if (parts.length == 1) {
	    cmd = input;
	    args = "";
	} else {
	    cmd = parts[0];
	    args = parts[1];
	}
	if (directives[cmd]) {
	    return directives[cmd](args, target);
	} else {
	    console && console.log("Unknown directive: " + cmd);
	    return target;
	}
    },
    interpretText: function (input, target) {
   var textExpr = expr.text(input);
   if (target.operand) {
       target.parent.replaceChild(target, target.operand);
       operations.mult(target.operand, textExpr);
   } else {
       target.parent.replaceChild(target, textExpr);
   }
   return textExpr;
    },
    interpretParameter: function (input, target) {
	var param = expr.parameter(input);
	if (target.operand) {
	    target.parent.replaceChild(target, target.operand);
	    operations.mult(target.operand, param);
	} else {
	    target.parent.replaceChild(target, param);
	}
	return param;
    },
    interpretFunction: function (func, target) {
	var arg = expr.editExpr();
	var parent = target.parent;
	func = func(arg);
	// The following is a hack for e.g. sin2xcosx to interpret as
	// (sin 2x)(cos x) rather than sin(2x cos x)
	// XXX
	if (operations.priorityMode) {
	    if (parent.isProduct && parent.parent.isTrigFunction) {
		parent = parent.removeChild(target) || parent;
		operations.mult(parent.parent, func);
		return arg;
	    }
	}
	target.parent.replaceChild(target, func);
	return arg;
    },
    interpretConstant: function (cons, target, k) {
	cons = expr.parameter(k, cons);
	target.parent.replaceChild(target, cons);
	return cons;
    },
    interpretPrefixOp: function (op, target) {
	return op(target);
    },
    interpretInfixOp: function (op, target) {
	target.parent.replaceChild(target, target.operand);
	return op(target.operand);
    },
    interpretPostfixOp: function (op, target) {
	target.parent.replaceChild(target, target.operand);
	return op(target.operand);
    },
    interpretKeyword: function (k, target) {
	return this['interpret' + k.type](k.value, target, k.kw);
    },
    interpret: function (target, input, ongoing) {
	var comp, newTarget, kw;
	if (input === undefined || input === null) {
	    input = target.content;
	}
	if (!input) {
	    if (target.isEditExpr) {
		if (target.operand) {
		    target.parent.replaceChild(target, target.operand);
		    target = target.operand;
		} else {
		    target.content = "";
		    target.resetCompletions();
		}
	    }
	    return target;
	}
	if (!target.isEditExpr) {
	    newTarget = expr.editExpr(input, target);
	    target.parent.replaceChild(target, newTarget);
	    target = newTarget;
	}
	// XXX Hack to prevent weird bug:
	target.content = null;
	if (input.charAt(0) === " ") {
	    // input starts with space: force interpretation of target
	    // then continue
	    target = this.interpret(target);
	    input = input.substr(1);
	    return this.interpret(target, input, ongoing);
	}
	var groups = /^\\[^\\]+\\/.exec(input);
	if (groups) {
	    // Input starts with a directive
	    var directive = groups[0];
	    if (directive.length === input.length) {
		// Input is just a directive
		if (ongoing) {
		    // Input ongoing so keep it as it is
		    target.content = input;
		    return target;
		}
		// Input finished so apply directive
		return this.interpretDirective(directive, target);
	    }
	    // There is more after the directive
	    target = this.interpretDirective(directive, target);
	    input = input.substr(directive.length);
	    return this.interpret(target, input, ongoing);
	}
	if (input.charAt(0) === "\\") {
	    // We're writing a directive but it's not finished
	    if (ongoing) {
		target.content = input;
		return target;
	    }
	    throw "unfinished directive";
	}
	groups = /^'[^']+'/.exec(input);
   if (groups) {
      // We have a text string
      var text = groups[0];
      if (text.length === input.length) {
      // Input is just a string
      if (ongoing) {
          // Input ongoing so keep it as it is
          target.content = input;
          return target;
      }
      // Input finished so replace with a Text expression
      return this.interpretText(text.substr(1, text.length - 2), target);
       }
       // There is more after the string so interpret the rest
       target = this.interpretText(text.substr(1, text.length - 2), target);
       input = input.substr(text.length);
       return this.interpret(target, input, ongoing);
   }
	groups = /^\d+(?:\.\d*)?/.exec(input);
	if (groups) {
	    // Input starts with a number
	    var number = groups[0];
	    if (number.length === input.length) {
		// Input is just a number
		if (ongoing) {
		    // Input ongoing so keep it as it is
		    target.content = input;
		    return target;
		}
		// Input finished so replace with a number expression
		return this.interpretNumber(number, target);
	    }
	    // There is more after the number so interpret the rest
	    target = this.interpretNumber(number, target);
	    input = input.substr(number.length);
	    return this.interpret(target, input, ongoing);
	}
	// Input doesn't start with a number.  Look for keywords
	if (target.operand) {
	    comp = postfixKeywords.getCompletions(input);
	} else {
	    comp = prefixKeywords.getCompletions(input);
	}
	if (comp.completions.length && ongoing) {
	    // There are keyword completions and input is ongoing so
	    // wait for more input
	    target.content = input;
	    if (input.length > 1) {
		target.setCompletions(comp.completions);
	    } else {
		target.resetCompletions();
	    }
	    return target;
	}
	// We are left with two cases:
	// 1. There are no completions
	// 2. There may be completions but input must be interpreted
	if (comp.longestPrefix) {
	    // Input starts with a keyword
	    kw = comp.longestPrefix.kw;
	    target = this.interpretKeyword(comp.longestPrefix, target);
	    if (kw.length === input.length) {
		// Input is just a keyword
		return target;
	    }
	    // There is more after the keyword so that needs interpreting
	    input = input.substr(kw.length);
	    return this.interpret(target, input, ongoing);
	}
	// We are in the situation where the input doesn't start with
	// a keyword and has no possible completions (or if it does
	// the whole input must be interpreted anyway).
	if (target.operand) {
	    // There is an operand so change to a product
	    target.parent.replaceChild(target, target.operand);
	    target = operations.mult(target.operand);
	    // XXX This is a hack to allow sin^2x to mean sin^2(x)
	    /*var gp = target.parent.parent;
	    if (gp.isTrigFunction && target.parent == gp.power) {
		target.parent.removeChild(target);
		target = gp.arg;
	    }*/
	    return this.interpret(target, input, ongoing);
	}
	// This means that the first letter must be a parameter
	if (!/^\w/.test(input)) {
	    // Input doesn't start with an alphanumeric character.
	    // For now, do not process it. XXX
	    target.content = input;
	    return target;
	}
	if (input.length === 1) {
	    // The input is just a parameter
	    if (ongoing) {
		// Input is ongoing, keep it as input
		target.content = input;
		target.resetCompletions();
		return target;
	    }
	    return this.interpretParameter(input, target);
	}
	// There is more input after the parameter so it's a product
	target = this.interpretParameter(input.charAt(0), target);
	input = input.substr(1);
	return this.interpret(target, input, ongoing);
    },
    confirmCompletion: function (e) {
	if (e.isEditExpr) { // XXX
	    if (e.getCurrentCompletion() !== null) {
		return this.interpret(e, e.content + e.getCurrentCompletion());
	    }
	}
	return e;
    },
    addChar: function (e, c) {
	if (c == "\r") { // XXX
	    return this.confirmCompletion(e);
	}
	var input = e.isEditExpr ? e.content + c : c;
	return this.interpret(e, input, true);
    },
    parse: function (input) {
	var edit = expr.editExpr();
	var root = expr.root(edit);
	this.interpret(edit, input.replace(/\s+/g, " "));
	return root;
    }
};

cvm.parse = {
    parser: parser,
    operations: operations,
    prefixKeywords: prefixKeywords,
    postfixKeywords: postfixKeywords,
    greekLowercase: greekLowercase,
    greekUppercase: greekUppercase
};

})(cvm);
