if (window.cvm === undefined) {
    cvm = {};
}

(function (cvm) {

if (cvm.expr !== undefined) {
    return;
}

var operators = cvm.operators;

if (operators === undefined) {
    throw "operators must be loaded";
}

var Expression = {
    __name__: "Expression",
    subLayout: function (layout, subexpr, bracketFlag) {
	var l = layout.ofExpr(subexpr);
	if (bracketFlag === true ||
	    bracketFlag !== false &&
	    !subexpr.isContainer && this.priority >= subexpr.priority) {
	    l = layout.bracket(l);
	}
	return l;
    },
    isNumber: function () {
	return false;
    },
    removeChild: function (e) {
	return null;
    },
    setPreviousSibling: function (prev, reciprocate) {
	this.previousSibling = prev;
	if (!prev && this.parent) {
	    this.parent.firstChild = this;
	} else if (reciprocate) {
	    prev.setNextSibling(this);
	}
    },
    setNextSibling: function (next, reciprocate) {
	this.nextSibling = next;
	if (!next && this.parent) {
	    this.parent.lastChild = this;
	} else if (reciprocate) {
	    next.setPreviousSibling(this);
	}
    },
    setRelations: function (parent, prev, next, reciprocate) {
	this.parent = parent;
	this.setNextSibling(next, reciprocate);
	this.setPreviousSibling(prev, reciprocate);
    },
    removeFromSiblings: function () {
	if (this.previousSibling) {
	    this.previousSibling.nextSibling = this.nextSibling;
	}
	if (this.nextSibling) {
	    this.nextSibling.previousSibling = this.previousSibling;
	}
	this.parent = null;
	this.nextSibling = null;
	this.previousSibling = null;
    },
    getSelection: function (expr) {
	var a, b, i;
	var child, start, stop;
	var myAncestors = [];
	if (!expr) {
	    return {expr: this};
	}
	for (a = this; !a.isRoot; a = a.parent) {
	    if (expr === a) {
		return {expr: a};
	    }
	    myAncestors.push(a);
	}
	for (a = expr; !a.isRoot; a = a.parent) {
	    if (a === this) {
		return {expr: a};
	    }
	    i = myAncestors.indexOf(a.parent);
	    if (i === 0) {
		return {expr: this};
	    } else if (i !== -1) {
		b = myAncestors[i - 1];
		for (child = a.parent.firstChild;; child = child.nextSibling) {
		    if (child === a) {
			start = a;
			stop = b;
			break;
		    } else if (child === b) {
			start = b;
			stop = a;
			break;
		    }
		}
		if (start === a.parent.firstChild
		    && stop === a.parent.lastChild) {
		    return {expr: a.parent};
		}
		return {expr: a.parent, start: start, stop: stop.nextSibling};
	    }
	}
	return null;
    },
    getPredecessor: function () {
	var e;
	if (this.previousSibling) {
	    e = this.previousSibling;
	    while (e.lastChild) {
		e = e.lastChild;
	    }
	    return e;
	}
	return this.parent;
    },
    getPredecessor2: function () {
	var e = this.lastChild;
	if (e) {
	    return e;
	} else {
	    for (e = this; !e.previousSibling; e = e.parent) {
		if (e.isRoot) {
		    return this;
		}
	    }
	    return e.previousSibling;
	}
    },
    getSuccessor2: function () {
	var e = this.nextSibling;
	if (e) {
	    while (e.firstChild) {
		e = e.firstChild;
	    }
	    return e;
	} else {
	    return this.parent.isRoot ? this : this.parent;
	}
    },
    getVPredecessor: function () {
	var e = this.getSiblingUp();
	if (e) {
	    while (e.firstChild) {
		e = e.getBottomChild();
	    }
	    return e;
	} else {
	    return this.parent.isRoot ? this : this.parent;
	}
    },
    getVSuccessor: function () {
	var e = this.getTopChild();
	if (e) {
	    return e;
	} else {
	    for (e = this; !e.getSiblingDown(); e = e.parent) {
		if (e.isRoot) {
		    return this;
		}
	    }
	    return e.getSiblingDown();
	}
    },
    getSiblingUp: function () {
	return this.parent.getNextChildUp(this);
    },
    getSiblingDown: function () {
	return this.parent.getNextChildDown(this);
    },
    getNextChildUp: function (child) {
	return child.previousSibling;
    },
    getNextChildDown: function (child) {
	return child.nextSibling;
    },
    getTopChild: function () {
	return this.firstChild;
    },
    getBottomChild: function () {
	return this.lastChild;
    },
    getRoot: function () {
	var e = this;
	while (e && !e.isRoot) {
	    e = e.parent;
	}
	return e;
    },
    getPreviousLeaf: function () {
	// Unused
	var e;
	for (e = this; !e.previousSibling; e = e.parent) {
	    if (e.isRoot) {
		return null;
	    }
	}
	e = e.previousSibling;
	while (e.lastChild) {
	    e = e.lastChild;
	}
	return e;
    },
    getNextLeaf: function () {
	// Unused
	var e = this;
	for (e = this; !e.nextSibling; e = e.parent) {
	    if (e.isRoot) {
		return null;
	    }
	}
	e = e.nextSibling;
	while (e.firstChild) {
	    e = e.firstChild;
	}
	return e;
    },
    setSelected: function (sel) {
	var p;
	this.selected = sel;
	// Following unused
	/*for (p = this; !p.isRoot; p = p.parent) {
	    p.containsSelection = true;
	}*/
    },
    clearSelected: function () {
	var p;
	this.selected = false;
	// Following unused
	/*for (p = this; !p.isRoot; p = p.parent) {
	    p.containsSelection = false;
	}*/
    },
    needsFactorSeparator: function () {
	return false;
    },
    sumSeparator: operators.infix.plus,
    getSumExpression: function () {
	return this;
    }
};
Expression = Prototype.specialise(Expression);

var FixedChildrenExpression = {
    __name__: "FixedChildrenExpression",
    childProperties: [], // This needs to be set
    optionalProperties: {}, // this needs to be set
    vOrder: [], // this needs to be set
    __init__: function () {
	var initArgs = arguments;
	var lastChildIndex = this.childProperties.length - 1;
	var prev, next;
	var self = this;
	this.childProperties.forEach(function (prop, i) {
	    var arg = initArgs[i];
	    var next = i < lastChildIndex ? initArgs[i + 1] : undefined;
	    if (arg) {
		self[prop] = arg;
		arg.parentIndex = i;
		arg.setRelations(self, prev, next);
	    }
	    prev = arg;
	});
    },
    copy: function() {
	var self = this;
	var childCopies = this.childProperties.map(function (prop) {
	    var child = self[prop];
	    return child && child.copy();
	});
	var copy = this.__proto__.specialise();
	copy.__init__.apply(copy, childCopies);
	return copy;
    },
    replaceChild: function (oldChild, newChild) {
	var i = oldChild.parentIndex;
	var prop = this.childProperties[i];
	newChild.parentIndex = i;
	this[prop] = newChild;
	newChild.setRelations(this,
	    oldChild.previousSibling, oldChild.nextSibling, true);
	oldChild.setRelations();
    },
    removeChild: function (child) {
	var self = this;
	var nonEmptyChildCount = 0;
	var nonEmptyChild = null;
        this.childProperties.forEach(function (prop) {
	    var ch = self[prop];
            if (ch !== child && ch && !(ch.isEditExpr && ch.isEmpty())) {
		nonEmptyChildCount++;
		nonEmptyChild = ch;
	    }
	});
	var i = child.parentIndex;
	var prop = this.childProperties[i];
	if (self.optionalProperties[prop]) {
	    self[prop] = null;
	    child.removeFromSibling();
	    return null;
	} else if (nonEmptyChildCount > 1) {
	    this.replaceChild(child, EditExpr());
	    return null;
	} else if (nonEmptyChildCount == 1) {
	    this.parent.replaceChild(this, nonEmptyChild);
	    return nonEmptyChild;
	} else {
	    return this.parent.removeChild(this);
	}
    },
    getTopChild: function () {
	var i, e;
	for (i = 0; i < this.vOrder.length; i++) {
	    e = this[this.vOrder[i]];
	    if (e) {
		return e;
	    }
	}
	return null;
    },
    getBottomChild: function () {
	var i, e;
	for (i = this.vOrder.length; i >= 0; i--) {
	    e = this[this.vOrder[i]];
	    if (e) {
		return e;
	    }
	}
	return null;
    },
    getNextChildUp: function (child) {
	var prop = this.childProperties[child.parentIndex];
	var i = this.vOrder.indexOf(prop);
	return this[this.vOrder[i - 1]] || null;
    },
    getNextChildDown: function (child) {
	var prop = this.childProperties[child.parentIndex];
	var i = this.vOrder.indexOf(prop);
	return this[this.vOrder[i + 1]] || null;
    }
};
FixedChildrenExpression = Expression.specialise(FixedChildrenExpression);


var OneChildExpression = {
    __name__: "OneChildExpression",
    __init__: function (child) {
	var initArgs = arguments;
	var self = this;
	this.child = child;
	child.setRelations(this);
	if (this.extraProperties) {
	    this.extraProperties.forEach(function (prop, i) {
		self[prop] = initArgs[i + 1];
	    });
	}
    },
    copy: function () {
	var initArgs, self;
	if (!this.extraProperties) {
	    return this.__proto__.instanciate(this.child.copy());
	} else {
	    self = this;
	    initArgs = [this.child.copy()];
	    this.extraProperties.forEach(function (prop) {
		initArgs.push(self[prop]);
	    });
	    return this.__proto__.instanciate.apply(this.__proto__, initArgs);
	};
    },
    replaceChild: function (oldChild, newChild) {
	if (this.child === oldChild) {
	    this.child = newChild;
	    newChild.setRelations(this);
	    oldChild.setRelations();
	    return true;
	}
	return false;
    },
    removeChild: function (child) {
	if (this.child === child) {
	    return this.parent.removeChild(this);
	} else {
	    return null;
	}
    }
};
OneChildExpression = Expression.specialise(OneChildExpression);

var RootExpression = {
    __name__: "RootExpression",
    isRoot: true,
    __init__: function (expr) {
	this.parent = this;
	this.expr = expr;
	expr.setRelations(this, null, null);
    },
    layout: function (layout) {
	var l = layout.ofExpr(this.expr);
	l.bindExpr(this);
	return l;
    },
    replaceChild: function (oldChild, newChild) {
	if (oldChild === this.expr) {
	    this.expr = newChild;
	    newChild.setRelations(this, null, null);
	    oldChild.setRelations();
	    return newChild;
	}
	return null;
    }
};
RootExpression = Expression.specialise(RootExpression);

var Number_ = {
    __name__: "Number",
    __init__: function (value) {
	this.value = value;
    },
    layout: function (layout) {
	var ltext = layout.text(this.value.toString());
	ltext.bindExpr(this);
	return ltext;
    },
    isNumber: function () {
	return true;
    },
    copy: function () {
	return expr.number(this.value);
    },
    needsFactorSeparator: function () {
	return true;
    }
};
Number_ = Expression.specialise(Number_);

var Parameter = {
    __name__: "Parameter",
    __init__: function (name, value) {
	this.name = name;
	this.value = value || name;
    },
    layout: function (layout) {
	var options = null;
	if (this.value.length === 1) {
	    options = {style: "italic"};
	}
	var ltext = layout.text(this.value, options);
	ltext.bindExpr(this);
	return ltext;
    },
    copy: function () {
	return expr.parameter(this.name, this.value);
    }
};
Parameter = Expression.specialise(Parameter);

var Subscript = {
    __name__: "Subscript",
    childProperties: ["base", "subscript"],
    vOrder: ["base", "subscript"],
    layout: function (layout) {
	var l = layout.subscript(
	    this.subLayout(layout, this.base),
	    layout.scale(layout.ofExpr(this.subscript), 0.8)
	);
	l.bindExpr(this);
	return l;
    }
};
Subscript = FixedChildrenExpression.specialise(Subscript);


var PrefixOperation = {
    __name__: "PrefixOperation",
    isPrefixOperation: true,
    childProperties: ["value"],
    vOrder: ["value"],
    layout: function (layout) {
	var lneg = this.prefixOp.layout(layout);
	var lval = this.subLayout(layout, this.value);
	var ltrain = layout.train(lneg, lval);
	lneg.bindExpr(this, "prefix");
	ltrain.bindExpr(this);
	return ltrain;
    },
    getSumExpression: function () {
	return this.value;
    }
};
PrefixOperation = FixedChildrenExpression.specialise(PrefixOperation);

var Negation = {
    __name__: "Negation",
    isNegation: true,
    prefixOp: operators.prefix.minus,
    sumSeparator: operators.infix.minus
};
Negation = PrefixOperation.specialise(Negation);

var PlusMinus = {
    __name__: "PlusMinus",
    isPlusMinus: true,
    prefixOp: operators.prefix.plusMinus,
    sumSeparator: operators.infix.plusMinus
};
PlusMinus = PrefixOperation.specialise(PlusMinus);

var MinusPlus = {
    __name__: "MinusPlus",
    isMinusPlus: true,
    prefixOp: operators.prefix.minusPlus,
    sumSeparator: operators.infix.minusPlus
};
MinusPlus = PrefixOperation.specialise(MinusPlus);

var Not = {
    __name__: "Not",
    isNot: true,
    prefixOp: operators.prefix.not
};
Not = PrefixOperation.specialise(Not);

var Bracket = {
    __name__: "Bracket",
    isBracket: true,
    isContainer: true,
    childProperties: ["expr"],
    vOrder: ["expr"],
    layout: function (layout) {
	var lbracket;
	var lexpr = layout.ofExpr(this.expr);
	lbracket = layout.bracket(lexpr, "red");
	// lbracket = layout.frame({border: "red", width: 1}, lexpr);
	lbracket.bindExpr(this);
	return lbracket;
    }
};
Bracket = FixedChildrenExpression.specialise(Bracket);

var VarLenOperation = {
    __name__: "VarLenOperation",
    isVarLenOperation: true,
    __init__: function () {
	var self = this;
	var i;
	var operands = arguments[0];
	if (arguments.length !== 1 || !operands instanceof Array) {
	    operands = [];
	    for (i = 0; i < arguments.length; i++) {
		operands.push(arguments[i]);
	    }
	}
	this.operands = operands;
	operands.forEach(function (t, i) {
	    t.setRelations(self, operands[i - 1], operands[i + 1]);
	});
    },
    fromSlice: function (slice) {
	var op;
	var operands = [];
	for (op = slice.start; op !== slice.stop; op = op.nextSibling) {
	    operands.push(op.copy());
	}
	return this.__proto__.instanciate(operands);
    },
    pushOp: null,
    layout: function (layout) {
	var self = this;
	var train = [];
	var ltrain;
	this.operands.forEach(function (op, i) {
	    self.pushOp(layout, train, i);
	});
	ltrain = layout.train(train);
	ltrain.bindExpr(this);
	return ltrain;
    },
    slicedLayout: function (layout, slice) {
	var self = this;
	var left = [];
	var right = [];
	var middle = [];
	var train = left;
	var ltrain;
	this.operands.forEach(function (op, i) {
	    switch (op) {
		case slice.start:
		    train = middle;
		    break;
		case slice.stop:
		    train = right;
		    break;
	    }
	    self.pushOp(layout, train, i);
	});
	left = layout.train(left);
	middle = layout.train(middle);
	right = layout.train(right);
	ltrain = layout.train([left, middle, right]);
	ltrain.bindExpr(this);
	return ltrain;
    },
    copy: function () {
	return this.__proto__.instanciate(this.operands.map(function (t) {
	    return t.copy();
	}));
    },
    replaceChild: function (oldChild, newChild, noAggregate) {
	var self = this;
	return this.operands.some(function (t, i, operands) {
	    var res;
	    if (t === oldChild) {
		res = self.insertAfter(t, newChild, noAggregate);
		self.removeChild(t);
		return res;
	    }
	    return null;
	});
    },
    removeChild: function (child) {
	var i = this.operands.indexOf(child);
	if (i === -1) {
	    return null;
	}
	child.setRelations();
	if (this.operands.length === 2 && !this.oneOperandPossible) {
	    this.parent.replaceChild(this, this.operands[1 - i]);
	    return this.operands[1 - i];
	} else {
	    this.operands.splice(i, 1);
	    if (i) {
		this.operands[i - 1].setNextSibling(this.operands[i]);
	    }
	    if (i < this.operands.length) {
		this.operands[i].setPreviousSibling(this.operands[i - 1]);
	    }
	    return null;
	}
    },
    removeSlice: function (slice) {
	var operands = this.operands;
	var len = operands.length;
	var i = slice.start ? operands.indexOf(slice.start) : 0;
	var j = slice.stop ? operands.indexOf(slice.stop) : len;
	var sliceLen = j - i;
	switch (len - sliceLen) {
	    case 0:
		this.parent.removeChild(this);
		return true;
	    case 1:
		if (!this.oneOperandPossible) {
		    this.parent.replaceChild(this, operands[i ? 0 : j]);
		    return true;
		}
	    default:
		if (i) {
		    operands[i - 1].setNextSibling(operands[j]);
		}
		if (j < len) {
		    operands[j].setPreviousSibling(operands[i - 1]);
		}
		operands.splice(i, sliceLen);
		return true;
	}
    },
    replaceSlice: function (slice, newOperand) {
	this.insertBefore(slice.start, newOperand);
	this.removeSlice(slice);
	return true;
    },
    insertAt: function (i, newOperand) {
	var prev, next;
	var self = this;
	if (i < 0 || i > this.operands.length) {
	    return false;
	}
	if (!newOperand.isGroup && newOperand.__proto__ === this.__proto__) {
	    // Same type so aggregate both operations
	    newOperand.operands.forEach(function (op, j) {
		self.insertAt(i + j, op);
	    });
	} else {
	    prev = this.operands[i - 1];
	    next = this.operands[i];
	    this.operands.splice(i, 0, newOperand);
	    newOperand.setRelations(this, prev, next, true);
	}
	return true;
    },
    insertAfter: function (operand, newOperand) {
	var i = this.operands.indexOf(operand);
	if (i === -1) {
	    return false;
	}
	return this.insertAt(i + 1, newOperand);
    },
    insertBefore: function (operand, newOperand) {
	var i = this.operands.indexOf(operand);
	if (i === -1) {
	    return false;
	}
	return this.insertAt(i, newOperand);
    }
};
VarLenOperation = Expression.specialise(VarLenOperation);

var Sum = {
    __name__: "Sum",
    pushOp: function (layout, train, i, forceOp) {
	var op;
	var term = this.operands[i];
	if (i) {
	    if (term.selected) {
		if (term.isPrefixOperation) {
		    op = operators.infix.empty.layout(layout);
		} else {
		    op = Expression.sumSeparator.layout(layout);
		}
		op.bindExpr(term);
	    } else {
		op = term.sumSeparator.layout(layout);
		op.bindExpr(term);
		term = term.getSumExpression();
	    }
	    train.push(op);
	}
	train.push(this.subLayout(layout, term));
    }
};
Sum = VarLenOperation.specialise(Sum);

var ExprWithRelation = {
    __name__: "ExprWithRelation",
    isExprWithRelation: true,
    extraProperties: ['relation']
};
ExprWithRelation = OneChildExpression.specialise(ExprWithRelation);

var Equation = {
    __name__: "Equation",
    isProposition: true,
    isEquation: true,
    fromSlice: function (slice) {
	var op;
	var operands = [];
	for (op = slice.start; op !== slice.stop; op = op.nextSibling) {
	    if (op == slice.start && op.isExprWithRelation) {
		operands.push(op.child.copy());
	    } else {
		operands.push(op.copy());
	    }
	}
	return this.__proto__.instanciate(operands);
    },
    pushOp: function (layout, train, i, forceOp) {
	var op;
	var operand = this.operands[i];
	var relation;
	if (i) {
	    if (operand.isExprWithRelation) {
		relation = operand.relation;
		operand = operand.child;
	    } else {
		relation = 'eq';
	    }
	    op = operators.infix[relation].layout(layout);
	    train.push(op);
	    op.bindExpr(operand);
	}
	train.push(this.subLayout(layout, operand));
    }
};
Equation = VarLenOperation.specialise(Equation);

var Product = {
    __name__: "Product",
    isProduct: true,
    subLayout: function (layout, subexpr) {
	// This is to prevent standard functions which are factors from
        // being surrounded in brackets
	if (subexpr.isTrigFunction) {
	    var space = layout.hspace(2);
	    var ltrain = layout.train([space, layout.ofExpr(subexpr), space]);
	    return ltrain;
	}
	return Expression.subLayout.call(this, layout, subexpr);
    },
    pushOp: function (layout, train, i, forceOp) {
	var op;
	var factor = this.operands[i];
	if (i && (factor.needsFactorSeparator())) {
	    op = operators.infix.times.layout(layout);
	    train.push(op);
	    op.bindExpr(this, i);
	}
	train.push(this.subLayout(layout, factor));
    }
};
Product = VarLenOperation.specialise(Product);

var ArgumentList = {
    __name__: "ArgumentList",
    isArgumentList: true,
    oneOperandPossible: true,
    pushOp: function (layout, train, i, forceOp) {
	var op;
	if (i) {
	    op = operators.infix.comma.layout(layout);
	    train.push(op);
	    op.bindExpr(this, i);
	}
	train.push(this.subLayout(layout, this.operands[i]));
    },
    insertAfterInRow: function (arg, newArg) {
	return this.insertAfter(arg, newArg);
    }
};
ArgumentList = VarLenOperation.specialise(ArgumentList);

var CoordsList = {
    __name__: "CoordsList",
    isArgumentList: true,
    oneOperandPossible: true,
    pushOp: function (layout, train, i, forceOp) {
   var op;
   if (i) {
       op = operators.infix.comma.layout(layout);
       train.push(op);
       op.bindExpr(this, i);
   }
   train.push(this.subLayout(layout, this.operands[i]));
    },
    layout: function (layout) {
   var self = this;
   var train = [];
   var ltrain;
   this.operands.forEach(function (op, i) {
       self.pushOp(layout, train, i);
   });
   ltrain = layout.train(train);
   var lbracket = layout.lrEnclosure(ltrain, "(", ")");
   ltrain.bindExpr(this);
   lbracket.bindExpr(this, "bracket");
   return layout.raise(4, lbracket);
    },
    insertAfterInRow: function (arg, newArg) {
   return this.insertAfter(arg, newArg);
    }
};
CoordsList = VarLenOperation.specialise(CoordsList);

var Text = {
    __name__: "Text",
     __init__: function (content) {
   this.content = content || "";
    },
    layout: function (layout) {
   var ltext = layout.text(this.content);
   var space = layout.hspace(3);
   var ltrain = layout.train([space, ltext, space]);
   ltrain.bindExpr(this);
   return ltrain;
    },
    copy: function () {
   return expr.text(this.content);
    }
};
Text = Expression.specialise(Text);


var Conjunction = {
    __name__: "Conjunction",
    isConjunction: true,
    pushOp: function (layout, train, i, forceOp) {
	var op;
	if (i) {
	    op = operators.infix.and.layout(layout);
	    train.push(op);
	    op.bindExpr(this, i);
	}
	train.push(this.subLayout(layout, this.operands[i]));
    }
};
Conjunction = VarLenOperation.specialise(Conjunction);

var Disjunction = {
    __name__: "Disjunction",
    isDisjunction: true,
    pushOp: function (layout, train, i, forceOp) {
	var op;
	if (i) {
	    op = operators.infix.or.layout(layout);
	    train.push(op);
	    op.bindExpr(this, i);
	}
	train.push(this.subLayout(layout, this.operands[i]));
    }
};
Disjunction = VarLenOperation.specialise(Disjunction);

var ConditionalExpression = {
    __name__: "ConditionalExpression",
    isConditionalExpression: true,
    childProperties: ["expr", "condition"],
    layout: function (layout) {
	if (this.expr.isConjunction) {
	    var rows = this.expr.operands.map(function (e) {
		return [layout.ofExpr(e)];
	    });
	    var lrows = layout.table(rows, 10, 2, "l");
	    var lbr = layout.lrEnclosure(lrows, null, "}");
	    var lconj = layout.raise(4, lbr);
	    var ltrain = layout.train([lconj, layout.ofExpr(this.condition)]);
	    ltrain.bindExpr(this);
	    return ltrain;
	} else {
	    var lexpr = this.subLayout(layout, this.expr);
	    var lop = operators.infix.comma.layout(layout);
	    var lcond = this.subLayout(layout, this.condition);
	    var ltrain = layout.train([lexpr, lop, lcond]);
	    ltrain.bindExpr(this);
	    return ltrain;
	}
    }
};
ConditionalExpression = FixedChildrenExpression.specialise(ConditionalExpression);

var Piecewise = {
    __name__: "Piecewise",
    isPiecewise: true,
    isContainer: true,
    layout: function (layout) {
	var rows = this.operands.map(function (piece) {
	    if (piece.isConditionalExpression) {
		return [layout.ofExpr(piece.expr), layout.ofExpr(piece.condition)];
	    } else {
		return [layout.ofExpr(piece), layout.text("otherwise")];
	    }
	});
	var lrows = layout.table(rows, 10, 2, "ll");
	var lbr = layout.lrEnclosure(lrows, "{", null);
	var l = layout.raise(4, lbr);
	l.bindExpr(this);
	return l;
    }
};
Piecewise = VarLenOperation.specialise(Piecewise);

var Parametric = {
    __name__: "Parametric",
    isParametric: true,
    __init__: function (equations, domain) {
	this.equations = equations;
    },
    layout: function (layout) {
	var leqs = layout.stack(this.equations.operands);
	var lbr = layout.lrEnclosure(leqs, null, "}");
	var ldom = layout.ofExpr(this.domain);
    }
};

var FunctionApplication = {
    __name__: "FunctionApplication",
    isFunctionApplication: true,
    childProperties: ["func", "arglist"],
    layout: function (layout) {
	var lfunc = layout.ofExpr(this.func);
	var largs = layout.bracket(layout.ofExpr(this.arglist), "blue");
	var ltrain = layout.train([lfunc, largs]);
	ltrain.bindExpr(this);
	return ltrain;
    }
};
FunctionApplication = FixedChildrenExpression.specialise(FunctionApplication);

var Power = {
    __name__: "Power",
    isPower: true,
    childProperties: ["base", "power"],
    vOrder: ["power", "base"],
    subLayout: function (layout, subexpr) {
	// This is to make sure roots are surrounded in brackets.
	// The general rule fails to do this as roots are containers
	var l = Expression.subLayout.call(this, layout, subexpr);
	if (subexpr === this.base && subexpr.isSqrt) {
	    l = layout.bracket(l);
	}
	return l;
    },
    layout: function (layout) {
	var bLayout = this.subLayout(layout, this.base);
	var pLayout = layout.ofExpr(this.power);
	var ls = layout.superscript(bLayout, layout.scale(pLayout, 0.8));
	ls.bindExpr(this);
	return ls;
    },
    needsFactorSeparator: function () {
	return this.base.needsFactorSeparator();
    }
};
Power = FixedChildrenExpression.specialise(Power);

var Fraction = {
    __name__: "Fraction",
    isFraction: true,
    childProperties: ["num", "den"],
    vOrder: ["num", "den"],
    __init__: function (num, den, keepScale) {
	FixedChildrenExpression.__init__.call(this, num, den);
	this.scaleDown = !keepScale;
    },
    layout: function (layout) {
	var line = layout.hline(null, 1);
	var vspace = layout.vspace(2);
	var hspace = layout.hspace(4);
	var den = layout.train([hspace, layout.ofExpr(this.den), hspace]);
	var num = layout.train([hspace, layout.ofExpr(this.num), hspace]);
	var stack = layout.stack([den, vspace, line, vspace, num], 1);
	stack.bindExpr(this);
	line.bindExpr(this, "line");
	if (this.scaleDown) {
	     stack = layout.scale(stack, 0.8);
	} else {
	    return stack;
	}
	return layout.raise(4, stack);
    },
    needsFactorSeparator: function () {
	return true;
    }
};
Fraction = FixedChildrenExpression.specialise(Fraction);

var Sqrt = {
    __name__: "Sqrt",
    isContainer: true,
    isSqrt: true,
    __init__: function (expr, nth) {
	this.expr = expr;
	this.nth = nth;
	if (nth) {
	    nth.setRelations(this, null, expr);
	}
	expr.setRelations(this, nth, null);
    },
    layout: function (layout) {
	var l = layout.ofExpr(this.expr);
	var lnth = this.nth && layout.scale(layout.ofExpr(this.nth), 0.8);
	var lroot = layout.sqrt(l, lnth);
	lroot.bindExpr(this);
	return lroot;
    },
    copy: function () {
	return expr.sqrt(this.expr.copy(), this.nth && this.nth.copy());
    },
    replaceChild: function (oldChild, newChild) {
	if (oldChild === this.expr) {
	    this.expr = newChild;
	    newChild.setRelations(this, this.nth, null, true);
	    oldChild.setRelations();
	    return true;
	} else if (oldChild === this.nth) {
	    this.nth = newChild;
	    newChild.setRelations(this, null, this.expr, true);
	    oldChild.setRelations();
	    return true;
	}
	return false;
    },
    removeChild: function (child) {
	if (child === this.nth) {
	    this.parent.replaceChild(this, this.expr);
	    return this.parent;
	} else if (child === this.expr) {
	    if (this.nth) {
		this.parent.replaceChild(this, this.nth);
		return this.parent;
	    } else {
		return this.parent.removeChild(this);
	    }
	} else {
	    return null;
	}
    }
};
Sqrt = Expression.specialise(Sqrt);

var TrigFunction = {
    __name__: "TrigFunction",
    isTrigFunction: true,
    __init__: function (name, arg, power) {
	this.name = name;
	this.arg = arg;
	this.power = power;
	this.arg.setRelations(this);
	if (power) {
	    this.power.setRelations(this, null, arg, true);
	}
    },
    subLayout: function (layout, subexpr) {
	// If subexpr is a product containing at least one standard
	// function then it must be surrounded in brackets
	var trigFactor;
	if (subexpr.isProduct) {
	     trigFactor = subexpr.operands.some(function (op) {
		return op.isTrigFunction;
	     });
	     if (trigFactor) {
		 return layout.bracket(layout.ofExpr(subexpr));
	     }
	}
	return Expression.subLayout.call(this, layout, subexpr);
    },
    layout: function (layout) {
	var lname = layout.text(this.name);
	var lspace = layout.hspace(3);
	var larg = this.subLayout(layout, this.arg);
	var lpower;
	if (this.power) {
	    lpower = layout.ofExpr(this.power);
	    lname = layout.superscript(lname, layout.scale(lpower, 0.8));
	}
	var l = layout.train([lname, lspace, larg]);
	l.bindExpr(this);
	return l;
    },
    copy: function () {
	return expr.trigFunction(
	    this.name,
	    this.arg.copy(),
	    this.power && this.power.copy()
	);
    },
    replaceChild: function (oldChild, newChild) {
	if (oldChild === this.arg) {
	    this.arg = newChild;
	    oldChild.setRelations();
	    newChild.setRelations(this, this.power, null, true);
	    return true;
	} else if (oldChild === this.power) {
	    this.power = newChild;
	    oldChild.setRelations();
	    newChild.setRelations(this, null, this.arg, true);
	    return true;
	}
	return false;
    },
    removeChild: function (child) {
	if (child === this.arg) {
	    return this.parent.removeChild(this);
	} else if (child === this.power) {
	    this.power = undefined;
	    this.arg.setRelations(this);
	    child.setRelations();
	}
	return null;
    },
    getTopChild: function () {
	return this.power || this.arg;
    },
    getBottomChild: function () {
	return this.arg;
    },
    getNextChildUp: function (child) {
	if (child === this.arg) {
	    return this.power;
	} else {
	    return null;
	}
    },
    getNextChildDown: function (child) {
	if (child === this.power) {
	    return this.arg;
	} else {
	    return null;
	}
    }
};
TrigFunction = Expression.specialise(TrigFunction);

var Matrix = {
    __name__: "Matrix",
    isMatrix: true,
    isContainer: true,
    __init__: function (array) {
	var self = this;
	var lastItem = null;
	this.rows = array;
	this.ncols = array.reduce(function (m, r) {
	    return Math.max(m, r.length);
	}, 0);
	this.nrows = array.length;
	this.rows.forEach(function (row, i) {
	    row.forEach(function (item, j) {
		var nextItem;
		if (j + 1 === self.ncols) {
		    nextItem = self.getItemAt(i + 1, 0);
		} else {
		    nextItem = self.getItemAt(i, j + 1);
		}
		item.setRelations(self, lastItem, nextItem);
		lastItem = item;
	    });
	});

    },
    getItemAt: function (i, j) {
	var row = this.rows[i];
	return row && row[j];
    },
    layout: function (layout) {
	var lrows = this.rows.map(function (row) {
	    return row.map(function (item) {
		return layout.ofExpr(item);
	    });
	});
	var ltable = layout.table(lrows, 7, 2);
	var lbracket = layout.lrEnclosure(ltable, "[", "]");
	ltable.bindExpr(this);
	lbracket.bindExpr(this, "bracket");
	return layout.raise(4, lbracket);
    },
    copy: function () {
	return expr.matrix(this.rows.map(function (row) {
	    return row.map(function (item) { return item.copy(); });
	}));
    },
    findChild: function (child, callback) {
	var self = this;
	return this.rows.some(function (row, i) {
	    return row.some(function (item, j) {
		if (item === child) {
		    callback(row, i, item, j);
		    return true;
		}
		return false;
	    });
	});
    },
    replaceChild: function (oldChild, newChild) {
	var self = this;
	return this.findChild(oldChild, function (row, i, item, j) {
	    newChild.setRelations(self, item.previousSibling, item.nextSibling, true);
	    row[j] = newChild;
	    oldChild.setRelations();
	});
    },
    removeChild: function (child) {
	var self = this;
	return this.findChild(child, function (row, i, item, j) {
	    var prev = child.previousSibling;
	    var next = child.nextSibling;
	    var nItems = self.rows.reduce(function (x, y) {
		return x + y.length;
	    }, 0);
	    if (nItems === 2) {
		self.parent.replaceChild(self, prev || next);
		return prev || next;
	    } else if (row.length === 1) {
		self.rows.splice(i, 1);
	    } else {
		row.splice(j, 1);
	    }
	    if (prev) {
		prev.setNextSibling(next, true);
	    } else {
		next.setPreviousSibling(prev, true);
	    }
	    child.setRelations();
	    return null;
	});
    },
    insertAfterInRow: function (oldItem, newItem) {
	var self = this;
	return this.findChild(oldItem, function (row, i, item, j) {
	    newItem.setRelations(self, item, item.nextSibling, true);
	    row.splice(j + 1, 0, newItem);
	});
    },
    insertRowAfter: function (oldItem, newRow) {
	var self = this;
	return this.findChild(oldItem, function (row, i, item, j) {
	    newRow.forEach(function (newItem, k) {
		newItem.setRelations(self,
		    newRow[k - 1] || row[row.length - 1],
		    newRow[k + 1] || self.rows[i + 1] && self.rows[i + 1][0],
		    true);
	    });
	    self.rows.splice(i + 1, 0, newRow);
	});
    },
    getNextChildUp: function (child) {
	var self = this;
	var next = null;
	this.findChild(child, function (row, i, item, j) {
	    if (i > 0) {
	        next = self.rows[i - 1][j];
	    }
	});
	return next;
    },
    getNextChildDown: function (child) {
	var self = this;
	var next = null;
	this.findChild(child, function (row, i, item, j) {
	    if (i < self.rows.length) {
	        next = self.rows[i + 1][j];
	    }
	});
	return next;
    },
    needsFactorSeparator: function () {
	return true;
    }
};
Matrix = Expression.specialise(Matrix);

var EditExpr = {
    __name__: "EditExpr",
    isEditExpr: true,
    __init__: function (content, operand) {
	this.content = content || "";
	this.operand = operand;
	this.resetCompletions();
    },
    layout: function (layout) {
	var lcontent = layout.text(this.content || "?");
	var lcolor = layout.color("red", lcontent);
	var comp, lcomp, lcompcolor, ltrain, ledit;
	lcontent.bindExpr(this);
	if (this.completionIndex === -1) {
	    ledit = lcolor;
	} else {
	    comp = this.completions[this.completionIndex];
	    lcomp = layout.text(comp);
	    lcompcolor = layout.color("gray", lcomp);
	    ltrain = layout.train([lcolor, lcompcolor]);
	    ltrain.bindExpr(this);
	    ledit = ltrain;
	}
	if (this.operand) {
	    return layout.train([layout.ofExpr(this.operand), ledit]);
	} else {
	    return ledit;
	}
    },
    copy: function () {
	return expr.editExpr(this.content, this.operand);
    },
    isEmpty: function () {
	return !this.content;
    },
    isInteger: function () {
	return /^\d+$/.test(this.content);
    },
    isDecimal: function () {
	return /^\d+\.\d*$/.test(this.content);
    },
    resetCompletions: function () {
	this.completions = [];
	this.completionIndex = -1;
    },
    setCompletions: function (completions) {
	this.completions = completions;
	this.completionIndex = 0;
    },
    cycleCompletions: function () {
	if (this.completionIndex !== -1) {
	    this.completionIndex++;
	    this.completionIndex %= this.completions.length;
	}
    },
    getCurrentCompletion: function () {
	if (this.completionIndex !== -1) {
	    return this.completions[this.completionIndex];
	} else {
	    return "";
	}
    },
    needsFactorSeparator: function () {
	if (this.operand) {
	    return this.operand.needsFactorSeparator();
	}
	return /^\d/.test(this.content);
    }
};
EditExpr = Expression.specialise(EditExpr);

var Fencing = {
    __name__: "Fencing",
    isContainer: true,
    layout: function (layout) {
	var lvalue = layout.ofExpr(this.child);
	var labs = layout.lrEnclosure(lvalue,
		this.leftFence, this.rightFence);
	labs.bindExpr(this);
	return labs;
    }
};
Fencing = OneChildExpression.specialise(Fencing);

var Abs = {
    __name__: "Abs",
    leftFence: "|",
    rightFence: "|"
};
Abs = Fencing.specialise(Abs);

var Ceiling = {
    __name__: "Ceiling",
    leftFence: "|+",
    rightFence: "+|"
};
Ceiling = Fencing.specialise(Ceiling);

var Floor = {
    __name__: "Floor",
    leftFence: "|_",
    rightFence: "_|"
};
Floor = Fencing.specialise(Floor);

var Conjugate = {
    __name__: "Conjugate",
    isContainer: true,
    layout: function(layout) {
	var lvalue = layout.ofExpr(this.child);
	var line = layout.hline(null, 1);
	var vspace = layout.vspace(2);
	var stack = layout.stack([lvalue, vspace, line], 0);
	stack.bindExpr(this);
	line.bindExpr(this, "line");
	return stack;
    }
};
Conjugate = OneChildExpression.specialise(Conjugate);

var Factorial = {
    __name__: "Factorial",
    layout: function (layout) {
	var lvalue = this.subLayout(layout, this.child);
	var excl = operators.getPostfix("factorial").layout(layout);
	var ltrain = layout.train([lvalue, excl]);
	ltrain.bindExpr(this);
	return ltrain;
    }
};
Factorial = OneChildExpression.specialise(Factorial);

var OpOf = {
    __name__: "OpOf",
    isOpOf: true,
    childProperties: ["arg", "from", "to"],
    optionalProperties: {from: true, to: true},
    layout: function (layout) {
	var stack = [];
	var i = 0;
	var lstack, ltrain;
	if (this.from) {
	    stack.push(layout.scale(layout.ofExpr(this.from), 0.8));
	    i = 1;
	}
	stack.push(this.operator.layout(layout));
	if (this.to) {
	    stack.push(layout.scale(layout.ofExpr(this.to), 0.8));
	}
	lstack = layout.stack(stack, i);
	ltrain = layout.train(lstack, this.subLayout(layout, this.arg));
	ltrain.bindExpr(this);
	return ltrain;
    },
    setFrom: function (newFrom) {
	if (this.from) {
	    this.from.setRelations();
	}
	this.from = newFrom;
	newFrom.setRelations(this, this.arg, this.to, true);
    },
    setTo: function (newTo) {
	if (this.to) {
	    this.to.setRelations();
	}
	this.to = newTo;
	newTo.setRelations(this, this.from, null, true);
    }
};
OpOf = FixedChildrenExpression.specialise(OpOf);

var SumOf = {
    __name__: "SumOf",
    isSumOf: true,
    operator: operators.getPrefix("sum")
};
SumOf = OpOf.specialise(SumOf);

var ProductOf = {
    __name__: "ProductOf",
    isProductOf: true,
    operator: operators.getPrefix("product")
};
ProductOf = OpOf.specialise(ProductOf);

var IntegralOf = {
    __name__: "IntegralOf",
    isIntegralOf: true,
    operator: operators.getPrefix("integral")
};
IntegralOf = OpOf.specialise(IntegralOf);

var Differential = {
    __name__: "Differential",
    isDifferential: true,
    layout: function (layout) {
	var ld = layout.text("d");
	var lvar = this.subLayout(layout, this.child);
	var l = layout.train([ld, lvar]);
	l.bindExpr(this);
	return l;
    }
};
Differential = OneChildExpression.specialise(Differential);

var Derivative = {
    __name__: "Derivative",
    isDerivative: true,
    childProperties: ["expr", "variable"],
    optionalProperties: {variable: true},
    layout: function (layout) {
	var ltrain;
	if (!this.variable) {
	    ltrain = layout.topAlign(
		this.subLayout(layout, this.expr),
		operators.getPostfix("prime").layout(layout)
	    );
	    ltrain.bindExpr(this);
	    return ltrain;
	} else {
	    var frac = expr.fraction(
		expr.parameter("d"),
		expr.differential(this.variable)
	    );
	    var diff = expr.applyFunction(frac, this.expr);
	    var ldiff = layout.ofExpr(diff);
	    ldiff.bindExpr(this);
	    return ldiff;
	}
    }
};
Derivative = FixedChildrenExpression.specialise(Derivative);

var ColorExpr = {
    __name__: "ColorExpr",
    extraProperties: ["color"],
    __init__: function () {
	OneChildExpression.__init__.apply(this, arguments);
	this.priority = this.child.priority;
    },
    layout: function (layout) {
	return layout.color(this.color, this.child.layout(layout));
    },
    replaceChild: function () {
	OneChildExpression.replaceChild.apply(this, arguments);
	this.priority = this.child.priority;
    }
};
ColorExpr = OneChildExpression.specialise(ColorExpr);

//
// Set priorities
//

var priorities = [
    [Number_, 100],
    [Parameter, 100],
    [EditExpr, 100],
    [Bracket, 97],
    [Subscript, 96.5],
    [FunctionApplication, 96.5],
    [Derivative, 96.5],
    [Not, 96.4],
    [Factorial, 96],
    [Differential, 96],
    [Sqrt, 95],
    [Abs, 95],
    [Ceiling, 95],
    [Floor, 95],
    [Conjugate, 95],
    [Power, 90],
    [Fraction, 80],
    [Product, 50],
    [SumOf, 40],
    [ProductOf, 40],
    [IntegralOf, 40],
    [TrigFunction, 40],
    [Negation, 20],
    [Sum, 10],
    [Matrix, 7],
    [ExprWithRelation, 5.1],
    [Equation, 5],
    [ConditionalExpression, 4.5],
    [Piecewise, 4.2],
    [Conjunction, 4],
    [Disjunction, 3]
];

priorities.forEach(function (pl) {
    pl[0].priority = pl[1];
});

var expr = cvm.expr = {
    Number: Number_,
    Parameter: Parameter,
    EditExpr: EditExpr,
    Bracket: Bracket,
    Subscript: Subscript,
    FunctionApplication: FunctionApplication,
    Derivative: Derivative,
    Not: Not,
    Factorial: Factorial,
    Differential: Differential,
    Sqrt: Sqrt,
    Abs: Abs,
    Ceiling: Ceiling,
    Floor: Floor,
    Conjugate: Conjugate,
    Power: Power,
    Fraction: Fraction,
    Product: Product,
    SumOf: SumOf,
    ProductOf: ProductOf,
    IntegralOf: IntegralOf,
    TrigFunction: TrigFunction,
    Negation: Negation,
    Sum: Sum,
    Matrix: Matrix,
    ExprWithRelation: ExprWithRelation,
    Equation: Equation,
    ConditionalExpression: ConditionalExpression,
    Piecewise: Piecewise,
    Conjunction: Conjunction,
    Disjunction: Disjunction,

    number: function (n) {
	return Number_.instanciate(n);
    },
    parameter: function (name, value) {
	return Parameter.instanciate(name, value);
    },
    subscript: function (base, subscript) {
	return Subscript.instanciate(base, subscript);
    },
    neg: function (x) {
	return Negation.instanciate(x);
    },
    plusMinus: function (x) {
	return PlusMinus.instanciate(x);
    },
    minusPlus: function (x) {
	return MinusPlus.instanciate(x);
    },
    not: function (x) {
	return Not.instanciate(x);
    },
    brackets: function (x) {
	return Bracket.instanciate(x);
    },
    sum: function (terms) {
	return Sum.instanciate(terms);
    },
    argumentList: function (args) {
	return ArgumentList.instanciate(args);
    },
    coordsList: function (args) {
   return CoordsList.instanciate(args);
    },
    text: function (args) {
   return Text.instanciate(args);
    },
    applyFunction: function (f, arglist) {
	return FunctionApplication.instanciate(f, arglist);
    },
    product: function (factors) {
	return Product.instanciate(factors);
    },
    conjunction: function (props) {
	return Conjunction.instanciate(props);
    },
    disjunction: function (props) {
	return Disjunction.instanciate(props);
    },
    conditionalExpression: function (expr, cond) {
	return ConditionalExpression.instanciate(expr, cond);
    },
    piecewise: function (pieces) {
	return Piecewise.instanciate(pieces);
    },
    power: function (x, y) {
	return Power.instanciate(x, y);
    },
    fraction: function (x, y) {
	return Fraction.instanciate(x, y);
    },
    editExpr: function (content, operand) {
	return EditExpr.instanciate(content, operand);
    },
    root: function (e) {
	return RootExpression.instanciate(e);
    },
    sqrt: function (e, nth) {
	return Sqrt.instanciate(e, nth);
    },
    abs: function (e) {
	return Abs.instanciate(e);
    },
    ceiling: function (e) {
	return Ceiling.instanciate(e);
    },
    conjugate: function (e) {
	return Conjugate.instanciate(e);
    },
    factorial: function (e) {
	return Factorial.instanciate(e);
    },
    floor: function (e) {
	return Floor.instanciate(e);
    },
    trigFunction: function (name, e, pow) {
	return TrigFunction.instanciate(name, e, pow);
    },
    matrix: function (array) {
	return Matrix.instanciate(array);
    },
    sumOf: function (e, from, to) {
	return SumOf.instanciate(e, from, to);
    },
    productOf: function (e, from, to) {
	return ProductOf.instanciate(e, from, to);
    },
    integralOf: function (e, from, to) {
	return IntegralOf.instanciate(e, from, to);
    },
    differential: function (e) {
	return Differential.instanciate(e);
    },
    derivative: function (e, v) {
	return Derivative.instanciate(e, v);
    },
    exprWithRelation: function (e, r) {
	return ExprWithRelation.instanciate(e, r);
    },
    equation: function (ops) {
	return Equation.instanciate(ops);
    },
    drawOnNewCanvas: function (e) {
	var canvas = document.createElement("canvas");//$("<canvas/>")[0];
	// Following for IE8
	if (canvas.getContext === undefined) {
	    G_vmlCanvasManager.initElement(canvas);
	}
	this.drawOnCanvas(e, canvas);
	return canvas;
    },
    drawOnCanvas: function (e, canvas) {
	var box = cvm.layout.ofExpr(e).box();
	e.box = box;
	canvas.style.verticalAlign = box.descent + "px";
	canvas.width = box.width + 2; // + 2 for IE9...
	canvas.height = box.height + 1;
	var ctx = canvas.getContext("2d");
	box.drawOnCanvas(ctx, 0.5, box.ascent + 0.5);
	return canvas;
    },
    color: function (e, color) {
	return ColorExpr.instanciate(e, color);
    }
};


})(cvm);
