const LZString = require('lz-string');

document.addEventListener('readystatechange', (event) => {

  if (event.target.readyState !== 'complete') {
      return;
  }

  const loaderElement = document.querySelector('.loader');

  document.getElementById('load-world').addEventListener('change', function (event) {

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
                    const startLoader = document.querySelector('.start');
                    const gameTitle = document.querySelector('header h1');
                    const gameAuthor = document.querySelector('header h2 cite');
                    gameData = JSON.parse(json);
                    gameTitle.innerHTML = gameData.name;
                    gameAuthor.innerHTML = gameData.author;
                    startLoader.gameData = gameData;
                    startLoader.classList.remove('hidden');
                    loaderElement.remove();
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