const gameElement = document.querySelector('.game');
const gameArea = document.querySelector('.game-area');
const settingsBar = document.querySelector('.settings-bar');
const bodyElement = document.querySelector('body');

const aspectRatio = 1.25;
const minWidth = 400;
const minHeight = minWidth / aspectRatio;
const settingsBarHeight = 60;

const initGameArea = () => {
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
  initGameArea();
});

settingsBar.querySelector('.mute').addEventListener('click', () => {});
settingsBar.querySelector('.full-screen').addEventListener('click', () => {
  gameArea.requestFullscreen();
})
initGameArea();