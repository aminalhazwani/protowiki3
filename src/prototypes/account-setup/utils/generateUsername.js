import { ADJECTIVES, NOUNS } from '../data/usernameData.js'

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function generateUsername() {
  const num = Math.floor(Math.random() * 90) + 10
  return capitalize(pick(ADJECTIVES)) + capitalize(pick(NOUNS)) + num
}
