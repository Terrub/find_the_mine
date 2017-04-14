function getDisplay(glib) {

    var display;
    var canvas;

    display = {};
    canvas = glib.canvas;

    display.drawPixel = function (x, y, color) {

        glib.fillStyle = color;
        glib.fillRect(x, y, 1, 1);

    }

    display.drawRect = function (x, y, w, h, color) {

        glib.fillStyle = color;
        glib.fillRect(x, y, w, h);

    }

    display.clearRect = function (x, y, w, h) {

        glib.clearRect(x, y, w, h);

    }

    display.fill = function (color) {

        glib.fillStyle = color;
        glib.fillRect(0, 0, canvas.width, canvas.height);

    }

    display.clear = function () {

        glib.clearRect(0, 0, canvas.width, canvas.height);

    }

    display.text = function (x, y, text, color, font) {

        if (isDefined(color)) {

            glib.fillStyle = color;

        }

        if (isDefined(font)) {

            glib.font = font;

        }

        glib.fillText(text, x, y);

    }

    return display;

}
