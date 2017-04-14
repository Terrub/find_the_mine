function mainLoop(func_frameRender) {

    var proto_mainLoop;
    var animating = false;

    function isAnimating() {

        return (animating === true);

    }

    function setIsAnimating(value) {
        animating = value;
    }

    function tic() {

        if ( ! isAnimating()) { return; }

        renderFrame();
        window.requestAnimationFrame(tic);

    }

    function proto_start() {

        if (isAnimating()) { return; }

        setIsAnimating(true);
        tic();

        report("Main loop started");

    }

    function proto_stop() {

        if ( ! isAnimating()) { return ; }

        setIsAnimating(false);

        report("Main loop stopped");

    }

    proto_mainLoop = {
        start: proto_start,
        stop: proto_stop
    };

    return proto_mainLoop;

}
