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

var num_mines;

var BUTTON_STATUS_CLOSED;
var BUTTON_STATUS_OPEN;
var BUTTON_STATUS_FLAGGED;

var LEFT_MOUSE_BUTTON_DOWN;
var RIGHT_MOUSE_BUTTON_DOWN;
var MIDDLE_MOUSE_BUTTON_DOWN;
var FOURTH_MOUSE_BUTTON_DOWN;
var FIFTH_MOUSE_BUTTON_DOWN;

var button_closed_color;
var button_open_color;

var button_width;
var button_height;

var gutter_size;
var font_size_modifier;

var tile_width;
var tile_height;

var canvas_width;
var canvas_height;

var mine_colors;

var one_mine_color;
var two_mine_color;
var three_mine_color;
var four_mine_color;
var five_mine_color;
var six_mine_color;
var seven_mine_color;
var eight_mine_color;

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

function initiateGameData(p_num_rows, p_num_cols) {

    var data;
    var x;
    var y;

    data = create2dArray(p_num_cols, p_num_rows);

    for (y = 0; y < p_num_rows; y += 1) {

        for (x = 0; x < p_num_cols; x += 1) {

            data[x][y] = {
                isMine: false,
                status: BUTTON_STATUS_CLOSED,
                num_mines: 0,
            };

        }

    }

    return data;

}

function createRandomMineCoords(p_num_mines, p_num_rows, p_num_cols) {

    var mines_to_place;
    var mine_coords;
    var total_mine_positions;
    var available_indices;
    var max_index;
    var i;

    var index;
    var mine_number;
    var mine;

    mines_to_place = p_num_mines;
    mine_coords = [];
    total_mine_positions = Math.floor(p_num_cols * p_num_rows);
    available_indices = Array(total_mine_positions);
    max_index = available_indices.length - 1;

    i = 0;
    for (i; i < total_mine_positions; i += 1) {
        available_indices[i] = i;
    }

    while (mines_to_place > 0) {

        index = generateRandomNumber(0, max_index);
        mine_number = available_indices.splice(index, 1);
        max_index = available_indices.length - 1;

        /*
            lets imagine a 4x3 grid
            that's a total of 4 * 3 = 12 positions.

          y x 0   1   2   3
          0 [00][01][02][03]
          1 [04][05][06][07]
          2 [08][09][10][11]

            So to get position 11 x, y coords I need to divide 11 by number
            of cols (=> 11 / 4 = 2.75 or 2, floored.) to get the y coord.
            For the x coord all I need is the remainder (=> 11 % 4 = 3)

            or

            y = Math.floor(position / num_cols);
            x = Math.floor(position % num_cols);

            example: (run in console)
            for (var i=0,n=12;i<n;i++){
                console.log("x:",i%4,"y:",Math.floor(i/4));
            }
        */

        mine = {
            x: Math.floor(mine_number % p_num_cols),
            y: Math.floor(mine_number / p_num_cols)
        }

        mine_coords.push(mine);

        mines_to_place -= 1;

    }

    return mine_coords;

}

function fillGameDataWithMines(p_data, p_mine_coords) {

    var i;
    var n;
    var x;
    var y;

    var mine;

    // Go through every point in the mine_coords
    i = 0;
    n = p_mine_coords.length;
    for (i; i < n; i += 1) {

        mine = p_mine_coords[i];

        p_data[mine.x][mine.y].isMine = true;

    }

}

function addMineCountToBottomRight(p_data, p_x, p_y) {

    /*
        [X][X][X]
        [X][O][1]
        [X][1][1]
    */

    p_data[p_x + 0][p_y + 1].num_mines += 1;
    p_data[p_x + 1][p_y + 0].num_mines += 1;
    p_data[p_x + 1][p_y + 1].num_mines += 1;

}

function addMineCountToBottomLeft(p_data, p_x, p_y) {

    /*
        [X][X][X]
        [1][O][X]
        [1][1][X]
    */

    p_data[p_x +-1][p_y + 0].num_mines += 1;
    p_data[p_x +-1][p_y + 1].num_mines += 1;
    p_data[p_x + 0][p_y + 1].num_mines += 1;

}

function addMineCountToTopRight(p_data, p_x, p_y) {

    /*
        [X][1][1]
        [X][O][1]
        [X][X][X]
    */

    p_data[p_x + 0][p_y +-1].num_mines += 1;
    p_data[p_x + 1][p_y +-1].num_mines += 1;
    p_data[p_x + 1][p_y + 0].num_mines += 1;

}

function addMineCountToTopLeft(p_data, p_x, p_y) {

    /*
        [1][1][X]
        [1][O][X]
        [X][X][X]
    */

    p_data[p_x +-1][p_y +-1].num_mines += 1;
    p_data[p_x +-1][p_y + 0].num_mines += 1;
    p_data[p_x + 0][p_y +-1].num_mines += 1;

}

function addMineCountToBottom(p_data, p_x, p_y) {

    /*
        [X][X][X]
        [1][O][1]
        [1][1][1]
    */

    p_data[p_x +-1][p_y + 0].num_mines += 1;
    p_data[p_x +-1][p_y + 1].num_mines += 1;
    p_data[p_x + 0][p_y + 1].num_mines += 1;
    p_data[p_x + 1][p_y + 0].num_mines += 1;
    p_data[p_x + 1][p_y + 1].num_mines += 1;

}

function addMineCountToRight(p_data, p_x, p_y) {

    /*
        [X][1][1]
        [X][O][1]
        [X][1][1]
    */

    p_data[p_x + 0][p_y +-1].num_mines += 1;
    p_data[p_x + 0][p_y + 1].num_mines += 1;
    p_data[p_x + 1][p_y +-1].num_mines += 1;
    p_data[p_x + 1][p_y + 0].num_mines += 1;
    p_data[p_x + 1][p_y + 1].num_mines += 1;

}

function addMineCountToLeft(p_data, p_x, p_y) {

    /*
        [1][1][X]
        [1][O][X]
        [1][1][X]
    */

    p_data[p_x +-1][p_y +-1].num_mines += 1;
    p_data[p_x +-1][p_y + 0].num_mines += 1;
    p_data[p_x +-1][p_y + 1].num_mines += 1;
    p_data[p_x + 0][p_y +-1].num_mines += 1;
    p_data[p_x + 0][p_y + 1].num_mines += 1;

}

function addMineCountToTop(p_data, p_x, p_y) {

    /*
        [1][1][1]
        [1][O][1]
        [X][X][X]
    */

    p_data[p_x +-1][p_y +-1].num_mines += 1;
    p_data[p_x +-1][p_y + 0].num_mines += 1;
    p_data[p_x + 0][p_y +-1].num_mines += 1;
    p_data[p_x + 1][p_y +-1].num_mines += 1;
    p_data[p_x + 1][p_y + 0].num_mines += 1;

}

function addMineCountToAllEight(p_data, p_x, p_y) {

    /*
        [1][1][1]
        [1][O][1]
        [1][1][1]
    */

    p_data[p_x +-1][p_y +-1].num_mines += 1;
    p_data[p_x +-1][p_y + 0].num_mines += 1;
    p_data[p_x +-1][p_y + 1].num_mines += 1;
    p_data[p_x + 0][p_y +-1].num_mines += 1;
    p_data[p_x + 0][p_y + 1].num_mines += 1;
    p_data[p_x + 1][p_y +-1].num_mines += 1;
    p_data[p_x + 1][p_y + 0].num_mines += 1;
    p_data[p_x + 1][p_y + 1].num_mines += 1;

}

function updateSurroundingTiles(p_data, p_num_rows, p_num_cols, p_mine_coords) {

    // assuming a 2d array;
    var i;
    var n;
    var x;
    var y;
    var nx;
    var ny;
    var mine;

    // Go through every point in the mine_coords
    i = 0;
    n = p_mine_coords.length;
    for (i; i < n; i += 1) {
        mine = p_mine_coords[i];

        x = mine.x;
        y = mine.y;

        // Check for corner tiles,
        // Check for side tiles,
        // Otherwise consider it a center tile,
        // Add mine count to surrounding tiles accordingly.
        if (x === 0) {
            if (y === 0) {
                addMineCountToBottomRight(p_data, x, y);
            }
            else if (y === p_num_rows - 1) {
                addMineCountToTopRight(p_data, x, y);
            }
            else {
                addMineCountToRight(p_data, x, y);
            }
        }
        else if (x === p_num_cols - 1) {
            if (y === 0) {
                addMineCountToBottomLeft(p_data, x, y);
            }
            else if (y === p_num_rows -1) {
                addMineCountToTopLeft(p_data, x, y);
            }
            else {
                addMineCountToLeft(p_data, x, y);
            }
        }
        else if (y === 0) {
            addMineCountToBottom(p_data, x, y);
        }
        else if (y === p_num_rows - 1) {
            addMineCountToTop(p_data, x, y);
        }
        else {
            addMineCountToAllEight(p_data, x, y);
        }

    }

}

/*
I want to add functionality that opens all the clear spaces (minecount === 0)
adjacent to the opened space.

I think I want to check all eight neighbours if a clear space is clicked, add
all the clear spaces found to a list of spaces to check. We can add the first
clicked space to this list as well, come to think of it. Then work through the
current list whilst filling the next untill nothing is left to check.

To speed things up i can look into using an exhaustive list of spaces to check
and remove any spaces already checked from any space that goes into the next
list.
*/

function createGrid(num_cols, num_rows) {

    var grid;
    var data;
    var mine_coords;

    var x;
    var y;

    var button;

    grid = {};

    grid.createGameData = function() {

        data = initiateGameData(num_rows, num_cols);
        mine_coords = createRandomMineCoords(num_mines, num_rows, num_cols);
        fillGameDataWithMines(data, mine_coords);
        updateSurroundingTiles(data, num_rows, num_cols, mine_coords);

        grid.data = data;

    }

    grid.draw = function() {

        for (j = 0; j < num_rows; j += 1) {

            for (i = 0; i < num_cols; i += 1) {

                button = data[i][j];

                x = i * tile_width + gutter_size;
                y = j * tile_height + gutter_size;

                if (button.status === BUTTON_STATUS_OPEN) {

                    drawOpenButtonAt(button, x, y);

                }
                else if (button.status === BUTTON_STATUS_CLOSED) {

                    drawClosedButtonAt(button, x, y);

                }
                else {

                    reportUsageError("Attempt to draw button with unknown status");

                }

            }

        }

    }

    grid.reset = function() {
        grid.createGameData();
        grid.draw();
    }

    return grid;

}

function createCanvas(p_width, p_height) {

    var canvas;

    canvas = document.createElement('canvas');

    canvas.width = p_width;
    canvas.height = p_height;

    return canvas;

}

function drawBackground(color) {

    gl.fillStyle = color;
    gl.fillRect(0, 0, canvas.width, canvas.height);

}

function handleMouseDownEvent(event) {

    var x;
    var y;
    var row;
    var col;
    var button;
    var cx;
    var cy;

    x = event.clientX;
    y = event.clientY;

    if (x >= 0 &&
        x < canvas.width &&
        y >= 0 &&
        y < canvas.height) {

        event.preventDefault();

        col = Math.floor(x / tile_width);
        row = Math.floor(y / tile_height);

        button = grid.data[col][row];

        cx = Math.floor(col * tile_width + gutter_size);
        cy = Math.floor(row * tile_height + gutter_size);

        if (event.buttons === LEFT_MOUSE_BUTTON_DOWN) {

            if (button.status === BUTTON_STATUS_CLOSED) {
                drawOpenButtonAt(button, cx, cy);
                button.status = BUTTON_STATUS_OPEN;
            }

        }
        else if (event.buttons === RIGHT_MOUSE_BUTTON_DOWN) {

            if (button.status === BUTTON_STATUS_CLOSED) {
                drawFlagOnButtonAt(button, cx, cy);
                button.status = BUTTON_STATUS_FLAGGED;
            }
            else if (button.status === BUTTON_STATUS_FLAGGED) {
                drawClosedButtonAt(button, cx, cy);
                button.status = BUTTON_STATUS_CLOSED;
            }

        }

    }

}

function handleMouseUpEvent(event) {

    var x;
    var y;

    x = event.clientX;
    y = event.clientY;

    if (x >= 0 &&
        x < canvas.width &&
        y >= 0 &&
        y < canvas.height) {

        event.preventDefault();

        // report("handleMouseUpEvent");

    }

}

function handleContextMenuEvent(event) {

    var x;
    var y;

    x = event.clientX;
    y = event.clientY;

    if (x >= 0 &&
        x < canvas.width &&
        y >= 0 &&
        y < canvas.height) {

        event.preventDefault();

    }

}

function addEventHandlers() {

    if (isUndefined(window.addEventListener)) {

        reportDependencyMissingError("window.addEventListerner");

    }

    window.addEventListener("mousedown", handleMouseDownEvent);
    window.addEventListener("mouseup", handleMouseUpEvent);
    window.addEventListener("contextmenu", handleContextMenuEvent)

}

function createUIDiv() {

    var div;

    div = document.createElement("div");
    document.body.appendChild(div);

    return div;

}

function createOpenAllButton(p_ui) {

    var btn;

    function openAllButtons() {

        var j;
        var i;
        var button;

        for (j = 0; j < num_rows; j += 1) {

            for (i = 0; i < num_cols; i += 1) {

                button = grid.data[i][j];

                x = i * tile_width + gutter_size;
                y = j * tile_height + gutter_size;

                drawOpenButtonAt(button, x, y);
                button.status = BUTTON_STATUS_OPEN

            }

        }

    }

    btn = document.createElement("button");
    btn.onclick = openAllButtons;
    btn.innerHTML = "OPEN";

    return btn;

}

function createResetButton(p_ui) {

    var btn;

    btn = document.createElement("button");
    btn.onclick = grid.reset;
    btn.innerHTML = "RESET";

    return btn;

}

function main() {

    var ui_div;
    var openAllButton;
    var resetButton;

    num_rows = 16;
    num_cols = 30;
    num_mines = 99;
    button_width = 28;
    button_height = 28;
    gutter_size = 2;
    font_size_modifier = 0.7;

    BUTTON_STATUS_CLOSED = 0;
    BUTTON_STATUS_OPEN = 1;
    BUTTON_STATUS_FLAGGED = 2;

    LEFT_MOUSE_BUTTON_DOWN = 1;
    RIGHT_MOUSE_BUTTON_DOWN = 2;
    MIDDLE_MOUSE_BUTTON_DOWN = 4;
    FOURTH_MOUSE_BUTTON_DOWN = 8;
    FIFTH_MOUSE_BUTTON_DOWN = 16;

    button_closed_color = color(80,80,80);
    button_open_color = color(100,100,100);

    one_mine_color = color(0,0,255);
    two_mine_color = color(0,255,0);
    three_mine_color = color(255,0,0);
    four_mine_color = color(255,0,255);
    five_mine_color = color(255,255,0);
    six_mine_color = color(0,255,255);
    seven_mine_color = color(255,255,255);
    eight_mine_color = color(127,127,127);

    mine_colors = [
        one_mine_color,
        two_mine_color,
        three_mine_color,
        four_mine_color,
        five_mine_color,
        six_mine_color,
        seven_mine_color,
        eight_mine_color
    ];

    grid = createGrid(
        num_cols,
        num_rows
    );

    tile_width = button_width + gutter_size;
    tile_height = button_height + gutter_size;

    canvas_width = Math.floor(tile_width * num_cols + gutter_size);
    canvas_height = Math.floor(tile_height * num_rows + gutter_size);

    canvas = createCanvas(canvas_width, canvas_height);
    gl = canvas.getContext('2d');

    ui_div = createUIDiv();
    openAllButton = createOpenAllButton();
    resetButton = createResetButton();

    ui_div.appendChild(openAllButton);
    ui_div.appendChild(resetButton);

    document.body.appendChild(canvas);
    document.body.appendChild(ui_div);

    grid.createGameData();

    drawBackground(color(50,50,50));
    grid.draw();

    addEventHandlers();

}
