import { CharacterStoreModel } from "./game-store"

test("can be created", () => {
  const instance = CharacterStoreModel.create({})

  expect(instance).toBeTruthy()
})
