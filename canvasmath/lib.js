var Prototype = {
    __name__: "Prototype",
    __init__: function (spec) {
	if (spec) {
	    for (var prop in spec) {
		if (spec.hasOwnProperty(prop)) {
		    this[prop] = spec[prop];
		}
	    }
	}
	return this;
    },
    specialise: function (spec) {
	var name = spec && spec.__name__ || this.__name__;
	var F;
	eval("F = function " + name + " () {};");
	F.prototype = this;
	var obj = new F();
	if (!obj.hasOwnProperty("__proto__")) {
	    obj.__proto__ = this;
	}
	if (spec) {
	    for (var prop in spec) {
		if (spec.hasOwnProperty(prop)) {
		    // Comment the following in order to be compatible with IE8
		    // This means no more descriptors :(
		    /*var desc = Object.getOwnPropertyDescriptor(spec, prop);
		    var g = desc.get;
		    var s = desc.set;
		    if ( g || s ) {
			var def = {};
			if ( g )
			    def.get = g;
			if ( s )
			    def.set = s;
			Object.defineProperty(obj, prop, def);
		    } else {*/
			obj[prop] = spec[prop];
		    //}
		}
	    }
	}
	return obj;
    },
    instanciate: function () {
	var obj = this.specialise();
	obj.__init__.apply(obj, arguments);
	return obj;
    },
    bind: function (prop) {
	return this[prop].bind(this);
    },
    addMixin: function (mixin) {
	for (var prop in mixin) {
	    if (mixin.hasOwnProperty(prop)) {
		if (this[prop]) {
		    throw "object has property '" + prop + "' already";
		}
		this[prop] = mixin[prop];
	    }
	}
	return this;
    }
};

var getEventCoords = function (e, element) {
    var offset = $(element).offset();
    return {
	x: e.pageX - offset.left,
	y: e.pageY - offset.top
    };
};

var PlatformInfo = {
    __init__: function () {
	var platform = navigator.platform;
	if (platform.indexOf("Mac") !== -1) {
	    this.os = "macos";
	} else if (platform.indexOf("Win") !== -1) {
	    this.os = "windows";
	} else if (platform.indexOf("Linux") !== -1) {
	    this.os = "linux";
	} else {
	    this.os = "unknown";
	}
    }
};
PlatformInfo = Prototype.specialise(PlatformInfo);
var platformInfo = PlatformInfo.instanciate();

//
// Shortcuts manager.  All shortcuts must be registered with this.
//

var KeyboardShortcuts = {
    __init__: function () {
	this.shortcuts = {};
	this.table = this.osTable[platformInfo.os];
	if (!this.table) {
	    this.table = this.osTable.windows;
	}
    },
    osTable: {
	windows: {
	    A: { txt: "Alt+", cmd: "A", name: "alt" },
	    C: { txt: "Ctrl+", cmd: "C", name: "control" },
	    M: { txt: "Meta+", cmd: "M", name: "meta" },
	    S: { txt: "Shift+", cmd: "S", name: "shift" }
	},
	macos: {
	    A: { txt: "&#x2325;", cmd: "A", name: "option" },
	    C: { txt: "^", cmd: "M", name: "control" },
	    M: { txt: "&#x2318;", cmd: "C", name: "command" },
	    S: { txt: "&#x21E7;", cmd: "S", name: "shift" }
	},
	linux: {
	    A: { txt: "Alt+", cmd: "A", name: "alt" },
	    C: { txt: "Ctrl+", cmd: "C", name: "control" },
	    M: { txt: "Meta+", cmd: "M", name: "meta" },
	    S: { txt: "Shift+", cmd: "S", name: "shift" }
	}
    },
    add: function (shortcut, action) {
	var self = this;
	var keycuts;
	var parts = shortcut.split('-');
	var key = parts[1].toUpperCase();
	var keyCode;
	var modifiers = parts[0];
	if (key.length > 1) {
	    keyCode = parseInt(key);
	} else {
	    keyCode = key.charCodeAt(0);
	}
	keycuts = this.shortcuts[keyCode];
	if (!keycuts) {
	    this.shortcuts[keyCode] = keycuts = {};
	}
	modifiers = modifiers.toUpperCase();
	var modsText = '';
	var osMods = '';
	'CASM'.split('').forEach(function (mod) {
	    if (modifiers.indexOf(self.table[mod].cmd) !== -1) {
		modsText += self.table[mod].txt;
		osMods += mod;
	    }
	});
	keycuts[osMods] = action;
	return { mods: modsText, key: key };
    },
    callFromEvent: function (e) {
	var keycuts = this.shortcuts[e.keyCode];
	if (!keycuts) {
	    return false;
	}
	var modifiers = (e.ctrlKey ? 'C': '') + (e.altKey ? 'A': '') +
	    (e.shiftKey ? 'S': '') + (e.originalEvent.metaKey ? 'M' : '');
	var action = keycuts[modifiers];
	if (action) {
	    action(e);
	    return true;
	}
	return false;
    }
};
KeyboardShortcuts = Prototype.specialise(KeyboardShortcuts);

Object.forEachItem = function (obj, f) {
    var key;
    for (key in obj) {
	if (obj.hasOwnProperty(key)) {
	    if (f(key, obj[key])) {
		return false;
	    }
	}
    }
    return true;
};

// Taken from jquery.ui.core.js
var KEY = {
    ALT: 18,
    BACKSPACE: 8,
    CAPS_LOCK: 20,
    COMMA: 188,
    COMMAND: 91,
    COMMAND_LEFT: 91, // COMMAND
    COMMAND_RIGHT: 93,
    CONTROL: 17,
    DELETE: 46,
    DOWN: 40,
    END: 35,
    ENTER: 13,
    ESCAPE: 27,
    HOME: 36,
    INSERT: 45,
    LEFT: 37,
    MENU: 93, // COMMAND_RIGHT
    NUMPAD_ADD: 107,
    NUMPAD_DECIMAL: 110,
    NUMPAD_DIVIDE: 111,
    NUMPAD_ENTER: 108,
    NUMPAD_MULTIPLY: 106,
    NUMPAD_SUBTRACT: 109,
    PAGE_DOWN: 34,
    PAGE_UP: 33,
    PERIOD: 190,
    RIGHT: 39,
    SHIFT: 16,
    SPACE: 32,
    TAB: 9,
    UP: 38,
    WINDOWS: 91 // COMMAND
};