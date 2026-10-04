const LZString = require('lz-string');

document.addEventListener('readystatechange', (event) => {

  if (event.target.readyState !== 'complete') {
    return;
  }

  const loaderElement = document.querySelector('.loader');
  const startLoader = document.querySelector('.game-area .start');
  const loadError = document.querySelector('.load-error');

  document.getElementById('load-world').addEventListener('change', function (event) {
    const file = event.target.files && event.target.files[0];

    if (!file) {
      return;
    }

    const fileReader = new FileReader();
    const isJson = file.type === 'application/json' || /\.json$/i.test(file.name);

    fileReader.onload = function () {
      let json;

      try {
        if (isJson) {
          json = fileReader.result;
        } else {
          json = LZString.decompressFromUint8Array(new Uint8Array(fileReader.result));
        }

        const gameData = JSON.parse(json);
        const gameTitle = document.querySelector('header h1');
        const gameAuthor = document.querySelector('header h2 cite');
        gameTitle.textContent = gameData.name;
        gameAuthor.textContent = gameData.author;
        startLoader.gameData = gameData;
        startLoader.classList.remove('hidden');
        loadError.textContent = '';
        loaderElement.remove();
      } catch (exception) {
        loadError.textContent = 'Could not read that world file.';
        startLoader.classList.remove('hidden');
        console.error(exception);
      }
    };

    if (isJson) {
      fileReader.readAsText(file);
    } else {
      fileReader.readAsArrayBuffer(file);
    }

    event.preventDefault();
  }, false);

});