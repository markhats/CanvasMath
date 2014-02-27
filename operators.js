if (window.cvm === undefined) {
    cvm = {};
}

(function (cvm) {

var operators = {
    prefix: {},
    infix: {},
    postfix: {},
    addPrefix: function (name, value) {
	this.prefix[name] = value;
    },
    addInfix: function (name, value) {
	this.infix[name] = value;
    },
    addPostfix: function (name, value) {
	this.postfix[name] = value;
    },
    getPrefix: function (name) {
	return this.prefix[name];
    },
    getInfix: function (name) {
	return this.infix[name];
    },
    getPostfix: function (name) {
	return this.postfix[name];
    },
    simpleOperator: function (symbol, lspace, rspace) {
	if (lspace !== undefined) {
	    return {
		layout: function (layout) {
		    return layout.train(
			layout.hspace(lspace),
			layout.text(symbol),
			layout.hspace(rspace === undefined ? lspace : rspace)
		    );
		}
	    };
	} else {
	    return {
		layout: function (layout) {
		    return layout.text(symbol);
		}
	    };
	}
    },
    addSumOperator: function (name, prefixSymbol, infixSymbol) {
	if (prefixSymbol || prefixSymbol === "") {
	    this.addPrefix(name, this.simpleOperator(prefixSymbol));
	}
	if (infixSymbol || prefixSymbol === "") {
	    this.addInfix(name, this.simpleOperator(infixSymbol, 3));
	}
    }
};

operators.addSumOperator("empty", "", "");
operators.addSumOperator("plus", "+", "+");
operators.addSumOperator("minus", "\u2212", "\u2212");
operators.addSumOperator("plusMinus", "\u00b1", "\u00b1");
operators.addSumOperator("minusPlus", "\u2213", "\u2213");

operators.addInfix("times", operators.simpleOperator("\u00D7", 1));

operators.addInfix("eq", operators.simpleOperator("=", 5));
operators.addInfix("neq", operators.simpleOperator("\u2260", 5));
operators.addInfix("leq", operators.simpleOperator("\u2264", 5));
operators.addInfix("geq", operators.simpleOperator("\u2265", 5));
operators.addInfix("lt", operators.simpleOperator("<", 5));
operators.addInfix("gt", operators.simpleOperator(">", 5));

operators.addInfix("comma", operators.simpleOperator(",", 0, 3));

operators.addInfix("and", operators.simpleOperator("\u2227", 5));
operators.addInfix("or", operators.simpleOperator("\u2228", 5));
operators.addPrefix("not", operators.simpleOperator("\u00ac"));

operators.addPostfix("prime", operators.simpleOperator("\u2032", 2, 0));

operators.addPostfix("factorial", operators.simpleOperator("!"));

operators.addPrefix("sum", {
    layout: function (layout) {
	return layout.scale(layout.text("\u2211"), 1.5);
    }
});

operators.addPrefix("product", {
    layout: function (layout) {
	return layout.scale(layout.text("\u220F"), 1.5);
    }
});

operators.addPrefix("integral", {
    layout: function (layout) {
	return layout.train([
	    layout.scale(layout.text("\u222B"), 1.5),
		layout.hspace(5)
	]);
    }
});

cvm.operators = operators;

})(cvm);
