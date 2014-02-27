#Aims
The aim of this project is to provide tools to display and edit mathematical expressions in canvas objects that work in modern browsers (IE 9+, Chrome, Safari, Firefox). Update: now works in IE8 (with font problems)

WYSIWYG editor with non-obtrusive interface.
full support for cut/copy/paste within an expression and between expressions.
include a parser for natural textual representation of expression
very easy to include in HTML page: <cvm>3x^2 - sin theta</cvm>
to make an expression editable by the viewer: <cvm editable=true></cvm>
to allow a viewer to copy/paste (parts of) an expression: <cvm selectable=true>(2 sqrt x)/(1+x^2+ ln x)</cvm>
#Examples
Try the interactive [CanvasMath playground](http://www.marooned.org.uk/~arno/cvm/test.html) (works in modern browsers). create, edit, copy, paste and serialize mathematical expressions.

CanvasMath can also be used to display math in a web page a bit like jsMath, except that it doesn't require latex syntax and uses canvas objects rather than html trees to display math. All that is needed is to include a javascript file in the header and to surround all math in the <cvm> tag. See an [example](http://www.marooned.org.uk/~arno/cvm/inlinetest.html). Don't forget the view the HTML source to see how simple it is!

It will also be able to render MathML within html pages. See this [MathML rendering test page](http://www.marooned.org.uk/~arno/cvm/mathmltest.html). Only a small subset of Content MathML works now but it is planned that both Content and Presentation MathML will be supported.

There is also a test suite showing the input syntax and testing that it parses, renders, serializes to MathML and parses and renders MathML properly [here](http://www.marooned.org.uk/~arno/cvm/testsuite.html).

#Plans
It is planned that there will be a number of possible syntaxes for inputing expressions, just like there are several serializers.

#Libraries
Canvasmath uses:

[jQuery](http://jquery.com/) for normalising events between browsers
[ExplorerCanvas](http://code.google.com/p/explorercanvas) to bring the canvas object to older versions of Internet Explorer
[collections.js](https://github.com/osteele/collections-js) to bring the modern iteration methods to arrays in older versions of Internet Explorer