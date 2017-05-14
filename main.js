/*
    This is where we contruct the game and the display and do all the passing of
    settings. For instance we can define how large a game is, and thus how large
    our canvas need to be and what not.

    How many squares?
    How many mines?
    which colours?
    Use / display a timer?
    etc...

    TODO:

    *   I want to add functionality that opens all the clear spaces
        (minecount === 0) adjacent to the opened space.

        I think I want to check all eight neighbours if a clear space is
        clicked, add all the clear spaces found to a list of spaces to check.
        We can add the first clicked space to this list as well, come to think
        of it. Then work through the current list whilst filling the next untill
        nothing is left to check.

        To speed things up i can look into using an exhaustive list of spaces to
        check and remove any spaces already checked from any space that goes
        into the next list.

        This may require using indices rather than coordinates though, easier to
        work with.
*/

report("declaring");

var canvas;
var gl;
var grid;

var num_rows;
var num_cols;
var num_spaces;
var num_mines;
var game_status;
var game_status_display;

var BUTTON_STATUS_CLOSED;
var BUTTON_STATUS_OPEN;
var BUTTON_STATUS_FLAGGED;

var LEFT_MOUSE_BUTTON;
var RIGHT_MOUSE_BUTTON;
var MIDDLE_MOUSE_BUTTO;
var FOURTH_MOUSE_BUTTON;
var FIFTH_MOUSE_BUTTON;

var GAME_STATUS_PLAYING;
var GAME_STATUS_LOST;
var GAME_STATUS_WON;

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

var background_color;

function color(p_r, p_g, p_b, p_a) {

    var r = isDefined(p_r) ? p_r : 0;
    var g = isDefined(p_g) ? p_g : 0;
    var b = isDefined(p_b) ? p_b : 0;
    var a = isDefined(p_a) ? p_a : 1;

    return formatise('rgba({@1:i},{@2:i},{@3:i},{@4:n})',r,g,b,a);

}

function getColorFromNumMines(num_mines) {

    return mine_colors[num_mines - 1];

}

function clearCanvas() {

    gl.clearRect(0, 0, canvas.width, canvas.height);

}

function drawBackground() {

    gl.fillStyle = background_color;
    gl.fillRect(0, 0, canvas.width, canvas.height);

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

    gl.fillStyle = button_closed_color;
    gl.fillRect(x, y, button_width, button_height);

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

function triggerLoseConditionForDontOpenMineGameOption() {

    game_status = GAME_STATUS_LOST;

    openAllButtons();

    game_status_display.innerHTML = "GAME OVER";

}

function triggerWinConditionForDontOpenMineGameOption() {

    game_status = GAME_STATUS_WON;

    game_status_display.innerHTML = "Congratulations, you found all the mines.";

}

function drawButtonStates() {
    var i;
    var button;
    var calculated_x;
    var calculated_y;
    var opened_a_mine;
    var opened_places;

    opened_places = 0;
    opened_a_mine = false;

    i = 0;
    for (i; i < num_spaces; i += 1) {
        button = grid.data[i];

        calculated_x = grid.getXCoordFromIndex(i) * tile_width + gutter_size;
        calculated_y = grid.getYCoordFromIndex(i) * tile_height + gutter_size;

        if (button.status === BUTTON_STATUS_OPEN) {
            opened_a_mine = button.isMine;
            opened_places += 1;

            drawOpenButtonAt(button, calculated_x, calculated_y);
        }
        else if (button.status === BUTTON_STATUS_CLOSED) {
            drawClosedButtonAt(button, calculated_x, calculated_y);
        }
        else if (button.status === BUTTON_STATUS_FLAGGED) {
            drawFlagOnButtonAt(button, calculated_x, calculated_y);
        }
        else {
            reportUsageError("Attempt to draw button with unknown status");
        }

        if (game_status === GAME_STATUS_PLAYING) {
            if (opened_a_mine) {
                triggerLoseConditionForDontOpenMineGameOption();
            }

            if (opened_places === (num_spaces - num_mines)) {
                triggerWinConditionForDontOpenMineGameOption();
            }
        }
    }
}

function initiateGameData() {
    var data;
    var i;

    data = Array(num_spaces);
    i = 0;

    for (i; i < num_spaces; i += 1) {
        data[i] = {
            isMine: false,
            status: BUTTON_STATUS_CLOSED,
            num_mines: 0,
        };
    }

    return data;
}

function generateRandomMineIndices(p_num_mines, p_num_places) {
    var mines_to_place;
    var num_places;
    var mine_indices;
    var available_indices;
    var max_index;
    var i;
    var random_index;
    var mine_index;

    mines_to_place = p_num_mines;
    num_places = p_num_places;
    mine_indices = [];
    available_indices = Array(num_places);

    // Fill an array with all possible placeble indices.
    i = 0;
    for (i; i < num_places; i += 1) {
        available_indices[i] = i;
    }

    while (mines_to_place > 0) {
        max_index = available_indices.length - 1;
        random_index = generateRandomNumber(0, max_index);
        mine_index = available_indices.splice(random_index, 1)[0];
        mine_indices.push(mine_index);
        mines_to_place -= 1;
    }

    return mine_indices;

}

function fillGameDataWithMines(p_data, p_mine_indices) {
    var mine_indices;
    var i;
    var n;
    var mine_index;

    mine_indices = p_mine_indices;

    // Go through every point in the mine_coords
    i = 0;
    n = mine_indices.length;
    for (i; i < n; i += 1) {
        mine_index = mine_indices[i];
        p_data[mine_index].isMine = true;
    }
}

function addMineCountToBottomRight(p_x, p_y) {
    /*
        [X][X][X]
        [X][O][1]
        [X][1][1]
    */
    grid.getItemByCoords(p_x + 0, p_y + 1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 1).num_mines += 1;
}

function addMineCountToBottomLeft(p_x, p_y) {
    /*
        [X][X][X]
        [1][O][X]
        [1][1][X]
    */
    grid.getItemByCoords(p_x +-1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x +-1, p_y + 1).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y + 1).num_mines += 1;
}

function addMineCountToTopRight(p_x, p_y) {
    /*
        [X][1][1]
        [X][O][1]
        [X][X][X]
    */
    grid.getItemByCoords(p_x + 0, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 0).num_mines += 1;
}

function addMineCountToTopLeft(p_x, p_y) {
    /*
        [1][1][X]
        [1][O][X]
        [X][X][X]
    */
    grid.getItemByCoords(p_x +-1, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x +-1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y +-1).num_mines += 1;
}

function addMineCountToBottom(p_x, p_y) {
    /*
        [X][X][X]
        [1][O][1]
        [1][1][1]
    */
    grid.getItemByCoords(p_x +-1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x +-1, p_y + 1).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y + 1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 1).num_mines += 1;
}

function addMineCountToRight(p_x, p_y) {
    /*
        [X][1][1]
        [X][O][1]
        [X][1][1]
    */
    grid.getItemByCoords(p_x + 0, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y + 1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 1).num_mines += 1;
}

function addMineCountToLeft(p_x, p_y) {
    /*
        [1][1][X]
        [1][O][X]
        [1][1][X]
    */
    grid.getItemByCoords(p_x +-1, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x +-1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x +-1, p_y + 1).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y + 1).num_mines += 1;
}

function addMineCountToTop(p_x, p_y) {
    /*
        [1][1][1]
        [1][O][1]
        [X][X][X]
    */
    grid.getItemByCoords(p_x +-1, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x +-1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 0).num_mines += 1;
}

function addMineCountToAllEight(p_x, p_y) {
    /*
        [1][1][1]
        [1][O][1]
        [1][1][1]
    */
    grid.getItemByCoords(p_x +-1, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x +-1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x +-1, p_y + 1).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 0, p_y + 1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y +-1).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 0).num_mines += 1;
    grid.getItemByCoords(p_x + 1, p_y + 1).num_mines += 1;
}

function updateSurroundingTiles(p_data, p_num_rows, p_num_cols, p_mine_indices) {
    var i;
    var n;
    var x;
    var y;
    var nx;
    var ny;
    var mine_index;

    // Go through every index in the provided mine indices
    i = 0;
    n = p_mine_indices.length;
    for (i; i < n; i += 1) {
        mine_index = p_mine_indices[i];

        x = grid.getXCoordFromIndex(mine_index);
        y = grid.getYCoordFromIndex(mine_index);

        // Check for corner tiles,
        // Check for side tiles,
        // Otherwise consider it a center tile,
        // Add mine count to surrounding tiles accordingly.
        if (x === 0) {
            if (y === 0) {
                addMineCountToBottomRight(x, y);
            }
            else if (y === p_num_rows - 1) {
                addMineCountToTopRight(x, y);
            }
            else {
                addMineCountToRight(x, y);
            }
        }
        else if (x === p_num_cols - 1) {
            if (y === 0) {
                addMineCountToBottomLeft(x, y);
            }
            else if (y === p_num_rows -1) {
                addMineCountToTopLeft(x, y);
            }
            else {
                addMineCountToLeft(x, y);
            }
        }
        else if (y === 0) {
            addMineCountToBottom(x, y);
        }
        else if (y === p_num_rows - 1) {
            addMineCountToTop(x, y);
        }
        else {
            addMineCountToAllEight(x, y);
        }
    }
}

function createGrid(num_cols, num_rows) {
    var grid;
    var data;
    var mine_indices;

    grid = {};

    grid.createGameData = function() {
        data = initiateGameData(num_spaces);
        mine_indices = generateRandomMineIndices(num_mines, num_spaces);
        fillGameDataWithMines(data, mine_indices);
        updateSurroundingTiles(data, num_rows, num_cols, mine_indices);
        grid.data = data;
    }

    grid.draw = function() {
        clearCanvas();
        drawBackground();
        drawButtonStates();
    }

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

    grid.getXCoordFromIndex = function(p_index) {
        var result;

        result = Math.floor(p_index % num_cols);

        return result;
    }

    grid.getYCoordFromIndex = function(p_index) {
        var result;

        result = Math.floor(p_index / num_cols);

        return result;
    }

    grid.getIndexFromCoords = function(p_x, p_y) {
        var index;

        if (p_x < 0 || p_x >= num_cols) {
            index = -1;
        }
        else if (p_y < 0 || p_y >= num_rows) {
            index = -1;
        }
        else {
            index = Math.floor(p_y * num_cols) + p_x;
        }

        return index;
    }

    grid.getItemByCoords = function(p_x, p_y) {
        var item;
        var index;

        index = grid.getIndexFromCoords(p_x, p_y);
        if (index !== -1) {
            item = data[index];
        }

        return item;
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

function openButtonAt(p_col, p_row) {
    var button;

    button = grid.getItemByCoords(p_col, p_row);
    button.status = BUTTON_STATUS_OPEN;

    // Found an empty button. Open any empty neighbours to speed things up.
    if (button.num_mines === 0 && !button.isMine) {
        index = grid.getIndexFromCoords(p_col, p_row);
        openEmptyNeighboursByIndex(index);
    }
}

function attemptOpenButtonsInBulkAt(p_col, p_row) {
    var num_spaces_flagged;
    var num_expected_flagged_spaces;
    var to_open_spaces_indices;
    var status_changed;
    var i;
    var n;
    var col_offset;
    var row_offset;
    var col;
    var row;
    var button_index;
    var button;

    num_spaces_flagged = 0;
    num_expected_flagged_spaces = 0;
    to_open_spaces_indices = [];
    status_changed = false;
    i = 0;
    n = 9;

    // Go through all positions in a 3x3 kernel.
    for (i; i < n; i += 1) {
        col_offset = Math.floor(1 - (i % 3));
        row_offset = Math.floor(1 - Math.floor(i / 3));

        col = p_col + col_offset;
        row = p_row + row_offset;

        button_index = grid.getIndexFromCoords(col, row);
        if (button_index === -1) {
            continue;
        }

        button = grid.data[button_index];
        // Found the kernel
        if (col_offset === 0 && row_offset === 0) {
            num_expected_flagged_spaces = button.num_mines;
        }

        if (button.status === BUTTON_STATUS_FLAGGED) {
            num_spaces_flagged += 1;
        }
        else if (button.status === BUTTON_STATUS_CLOSED) {
            to_open_spaces_indices.push(button_index);
        }
    }

    if (num_spaces_flagged === num_expected_flagged_spaces) {
        i = 0;
        n = to_open_spaces_indices.length;
        for (i; i < n; i += 1) {
            button_index = to_open_spaces_indices[i];
            col = grid.getXCoordFromIndex(button_index);
            row = grid.getYCoordFromIndex(button_index);
            openButtonAt(col, row);
            status_changed = true;
        }
    }

    return status_changed;
}

function handleMouseDownEvent(event) {
    var x;
    var y;
    var clicked_inside_canvas;
    var col;
    var row;
    var space;
    var status_changed;
    var index;

    x = event.clientX;
    y = event.clientY;
    status_changed = false;

    clicked_inside_canvas = (
        x >= 0 &&
        x < canvas.width &&
        y >= 0 &&
        y < canvas.height
    );

    if (clicked_inside_canvas) {
        event.preventDefault();

        col = Math.floor(x / tile_width);
        row = Math.floor(y / tile_height);
        if (col >= num_cols || row >= num_rows) {
            // We're out of bounds, probably hit the bottom/right gutter. Just abort.
            return;
        }

        // All these status checks should be done elsewhere.
        space = grid.getItemByCoords(col, row);
        if (event.buttons === LEFT_MOUSE_BUTTON) {
            if (space.status === BUTTON_STATUS_CLOSED) {
                openButtonAt(col, row);
                status_changed = true;
            }
        }
        else if (event.buttons === RIGHT_MOUSE_BUTTON) {
            if (space.status === BUTTON_STATUS_CLOSED) {
                space.status = BUTTON_STATUS_FLAGGED;
                status_changed = true;
            }
            else if (space.status === BUTTON_STATUS_FLAGGED) {
                space.status = BUTTON_STATUS_CLOSED;
                status_changed = true;
            }
        }
        else if (event.buttons === (LEFT_MOUSE_BUTTON + RIGHT_MOUSE_BUTTON)) {
            if (space.status === BUTTON_STATUS_OPEN && !space.isMine) {
                status_changed = attemptOpenButtonsInBulkAt(col, row);
            }
        }

        // This belongs in the grid logic, not here.
        if (status_changed) {
            grid.draw();
        }
    }
}

function handleMouseUpEvent(event) {
    var x;
    var y;
    var clicked_inside_canvas;

    x = event.clientX;
    y = event.clientY;

    clicked_inside_canvas = (
        x >= 0 &&
        x < canvas.width &&
        y >= 0 &&
        y < canvas.height
    );

    if (clicked_inside_canvas) {
        event.preventDefault();
    }
}

function handleContextMenuEvent(event) {
    var x;
    var y;
    var clicked_inside_canvas;

    x = event.clientX;
    y = event.clientY;

    clicked_inside_canvas = (
        x >= 0 &&
        x < canvas.width &&
        y >= 0 &&
        y < canvas.height
    );

    if (clicked_inside_canvas) {
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

function createGameStatusDisplay() {
    var log;

    log = document.createElement("span");
    log.style.marginLeft = "8px";
    log.style.MarginRight = "8px";

    return log;
}

function openAllButtons() {
    var i;
    var n;
    var button;

    i = 0;
    for (i; i < num_spaces; i += 1) {
        button = grid.data[i];
        button.status = BUTTON_STATUS_OPEN;
    }

    grid.draw();
}

function openEmptyNeighboursByIndex(p_index) {
    var check_list;
    var x;
    var y;
    var i;
    var n;
    var x_off;
    var y_off;
    var col;
    var row;
    var button_index;
    var button;

    check_list = [];

    x = grid.getXCoordFromIndex(p_index);
    y = grid.getYCoordFromIndex(p_index);

    // Go through all positions in a 3x3 kernel.
    i = 0;
    n = 9;
    for (i; i < n; i += 1) {
        x_off = Math.floor(1 - (i % 3));
        y_off = Math.floor(1 - Math.floor(i / 3));

        // Skip the kernel centre for now.
        if (x_off === 0 && y_off === 0) {
            continue;
        }

        col = x + x_off;
        row = y + y_off;

        button_index = grid.getIndexFromCoords(col, row);
        if (button_index === -1) {
            continue;
        }

        button = grid.data[button_index];
        if (button.status !== BUTTON_STATUS_CLOSED) {
            continue;
        }

        button.status = BUTTON_STATUS_OPEN;
        // Found another empty button
        if (button.num_mines === 0 && !button.isMine) {
            // Ignore possible duplicates
            if (check_list.indexOf(button_index) === -1) {
                check_list.push(button_index);
            }
        }
    }

    i = 0;
    n = check_list.length;
    for (i; i < n; i += 1) {
        button_index = check_list[i];
        openEmptyNeighboursByIndex(button_index);
    }
}

function resetGame() {
    game_status = GAME_STATUS_PLAYING;
    game_status_display.innerHTML = "";
    grid.reset();
}

function createOpenAllButton(p_ui) {
    var btn;

    btn = document.createElement("button");
    btn.onclick = openAllButtons;
    btn.innerHTML = "OPEN";

    return btn;
}

function createResetButton(p_ui) {
    var btn;

    btn = document.createElement("button");
    btn.onclick = resetGame;
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

    GAME_STATUS_PLAYING = 0;
    GAME_STATUS_LOST = 1;
    GAME_STATUS_WON = 2;

    game_status = GAME_STATUS_PLAYING;

    BUTTON_STATUS_CLOSED = 0;
    BUTTON_STATUS_OPEN = 1;
    BUTTON_STATUS_FLAGGED = 2;

    LEFT_MOUSE_BUTTON = 1;
    RIGHT_MOUSE_BUTTON = 2;
    MIDDLE_MOUSE_BUTTON = 4;
    FOURTH_MOUSE_BUTTON = 8;
    FIFTH_MOUSE_BUTTON = 16;

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

    background_color = color(50,50,50);

    num_spaces = num_cols * num_rows;

    grid = createGrid(num_cols, num_rows);

    tile_width = button_width + gutter_size;
    tile_height = button_height + gutter_size;

    canvas_width = Math.floor(tile_width * num_cols + gutter_size);
    canvas_height = Math.floor(tile_height * num_rows + gutter_size);

    canvas = createCanvas(canvas_width, canvas_height);
    gl = canvas.getContext('2d');

    ui_div = createUIDiv();

    openAllButton = createOpenAllButton();
    resetButton = createResetButton();
    game_status_display = createGameStatusDisplay();

    ui_div.appendChild(openAllButton);
    ui_div.appendChild(resetButton);
    ui_div.appendChild(game_status_display);

    document.body.appendChild(canvas);
    document.body.appendChild(ui_div);

    resetGame();
    addEventHandlers();
}
