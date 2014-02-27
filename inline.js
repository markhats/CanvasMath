var transformInline = function (tagname) {
    var element, i, text;
    var root, canvas;
    var elements = document.getElementsByTagName(tagname || "cvm");
    cvm.box.init();
    $(tagname || "cvm").each(function () {
	cvm.select.addCvm(this);
    });
};

$(document).ready(function () {
    if (!this.preventAutomaticTransform) {
	transformInline();
    }
    cvm.parse.operations.priorityMode = false;
    cvm.select.initEditing();
    $(document.body).mousedown(function () {
	cvm.select.selection.reset();
	cvm.select.drawChanged();
    });
});
