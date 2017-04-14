/*

    This is where we contruct the game and the display and do all the passing of
    settings. For instance we can define how large a game is, and thus how large
    our canvas need to be and what not.

    How many squares?
    How many mines?
    which colours?
    Use / display a timer?
    etc...

*/

console.log("Initiating");

var canvas;
var gl;
var grid;

var num_rows;
var num_cols;

var total_num_mines;

var button_status_closed = 0;
var button_status_open = 1;
var button_status_flagged = 2;

var button_closed_color = color(80, 80, 80);
var button_open_color = color(100,100,100);

var button_width;
var button_height;
var gutter_size;
var font_size_modifier;

var one_mine_color = color(0,0,255);
var two_mine_color = color(0,255,0);
var three_mine_color = color(255,0,0);
var four_mine_color = color(255,0,255);
var five_mine_color = color(255,255,0);
var six_mine_color = color(0,255,255);
var seven_mine_color = color(255,255,255);
var eight_mine_color = color(127,127,127);

var mine_colors = [
    one_mine_color,
    two_mine_color,
    three_mine_color,
    four_mine_color,
    five_mine_color,
    six_mine_color,
    seven_mine_color,
    eight_mine_color
]

function color(p_r, p_g, p_b, p_a) {

    var r = isDefined(p_r) ? p_r : 0;
    var g = isDefined(p_g) ? p_g : 0;
    var b = isDefined(p_b) ? p_b : 0;
    var a = isDefined(p_a) ? p_a : 1;

    return formatise('rgba({@1:i},{@2:i},{@3:i},{@4:n})',r,g,b,a);

}

function create2dArray(c, r) {

    var result;

    var i;
    var n;

    result = Array(c);

    for (i = 0; i < c; i += 1) {

        result[i] = Array(r);

    }

    return result;

}

function getColorFromNumMines(num_mines) {

    return mine_colors[num_mines - 1];

}

function drawOpenButtonAt(btn, x, y) {

    var text;
    var font_size;

    font_size = Math.floor((button_height - 6) * font_size_modifier);

    // Draw the background of the button
    gl.fillStyle = button_open_color;
    gl.fillRect(
        x,
        y,
        button_width,
        button_height
    );

    gl.font = formatise(
        "{@1:i}{@2:s} {@3:s}",
        Math.floor(button_height * font_size_modifier), "px", "arial"
    );

    if (btn.num_mines > 0 || btn.isMine) {

        if (btn.isMine) {

            gl.fillStyle = "black"
            text = String.fromCharCode('9967'); // Gear like symbol

        } else {

            gl.fillStyle = getColorFromNumMines(btn.num_mines);
            text = btn.num_mines;

        }

        gl.fillText(
            text,
            x + Math.floor((button_width - gl.measureText(text).width) / 2),
            y + Math.floor(button_height - ((button_height - font_size) / 2))
        );

    }

}

function drawClosedButtonAt(btn, x, y) {

    gl.fillStyle = button_closed_color;

    gl.fillRect(x, y, button_width, button_height);

}

function drawFlagOnButtonAt(btn, x, y) {

    var text;
    var font_size;

    text = String.fromCharCode('9873');
    font_size = Math.floor((button_height - 6) * font_size_modifier);

    gl.fillStyle = "black"
    gl.font = formatise("{@1:i}{@2:s} {@3:s}", font_size, "px", "arial");

    gl.fillText(
        text,
        x + Math.floor((button_width - gl.measureText(text).width) / 2),
        y + Math.floor(button_height - ((button_height - font_size) / 2))
    );

}

function createRandomGameData(data) {

    // assuming a 2d array;
    var i;
    var j;
    var n;

    var x;
    var y;

    var mines_to_place;

    for (j = 0; j < num_rows; j += 1) {
        for (i = 0; i < num_cols; i += 1) {
            data[i][j] = {
                isMine: false,
                status: button_status_closed,
                num_mines: 0,
            };
        }
    }

    mines_to_place = total_num_mines;

    while (mines_to_place > 0) {

        x = generateRandomNumber(1, num_cols - 1);
        y = generateRandomNumber(1, num_rows - 1);

        if (data[x][y].isMine === true) {
            // we already had this one, try again.
            continue;

        }

        data[x][y].isMine = true;

        // update surrounding mines
        data[x +-1][y +-1].num_mines += 1;
        data[x +-1][y + 0].num_mines += 1;
        data[x +-1][y + 1].num_mines += 1;
        data[x + 0][y +-1].num_mines += 1;
        data[x + 0][y + 1].num_mines += 1;
        data[x + 1][y +-1].num_mines += 1;
        data[x + 1][y + 0].num_mines += 1;
        data[x + 1][y + 1].num_mines += 1;

        mines_to_place -= 1;

    }

}

function createGrid(num_cols, num_rows) {

    var grid;
    var data;

    var x;
    var y;

    var button;

    grid = {};

    data = create2dArray(num_cols, num_rows);

    createRandomGameData(data);

    grid.draw = function() {

        for (j = 0; j < num_rows; j += 1) {

            for (i = 0; i < num_cols; i += 1) {

                button = data[i][j];

                x = i * (button_width + gutter_size) + gutter_size;
                y = j * (button_height + gutter_size) + gutter_size;

                if (button.status === button_status_open) {

                    drawOpenButtonAt(button, x, y);

                }
                else if (button.status === button_status_closed) {

                    drawClosedButtonAt(button, x, y);

                }
                else {

                    reportUsageError("Attempt to draw button with unknown status");

                }

            }

        }

    }

    grid.data = data;

    return grid;

}

function drawBackground(color) {

    gl.fillStyle = color;
    gl.fillRect(0, 0, canvas.width, canvas.height);

}

function addLeftClickEventListner() {

    var click_hook = null;
    var oldMouseClick = document.onclick;

    function newMouseClick(event) {

        var x;
        var y;
        var row;
        var col;

        x = event.clientX;
        y = event.clientY;

        if (x >= 0 &&
            x < canvas.width &&
            y >= 0 &&
            y < canvas.height) {

            col = Math.floor(x / (button_width + gutter_size));
            row = Math.floor(y / (button_height + gutter_size));

            button = grid.data[col][row];

            if (button.status === button_status_closed) {

                drawOpenButtonAt(
                    button,
                    Math.floor(col * (button_width + gutter_size) + gutter_size),
                    Math.floor(row * (button_height + gutter_size) + gutter_size)
                );
                button.status = button_status_open;

            }

        }

    }

    if (isFunction(oldMouseClick)) {

        click_hook = function(event) {

            oldMouseClick(event);
            newMouseClick(event);

        }

        report("Outside click function was found. Using post-hook");

    } else {

        click_hook = newMouseClick;

        report("No outside click function exists. Using direct hook");

    }

    document.onclick = click_hook;

}

function addRightClickEventListner() {

    var click_hook = null;
    var oldContextMenu = document.oncontextmenu;

    function newContextMenu(event) {

        var x;
        var y;
        var row;
        var col;
        var cx;
        var cy;

        x = event.clientX;
        y = event.clientY;

        if (x >= 0 &&
            x < canvas.width &&
            y >= 0 &&
            y < canvas.height) {

            event.preventDefault();

            col = Math.floor(x / (button_width + gutter_size));
            row = Math.floor(y / (button_height + gutter_size));

            button = grid.data[col][row];

            cx = Math.floor(col * (button_width + gutter_size) + gutter_size);
            cy = Math.floor(row * (button_height + gutter_size) + gutter_size);

            if (button.status === button_status_closed) {
                drawFlagOnButtonAt(button, cx, cy);
                button.status = button_status_flagged;
            }
            else if (button.status === button_status_flagged) {
                drawClosedButtonAt(button, cx, cy);
                button.status = button_status_closed;
            }

        }

    }

    if (isFunction(oldContextMenu)) {

        click_hook = function(event) {

            oldContextMenu(event);
            newContextMenu(event);

        }

        report("Outside context menu function was found. Using post-hook");

    } else {

        click_hook = newContextMenu;

        report("No outside context menu function exists. Using direct hook");

    }

    document.oncontextmenu = click_hook;

}

function addOpenAllButton() {

    var btn;

    function openAllButtons() {

        var j;
        var i;
        var button;

        for (j = 0; j < num_rows; j += 1) {

            for (i = 0; i < num_cols; i += 1) {

                button = grid.data[i][j];

                x = i * (button_width + gutter_size) + gutter_size;
                y = j * (button_height + gutter_size) + gutter_size;

                drawOpenButtonAt(button, x, y);

            }

        }

    }

    btn = document.createElement("button");
    btn.onclick = openAllButtons;
    btn.innerHTML = "OPEN";
    document.body.appendChild(btn);

}

function main() {

    num_rows = 30;
    num_cols = 30;
    total_num_mines = 180;
    button_width = 25;
    button_height = 25;
    gutter_size = 2;
    font_size_modifier = 0.7;

    grid = createGrid(
        num_cols,
        num_rows
    );

    canvas = document.createElement('canvas');
    gl = canvas.getContext('2d');

    canvas.width = Math.floor((button_width + gutter_size) * num_cols + gutter_size);
    canvas.height = Math.floor((button_height + gutter_size) * num_rows + gutter_size);

    document.body.appendChild(canvas);

    drawBackground(color(50,50,50));
    grid.draw();

    addLeftClickEventListner();
    addRightClickEventListner();

    addOpenAllButton();

}
