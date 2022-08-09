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
  strikes: number
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
  beaten: Card[]
  stage: Stage
  activePlayer: CurrentPlayer
  trump: CardSuits
}

export class GameController {
  public deck: Card[]
  public players: Player[]
  public current: Card[]
  public beaten: Card[]
  public stage: Stage
  public activePlayer: CurrentPlayer
  public trump: CardSuits

  private setState: React.Dispatch<React.SetStateAction<PlaygroundState>>

  constructor(players: Player[], setState: React.Dispatch<React.SetStateAction<PlaygroundState>>) {
    this.players = players
    this.deck = this.shuffle(CardDeck36)
    this.current = []
    this.beaten = []
    this.setState = setState
  }

  async init() {
    this.stage = Stage.stumps
    this.trump = CardSuits.Hearts
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
      beaten: this.beaten,
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

  // Move trumps to end & sort ascending
  sort(cards: Card[]) {
    cards
      .sort((a, b) => (a.suit !== this.trump && b.suit !== this.trump ? -1 : 1))
      .sort((a, b) => (a.suit !== this.trump && b.suit !== this.trump ? a.rank - b.rank : 1))
      .sort((a, b) => (a.suit === this.trump && b.suit === this.trump ? a.rank - b.rank : 0))
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
    await delay(500)
    if (this.current.length === this.players.length) {
      console.log("Round is over. Next turn")
      this.beaten = [...this.beaten, ...this.current]
      await delay(500)
      this.current = []
      this.updateState()
      if (fromPlayer.cards.length === 0) {
        if (fromPlayer.stumps.length > 0) {
          await this.showStumps()
        } else {
          console.log(`${self.name} quit game`)
          await this.setNextPlayer()
          this.players = this.players.filter((player) => !!player.cards.length && !!player.stumps.length)
        }
      }
    } else {
      await this.setNextPlayer()
    }
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

  async showStumps() {
    const self = this.players.find((player) => player.id === this.activePlayer.id)
    self.cards = self.stumps.map(stump => ({...stump, isStump: false}))
    self.stumps = []
    console.log(`${self.name} opened stumps`, self.cards)
    this.updateState()
    await delay(500)
  }

  async mainGamePlayerPassCard(card: Card) {
    console.log("mainGamePlayerPassCard", card)
    if (this.current.length === 0) {
      await this.passCard({ from: this.activePlayer.id, card })
    } else {
      const self = this.players.find((player) => player.id === this.activePlayer.id)
      const targetCard = this.current.at(-1)
      const canPass = this.checkIfCanPassCardMain(targetCard, card)
      if (canPass) {
        await this.passCard({ from: this.activePlayer.id, card })
      } else {
        self.strikes++
      }
    }
  }

  async mainGameCpuPassBadCard(player: Player) {
    player.cards.sort((a, b) => a.rank - b.rank)
    const trumps = player.cards.filter((card) => card.suit === this.trump)
    const spades = player.cards.filter((card) => card.suit === CardSuits.Spades)
    const shitCards = player.cards.filter(
      (card) => card.suit !== CardSuits.Spades && card.suit !== this.trump,
    )
    const card = shitCards[0] || spades[0] || trumps[0]
    console.log("CPU pass bad card", card, player.cards)
    await this.mainGamePlayerPassCard(card)
  }

  async mainGameTakeCard() {
    const card = this.current.shift()
    const player = this.players.find((player) => player.id === this.activePlayer.id)
    player.cards.unshift(card)
    console.log(`${player.name} takes card`, card)
    await this.setNextPlayer()
  }

  async mainGameCpuTurn() {
    await delay(1000)
    const player = this.players.find((player) => player.id === this.activePlayer.id)
    if (this.current.length === 0) {
      await this.mainGameCpuPassBadCard(player)
    } else {
      const cardToPass = this.findCardToPass(player)
      if (cardToPass) {
        await this.passCard({ from: player.id, card: cardToPass })
        if (this.current.length === 0) {
          await this.mainGameCpuPassBadCard(player)
        }
      } else {
        await this.mainGameTakeCard()
      }
    }
  }

  async prepareTurnPlayer({ target, card }: { target: Player; card: Card }) {
    const self = this.players.find((player) => player.id === 3)

    // Deck is empty. Time to start game
    if (!this.activePlayer.canContinueTurn && this.deck.length === 1) {
      if (target.id !== self.id) {
        console.log("Didnt took last card")
        self.strikes++
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
        self.strikes++
      }
      await this.takeCard(target.id)
      await this.setNextPlayer()
      return false
    } else {
      const canPassToTarget = this.checkIfCanPassCard(target, card)
      if (!canPassToTarget) {
        console.log("You shell not pass!")
        self.strikes++
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
        this.activePlayer.canContinueTurn = false
        await this.setNextPlayer()
        return false
      } else {
        console.log("Player can pass card")
        this.activePlayer.canContinueTurn = true
        this.updateState()
        return true
      }
    } else {
      return false
    }
  }

  async prepareTurnCPU(playerId: number, playerCard?: Card) {
    console.log("prepareTurnCPU", playerId, playerCard, this.deck)
    let receiverId: number
    const self = this.players.find((player) => player.id === playerId)

    if (this.deck.length === 0) {
      console.log("WTF")
      return await this.setNextPlayer()
      
    }
    // Deck is empty. Time to start game
    if (!playerCard && this.deck.length === 1) {
      this.trump = this.deck[0].suit === CardSuits.Spades ? null : this.deck[0].suit
      receiverId = self.id
      await this.takeCard(receiverId)
      this.stage = Stage.mainGame
      return await this.setNextPlayer()
    }

    const opponents = this.players.filter((player) => player.id !== playerId)

    let card = playerCard || this.deck[0]
    let canPass = this.checkIfCanPassCard(opponents[0], card)
    let canPassToHimself = false

    if (canPass) {
      receiverId = opponents[0].id
    } else {
      canPass = this.checkIfCanPassCard(opponents[1], card)
      if (canPass) {
        receiverId = opponents[1].id
      } else {
        if (!playerCard) {
          canPassToHimself = this.checkIfCanPassCard(self, card)
        }
      }
    }

    if (canPass) {
      if (playerCard) {
        const skip = calcProbability(50)
        if (skip) {
          console.log(`${this.activePlayer.name} skip pass card to ${receiverId}`)
          self.strikes++
        } else {
          await this.passCard({ card, from: self.id, to: receiverId })
        }
      } else {
        await this.takeCard(receiverId)
      }
      card = self.cards[0]
      return await this.prepareTurnCPU(self.id, card)
    } else {
      await this.takeCard(self.id)
      if (canPassToHimself) {
        return await this.prepareTurnCPU(self.id)
      } else {
        return await this.setNextPlayer()
      }
    }
  }

  checkIfCanPassCard(target: Player, card: Card) {
    if (target.cards.length === 0) {
      return false
    }
    const targetCard = target.cards[0]
    let canPass: boolean
    if (card.rank === CardRanks.six) {
      canPass = targetCard.rank === CardRanks.ace
    } else {
      canPass = targetCard.rank === card.rank - 1
    }
    return canPass
  }

  checkIfCanPassCardMain(targetCard: Card, card: Card) {
    console.log("checkIfCanPassCardMain", targetCard, card)
    const isTrump = card.suit === this.trump
    const targetIsTrump = targetCard.suit === this.trump
    const targetIsSpade = targetCard.suit === CardSuits.Spades
    const sameSuit = card.suit === targetCard.suit
    const canPass =
      (sameSuit && card.rank > targetCard.rank) || (!targetIsSpade && !targetIsTrump && isTrump)
    return canPass
  }

  findCardToPass(player: Player) {
    const targetCard = this.current.at(-1)
    this.sort(player.cards)
    console.log("findCardToPass", targetCard, player.cards)
    const validCards = player.cards.filter((card) => this.checkIfCanPassCardMain(targetCard, card))
    console.log("validCards", validCards)
    return validCards[0]
  }

  async setNextPlayer() {
    const currentPlayerIndex = this.players.findIndex(
      (player) => player.id === this.activePlayer.id,
    )
    if (this.activePlayer.canContinueTurn) {
      this.players[currentPlayerIndex].strikes++
    }

    const nextPlayerIndex = currentPlayerIndex + 1
    const nextPlayer = { ...(this.players[nextPlayerIndex] || this.players[0]) }
    await this.setActivePlayer(nextPlayer)
  }
}
