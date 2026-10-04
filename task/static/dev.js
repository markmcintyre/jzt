const LZString = require('lz-string');

document.addEventListener('readystatechange', (event) => {

    if (event.target.readyState !== 'complete') {
        return;
    }

    const body = document.querySelector('body');
    const gameElement = document.getElementById("jzt");
    const game = new jzt.Game({
        canvasElement: gameElement
    });
    const exportButton = document.getElementById('export-site');

    document.getElementById('open-world').addEventListener('change', function (event) {

        var fileReader,
            file;

        if (event.target.files && event.target.files[0]) {

            file = event.target.files[0];
            fileReader = new FileReader();

            fileReader.onload = function () {

                var json,
                    data;

                if (file.type === 'application/json') {
                    json = fileReader.result;
                } else {
                    data = fileReader.result.split(',')[1];
                    try {
                        json = LZString.decompressFromBase64(data);
                    } catch (decodeException) {
                        alert('Couldn\'t read game world.\n' + decodeException);
                    }
                }

                if (json) {

                    try {
                        game.run(JSON.parse(json));
                        body.classList.remove('unloaded');
                        body.classList.add('loaded');
                    } catch (exception) {
                        console.error(exception);
                    }

                }

            };

            if (file.type === 'application/json') {
                fileReader.readAsText(file);
            } else {
                fileReader.readAsDataURL(file);
            }

        }

        event.preventDefault();

    }, false);

});