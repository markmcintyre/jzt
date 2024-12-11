const gameElement = document.querySelector('.game');
const gameArea = document.querySelector('.game-area');
const settingsBar = document.querySelector('.settings-bar');
const startLoader = document.querySelector('.game-area .start');
const bodyElement = document.querySelector('body');
const canvasElement = document.querySelector('.game canvas');
const gem = document.querySelector('.gem');

const aspectRatio = 1.25;
const minWidth = 400;
const minHeight = minWidth / aspectRatio;
const cycleColors = ['#8585ff', '#85ff85', '#88ffff', '#ff8888', '#ff88ff', '#ffff88', '#ffffff'];
let gemColorIndex = 0;

const resizeGameArea = () => {
  const settingsBarHeight = settingsBar.getBoundingClientRect().height;
  const container = gameElement.getBoundingClientRect();
  const containerHeight = container.height - settingsBarHeight;
  const calculatedWidth = Math.max(minWidth, Math.min(container.width, containerHeight * aspectRatio));
  const calculatedHeight = Math.max(minHeight, calculatedWidth / aspectRatio);
  const left = (container.width - calculatedWidth) / 2;
  const top = (container.height - calculatedHeight) / 2 - (settingsBarHeight/2);
  gameArea.style.width = `${calculatedWidth}px`;
  gameArea.style.height = `${calculatedHeight}px`;
  gameArea.style.left = `${left}px`;
  gameArea.style.top = `${top}px`;
  settingsBar.style.top = `${top + calculatedHeight}px`;
  settingsBar.style.width = `${calculatedWidth}px`;
  settingsBar.style.left = `${left}px`;
  bodyElement.style.minHeight = `calc(${minHeight}px + ${settingsBarHeight}px + 10rem)`;
}

window.addEventListener('resize', () => {
  resizeGameArea();
});

startLoader.addEventListener('click', () => {

  let gameData = startLoader.gameData;
  const game = new jzt.Game({canvasElement});

  if (gameData) {
    console.log(`Loading game "${gameData.name}"…`);
    game.run(gameData);
    startLoader.remove();
  } else {

  }

});

settingsBar.querySelector('.mute').addEventListener('click', () => {});
settingsBar.querySelector('.full-screen').addEventListener('click', () => {
  gameElement.requestFullscreen();
})

window.setInterval(() => {
  gemColorIndex = gemColorIndex + 1 < cycleColors.length ? gemColorIndex + 1 : 0;
  gem.style.color = cycleColors[gemColorIndex];
}, 250);

resizeGameArea();