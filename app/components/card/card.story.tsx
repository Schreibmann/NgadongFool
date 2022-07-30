import * as React from "react"
import { storiesOf } from "@storybook/react-native"
import { StoryScreen, Story, UseCase } from "../../../storybook/views"
import { Card } from "./card"
import { CardRanks, CardSuits } from "./card.props"

declare let module

storiesOf("Card", module)
  .addDecorator((fn) => <StoryScreen>{fn()}</StoryScreen>)
  .add("Style Presets", () => (
    <Story>
      <UseCase text="Card" usage="Front view">
        <Card rank={CardRanks.ace} suit={CardSuits.Hearts} opened />
      </UseCase>
      <UseCase text="Card" usage="Front view">
        <Card rank={CardRanks.ace} suit={CardSuits.Hearts} opened={false} />
      </UseCase>
    </Story>
  ))
