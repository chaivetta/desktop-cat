# Desktop Cat

Pixel cats that live on the bottom edge of your screen. They wander, groom, nap, stretch, roll over, sit in boxes, eat, and play with their toys — and you can play with them too.

![All seven coats in every pose](docs/preview.png)

## What they do

- **Wander** along the top of your taskbar, and stop to **boop noses** when two cats meet
- **Watch you** — bring the mouse pointer close and they turn their heads and follow it with their eyes
- **Groom** — lick a paw, wash behind the ears, twist round to lick a flank, or go full leg-in-the-air
- **Knead** — paws pressing in turn, eyes squeezed shut, before settling down
- **Nap** — curl into a loaf with little *z*'s floating up; wake with a big **stretch** and a **yawn**
- **Roll over** — belly up, paws kicking in the air
- **Zoomies** — once in a while, a sudden sprint from one side of the screen to the other, ending in a skidding stop. Now and then a second cat joins in and they race
- **Eat** — when you put food out, they trot over and tuck in, then groom
- **Sit in boxes** — of course. They duck down and peek out over the edge
- **Play** — chase, crouch with a bottom-wiggle, pounce, bat, stand up and swat
- **Play-fight** — two cats square up, swat and hop at each other, then one bolts and the other chases it until it flops over in surrender

![Stretch, yawn, stand and swat, eat, boop, zoomies, hunting crouch](docs/moves.png)

![Watching the pointer, kneading, play-fighting and the chase](docs/more.png)

![Skid, and three ways to groom](docs/moves2.png)

## Toys

| Toy | |
| :-- | :-- |
| **Ball of yarn** | Throw it and they chase it. **Hold it** and it dangles on its string — they stand up to swat it and leap for it |
| **Wind-up mouse** | Scurries about until it winds down; the cats hunt it and send it flipping. Click it to wind it up again |
| **Cardboard box** | A cat will climb in and peek out. Drag the box around — passenger included. Click it to make the cat hop out |
| **Food bowl** | *Feed the cats* puts a bowl out; click the bowl to refill it |
| **Laser pointer** | Turn it on and the red dot follows your mouse. Every cat on screen goes after it |
| **Feather wand** | A feather on a string at the end of a stick, held by your pointer. Swing it — they stand, swat and leap for it |
| **Butterfly** | Drifts about the room, rests on the floor or on a napping cat. The cats stalk and pounce; it always gets away |
| **Catnip** | Drop a pouch: each cat sniffs it, then rolls about in bliss — and often gets the zoomies after. Click it to freshen it up |
| **Cat bed** | Sleepy cats walk over, knead it and curl up inside. Drag it with the sleeper in it |
| **Scratching post** | Cats stretch up against it and rake away, sisal fluff flying, the pom-pom swinging |

![Eating, sitting in a box, swatting at dangling yarn, chasing the laser](docs/toys.png)

![Scratching post, cat bed, catnip, feather wand and a race](docs/toys2.png)

## Every cat has a card

Right-click or double-click a cat (or pick **Cat cards…** from the tray icon) to open its card.

<img src="docs/card.png" width="360" align="right" alt="A cat card: portrait, love hearts, growing-up bar, personality, diary">

- **A name** — new cats arrive as kittens and ask to be named (🎲 suggests one). Click the name to change it any time
- **Name tag** — show the name in a little speech bubble above the cat's head, or keep it on the card only
- **Personality** — two random traits per cat, like *Playful*, *Sleepy*, *Cuddly*, *Curious*, *Foodie*, *Tidy*, *Rascal*, *Hunter* or *Lazy*, plus a favourite toy. They really change how the cat behaves: a sleepy cat naps more, a hunter goes after the mouse and the butterfly, a foodie lingers at the bowl
- **Growing up** — kittens start small and grow as you look after them: petting, feeding, playing, naps in the bed. Kitten 🍼 → young cat 🐱 → grown-up 👑
- **Love bar** — ten pixel hearts. Petting, feeding and playing (especially with their favourite toy) fill it up; it fades slowly if they're left alone for long
- **Diary** — what they've been up to: meals, naps, games, races, play-fights, growing up…
- **Turkish and English** — switch at the bottom of the card

Everything is saved on your computer and remembered next time.

![Name tags above the cats](docs/nametags.png)

<br clear="right">

## Playing with the cats

| | |
| :-- | :-- |
| **Click** a cat | Pet it — hearts and a soft purr (a sleeping cat wakes up and stretches) |
| **Drag** a cat | Pick it up by the scruff; let go and it lands on its feet |
| **Drag** a toy | Move the box, bowl or mouse; dangle the yarn, swing it and let go to throw it |
| **Right-click / double-click** a cat | Open its card |
| **Tray / menu-bar icon** | Cat cards, adopt a kitten (seven coats), toys, feed them, laser pointer, **cat size** and **toy size** (each from tiny to large), hide them, start with your computer |

Seven coats: ginger tabby, black, white, grey tabby, calico, siamese and tuxedo.

The window is transparent and click-through: your desktop works as normal, and the mouse is only caught when it is over a cat or a toy.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm start
```

Build a stand-alone app — a portable `.exe` on Windows, a `.dmg` on macOS, an `AppImage` on Linux (build each on its own system):

```bash
npm run dist
```

On macOS the app isn't signed, so the first time, right-click it and choose **Open** (or *System Settings → Privacy & Security → Open Anyway*).

### Try it in a browser

Open `src/index.html` directly — it runs as a little demo room with buttons for every cat and toy.

## How it's drawn

No sprite sheets. Every frame, each cat is rasterised from simple shapes into a 48×42 material buffer, then lit — top edges catch the light, undersides and far legs fall into shadow — and outlined. Scaled up with nearest-neighbour, that gives the chunky "pixel 3D" look, and lets every coat pattern work in every pose. The toys are drawn the same way.

## License

MIT
