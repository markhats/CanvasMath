window.addEventListener("load", function () {

// Some shortcuts
var layout = cvm.layout;
var mathMLParser = cvm.mathml.parser;

// Steal the XML parser from the browser :)
var domParser = new DOMParser();

// Get the context object for the canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Define some helper functions
var mathML2Expr = function (text) {
    var mathml = domParser.parseFromString(text, "text/xml").firstChild;
    return mathMLParser.parse(mathml);
};

var getBox = function (e) {
    return layout.ofExpr(e).box();
};


// The mathML text of the expression to be displayed
var text = "<apply><root/><apply><divide/><cn>1</cn><apply><plus/><ci>x</ci><cn>1</cn></apply></apply></apply>";

// How to display it
var expression = mathML2Expr(text);
var box = getBox(expression);
box.drawOnCanvas(ctx, 10, 100);

});
