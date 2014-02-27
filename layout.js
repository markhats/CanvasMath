if (window.cvm === undefined) {
    cvm = {};
}

(function (cvm) {

var bx = cvm.box;

var Layout = {
    bindExpr: function (expr, key) {
	if (!this.boundExprs) {
	    this.boundExprs = [];
	}
	this.boundExprs.push({expr: expr, key: key});
    }
};
Layout = Prototype.specialise(Layout);

var LTrain = {
    __name__: "LTrain",
    __init__: function (elems) {
	this.elems = elems;
    },
    box: function () {
	var boxes = this.elems.map(function (elem) {
	    return elem.box();
	});
	var train = bx.Train.instanciate(boxes);
	train.bindLayout(this);
	return train;
    }
};
LTrain = Layout.specialise(LTrain);

var LText = {
    __name__: "LText",
    __init__: function (text, style) {
	this.text = text;
	this.style = style || {};
    },
    box: function () {
	var font = [];
	var style = this.style;
	var box;
	style.style && font.push(style.style);
	style.variant && font.push(style.variant);
	style.weight && font.push(style.weight);
	font.push(style.size || "20px");
	font.push(style.family || "serif");
	this.font = font.join(" ");
	box = bx.TextBox.instanciate(this.text, this.font);
	box.bindLayout(this);
	return box;
    }
};
LText = Layout.specialise(LText);

var LScale = {
    __name__: "LScale",
    __init__: function (elem, scale) {
	this.elem = elem;
	this.scale = scale;
    },
    box: function () {
	var box = bx.Scale.instanciate(this.elem.box(), this.scale);
	box.bindLayout(this);
	return box;
    }
};
LScale = Layout.specialise(LScale);

var LBracket = {
    __name__: "LBracket",
    __init__: function (elem, color) {
	this.elem = elem;
	this.color = color;
    },
    box: function () {
	var box = this.elem.box();
	var left = bx.Paren.instanciate(box);
	var right = bx.Paren.instanciate(box, true);
	if (this.color) {
	    left = bx.ColorBox.instanciate(this.color, left);
	    right = bx.ColorBox.instanciate(this.color, right);
	}
	var train = bx.Train.instanciate(left, box, right);
	left.bindLayout(this, "left");
	right.bindLayout(this, "right");
	train.bindLayout(this);
	return train;
    }
};
LBracket = Layout.specialise(LBracket);

var LLREnclosure = {
    __name__: "LLREnclosure",
    __init__: function (elem, left, right, color) {
	this.elem = elem;
	this.left = left;
	this.right = right;
	this.color = color;
    },
    box: function () {
	var box = bx.Stack.instanciate([
	    bx.VSpace.instanciate(2),
	    this.elem.box(),
	    bx.VSpace.instanciate(2)
	], 1);
	var left = this.left && bx.getElasticBox(this.left, box);
	var right = this.right && bx.getElasticBox(this.right, box);
	if (this.color) {
	    left = left && bx.ColorBox.instanciate(this.color, left);
	    right = right && bx.ColorBox.instanciate(this.color, right);
	}
	var boxes;
	if (left) {
	    boxes = [bx.HSpace.instanciate(2), left, bx.HSpace.instanciate(2)];
	} else {
	    boxes = [];
	}
	boxes.push(box);
	if (right) {
	    boxes.push(bx.HSpace.instanciate(2));
	    boxes.push(right);
	    boxes.push(bx.HSpace.instanciate(2));
	}
	var train = bx.Train.instanciate(boxes);
	left && left.bindLayout(this, "left");
	right && right.bindLayout(this, "right");
	train.bindLayout(this);
	return train;
    }
};
LLREnclosure = Layout.specialise(LLREnclosure);

var LSuperscript = {
    __name__: "LSuperscript",
    __init__: function (elem, superscript) {
	this.elem = elem;
	this.superscript = superscript;
    },
    box: function () {
	var box = this.elem.box();
	var supbox = this.superscript.box();
	var superscript = bx.Decoration.instanciate(supbox, box.width, box.ascent - 10 - supbox.descent);
	var decbox = bx.DecoratedBox.instanciate(box, [superscript]);
	decbox.bindLayout(this);
	return decbox;
    }
};
LSuperscript = Layout.specialise(LSuperscript);

var LSubscript = {
    __name__: "LSubscript",
    __init__: function (elem, subscript) {
	this.elem = elem;
	this.subscript = subscript;
    },
    box: function () {
	var box = this.elem.box();
	var supbox = this.subscript.box();
	var subscript = bx.Decoration.instanciate(supbox, box.width, box.descent + 10 - supbox.ascent);
	var decbox = bx.DecoratedBox.instanciate(box, [subscript]);
	decbox.bindLayout(this);
	return decbox;
    }
};
LSubscript = Layout.specialise(LSubscript);

var LTopAlign = {
    __name__: "LTopAlign",
    __init__: function (elem, superscript) {
	this.elem = elem;
	this.superscript = superscript;
    },
    box: function () {
	var box = this.elem.box();
	var supbox = this.superscript.box();
	var superscript = bx.Decoration.instanciate(supbox, box.width, box.ascent - supbox.ascent);
	var decbox = bx.DecoratedBox.instanciate(box, [superscript]);
	decbox.bindLayout(this);
	return decbox;
    }
};
LTopAlign = Layout.specialise(LTopAlign);

var LHSpace = {
    __name__: "LHSpace",
    __init__: function (width) {
	this.width = width;
    },
    box: function () {
	return bx.HSpace.instanciate(this.width);
    }
};
LHSpace = Layout.specialise(LHSpace);

var LVSpace = {
    __name__: "LVSpace",
    __init__: function (height) {
	this.height = height;
    },
    box: function () {
	return bx.VSpace.instanciate(this.height);
    }
};
LVSpace = Layout.specialise(LVSpace);

var LStack = {
    __name__: "LStack",
    __init__: function (elems, baseline) {
	this.elems = elems;
	this.baseline = baseline;
    },
    box: function () {
	var boxes = this.elems.map(function (el) { return el.box(); });
	var stack = bx.Stack.instanciate(boxes, this.baseline);
	stack.bindLayout(this);
	return stack;
    }
};
LStack = Layout.specialise(LStack);

var LHLine = {
    __name__: "LHLine",
    __init__: function (width, height) {
	this.width = width;
	this.height = height;
    },
    box: function () {
	var line = bx.HLine.instanciate(this.width, this.height);
	line.bindLayout(this);
	return line;
    }
};
LHLine = Layout.specialise(LHLine);

var LColor = {
    __name__: "LColor",
    __init__: function (color, elem) {
	this.color = color;
	this.elem = elem;
    },
    box: function () {
	var box = this.elem.box();
	var cbox = bx.ColorBox.instanciate(this.color, box);
	cbox.bindLayout(this);
	return cbox;
    }
};
LColor = Layout.specialise(LColor);

var LCursor = {
    __name__: "LCursor",
    __init__: function (elem) {
	this.elem = elem;
    },
    box: function () {
	var box = this.elem.box();
	var cbox = bx.Cursor.instanciate(box);
	cbox.bindLayout(this);
	return cbox;
    }
};
LCursor = Layout.specialise(LCursor);

var LFrame = {
    __name__: "LFrame",
    __init__: function (style, elem) {
	this.style = style;
	this.elem = elem;
    },
    box: function () {
	var box = this.elem.box();
	var fbox = bx.Frame.instanciate(this.style, box);
	fbox.bindLayout(this);
	return fbox;
    }
};
LFrame = Layout.specialise(LFrame);

var LSqrt = {
    __name__: "LSqrt",
    __init__: function (elem, nth) {
	this.elem = elem;
	this.nth = nth;
    },
    box: function () {
	var box = this.elem.box();
	var nthbox = this.nth && this.nth.box();
	var rbox = bx.RootSign.instanciate(box, nthbox);
	rbox.bindLayout(this);
	return rbox;
    }
};
LSqrt = Layout.specialise(LSqrt);

var LRaise = {
    __name__: "LRaise",
    __init__: function (height, elem) {
	this.height = height;
	this.elem = elem;
    },
    box: function () {
	var box = this.elem.box();
	var rbox = bx.RaiseBox.instanciate(this.height, box);
	rbox.bindLayout(this);
	return rbox;
    }
};
LRaise = Layout.specialise(LRaise);

var LTable = {
    __name__: "LTable",
    __init__: function (array, hspace, vspace, align) {
	this.rows = array;
	this.hspace = hspace;
	this.vspace = vspace;
	this.align = align;
    },
    box: function () {
	var brows = this.rows.map(function (row) {
	    return row.map(function (elem) {
		return elem.box();
	    });
	});
	var tbox = bx.Table.instanciate(brows, this.hspace, 
	    this.vspace, this.align);
	return tbox;
    }
};
LTable = Layout.specialise(LTable);

cvm.layout = {
    ofExpr: function (expr) {
	var l;
	if (expr.selected) {
	    expr = expr.selected;
	}
	return expr.layout(this);
    },
    select: function (l, editing) {
	if (editing) {
	    return this.cursor(l);
	    /*l = this.frame({background: "#DDDDDD"}, l);
	    return this.lrEnclosure(l, "", "|", "red");*/
	} else {
	    return this.frame({background: "#AAFFAA"}, l);
	}
    },
    train: function () {
	var elems = arguments;
        if (elems.length === 1) {
	    elems = elems[0];
	} else {
	    var filter = Array.prototype.filter;
	    elems = filter.call(elems, function () { return true; });
	}
	return LTrain.instanciate(elems);
    },
    text: function (text, style) {
	return LText.instanciate(text, style);
    },
    scale: function (elem, scale) {
	return LScale.instanciate(elem, scale);
    },
    bracket: function (elem, color) {
	return LLREnclosure.instanciate(elem, "(", ")", color);
    },
    lrEnclosure: function (elem, left, right, color) {
	return LLREnclosure.instanciate(elem, left, right, color);
    },
    superscript: function (elem, superscript) {
	return LSuperscript.instanciate(elem, superscript);
    },
    subscript: function (elem, subscript) {
	return LSubscript.instanciate(elem, subscript);
    },
    topAlign: function (elem, superscript) {
	return LTopAlign.instanciate(elem, superscript);
    },
    hspace: function (width) {
	return LHSpace.instanciate(width);
    },
    vspace: function (height) {
	return LVSpace.instanciate(height);
    },
    stack: function (elems, baseline) {
	return LStack.instanciate(elems, baseline);
    },
    hline: function (width, height) {
	return LHLine.instanciate(width, height);
    },
    color: function (color, elem) {
	return LColor.instanciate(color, elem);
    },
    cursor: function (elem) {
	return LCursor.instanciate(elem);
    },
    frame: function (style, elem) {
	return LFrame.instanciate(style, elem);
    },
    raise: function (height, elem) {
	return LRaise.instanciate(height, elem);
    },
    sqrt: function (elem, nth) {
	return LSqrt.instanciate(elem, nth);
    },
    table: function (array, hspace, vspace, align) {
	return LTable.instanciate(array, hspace, vspace, align);
    }
};

})(cvm);
