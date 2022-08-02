import { Card, CardSuits } from "../../components/card/card.props"
import { CardDeck36 } from "../../config/constants"

export interface Player {
  id: number
  name: string
  avatar: string
  isCPU: boolean
  cards: Card[]
  stumps: Card[]
}

export enum Stage {
  prepare = "prepare",
  mainGame = "mainGame",
}

export interface PlaygroundState {
  deck: Card[]
  players: Player[]
  current: Card[]
  stage: Stage
  activePlayer: Player
}

export class GameController {
  public deck: Card[]
  public players: Player[]
  public current: Card[]
  public stage: Stage
  public activePlayer: Player
  public trump: CardSuits

  private setState: React.Dispatch<React.SetStateAction<PlaygroundState>>

  constructor(players: Player[], setState: React.Dispatch<React.SetStateAction<PlaygroundState>>) {
    this.players = players
    this.deck = this.shuffle(CardDeck36)
    this.current = []
    this.setState = setState
  }

  wait(ms: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(ms)
      }, ms)
    })
  }

  async init() {
    this.stage = Stage.prepare
    await this.takeStumps()
    await this.takeCard()
    const randomPlayer = this.players[Math.floor(Math.random() * this.players.length)]
    this.setActivePlayer(randomPlayer)
  }

  updateState() {
    const state = {
      deck: this.deck,
      players: this.players,
      current: this.current,
      stage: this.stage,
      activePlayer: this.activePlayer,
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

  setActivePlayer(player: Player) {
    this.activePlayer = player
    this.updateState()
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
    await this.wait(500)
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
    await this.wait(500)
  }

  async takeStumps(): Promise<void> {
    for (let i = 0; i < this.players.length; i++) {
      await this.takeCard(this.players[i].id, true)
      await this.takeCard(this.players[i].id, true)
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
      this.setNextPlayer()
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
        await this.passCard({ card, from: self.id, to: receiverId })
      } else {
        await this.takeCard(receiverId)
      }
      card = playerCard ? undefined : self.cards[0]
      await this.prepareTurnCPU(self.id, card)
    } else {
      await this.takeCard(self.id)
      this.setNextPlayer()
    }
  }

  checkIfCanPassCard(target: Player, card: Card) {
    if (target.cards.length === 0) {
      return false
    }
    const targetCard = target.cards[0]
    const canPass = targetCard.rank === card.rank - 1
    return canPass
  }

  setNextPlayer() {
    const currentPlayerIndex = this.players.findIndex(
      (player) => player.id === this.activePlayer.id,
    )
    const nextPlayerIndex = currentPlayerIndex + 1
    const nextPlayer = this.players[nextPlayerIndex] || this.players[0]
    this.setActivePlayer(nextPlayer)
  }
}
