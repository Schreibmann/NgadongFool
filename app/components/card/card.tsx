import * as React from "react"
import {
  ImageBackground,
  ViewStyle,
  StyleProp,
  ImageStyle,
  PixelRatio,
  TextStyle,
  ViewProps,
} from "react-native"
import { cardHeight, CardWidth } from "../../config/constants"
import { CardProps } from "./card.props"
import * as Animatable from "react-native-animatable"
import { color, typography } from "../../theme"
import { Text } from "../../components"

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
  display: "flex",
  flex: 1,
  width,
  height,
  backgroundColor: "transparent",
  borderRadius: 6,
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
  top: 0,
}
const TEXT: TextStyle = {
  color: color.palette.black,
  fontFamily: typography.code,
}
const BOLD: TextStyle = { fontWeight: "bold" }
const STUMP_TEXT: TextStyle = {
  ...TEXT,
  ...BOLD,
  fontSize: 24,
  letterSpacing: 6,
  transform: [
    {
      rotate: "-64deg",
    },
  ],
}
const SHADOW = {
  shadowColor: "black",
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.5,
  shadowRadius: 20,
  opacity: 0.5,
}

const JACKET_OFFSET = {
  top: cardHeight * -4,
  left: CardWidth * -2,
}

export function Card(props: CardProps) {
  const { offset, opened, isStump, dragging } = props
  const cardRef = React.useRef<Animatable.AnimatableComponent<ViewProps, ViewStyle>>(null)

  const spriteOffset = opened ? offset : JACKET_OFFSET
  const CARD_IMAGE_STYLE: StyleProp<ImageStyle> = {
    width: spriteWidth,
    height: spriteHeight,
    resizeMode: "cover",
    overflow: "hidden",
    ...spriteOffset,
  }

  React.useEffect(() => {
    cardRef.current.flipInY(500)
  }, [props.rank, props.suit])

  return (
    <Animatable.View
      // @ts-ignore
      ref={cardRef}
      style={[CARD_CONTAINER_STYLE, dragging ? SHADOW : null]}
    >
      <ImageBackground
        style={CARD_IMAGE_BACKGROUND_STYLE}
        imageStyle={CARD_IMAGE_STYLE}
        source={cardsSripeMap}
      >
        {isStump && <Text style={STUMP_TEXT} text="ПЕНЁК" />}
      </ImageBackground>
    </Animatable.View>
  )
}
