import * as React from "react"
import {
  View,
  ImageBackground,
  ViewStyle,
  StyleProp,
  ImageStyle,
  PixelRatio,
  TouchableOpacity,
  ViewProps,
} from "react-native"
import { cardHeight, CardWidth } from "../../config/constants"
import { CardProps } from "./card.props"
import * as Animatable from "react-native-animatable"

export const cardsSripeMap = require("./cards-sprite-map.png")

const spriteWidth = PixelRatio.roundToNearestPixel(1252)
const spriteHeight = PixelRatio.roundToNearestPixel(750)
const width = PixelRatio.roundToNearestPixel(CardWidth)
const height = PixelRatio.roundToNearestPixel(cardHeight)

const CARD_CONTAINER_STYLE: StyleProp<ViewStyle> = {
  width: CardWidth,
  height: cardHeight,
  backgroundColor: "transparent",
  padding: 0,
  margin: 3,
  borderRadius: 6,
  overflow: "hidden",
}

const CARD_IMAGE_BACKGROUND_STYLE: StyleProp<ImageStyle> = {
  flex: 1,
  width,
  height,
  backgroundColor: "transparent",
  borderRadius: 6,

  overflow: "hidden",
  top: 0,
}

const JACKET_OFFSET = {
  top: cardHeight * -4,
  left: CardWidth * -2,
}

export function Card(props: CardProps) {
  const { offset, opened } = props
  const cardRef = React.useRef(null)

  const spriteOffset = opened ? offset : JACKET_OFFSET
  const CARD_IMAGE_STYLE: StyleProp<ImageStyle> = {
    width: spriteWidth,
    height: spriteHeight,
    resizeMode: "cover",
    overflow: "hidden",
    ...spriteOffset,
  }

  const handlePress = () => {
    // TODO make turn with card props
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <Animatable.View
        ref={cardRef}
        animation="flipInY"
        duration={300}
        style={CARD_CONTAINER_STYLE}
      >
        <ImageBackground
          style={CARD_IMAGE_BACKGROUND_STYLE}
          imageStyle={CARD_IMAGE_STYLE}
          source={cardsSripeMap}
        />
      </Animatable.View>
    </TouchableOpacity>
  )
}
