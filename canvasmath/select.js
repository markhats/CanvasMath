if (window.cvm === undefined) {
    cvm = {};
}

(function (cvm) {

var parser = cvm.parse.parser;

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


var Selection = Prototype.specialise({
    __init__: function (s) {
	//this.reset(s);
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
	this.replace(expr);
	this.reset({expr: expr});
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
	var root;
	if (this.expr) {
	    this.expr.clearSelected();
	    root = this.expr.getRoot();
	    if (root) {
		root.changed = true;
	    }
	}
	if (this.expr && s && s.expr !== this.expr) {
	    if (root) {
		root.changed = true;
		if (this.expr.isEditExpr) {
		    parser.interpret(this.expr);
		}
	    }
	}
	if (s && s.expr) {
	    this.root = root = s.expr.getRoot();
	    if (!root) {
		throw "expression should be rooted!";
	    }
	    this.updateEditingMenu();
	    root.changed = true;
	    this.expr = s.expr;
	    this.expr.setSelected(this);
	    this.start = s.start;
	    this.stop = s.stop;
	    this.isSlice = (s.start || s.stop) && s.expr.slicedLayout;
	} else {
	    this.expr = this.start = this.stop = null;
	    this.isSlice = false;
	    this.root = null;
	    cvm.edit.menu.hide();
	}
    },
    updateEditingMenu: function () {
	var root = this.root;
	if (root.editable) {
	    var rootOffset = $(root.canvas).offset();
	    cvm.edit.menu.showAt(
		rootOffset.left,
		rootOffset.top + root.box.height + 10
	    );
	} else {
	    cvm.edit.menu.hide();
	}
    },
    setEditing: function () {
	cvm.edit.menu.switchMode('edit');
	this.editing = true;
    },
    clearEditing: function () {
	cvm.edit.menu.switchMode('hilight');
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
	//this.setEditing();
    },
    moveDown: function () {
	var s;
	if (!this.expr) {
	    return;
	}
	this.reset({expr: this.expr.getVSuccessor()});
	//this.setEditing();
    },
    moveLeft: function () {
	this.reset({expr: this.expr.getPredecessor2()});
	//this.setEditing();
    },
    moveRight: function () {
	this.reset({expr: this.expr.getSuccessor2()});
	//this.setEditing();
    }

});

var selection = Selection.instanciate();
var selectionStart;

cvm.select = {
    roots: [],
    initEditing: function () {
	cvm.edit.init(selection);
	selection.reset();
    },
    addCvm: function (el) {
	el = $(el);
	var text = el.text();
	var root = cvm.parse.parser.parse(text);
	root.selectable = el.attr("selectable");
	root.editable = el.attr("editable");
	var canvas = cvm.expr.drawOnNewCanvas(root);
	el.replaceWith(canvas);
	root.canvas = canvas;
	this.roots.push(root);
	if (root.selectable || root.editable) {
	    this.makeSelectable(root);
	}
	if (root.selectable || root.editable) {
	    $(canvas).addClass("selectable");
	}
	if (root.editable) {
	    $(canvas).addClass("editable");
	}
    },
    drawChanged: function () {
	this.roots.forEach(function (root) {
	    if (root.changed) {
		cvm.expr.drawOnCanvas(root, root.canvas);
		root.changed = false;
		if (root === selection.root) {
		    selection.updateEditingMenu();
		}
	    }
	});
    },
    makeSelectable: function (root) {
	var canvas = $(root.canvas);
	var self = this;
	canvas.mousedown(function (e) {
	    e.stopPropagation();
	    var coords = getEventCoords(e, this);
	    selectionStart = getFirstBoundExpr(root.box,
		coords.x, coords.y - root.box.ascent);
	    selection.clearEditing();
	    if (root.editable) {
		selection.reset({expr: selectionStart});
		selection.setEditing();
	    } else {
		selection.reset();
	    }
	    self.drawChanged();
	});
	canvas.mousemove(function (e) {
	    e.stopPropagation();
	    if (!selectionStart) {
		return;
	    }
	    var coords = getEventCoords(e, this);
	    var target = getFirstBoundExpr(root.box,
		coords.x, coords.y - root.box.ascent);
	    if (!target) {
		return;
	    }
	    var s = selectionStart.getSelection(target);
	    selection.reset(s);
	    selection.clearEditing();
	    self.drawChanged();
	});
	canvas.mouseup(function (e) {
	    e.stopPropagation();
	    selectionStart = null;
	});
	canvas.mouseout(function (e) {
	    e.stopPropagation();
	    selectionStart = null;
	});
    },
    selection: selection
};

})(cvm);