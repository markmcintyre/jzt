const gameElement = document.querySelector('.game');
const gameArea = document.querySelector('.game-area');
const settingsBar = document.querySelector('.settings-bar');
const startLoader = document.querySelector('.game-area .start');
const canvasElement = document.querySelector('.game canvas');
const loadError = document.querySelector('.load-error');
const howToPlay = document.querySelector('.how-to-play');
const gem = document.querySelector('.gem');

const aspectRatio = 1.25;
const minWidth = 400;
const minHeight = minWidth / aspectRatio;
const cycleColors = ['#8585ff', '#85ff85', '#88ffff', '#ff8888', '#ff88ff', '#ffff88', '#ffffff'];
let gemColorIndex = 0;

class JztSettings {

  #listeners = [];
  #muted;

  initialize(initialSettings) {
    this.#muted = initialSettings.audioMute;
  }

  addListener(listener) {
    this.#listeners.push(listener);
  }

  get isMuted() {
    return this.#muted;
  }

  set isMuted(value) {
    this.#muted = value;
    this.#listeners.forEach((listener) => {
      listener({audioMute: this.#muted});
    });
  }

}

class SlidingPanel {

  types = ['game-over', 'victory'];

  callback(type, message) {
    if (type === 'game-over') {
      console.log('Game over event received!');
    } else if (type === 'victory') {
      console.log('Victory event received!');
    }
  }

}

const resizeGameArea = () => {
  const settingsBarHeight = settingsBar.getBoundingClientRect().height;
  const howToPlayHeight = howToPlay.getBoundingClientRect().height;
  const container = gameElement.getBoundingClientRect();
  const gameAreaHeight = Math.max(minHeight, container.height - settingsBarHeight - howToPlayHeight);
  const calculatedWidth = Math.max(minWidth, Math.min(container.width, gameAreaHeight * aspectRatio));
  const calculatedHeight = Math.max(minHeight, calculatedWidth / aspectRatio);
  gameArea.style.width = `${calculatedWidth}px`;
  gameArea.style.height = `${calculatedHeight}px`;
  settingsBar.style.width = `${calculatedWidth}px`;
  howToPlay.style.width = `${calculatedWidth}px`;
};

const settings = new JztSettings();
const panel = new SlidingPanel();

const showLoadError = (exception) => {
  loadError.textContent = 'Could not load this world. Check the packaged world file and try again.';
  startLoader.dataset.loading = '';
  console.error(exception);
};

const fetchWorld = async () => {
  const worldPath = gameArea.dataset.jztWorld;
  const response = await fetch(worldPath);
  if (!response.ok) {
    throw new Error(`World request failed with HTTP status ${response.status}.`);
  }
  return response.json();
};

const startGame = async () => {
  if (startLoader.dataset.loading === 'true') {
    return;
  }

  startLoader.dataset.loading = 'true';
  loadError.textContent = '';

  try {
    const gameData = startLoader.gameData || await fetchWorld();
    const game = new jzt.Game({
      canvasElement,
      notificationListeners: [panel],
    });
    game.observeSettings(settings);
    game.run(gameData);
    canvasElement.style.display = 'block';
    startLoader.remove();
  } catch (exception) {
    showLoadError(exception);
  }
};

window.addEventListener('resize', resizeGameArea);
startLoader.addEventListener('click', startGame);
startLoader.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    startGame();
  }
});

settingsBar.querySelector('.mute').addEventListener('click', () => {
  settings.isMuted = !settings.isMuted;
});
settingsBar.querySelector('.full-screen').addEventListener('click', () => {
  const request = gameElement.requestFullscreen();
  if (request) {
    request.catch((exception) => console.error('Could not enter fullscreen mode.', exception));
  }
});

window.setInterval(() => {
  gemColorIndex = gemColorIndex + 1 < cycleColors.length ? gemColorIndex + 1 : 0;
  gem.style.color = cycleColors[gemColorIndex];
}, 250);

resizeGameArea();