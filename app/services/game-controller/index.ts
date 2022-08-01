import { Card } from "../../components/card/card.props";
import { CardDeck36 } from "../../config/constants";

export interface Player {
    id: number;
    name: string;
    avatar: string;
    isCPU: boolean;
    cards: Card[];
    stumps: Card[];
}

enum Stage {
    prepare = 'prepare',
    mainGame = 'mainGame'
}

export class GameController {
    public deck: Card[]
    public players: Player[]
    public current: Card[]
    public stage: Stage
    public activePlayer: number

    constructor(players: Player[]) {
        this.players = players
        this.deck = this.shuffle(CardDeck36)
        this.current = []
    }

    init() {
        this.stage = Stage.prepare
        this.takeStumps()
        this.takeCard()
        const randomPlayer = this.players[Math.floor(Math.random() * this.players.length)];
        this.setActivePlayer(randomPlayer.id)
    }

    shuffle(deck: Card[]): Card[] {
        let currentIndex = deck.length
        let randomIndex: number
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex--
            [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]]
        }
        return deck;
    }

    passCard({ card, from, to }: { from: number, to?: number, card: Card }): void {
        const fromPlayer = this.players.find(player => player.id === from)
        const cardIndex = fromPlayer.cards.findIndex(c => c.rank === card.rank && c.suit === card.suit)
        if (to) {
            const targetPlayer = this.players.find(player => player.id === to)
            targetPlayer.cards.unshift(fromPlayer.cards[cardIndex])
        } else {
            this.current.push(fromPlayer.cards[cardIndex])  
        }
        fromPlayer.cards = fromPlayer.cards.filter((_, index) => index !== cardIndex);
    }

    takeCard(playerId?: number, toStump = false): void {
        const card = this.deck.shift()
        if (playerId) {
            const targetPlayer = this.players.find(player => player.id === playerId)
            if (toStump) {
                targetPlayer.stumps.push({...card, isStump: true})
            } else {
                targetPlayer.cards.unshift(card)
            }
            
        } else {
            this.current.push(card)
        }
    }

    takeStumps(): void {
        this.players.forEach(player => {
            this.takeCard(player.id, true)
            this.takeCard(player.id, true)
        })
    }

    setActivePlayer(playerId: number) { 
        this.activePlayer = playerId;
    }

    prepareTurnCPU(playerId: number, playerCard?: Card) {
        const self = this.players.find(player => player.id === playerId)
        const opponents = this.players.filter(player => player.id !== playerId)

        let card = playerCard || this.deck[0]
        let receiverId: number
        let canPass = this.checkIfCanPassCard(opponents[0], card)

        if (canPass) {
            receiverId = opponents[0].id
          // this.passCard({ card, from: self.id, to: opponents[0].id})
        } else {
            canPass = this.checkIfCanPassCard(opponents[1], card) 
            if (canPass) {
                receiverId = opponents[1].id
                // this.passCard({ card, from: self.id, to: opponents[1].id})
            } else {
                canPass = this.checkIfCanPassCard(self, card)
                if (canPass) {
                    receiverId = self.id
                    // this.passCard({ card, from: self.id, to: opponents[1].id})
                }
            }
        }

        if (canPass) {
            this.takeCard(receiverId)
            card = self.cards[0]
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
}