if (window.cvm === undefined) {
    cvm = {};
}

(function (cvm) {

var parser = cvm.parse.parser;
var operations = cvm.parse.operations;
var expr = cvm.expr;
var select = cvm.select;

var lastKeyDownIsShortcut = false;
var shortcuts = KeyboardShortcuts.instanciate();
var selection;

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

var clipboard = Clipboard.instanciate();

var keydown = function (e) {
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
	case KEY.BACKSPACE:
	    e.preventDefault();
	    e.stopPropagation();
	    if (selection.expr) {
		if (!selection.expr.getRoot().editable) {
		    return;
		}
		selection.expr.getRoot().changed = true;
		if (selection.expr.isEditExpr) {
		    s = selection.expr.content;
		    if (s) {
			s = s.substr(0, s.length - 1);
			selection.expr.content = s;
			//parser.interpret(selection.expr, s, true);
		    } else {
			var editExpr = selection.expr;
			var child = selection.expr.operand;
			if (child) {
			    selection.reset();
			    editExpr.parent.replaceChild(editExpr, child);
			    selection.reset({expr: child});
			} else {
			    var pred = editExpr.getPredecessor();
			    var newParent = selection.remove();
			    selection.reset({expr: pred || newParent});
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
	case KEY.TAB:
	    e.preventDefault();
	    e.stopPropagation();
	    if (selection.expr && selection.expr.isEditExpr) {
		selection.expr.cycleCompletions();
	    }
	    break;
	default:
	    return;
    }
    select.drawChanged();
};

var keypress = function (e) {
    var c;
    if (!selection.expr || !selection.expr.getRoot().editable) {
	return;
    }
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
	var r = expr.root(selection.expr.fromSlice(selection));
	var e2 = parser.addChar(r.firstChild, c);
	if (e2) {
	    selection.expr.replaceSlice(selection, r.firstChild);
	}
	selection.reset({expr: e2});
    } else if (selection.expr) {
	var newexpr = parser.addChar(selection.expr, c);
	selection.reset({expr: newexpr});
    }
    selection.setEditing();
    select.drawChanged();
};

var copyShortcut = shortcuts.add('C-c', function () {
    selection.copyToClipboard(clipboard);
});
var pasteShortcut = shortcuts.add('C-v', function () {
    selection.pasteFromClipboard(clipboard);
    select.drawChanged();
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
    selection.reset();
    select.drawChanged();
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

var TextButton = Prototype.specialise({
    __init__: function (text) {
	this.text = text;
	this.button = $(expr.drawOnNewCanvas(parser.parse(text)));
    },
    action: function (selection) {
	var e = selection.expr;
	if (selection.isEditing()) {
	    e = parser.interpret(e);
	}
	selection.reset({expr: parser.interpret(e, this.text)});
    }
});

var SubMenuButton = Prototype.specialise({
    __init__: function (submenu, btn) {
	this.submenu = submenu;
	this.submenuVisible = false;
	this.button = btn;
    },
    action: function (selection, menu) {
	this.submenuVisible = !this.submenuVisible;
	if (this.submenuVisible) {
	    menu.showRow(this.submenu);
	    this.button.css({'background-color': "yellow"});
	} else {
	    menu.hideRow(this.submenu);
	    this.button.css({'background-color': "white"});
	}
    }
});

var image = function (name) {
    return $('<img src="img/' + name + '.png">');
};

var text = function (text) {
    return $(expr.drawOnNewCanvas(parser.parse(text)));
};

var powerButton = SimpleButton.specialise({
    isPostfix: true,
    getInput: function (e) { return  " ^ "; },
    getExpr: function (e) { return operations.pow(e); },
    button: image("power-button"),
    hiButton: image("hi-power-button")
});

var subscriptButton = SimpleButton.specialise({
    isPostfix: true,
    getInput: function (e) { return " _ "; },
    getExpr: function (e) { return operations.subscript(e); },
    button: image("subscript-button"),
    hiButton: image("hi-subscript-button")
});

var sqrtButton = SimpleButton.specialise({
    getInput: function (e) { return " sqrt "; },
    getExpr: function (e) {
	var e1 = e.copy();
	e.parent.replaceChild(e, expr.sqrt(e1));
	return e1;
    },
    button: image("sqrt-button"),
    hiButton: image("hi-sqrt-button")
});

var cbrtButton = SimpleButton.specialise({
    getInput: function (e) { return " 3 root "; },
    getExpr: function (e) {
	var n = expr.number(3);
	e.parent.replaceChild(e, n);
	return operations.nthRoot(n, e); 
    },
    button: image("cbrt-button"),
    hiButton: image("hi-cbrt-button")
});

var rootButton = SimpleButton.specialise({
    isPostfix: true,
    getInput: function (e) { return " root "; },
    getExpr: function (e) { return operations.nthRoot(e); },
    button: image("root-button"),
    hiButton: image("hi-root-button")
});

var fractionButton = SimpleButton.specialise({
    isPostfix: true,
    getInput: function (e) { return " / "; },
    getExpr: function (e) { return operations.frac(e); },
    button: image("fraction-button"),
    hiButton: image("hi-fraction-button")
});

var editMenuData = [
    powerButton,
    subscriptButton,
    sqrtButton,
    cbrtButton,
    rootButton,
    fractionButton
];

var EditMenu = Prototype.specialise({
    __init__: function (id) {
	this.id = id;
	this.div = $("<div></div>", { id: id}).css({position: 'absolute'});
	$(document.body).append(this.div);
	this.hide();
	this.rows = {};
	this.mode = 'edit';
    },
    showAt: function (x, y) {
	this.div.show().offset({top: y, left: x});
    },
    hide: function () {
	this.div.hide();
    },
    hideRow: function (rowId) {
	var row = this.rows[rowId];
	row && row.hide();
    },
    showRow: function (rowId) {
	var row = this.rows[rowId];
	row && row.show();
    },
    switchMode: function (mode) {
	$("." + this.mode + "-only").hide();
	$("." + mode + "-only").show();
	this.mode = mode;
    },
    addRow: function (rowId, rowData) {
	var self = this;
	var row = $("<div></div>", { id: rowId });
	this.rows[rowId] = row;
	rowData.forEach(function (btn) {
	    var listener = function (e) {
		if (selection.expr) {
		    btn.action(selection, self);
		    cvm.select.drawChanged();
		}
		return false;
	    };
	    btn.button.addClass('editor-button');
	    btn.button.mousedown(listener);
	    row.append(btn.button);
	    if (btn.hiButton) {
		btn.button.addClass('edit-only');
		btn.hiButton.addClass('editor-button');
		btn.hiButton.addClass('hilight-only');
		btn.hiButton.mousedown(listener);
		row.append(btn.hiButton);
	    }
	});
	this.div.append(row);
    }	
});



cvm.edit = {
    init: function (sel) {
	selection = sel;
	$(document).keydown(keydown);
	$(document).keypress(keypress);
	this.menu = EditMenu.instanciate("edit-menu");
	editMenuData.push(
	    SubMenuButton.instanciate("greek-lowercase", text("alpha beta gamma"))
	);
	this.menu.addRow("simple-buttons", editMenuData);
	var greekMenuData = [cvm.parse.greekLowercase, cvm.parse.greekUppercase]
	    .map(function (letters) {
		return letters.map(function (item) {
		    return TextButton.instanciate(item.name);
		});
	    });
	this.menu.addRow("greek-lowercase", greekMenuData[0]);
	this.menu.hideRow("greek-lowercase");
	this.menu.addRow("greek-uppercase", greekMenuData[1]);
    }
};

})(cvm);
