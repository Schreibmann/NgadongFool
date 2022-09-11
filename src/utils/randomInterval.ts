export function randomIntFromInterval(min = 1, max = 100) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function calcProbability(percent = 10) {
  const randomNum = randomIntFromInterval()
  const probability = randomNum <= percent
  return probability
}
