var parser = cvm.parse.parser;
var operations = cvm.parse.operations;
var expr = cvm.expr;
var layout = cvm.layout;

var forEachBinding = function (box, x, y, callback) {
    box.getContainers(x, y).forEach(function (c) {
	if (!c.box.boundLayouts) {
	    return;
	}
	c.box.boundLayouts.forEach(function (l) {
	    if (!l.layout.boundExprs) {
		return;
	    }
	    l.layout.boundExprs.forEach(function (e) {
		callback(c, l, e);
	    });
	});
    });
};

var getFirstBoundExpr = function (box, x, y) {
    var res;
    try {
	forEachBinding(box, x, y, function (c, l, e) {
	    res = e.expr;
	    throw "found";
	});
    } catch (err) {
	if (err === "found") {
	    return res;
	}
	throw err;
    }
};

var Clipboard = Prototype.specialise({
    __init__: function () {
	this.expr = null;
    },
    copy: function (e) {
	this.expr = e;
    },
    paste: function () {
	return this.expr;
    }
});

var Selection = Prototype.specialise({
    __init__: function (s) {
	this.reset(s);
    },
    replace: function (newExpr) {
	if (this.isSlice) {
	    this.expr.replaceSlice(this, newExpr);
	} else {
	    this.expr.parent.replaceChild(this.expr, newExpr);
	}
    },
    remove: function () {
	var newParent;
	if (!this.expr) {
	    return null;
	}
	newParent = this.expr.parent;
	if (this.isSlice) {
	    this.expr.removeSlice(this);
	} else {
	    newParent = this.expr.parent.removeChild(this.expr) || newParent;
	}
	this.reset({expr: null});
	return newParent;
    },
    copyToClipboard: function (clipboard) {
	var expr;
	if (!this.expr) {
	    return;
	}
	if (this.isSlice) {
	    expr = this.expr.fromSlice(this);
	} else {
	    expr = this.expr.copy();
	}
	clipboard.copy(expr);
    },
    pasteFromClipboard: function (clipboard) {
	if (!this.expr) {
	    return;
	}
	var expr = clipboard.paste().copy();
	if (!expr) {
	    return;
	}
	if (this.isEditing()) {
	    this.reset({expr: parser.interpret(this.expr)});
	}
	// XXX Does not always work.
	this.replace(expr);
	this.reset({expr: expr});
	this.setEditing();
    },
    layout: function (layout) {
	if (this.isSlice) {
	    var l = this.expr.slicedLayout(layout, this);
	    l.elems[1] = layout.select(l.elems[1]);
	    return l;
	} else {
	    return layout.select(this.expr.layout(layout), this.editing);
	}
    },
    reset: function (s) {
	this.set(s);
	if (s) {
	    this.stack = [s];
	    this.index = 0;
	} else {
	    this.stack = [];
	    this.index = null;
	}
    },
    set: function (s) {
	this.clearEditing();
	if (this.expr && s && s.expr !== this.expr) {
	    this.expr.clearSelected();
	    if (this.expr.isEditExpr && this.expr.parent) {
		parser.interpret(this.expr);
	    }
	}
	if (s && s.expr) {
	    this.expr = s.expr;
	    this.expr.setSelected(this);
	    this.start = s.start;
	    this.stop = s.stop;
	    this.isSlice = (s.start || s.stop) && s.expr.slicedLayout;
	} else {
	    this.expr = this.start = this.stop = null;
	    this.isSlice = false;
	}
    },
    setEditing: function () {
	if (!this.editing) {
	    $("#editor-buttons").show();
	    $("#hi-editor-buttons").hide();
	}
	this.editing = true;
    },
    clearEditing: function () {
	if (this.editing) {
	    $("hi-editor-buttons").show();
	    $("editor-buttons").hide();
	}
	this.editing = false;
    },
    isEditing: function () {
	return this.editing;
    },
    moveUp: function () {
	var s;
	if (!this.expr) {
	    return;
	}
	this.reset({expr: this.expr.getVPredecessor()});
	this.setEditing();
    },
    moveDown: function () {
	var s;
	if (!this.expr) {
	    return;
	}
	this.reset({expr: this.expr.getVSuccessor()});
	this.setEditing();
    },
    moveLeft: function () {
	this.reset({expr: this.expr.getPredecessor2()});
	this.setEditing();
    },
    moveRight: function () {
	this.reset({expr: this.expr.getSuccessor2()});
	this.setEditing();
    }
});

var PositionedExpressions = Prototype.specialise({
    __name__: "PositionedExpressions",
    __init__: function () {
	this.exprs = [];
    },
    add: function (expr, x, y) {
	this.exprs.push({
	    expr: expr,
	    box: layout.ofExpr(expr).box(),
	    x: x,
	    y: y
	});
    },
    remove: function (expr) {
	return this.exprs.some(function (item, i, items) {
	    if (item.expr === expr) {
		items.splice(i, 1);
		return true;
	    }
	    return false;
	});
    },
    update: function (expr) {
	return this.exprs.some(function (item) {
	    if (item.expr === expr) {
		item.box = layout.ofExpr(expr).box();
		return true;
	    }
	    return false;
	});
    },
    findFirstAt: function (x, y) {
	var i, item;
	for (i = 0; i < this.exprs.length; i++) {
	    item = this.exprs[i];
	    if (item.box.contains(x - item.x, y - item.y)) {
		return item;
	    }
	}
	return null;
    },
    drawOnCanvas: function (ctx) {
	this.exprs.forEach(function (item) {
	    // XXX This needs to be done only when necessary
	    item.box = layout.ofExpr(item.expr).box();
	    item.box.drawOnCanvas(ctx, item.x, item.y);
	});
    }
});

var SimpleButton = Prototype.specialise({
    action: function (selection) {
	var e = selection.expr;
	var e1;
	if (selection.isEditing()) {
	    e = parser.interpret(e);
	    if (this.isPostfix && e.isEditExpr && e.isEmpty() && !e.operand) {
		selection.reset({expr: this.getExpr(e).parent.firstChild});
		selection.setEditing();
	    } else {
		e1 = parser.addChar(e, this.getInput(e));
		selection.reset({expr: e1});
		selection.setEditing();
	    }
	} else if (selection.isSlice) {
	    var r = expr.root(e.fromSlice(selection));
	    e1 = this.getExpr(r.expr);
	    e.replaceSlice(selection, r.expr);
	    selection.reset({expr: e1});
	} else {
	    selection.reset({expr: this.getExpr(e)});
	}
    }
});

var powerButton = SimpleButton.specialise({
    isPostfix: true,
    getInput: function (e) { return  " ^ "; },
    getExpr: function (e) { return operations.pow(e); }
});

var subscriptButton = SimpleButton.specialise({
    isPostfix: true,
    getInput: function (e) { return " _ "; },
    getExpr: function (e) { return operations.subscript(e); }
});

var sqrtButton = SimpleButton.specialise({
    getInput: function (e) { return " sqrt "; },
    getExpr: function (e) {
	var e1 = e.copy();
	e.parent.replaceChild(e, expr.sqrt(e1));
	return e1;
    }
});

var cbrtButton = SimpleButton.specialise({
    getInput: function (e) { return " 3 root "; },
    getExpr: function (e) {
	var n = expr.number(3);
	e.parent.replaceChild(e, n);
	return operations.nthRoot(n, e);
    }
});

var rootButton = SimpleButton.specialise({
    isPostfix: true,
    getInput: function (e) { return " root "; },
    getExpr: function (e) { return operations.nthRoot(e); }
});

var fractionButton = SimpleButton.specialise({
    isPostfix: true,
    getInput: function (e) { return " / "; },
    getExpr: function (e) { return operations.frac(e); }
});

var testOnLoad = function () {
    var selection = Selection.instanciate();
    var shortcuts = KeyboardShortcuts.instanciate();
    var clipboard = Clipboard.instanciate();
    var posexprs = PositionedExpressions.instanciate();
    var serializers = {
	Simple: SimpleSerializer,
	RPN: RPNSerializer,
	LaTeX: LaTeXSerializer,
	GeoGebra: GeoGebraSerializer,
	Maxima: MaximaSerializer,
	MathML: MathMLSerializer
    };
    Object.forEachItem(serializers, function (s) {
	if (serializers.hasOwnProperty(s)) {
	    $("#serializer").append($("<option/>", {name: s, text: s}));
	}
    });
    var currentSerializer = serializers.Simple;
    var exprBox;
    var mouseDownExpr;
    var mouseCoords;
    var copyShortcut = shortcuts.add('C-c', function () {
	selection.copyToClipboard(clipboard);
    });
    var pasteShortcut = shortcuts.add('C-v', function () {
	selection.pasteFromClipboard(clipboard);
	drawExprs();
    });
    var cutShortcut = shortcuts.add('C-x', function () {
	if (selection.expr) {
	    selection.copyToClipboard(clipboard);
	} else {
	    return;
	}
	if (!selection.isSlice && selection.expr.parent.isRoot) {
	    posexprs.remove(selection.expr.parent);
	} else {
	    selection.remove();
	}
	selection.reset({expr: null});
	drawExprs();
    });
    var createShortcut = shortcuts.add('C-e', function (e) {
	if (!mouseCoords) { return; };
	var ed = expr.editExpr();
	var newExpr = expr.root(ed);
	e.preventDefault();
	e.stopPropagation();
	posexprs.add(newExpr, mouseCoords.x, mouseCoords.y);
	selection.reset({expr: ed});
	selection.setEditing();
	drawExprs();
    });
    var serializeShortcut = shortcuts.add('C-s', function (e) {
	e.preventDefault();
	e.stopPropagation();
	if (selection.expr) {
	    $("#serialization").val(currentSerializer.serialize(selection.expr));
	}
    });
    cvm.box.init();
    var _canvas = $("#testcvs")[0];
    if (!_canvas.getContext) {
	G_vmlCanvasManager.initElement(_canvas);
    }
    var ctx = _canvas.getContext("2d");
    var drawExprs = function () {
	ctx.clearRect(0, 0, 800, 400);
	posexprs.drawOnCanvas(ctx);
    };
    var lastKeyDownIsShortcut = false;
    drawExprs();
    $(document).keydown(function (e) {
	var sel, s;
	// This is for Firefox
	lastKeyDownIsShortcut = shortcuts.callFromEvent(e);
	if (lastKeyDownIsShortcut) {
	    e.preventDefault();
	    e.stopPropagation();
	    return;
	}
	switch (e.which) {
	    case KEY.UP:
		e.preventDefault();
		e.stopPropagation();
		selection.moveUp();
		break;
	    case KEY.DOWN:
		e.preventDefault();
		e.stopPropagation();
		selection.moveDown();
		break;
	    case KEY.LEFT:
		e.preventDefault();
		e.stopPropagation();
		selection.moveLeft();
		break;
	    case KEY.RIGHT:
		e.preventDefault();
		e.stopPropagation();
		selection.moveRight();
		break;
	    case KEY.BACKSPACE: // Backspace
		e.preventDefault();
		e.stopPropagation();
		if (selection.expr) {
		    if (selection.expr.isEditExpr) {
			s = selection.expr.content;
			if (s) {
			    s = s.substr(0, s.length - 1);
			    parser.interpret(selection.expr, s, true);
			} else {
			    var pred = selection.expr.getPredecessor();
			    var newParent = selection.remove();
			    if (pred.isRoot) {
				posexprs.remove(pred);
			    } else {
				selection.reset({expr: newParent || pred});
			    }
			}
		    } else {
			sel = expr.editExpr();
			selection.replace(sel);
			selection.reset({expr: sel});
		    }
		    selection.setEditing();
		}
		break;
	    case KEY.TAB: // Tab
		e.preventDefault();
		e.stopPropagation();
		if (selection.expr && selection.expr.isEditExpr) {
		    selection.expr.cycleCompletions();
		}
		break;
	    default:
		return;
	}
	drawExprs();
    });
    $(document).keypress(function (e) {
	var c;
	// XXX check that following cannot be simplified to charCode = e.which;
	var charCode = e.which == 13 ? 13 : e.keyCode; // Used to be e.charCode - changed to e.keyCode for IE8 compatibility
	// This is for Firefox
	if (lastKeyDownIsShortcut) {
	    return;
	}
	if (!charCode) {
	    return;
	}
	// Input character
	c = String.fromCharCode(charCode);
	if (selection.isSlice) {
	    var r = root(selection.expr.fromSlice(selection));
	    var e2 = parser.addChar(r.firstChild, c);
	    if (e2) {
		selection.expr.replaceSlice(selection, r.firstChild);
	    }
	    selection.reset({expr: e2});
	} else if (selection.expr) {
	    selection.reset({expr: parser.addChar(selection.expr, c)});
	}
	selection.setEditing();
	drawExprs();
    });
    $("#testcvs").mousedown(function (e) {
	var coords = getEventCoords(e, this);
	var item = posexprs.findFirstAt(coords.x, coords.y);
	var target = null;
	if (item) {
	    target = getFirstBoundExpr(
		item.box,
		coords.x - item.x, coords.y - item.y
	    );
	}
	mouseDownExpr = target;
	selection.reset({expr: target});
	selection.setEditing();
	drawExprs();
    });
    $("#testcvs").mouseout(function (e) {
	mouseCoords = null;
    });
    $("#testcvs").mousemove(function (e) {
	var coords = mouseCoords = getEventCoords(e, this);
	if (!mouseDownExpr) {
	    return;
	}
	var item = posexprs.findFirstAt(coords.x, coords.y);
	if (!item) {
	    return;
	}
	var target = getFirstBoundExpr(
	    item.box,
	    coords.x - item.x, coords.y - item.y
	);
	if (mouseDownExpr) {
	    var s = mouseDownExpr.getSelection(target);
	    selection.reset(s);
	} else if (target) {
	    selection.reset({expr: target});
	} else {
	    selection.reset();
	}
	drawExprs();
    });
    $("#testcvs").mouseup(function (e) {
	mouseDownExpr = null;
    });
    $("#priority-mode").click(function (e) {
	operations.priorityMode = this.checked;
    });
    operations.priorityMode = false;
    $("#priority-mode:checked").val(false);
    $("#prefixkwlist").text(cvm.parse.prefixKeywords.list.
	map(function (x) { return x.kw; }).join(" "));
    $("#postfixkwlist").text(cvm.parse.postfixKeywords.list.
	map(function (x) { return x.kw; }).join(" "));

    [
	[createShortcut, "#create-shortcut"],
	[copyShortcut, "#copy-shortcut"],
	[pasteShortcut, "#paste-shortcut"],
	[cutShortcut, "#cut-shortcut"],
	[serializeShortcut, "#serialize-shortcut"]
    ].forEach(function (x) {
	var id = x[1];
	var sh = x[0];
	$(id).html(sh.mods + sh.key);
    });
    $("#serializer").change(function (e) {
	currentSerializer = serializers[this.options[this.selectedIndex].value];
    });
    $("#serialize").click(function (e) {
	if (selection.expr) {
	    $("#serialization").val(currentSerializer.serialize(selection.expr));
	}
    });
    [
	["power-button", powerButton],
	["subscript-button", subscriptButton],
	["sqrt-button", sqrtButton],
	["cbrt-button", cbrtButton],
	["root-button", rootButton],
	["fraction-button", fractionButton]
    ].forEach(function (x) {
	var id = x[0];
	var btn = x[1];
	var listener = function (e) {
	    if (selection.expr) {
		btn.action(selection);
		drawExprs();
	    }
	}
	$("#"+id).click(listener);
	$("#hi-" + id).click(listener);
    });
};

$(document).ready(testOnLoad);