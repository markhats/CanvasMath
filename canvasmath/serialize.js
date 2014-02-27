var SimpleSerializer = {
    serialize: function (e, forceBrackets) {
	var s = this[e.__name__](e);
	if (forceBrackets || e.priority && e.priority <= e.parent.priority) {
	    s = "(" + s + ")";
	}
	return s;
    },
    RootExpression: function (e) {
	return this.serialize(this.expr);
    },
    Number: function (n) {
	return n.value.toString();
    },
    Parameter: function (p) {
	return p.name;
    },
    Negation: function (e) {
	return "-" + this.serialize(e.value);
    },
    Bracket: function (e) {
	return "(" + this.serialize(e.expr) + ")";
    },
    Sum: function (e) {
	var sum = "";
	var self = this;
	e.operands.forEach(function (op, i) {
	    if (op.isNegation) {
		sum += self.serialize(op);
	    } else {
		sum += (i ? "+" : "") + self.serialize(op);
	    }
	});
	return sum;
    },
    Product: function (e) {
	var self = this;
	return e.operands.
	    map(function (op) { return self.serialize(op); }).
	    join("*");
    },
    ArgumentList: function (e) {
	var self = this;
	return e.operands.
	    map(function (op) {return self.serialize(op);}).
	    join(", ");
    },
    FunctionApplication: function (e) {
	return this.serialize(e.func) + "[" + this.serialize(e.arglist) + "]";
    },
    Equation: function (e) {
	var self = this;
	return e.operands.
	    map(function (op) { return self.serialize(op); }).
	    join("=");
    },
    Power: function (e) {
	return this.serialize(e.base) + "^" + this.serialize(e.power);
    },
    Fraction: function (e) {
	return this.serialize(e.num) + "/" + this.serialize(e.den);
    },
    Sqrt: function (e) {
	if (e.nth) {
	    return this.serialize(e.nth) + " root " +
		    this.serialize(e.expr, true);
	} else {
	    return "sqrt" + this.serialize(e.expr, true);
	}
    },
    TrigFunction: function (e) {
	return e.name + this.serialize(e.arg, true);
    },
    Matrix: function (e) {
	var self = this;
	return "(" + e.rows.map(function (row) {
	    return row.map(function (item) { return self.serialize(item); }).
		join(", ");
	}).join("; ") + ")";
    },
    Abs: function (e) {
	return "abs" + this.serialize(e.child, true);
    },
    Floor: function (e) {
	return "floor" + this.serialize(e.child, true);
    },
    Ceiling: function (e) {
	return "ceiling" + this.serialize(e.child, true);
    },
    Factorial: function (e) {
	return this.serialize(e.child) + "!";
    },
    Conjugate: function (e) {
	return "conj" + this.serialize(e.child, true);
    }
};
SimpleSerializer = Prototype.specialise(SimpleSerializer);

var RPNSerializer = {
    serialize: function (e) {
	return this.serializeToStack(e).join(" ");
    },
    serializeToStack: function (e, stack) {
	if (!stack) {
	    stack = [];
	}
	this[e.__name__](e, stack);
	return stack;
    },
    RootExpression: function (e, stack) {
	this.serializeToStack(this.expr, stack);
    },
    Number: function (n, stack) {
	stack.push(n.value.toString());
    },
    Parameter: function (p, stack) {
	stack.push(p.name);
    },
    Negation: function (e, stack) {
	stack.push("neg");
	this.serializeToStack(e.value, stack);
    },
    Bracket: function (e, stack) {
    },
    Sum: function (e, stack) {
	var self = this;
	e.operands.forEach(function (op, i) {
	    var sign = null;
	    if (i) {
		if (op.isNegation) {

		    sign = "-";
		    op = op.value;
		} else {
		    sign = "+";
		}
	    }
	    self.serializeToStack(op, stack);
	    if (sign) {
		stack.push(sign);
	    }
	});
    },
    Product: function (e, stack) {
	var self = this;
	e.operands.forEach(function (op, i) {
	    self.serializeToStack(op, stack);
	    if (i) {
		stack.push("*");
	    }
	});
    },
    Equation: function (e, stack) {
	var self = this;
	e.operands.forEach(function (op, i) {
	    self.serializeToStack(op, stack);
	    if (i) {
		stack.push("==");
	    }
	});
    },
    Power: function (e, stack) {
	this.serializeToStack(e.base, stack);
	stack.push("^");
	this.serializeToStack(e.power, stack);
    },
    Fraction: function (e, stack) {
	this.serializeToStack(e.num, stack);
	stack.push("/");
	this.serializeToStack(e.den, stack);
    },
    Sqrt: function (e, stack) {
	this.serializeToStack(e.expr, stack);
	stack.push("sqrt");
    },
    TrigFunction: function (e, stack) {
	this.serializeToStack(e.arg, stack);
	stack.push(e.name);
    },
    Matrix: function (e) {
	var self = this;
	return "(" + e.rows.map(function (row) {
	    return row.map(function (item) { return self.serialize(item); }).
		join(", ");
	}).join("; ") + ")";
    }
};
RPNSerializer = Prototype.specialise(RPNSerializer);

var LaTeXSerializer = {
    serialize: function (e, noBrackets) {
	var s = this[e.__name__](e);
	if (!noBrackets && e.priority && e.priority <= e.parent.priority) {
	    s = "\\left(" + s + "\\right)";
	}
	return s;
    },
    RootExpression: function (e) {
	return this.serialize(this.expr);
    },
    Number: function (n) {
	return n.value.toString();
    },
    Parameter: function (p) {
	return (p.name !== p.value ? "\\" : "") + p.name;
    },
    Negation: function (e) {
	return "-" + this.serialize(e.value);
    },
    Bracket: function (e) {
	return "\\left(" + this.serialize(e.expr) + "\\right)";
    },
    Sum: function (e) {
	var sum = "";
	var self = this;
	e.operands.forEach(function (op, i) {
	    if (op.isNegation) {
		sum += self.serialize(op);
	    } else {
		sum += (i ? "+" : "") + self.serialize(op);
	    }
	});
	return sum;
    },
    Product: function (e) {
	var self = this;
	var bits = [];
	e.operands.forEach(function (op, i) {
	    if (i && op.needsFactorSeparator) {
		bits.push("\\times");
	    }
	    bits.push(self.serialize(op));
	});
	return bits.join(" ");
    },
    Equation: function (e) {
	var self = this;
	return e.operands.
	    map(function (op) { return self.serialize(op); }).
	    join("=");
    },
    Power: function (e) {
	return this.serialize(e.base) + "^{" + this.serialize(e.power, true) + "}";
    },
    Fraction: function (e) {
	var num = this.serialize(e.num, true);
	var den = this.serialize(e.den, true);
	return "\\frac{" + num + "}{" + den + "}";
    },
    Sqrt: function (e) {
	return "\\sqrt{" + this.serialize(e.expr) + "}";
    },
    TrigFunction: function (e) {
	return "\\"+e.name + " " + this.serialize(e.arg);
    },
    Matrix: function (e) {
	var self = this;
	var i;
	var arrayParams = "";
	for (i = 0; i < e.ncols; i++) {
	    arrayParams += "c";
	}
	var arrayContent = e.rows.map(function (row) {
	    return row.map(function (item) { return self.serialize(item); }).
		join(" & ");
	}).join("\\\\\n");
	return "\\left(\\begin{array}{" + arrayParams + "}\n" +
	    arrayContent +
	    "\n\\end{array}";
    }
};
LaTeXSerializer = Prototype.specialise(LaTeXSerializer);

var GeoGebraSerializer = {
    Parameter: function (e) {
	return e.value;
    },
    Matrix: function (e) {
	var self = this;
	return "{" + e.rows.map(function (row) {
	    return "{" + row.map(function (item) { return self.serialize(item); }).
		join(", ") + "}";
	}) + "}";
    }
};
GeoGebraSerializer = SimpleSerializer.specialise(GeoGebraSerializer);

var MaximaSerializer = {
    Parameter: function (e) {
	return (e.name !== e.value ? "%" : "") + e.name;
    },
    Matrix: function (e) {
	return "matrix(" + e.rows.map(function (row) {
	    return "[" +
		row.map(function (item) { return self.serialize(item); }).
		join(", ") + "]";
	}) + ")";
    }
};
MaximaSerializer = SimpleSerializer.specialise(MaximaSerializer);

var MathMLSerializer = {
    serialize: function (e, indent, indentStep, toHTML) {
	var bits = this.serializeToBits(e);
	return this.bitsToMathML(bits, indent || 0, indentStep || 2, toHTML);
    },
    serializeToBits: function (e) {
	var bits = [];
	this.objectToBits(this.exprToObject(e), bits);
	return bits;
    },
    exprToObject: function (e) {
	return this[e.__name__](e);
    },
    objectToBits: function (obj, bits) {
	var self = this;
	switch (typeof obj) {
	case "object":
	    if (!obj.children || obj.children.length === 0) {
		bits.push({
		    type: "emptyTag",
		    htmltext: "<" + obj.tag + ">" + "</" + obj.tag + ">",
		    // innerHTML doesn't like the following:
		    xmltext: "<" + obj.tag + "/>"
		});
		return;
	    }
	    bits.push({
		type: "openTag",
		text: "<" + obj.tag + ">"
	    });
	    obj.children.forEach(function (child) {
		self.objectToBits(child, bits);
	    });
	    bits.push({
		type: "closeTag",
		text: "</" + obj.tag + ">"
	    });
	    return;
	case "number":
	    bits.push({
		type: "text",
		text: obj.toString()
	    });
	    return;
	case "string":
	    bits.push({
		type: "text",
		text: obj
	    });
	    return;
	}
    },
    bitsToMathML: function (bits, indent, indentStep, toHTML) {
	var spaces = "                                                                                   ";
	var lines = [];
	var indentSpaces = spaces.substr(indent);
	var inlineTag = false;
	bits.forEach(function (bit, i) {
	    var emptyTag;
	    switch (bit.type) {
	    case "emptyTag":
		emptyTag = toHTML ? bit.htmltext : bit.xmltext;
		lines.push(spaces.substr(0, indent) + emptyTag);
		break;
	    case "openTag":
		lines.push(spaces.substr(0, indent) + bit.text);
		indent += indentStep;
		break;
	    case "text":
		inlineTag = bits[i + 1].type === "closeTag";
		if (inlineTag) {
		    lines[lines.length - 1] += bit.text;
		}
		break;
	    case "closeTag":
		indent -= indentStep;
		if (inlineTag) {
		    lines[lines.length - 1] += bit.text;
		    inlineTag = false;
		} else {
		    lines.push(spaces.substr(0, indent) + bit.text);
		}
		break;
	    }
	});
	return lines.join("\n");
    },
    apply: function (fn, args, quals) {
	var self = this;
	var fnObj;
	if (typeof fn === "string") {
	    fnObj = {tag: fn};
	} else {
	    fnObj = self.exprToObject(fn);
	}
	var applyArgs = [fnObj];
	if (quals) {
	    quals.forEach(function (qual) {
		applyArgs.push({
		    tag: qual.name,
		    children: [self.exprToObject(qual.value)]
		});
	    });
	}
	args.forEach(function (arg) {
	    applyArgs.push(self.exprToObject(arg));
	});
	return {
	    tag: "apply",
	    children: applyArgs
	};
    },
    RootExpression: function (e) {
	return this.exprToObject(e.expr);
    },
    Number: function (n) {
	return {
	    tag: "cn",
	    children: [n.value.toString()]
	};
    },
    Parameter: function (p) {
	var text;
	if (p.name === p.value) {
	    text = p.value;
	} else {
	    text = "&" + p.name + ";";
	}
	return {
	    tag: "ci",
	    children: [text]
	};
    },
    Subscript: function (e) {
	var args = [e.base];
	if (e.subscript.isArgumentList) {
	    args = args.concat(e.subscript.operands);
	} else {
	    args.push(e.subscript);
	}
	return this.apply("selector", args);
    },
    Negation: function (e) {
	return this.apply("minus", [e.value]);
    },
    Not: function (e) {
	return this.apply("not", [e.value]);
    },
    Bracket: function (e) {
	return this.exprToObject(e.expr);
    },
    Sum: function (e) {
	if (e.operands.length === 2 && e.operands[1].isNegation) {
	    return this.apply("minus", [e.operands[0], e.operands[1].value]);
	}
	return this.apply("plus", e.operands);
    },
    Product: function (e) {
	return this.apply("times", e.operands);
    },
    FunctionApplication: function (e) {
	var f = e.func;
	var args = e.arglist.operands;
	return this.apply(f, args);
    },
    Conjunction: function (e) {
	return this.apply("and", e.operands);
    },
    Disjunction: function (e) {
	return this.apply("or", e.operands);
    },
    Equation: function (e) {
	var self = this;
	var relations = [];
	var group, rel, lastExpr;
	e.operands.forEach(function (operand, i) {
	    if (i === 0) {
		lastExpr = operand;
	    } else if (operand.relation === rel) {
		group.push(operand.child);
		lastExpr = operand.child;
	    } else {
		if (group) {
		    relations.push(self.apply(rel, group));
		}
		group = [lastExpr, operand.child];
		rel = operand.relation;
		lastExpr = operand.child;
	    }
	});
	relations.push(this.apply(rel, group));
	if (relations.length === 1) {
	    return relations[0];
	} else {
	    relations.unshift({tag: 'and'});
	    return {
		tag: "apply",
		children: relations
	    };
	}
    },
    Power: function (e) {
	return this.apply("power", [e.base, e.power]);
    },
    Fraction: function (e) {
	var quals;
	if (e.num.isDifferential && e.den.isDifferential) {
	    quals = [{name: "bvar", value: e.den.child}];
	    return this.apply("diff", [e.num.child], quals);
	}
	return this.apply("divide", [e.num, e.den]);
    },
    Sqrt: function (e) {
	var quals = null;
	if (e.nth) {
	    quals =[{
		name: "degree",
		value: e.nth
	    }];
	}
	return this.apply("root", [e.expr], quals);
    },
    TrigFunction: function (e) {
	return this.apply(e.name, [e.arg]);
    },
    /* XXX Matrix: function (e) {
	var self = this;
	return "(" + e.rows.map(function (row) {
	    return row.map(function (item) { return self.serialize(item); }).
		join(", ");
	}).join("; ") + ")";
    }, */
    Abs: function (e) {
	return this.apply("abs", [e.child]);
    },
    Floor: function (e) {
	return this.apply("floor", [e.child]);
    },
    Ceiling: function (e) {
	return this.apply("ceiling", [e.child]);
    },
    Factorial: function (e) {
	return this.apply("factorial", [e.child]);
    },
    Conjugate: function (e) {
	return this.apply("conjugate", [e.child]);
    },
    OpOf: function (e, opname) {
	var quals = [];
	if (e.from) {
	    if (e.from.isEquation) {
		// XXX Not good: it is assumed below that the equation is
		// of the form e.g. i=0
		quals.push({name: "bvar", value: e.from.operands[0]});
		quals.push({name: "lowlimit", value: e.from.operands[1].child});
	    }
	}
	if (e.to) {
	    quals.push({name: "uplimit", value: e.to});
	}
	return this.apply(opname, [e.arg], quals);
    },
    SumOf: function (e) {
	return this.OpOf(e, "sum");
    },
    ProductOf: function (e) {
	return this.OpOf(e, "product");
    },
    IntegralOf: function (e) {
	var quals = [];
	var arg = e.arg;
	var bvar;
	if (arg.isProduct && arg.lastChild.isDifferential) {
	    bvar = arg.lastChild.child;
	    if (arg.operands.length > 2) {
		arg = expr.product(arg.operands.slice(0, -1));
	    } else {
		arg = arg.firstChild;
	    }
	} else if (arg.isFraction && arg.num.isDifferential) {
	    bvar = arg.num;
	    arg = expr.fraction(expr.number(1), arg.den);
	}
	if (bvar) {
	    quals.push({name: "bvar", value: bvar});
	}
	if (e.from) {
	    quals.push({name: "lowlimit", value: e.from});
	}
	if (e.to) {
	    quals.push({name: "uplimit", value: e.to});
	}
	return this.apply("int", [arg], quals);
    },
    Derivative: function (e) {
	var quals = [];
	if (e.variable) {
	    quals.push({name: "bvar", value: e.variable});
	}
	return this.apply("diff", [e.expr], quals);
    },
    Matrix: function (e) {
	var self = this;
	var rows = e.rows.map(function (row) {
	    return {
		tag: "matrixrow",
		children: row.map(function (x) {
		    return self.exprToObject(x);
		})
	    };
	});
	return {
	    tag: "matrix",
	    children: rows
	};
    },
    Piecewise: function (e) {
	var self = this;
	var pieces = e.operands.map(function (piece) {
	    if (piece.isConditionalExpression) {
		return {
		    tag: "piece",
		    children: [
			self.exprToObject(piece.expr),
			self.exprToObject(piece.condition)
		    ]
		};
	    } else {
		return {
		    tag: "otherwise",
		    children: [self.exprToObject(piece)]
		};
	    }
	});
	return {
	    tag: "piecewise",
	    children: pieces
	};
    }
};
MathMLSerializer = Prototype.specialise(MathMLSerializer);
