export function randomIntFromInterval(min = 1, max = 100) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function calcProbability(percent = 10) {
  const randomNum = randomIntFromInterval();
  return randomNum <= percent;
}
