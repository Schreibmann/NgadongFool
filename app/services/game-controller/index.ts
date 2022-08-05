import { Card, CardRanks, CardSuits } from "../../components/card/card.props"
import { CardDeck36 } from "../../config/constants"
import { delay } from "../../utils/delay"
import { calcProbability } from "../../utils/randomInterval"

export interface Player {
  id: number
  name: string
  avatar: string
  isCPU: boolean
  cards: Card[]
  stumps: Card[]
}

export interface CurrentPlayer extends Player {
  canContinueTurn: boolean
}

export enum Stage {
  stumps = "stumps",
  prepare = "prepare",
  mainGame = "mainGame",
}

export interface PlaygroundState {
  deck: Card[]
  players: Player[]
  current: Card[]
  stage: Stage
  activePlayer: CurrentPlayer
  trump: CardSuits
}

export class GameController {
  public deck: Card[]
  public players: Player[]
  public current: Card[]
  public stage: Stage
  public activePlayer: CurrentPlayer
  public trump: CardSuits

  private setState: React.Dispatch<React.SetStateAction<PlaygroundState>>

  constructor(players: Player[], setState: React.Dispatch<React.SetStateAction<PlaygroundState>>) {
    this.players = players
    this.deck = this.shuffle(CardDeck36)
    this.current = []
    this.setState = setState
  }

  async init() {
    this.stage = Stage.stumps
    await this.takeStumps()
    await this.takeCard()
    const randomPlayer = this.players[Math.floor(Math.random() * this.players.length)]
    await this.setActivePlayer({ ...randomPlayer })
  }

  updateState() {
    const state = {
      deck: this.deck,
      players: this.players,
      current: this.current,
      stage: this.stage,
      activePlayer: this.activePlayer,
      trump: this.trump,
    }
    this.setState(state)
  }

  shuffle(deck: Card[]): Card[] {
    let currentIndex = deck.length
    let randomIndex: number
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex--
      ;[deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]]
    }
    return deck
  }

  async setActivePlayer(player: Player, canContinueTurn = false) {
    this.activePlayer = { ...player, canContinueTurn }
    this.updateState()
    await delay(300)
  }

  async passCard({ card, from, to }: { from: number; to?: number; card: Card }): Promise<void> {
    console.log("pass card", card, from, to)
    const fromPlayer = this.players.find((player) => player.id === from)
    const cardIndex = fromPlayer.cards.findIndex(
      (c) => c.rank === card.rank && c.suit === card.suit,
    )
    // Pass to player
    if (to) {
      const targetPlayer = this.players.find((player) => player.id === to)
      targetPlayer.cards.unshift(fromPlayer.cards[cardIndex])
      // Put to deck
    } else {
      this.current.push(fromPlayer.cards[cardIndex])
    }
    fromPlayer.cards = fromPlayer.cards.filter((_, index) => index !== cardIndex)
    this.updateState()
    await delay(300)
  }

  async takeCard(playerId?: number, toStump = false): Promise<void> {
    const card = this.deck.shift()
    if (playerId) {
      const targetPlayer = this.players.find((player) => player.id === playerId)
      if (toStump) {
        targetPlayer.stumps.push({ ...card, isStump: true })
      } else {
        targetPlayer.cards.unshift(card)
      }
    } else {
      this.current.push(card)
    }
    this.updateState()
    await delay(300)
  }

  async takeStumps(): Promise<void> {
    for (let i = 0; i < this.players.length; i++) {
      await this.takeCard(this.players[i].id, true)
      await this.takeCard(this.players[i].id, true)
    }
    this.stage = Stage.prepare
  }

  async prepareTurnPlayer({ target, card }: { target: Player; card: Card }) {
    const self = this.players.find((player) => player.id === 3)

    // Deck is empty. Time to start game
    if (this.deck.length === 1) {
      if (target.id !== self.id) {
        console.log("Didnt took last card")
        // TODO throw bad cards
      }
      this.trump = this.deck[0].suit === CardSuits.Spades ? null : this.deck[0].suit
      await this.takeCard(self.id)
      this.stage = Stage.mainGame
      await this.setNextPlayer()
      return false
    }

    const opponents = this.players.filter((player) => player.id !== 3)

    let canPassToSomeOne =
      this.checkIfCanPassCard(opponents[0], card) || this.checkIfCanPassCard(opponents[1], card)

    // Player saved card
    if (target.id === self.id) {
      if (canPassToSomeOne) {
        console.log("Could pass but saved card")
        // TODO throw bad cards
      }
      await this.takeCard(target.id)
      await this.setNextPlayer()
      return false
    } else {
      const canPassToTarget = this.checkIfCanPassCard(target, card)
      if (!canPassToTarget) {
        console.log("You shell not pass!")
        // TODO throw bad cards
        return false
      }
    }

    if (this.activePlayer.canContinueTurn) { 
      await this.passCard({ card, from: self.id, to: target.id })
    } else {
      await this.takeCard(target.id)
    }
    

    const myCard = self.cards[0]

    if (myCard) {
      canPassToSomeOne =
        this.checkIfCanPassCard(opponents[0], myCard) ||
        this.checkIfCanPassCard(opponents[1], myCard)
      if (!canPassToSomeOne) {
        await this.setNextPlayer()
        return false
      } else {
        console.log("Player can pass card")
        this.activePlayer.canContinueTurn = true
        return true
      }
    } else {
      return false
    }
  }

  async prepareTurnCPU(playerId: number, playerCard?: Card) {
    let receiverId: number
    const self = this.players.find((player) => player.id === playerId)

    // Deck is empty. Time to start game
    if (!playerCard && this.deck.length === 1) {
      this.trump = this.deck[0].suit === CardSuits.Spades ? null : this.deck[0].suit
      receiverId = self.id
      await this.takeCard(receiverId)
      this.stage = Stage.mainGame
      await this.setNextPlayer()
      return
    }

    const opponents = this.players.filter((player) => player.id !== playerId)

    let card = playerCard || this.deck[0]
    let canPass = this.checkIfCanPassCard(opponents[0], card)

    if (canPass) {
      receiverId = opponents[0].id
    } else {
      canPass = this.checkIfCanPassCard(opponents[1], card)
      if (canPass) {
        receiverId = opponents[1].id
      } else {
        if (!playerCard) {
          canPass = this.checkIfCanPassCard(self, card)
          if (canPass) {
            receiverId = self.id
          }
        }
      }
    }

    if (canPass) {
      if (playerCard) {
        const skip = calcProbability(50)
        if (skip) {
          console.log(`${this.activePlayer.name} skip pass card to ${receiverId}`)
          // TODO throw bad cards
        } else {
          await this.passCard({ card, from: self.id, to: receiverId })
        }
      } else {
        await this.takeCard(receiverId)
      }
      card = self.cards[0]
      await this.prepareTurnCPU(self.id, card)
    } else {
      await this.takeCard(self.id)
      await this.setNextPlayer()
    }
  }

  checkIfCanPassCard(target: Player, card: Card) {
    if (target.cards.length === 0) {
      return false
    }
    const targetCard = target.cards[0]
    let canPass
    if (card.rank === CardRanks.six) {
      canPass = targetCard.rank === CardRanks.ace
    } else {
      canPass = targetCard.rank === card.rank - 1
    }
    return canPass
  }

  async setNextPlayer() {
    const currentPlayerIndex = this.players.findIndex(
      (player) => player.id === this.activePlayer.id,
    )
    const nextPlayerIndex = currentPlayerIndex + 1
    const nextPlayer = { ...(this.players[nextPlayerIndex] || this.players[0]) }
    await this.setActivePlayer(nextPlayer)
  }
}
