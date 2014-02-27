var tests = [
    "1+2*54",
    "-12-3*2",
    "1/2 + 2/3",
    "1+ sqrt(12)",
    "(3root2)^2",
    "sqrt(1/(x+1))",
    "3x^5-2x^4+3x-1",
    "alpha + beta gamma",
    "sinxcosx + tanx",
    "arcsinx",
    "abs((1+x)/(1-x))",
    "floor(n) + ceil(n^2)",
    "6!",
    "sum xy",
/*    "sum from (i=1) to n (1/i)",
    "product from (k=1) to n (1 - 1/k)",
    "integral from 0 to 1 (y d.x)",
    "integral from 0 to (pi/2) ((sinx) d.x)",*/
    "integral fg",
    "f[x, sin t, sqrt3]",
    "(integral f[x] d.x)^2",
    "f'[x+1]",
    "(f + g)'[t]",
    "(f/g)'",
    "d.y/d.x",
    "x_1+x_2",
    "(M+N)_[i+1, j-1]",
    "(a, b; c, d)",
    "p or not q",
    "p and q and r",
    "x<y<z",
    "f[x] = (\n    2x-1 if 0 <= x <= 1\n    else x if 1 < x <=4\n    else 0\n)"
];

var nonMathMLTests = [
    "(\n    x = a cos theta\n    and y = b sin theta\n) if 0 < theta <= 2pi"
];

window.addEventListener("load", function () {
    var tbody = $("#tests");
    var parser = cvm.parse.parser;
    var mathMLParser = cvm.mathml.parser;
    var expr = cvm.expr;
    var showTest = function (test, nonMathML) {
	var e = parser.parse(test);
	// The following doesn't recognise entities such as &alpha;
	// (and also I don't know if IE9 supports it)
	/*
	var parser = new DOMParser();
	var mathml = parser.parseFromString(mathmlText, "text/xml").firstChild;
	*/
	// So fallback onto innerHTML, which does, but has trouble parsing
	// empty elements e.g. <plus/>, which is why empty elements are
	// serialized as e.g. <plus></plus> :(
	if (!nonMathML) {
	    var mathMLBits = MathMLSerializer.serializeToBits(e);
	    var mathmlText = MathMLSerializer.bitsToMathML(mathMLBits, 0, 2);
	    var mathmlHTML = MathMLSerializer.bitsToMathML(mathMLBits, 0, 0, true);
	    var parent = document.createElement("math");
	    parent.innerHTML = mathmlHTML;
	    var mathml = parent.firstElementChild;
	    var parsedMathML = mathMLParser.parse(mathml);
	}
	var row = $("<tr/>");
	row.append("<td><pre>" + test + "</pre></td>");
	row.append($("<td/>").append(expr.drawOnNewCanvas(e)));
	if (nonMathML) {
	    row.append("<td>No MathML</td>");
	} else {
	    var pre = $("<pre/>").text(mathmlText);
	    row.append($("<td/>").append(pre));
	}
	if (!nonMathML) {
	    row.append($("<td/>").append(expr.drawOnNewCanvas(parsedMathML)));
	}
	tbody.append(row);
    };
    tests.forEach(function (test) { showTest(test); });
    nonMathMLTests.forEach(function (test) { showTest(test, true); });
}, false);
