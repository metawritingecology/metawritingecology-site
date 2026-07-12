export type FictionFragment = {
  id: string;
  text: string;
  sourceWorkId?: string;
  sourceTitle?: string;
  sourceVolume?: string;
};

export type FictionWorkFragments = {
  workId: string;
  title: string;
  fragments: readonly FictionFragment[];
};

export const fictionFragments = [
  {
    workId: "the-central-naming-tower",
    title: "The Central Naming Tower",
    fragments: [
      {
        id: "season-one-complete-fragment-01",
        text: "The Seventh Calibration Hall was clean in the way all Tower rooms were clean: white walls, white floor, white instruments suspended without visible wires. Nothing reflected too clearly. The glass between the observation deck and the naming circle had been treated to prevent self-recognition after seven seconds.\n\nNeam stopped at the threshold and let the room read him.\n\nA pale line of light passed over his face.\n\n**Reader: Neam.**\n**Cohort: 17-W.**\n**Authenticity Index: 0.86.**\n**Interpretive Stability: Acceptable.**\n\nThe door allowed him in.",
        sourceWorkId: "the-central-naming-tower-book-one",
        sourceTitle: "The Central Naming Tower — Book One",
        sourceVolume: "Book One",
      },
      {
        id: "season-one-complete-fragment-02",
        text: "The body could never be certain of direction inside the Tower. The machines were too smooth. Ascent and descent became administrative claims. The panel told you what kind of movement had been authorized, and the body learned to agree.\n\nThe child did not agree.\n\nHis breathing slipped around the elevator’s rhythm. The wall took it first. Neam heard a faint, irregular pressure pass through the metal under the child’s hand.\n\nThen the child spoke.\n\n“Grief is heavier on floors.”\n\nNeam turned toward him.\n\nDadel did not.\n\nThe child kept looking at the wall.\n\n“Between floors,” he said, “it forgets.”",
        sourceWorkId: "the-central-naming-tower-book-one",
        sourceTitle: "The Central Naming Tower — Book One",
        sourceVolume: "Book One",
      },
      {
        id: "season-one-complete-fragment-04",
        text: "The doors opened.\n\nFloor Thirty-Two waited outside.\n\nSame cream walls.\n\nSame bed.\n\nSame care phrase glowing above it.\n\n**When Grief feels heavy, Grief may rest.**\n\nThe Calibrator stared.\n\nDadel swore.\n\nIt was a small word. Common. Low. Nothing Tower-trained.\n\nNeam had never heard him use it.\n\nThe child opened his eyes.\n\nHe did not seem surprised.\n\n“Wrong up,” he said.\n\nNo one corrected him.",
        sourceWorkId: "the-central-naming-tower-book-one",
        sourceTitle: "The Central Naming Tower — Book One",
        sourceVolume: "Book One",
      },
      {
        id: "season-one-complete-fragment-05",
        text: "Beyond the rail, the land opened.\n\nFlat, brown-green, crossed by old roads that had not been used in a long time. Some still curved toward places that no longer existed. A black fence cut across the distance. Past it stood a cluster of low shapes half-swallowed by grass.\n\nNot ruins exactly.\n\nToo low to be ruins.\n\nToo stubborn to be gone.\n\nDadel stopped.\n\nNeam knew before he asked.\n\n“That’s it?”\n\nDadel’s face changed.\n\nOnly a little.\n\n“The remains of it.”\n\n“Dadel Town.”\n\nDadel kept his eyes on the plain.\n\n“They moved the road,” he said.\n\n“What?”\n\n“The old road went farther left. My grandmother complained about it. Even after she forgot other things. She said the survey map was rude.”",
        sourceWorkId: "the-central-naming-tower-book-one",
        sourceTitle: "The Central Naming Tower — Book One",
        sourceVolume: "Book One",
      },
      {
        id: "season-two-complete-fragment-01",
        text: "The elevator arrived at Floor Thirty-Two with no chime.\n\nThe doors opened on the care hallway.\n\nWarm light. Cream walls. Corrected air. A cup on the floor beside the bed where a child could reach it without asking.\n\nEverything looked close enough to normal that Neam did not trust it.\n\nDadel was still sitting on the elevator floor, one hand over his face. The child sat across from him with his knees drawn up. His bare feet were dirty. There was dried blood on one heel from somewhere Neam had not seen.\n\nThe panel showed nothing.\n\nThen, after a delay:\n\n**Arrival: Floor Thirty-Two**\n**Subject: —**\n**Correction Pending**\n\nThe blank after _Subject_ held for three seconds.\n\nLong enough for all of them to see it.\n\nThen the Tower repaired itself.\n\n**Subject: Grief**",
        sourceWorkId: "the-central-naming-tower-book-two",
        sourceTitle: "The Central Naming Tower — Book Two",
        sourceVolume: "Book Two",
      },
      {
        id: "season-two-complete-fragment-02",
        text: "The room beyond was warm.\n\nToo warm, almost. It had no bed. No chair. No care phrase. The walls were woven from pale strips of material, crossing over and under each other so tightly they looked solid from a distance. Up close, there were gaps. Tiny ones. Dark behind the weave.\n\nThe floor was soft and slightly springy.\n\nA cup sat in the center of the room.\n\nA red ball sat beside it.\n\nNeither belonged there.\n\nThe child looked at the ball.\n\nNeam looked at Dadel.\n\nDadel said, “Do not pick that up.”\n\n“I wasn’t going to.”\n\n“I was talking to him.”\n\nThe child did not pick it up.\n\nHe nudged it once with his toe.\n\nThe ball rolled badly, stopped early, and leaned against the cup.\n\nThe wall recorded:\n\nObject Contact: Mild\nPlay Response: Possible\n\nThe child looked at the wall.\n\n“Bad play,” he said.",
        sourceWorkId: "the-central-naming-tower-book-two",
        sourceTitle: "The Central Naming Tower — Book Two",
        sourceVolume: "Book Two",
      },
      {
        id: "season-two-complete-fragment-04",
        text: "The assistant began rolling up the cord, then stopped when it tied itself into a knot around his fingers.\n\nHe sighed.\n\nNo one helped him for several seconds.\n\nThen Dadel reached over and loosened it with one hand.\n\n“Don’t pull against it,” Dadel said.\n\nThe assistant nodded.\n\n“Thank you.”\n\n“Do not make this emotional.”\n\n“I wasn’t.”\n\n“You looked close.”\n\nThe child leaned forward and touched the blank wall with one finger.\n\nThe wall did not answer.\n\nHe smiled a little.\n\nNot happy.\n\nSurer.\n\nNeam asked, “What did it feel like?”\n\nThe child thought.\n\n“Like someone cleaned the whole room before I knew what I wanted to keep.”\n\nDadel made a sound.\n\n“That is awful.”\n\n“Yes,” the child said.\n\nThe lower wall scratched one final line.\n\nANSWER GIVEN TOO SOON IS STILL A DOOR\n\nThen, beneath it:\n\nDO NOT ENTER EVERY DOOR THAT LOVES YOU\n\nVale looked away.\n\nThe assistant whispered, “That one is worse.”",
        sourceWorkId: "the-central-naming-tower-book-two",
        sourceTitle: "The Central Naming Tower — Book Two",
        sourceVolume: "Book Two",
      },
      {
        id: "season-two-complete-fragment-05",
        text: "The Door Without Number had learned to wait.\n\nThat was new.\n\nAt first it had opened whenever the Tower failed to count it. Then whenever the child came near it. Then whenever the Second Reader pressed from below with its patient, crooked almost-words.\n\nNow it waited.\n\nNo chime. No seam. No glow around the frame.\n\nOnly a section of wall that refused to become wall completely.\n\nDadel stood in front of it with the blank pendant in his hand.\n\nIt looked smaller away from his throat.\n\nA pale worn fragment. A hole at one end where the thread had passed through. No number. No name. No proper shape for a tool.\n\nBad jewelry.\n\nThat was what he had called it for years.",
        sourceWorkId: "the-central-naming-tower-book-two",
        sourceTitle: "The Central Naming Tower — Book Two",
        sourceVolume: "Book Two",
      },
      {
        id: "season-three-complete-fragment-01",
        text: "The road did not close overnight.\n\nThat was the first problem.\n\nThe second problem was that there had been no night.\n\nThe enumeration chamber kept its lights at procedure-level brightness, which meant no one could tell whether time had passed or merely been documented. Neam’s eyes hurt. Dadel had stopped complaining about his back, which meant his back was worse than usual. Vale stood by the table with both hands in her coat pockets, staring at the sideways road as if it had personally insulted her training.\n\nThe child sat at the threshold.\n\nThe blue thread knot lay in his open palm. He had not tied it to his wrist. He had not asked anyone where it belonged.\n\nIt did nothing.\n\nThat made it one of the few honest objects left.",
        sourceWorkId: "the-central-naming-tower-book-three",
        sourceTitle: "The Central Naming Tower — Book Three",
        sourceVolume: "Book Three",
      },
      {
        id: "season-three-complete-fragment-02",
        text: "A pale line appeared across the road.\n\nThen another.\n\nNot tape this time.\n\nThe road itself produced them, or allowed them. Thin white marks, forming a square around the child’s feet.\n\nHe had not stepped into it.\n\nThe square had come to him.\n\nVale whispered, “Review boundary.”\n\nDadel said, “We left the room.”\n\n“The Tower brought the room.”\n\nThe official voice spoke again.\n\nPlease remain within readiness field.\n\nThe child looked down.\n\n“No.”\n\nThe square brightened.\n\nRefusal recorded.\nRefusal stability: improved.\n\nThe child stepped out of the square.\n\nThe square followed.\n\nDadel laughed once, a small ugly sound.\n\n“Oh, that is vile.”",
        sourceWorkId: "the-central-naming-tower-book-three",
        sourceTitle: "The Central Naming Tower — Book Three",
        sourceVolume: "Book Three",
      },
      {
        id: "season-three-complete-fragment-04",
        text: "The shape appeared after the next bend.\n\nIt lay across the side of the road.\n\nNot blocking the road. Not exactly. The road had made space for it, or gone around it, or perhaps the road had been built by things trying not to touch it.\n\nIt was enormous.\n\nNot animal.\n\nNot building.\n\nNot body.\n\nA long, low mass of collapsed structure, pale and dark in layers. Its surface was covered with doorplates, room numbers, fragments of cloth, broken cups, folded papers, small shelves, ribbon, thread, child-sized handprints, blackened labels, and mouth-shaped gaps where voices entered and left.\n\nTiny rooms had been built into its side.\n\nTiny was wrong. They were normal rooms made small by comparison.",
        sourceWorkId: "the-central-naming-tower-book-three",
        sourceTitle: "The Central Naming Tower — Book Three",
        sourceVolume: "Book Three",
      },
      {
        id: "season-three-complete-fragment-05",
        text: "The road ahead opened slightly.\n\nNot toward Dadel Town.\n\nNot toward Tower.\n\nNot below.\n\nOnly forward in the way a breath is forward when no one asks it to become speech.\n\nThe child took one step.\n\nThen another.\n\nThe field did not follow as a trap.\n\nIt followed as weather.\n\nStill present.\n\nLess organized.\n\nDadel walked behind him, not at his side, not guarding the edge of the child, but watching the water lines for taking.\n\nNeam walked near enough to be asked.\n\nNot near enough to answer before being asked.\n\nBelow, the echo remained.\n\nFor the first time, enough had not become more.\n\nFor the first time, restraint had not become display.\n\nFor the first time, waiting had not become a job.\n\nThe shape moved with the child.\n\nOr the child moved with the shape.\n\nNo one named the difference.\n\nThe blue knot stayed in his pocket, still doing nothing.\n\nThat helped more than it should have.",
        sourceWorkId: "the-central-naming-tower-book-three",
        sourceTitle: "The Central Naming Tower — Book Three",
        sourceVolume: "Book Three",
      },
    ],
  },
  {
    workId: "the-field-below-the-index",
    title: "The Field Below the Index",
    fragments: [
      {
        id: "the-field-below-the-index-fragment-01",
        text: "The Field opened anyway.\n\nNot with gates. Gates were too literal. Not with flags. Flags made the wrong systems hungry. Not with ceremony. Ceremony attracted interpretation.\n\nIt opened as sequence.\n\nLights came on in rooms not marked on external maps. Machines warmed before names arrived for them. Screens refreshed. Small vendors lifted metal shutters. Elevators moved inside buildings that the Index grouped under a neighboring category. Children crossed streets whose names had never been translated correctly. A woman poured hot water over leaves while a logistics system, somewhere very far away, used her city as a dependency without storing its full name.\n\nContinuity did not announce itself.\n\nIt arranged morning.",
        sourceWorkId: "the-field-below-the-index",
        sourceTitle: "The Field Below the Index",
      },
      {
        id: "the-field-below-the-index-fragment-03",
        text: "Outside the audit, the Field opened into morning.\n\nA shopkeeper lifted a metal shutter and set a row of portable chargers near the counter. A customer waiting for coffee picked one up, turned it over, and saw the Field on its underside. Not the Field’s name. Not the Field’s status. Only a small manufacturing trace, a string of letters, a place folded into plastic.\n\nHe picked up a router.\n\nThe Field again.\n\nA hinge.\n\nThe Field.\n\nA sensor.\n\nThe Field.\n\nA battery pack.\n\nA thermal strip.\n\nA connector so small he almost dropped it.\n\nThe Field again.\n\nThe shopkeeper watched him turning objects over and asked whether he was looking for something specific.\n\nHe said no.\n\nHe was not looking for the Field.\n\nHe kept finding it.",
        sourceWorkId: "the-field-below-the-index",
        sourceTitle: "The Field Below the Index",
      },
      {
        id: "the-field-below-the-index-fragment-04",
        text: "At 07:03, the update moved to beverages.\n\nA customer ordered tea with no ice.\n\nThe platform standardized the phrase:\n\nNO ICE\n\nThe cup contained no cubes.\n\nOnly fragments small enough to pass through the scoop, bright against the tea, floating at the edge where liquid met plastic. The customer lifted the cup and watched them move.\n\nNo cubes.\n\nSome cold.\n\nThe platform marked the order correct.\n\nThe customer did not complain.\n\nThe Field marked it not wrong.\n\nNo ice had never meant the absence of cold.\n\nIt meant the removable ice had been removed. It meant the instruction had been followed to the edge of practice. It meant the sentence had reached the counter and met a scoop, a lid, a rush of orders, a hand trained by repetition, and the small physics of fragments passing through holes.",
        sourceWorkId: "the-field-below-the-index",
        sourceTitle: "The Field Below the Index",
      },
    ],
  },
  {
    workId: "delivery-not-established",
    title: "Delivery Not Established",
    fragments: [
      {
        id: "delivery-not-established-fragment-01",
        text: "Inside, the depot smelled of cardboard, rain-damp uniforms, instant coffee, toner, and the thin plastic heat of label printers. Packages moved along belts in small obedient waves. Screens above the sorting lanes showed district maps in current-version colors: blue for stable addresses, yellow for pending entrance confirmation, orange for high-risk receipt conditions, and gray for places that could not yet be used by the morning routes.\n\nSenvel looked at the map once, then looked away.\n\nHe preferred his notebook.",
        sourceWorkId: "delivery-not-established",
        sourceTitle: "Delivery Not Established",
      },
      {
        id: "delivery-not-established-fragment-02",
        text: "Mrs. Senn looked at Senvel’s phone.\n\n“It worked?”\n\n“Yes.”\n\n“But I am still the same person.”\n\n“Yes.”\n\n“And this is farther from my door.”\n\n“Yes.”\n\n“And now it is more real?”\n\nSenvel had no good answer.\n\nThe clerk printed a receipt and asked Mrs. Senn to sign. Mrs. Senn signed with a small hand-drawn mark instead of a full signature. It looked like a loop crossed by a short diagonal line.",
        sourceWorkId: "delivery-not-established",
        sourceTitle: "Delivery Not Established",
      },
      {
        id: "delivery-not-established-fragment-03",
        text: "South Market did not believe in straight lines.\n\nIt had official aisles, numbered gates, municipal hygiene zones, current-version vendor units, emergency exits, QR-coded inspection plates, fire lanes painted in yellow, and a map mounted beside the north entrance under a sheet of scratched acrylic.\n\nNo one used any of that unless they were lost.\n\nThe market was navigated by smell, by noise, by dripping water, by the angle of stacked crates, by whose nephew had parked a scooter where scooters were not allowed, by which fishmonger shouted first, by which breakfast stall ran out of scallion cakes before nine, and by whether the woman who sold cut fruit had opened her second umbrella.\n\nSenvel knew three ways into South Market. The app knew one.",
        sourceWorkId: "delivery-not-established",
        sourceTitle: "Delivery Not Established",
      },
      {
        id: "delivery-not-established-fragment-04",
        text: "He stepped back and looked at both lockers.\n\nB-12 had accepted the package and rejected the placement.\n\nB-21 had no package and remembered cardboard.\n\nThe first locker had accepted the package.\n\nThe second locker remembered it.\n\nNeither could deliver it.",
        sourceWorkId: "delivery-not-established",
        sourceTitle: "Delivery Not Established",
      },
    ],
  },
  {
    workId: "the-available-edition",
    title: "The Available Edition",
    fragments: [
      {
        id: "the-available-edition-fragment-01",
        text: "The absence of the primary text should not be understood as deletion, suppression, correction, disavowal, confirmation, completion, abandonment, postponement, or replacement. No single interpretive status should be assigned to its absence. The primary text is not included in this edition because the available access conditions do not presently support direct circulation without producing a higher risk of substitution by summary, inference, classification, or automated thematic reduction.\n\nThis note does not describe the primary text.\n\nThis note describes the conditions under which the primary text became unavailable.",
        sourceWorkId: "the-available-edition",
        sourceTitle: "The Available Edition",
      },
      {
        id: "the-available-edition-fragment-03",
        text: "The catalogue system created a temporary entry.\n\nThe temporary entry became searchable.\n\n2. Placeholder Record: First Known Form\n\nRecord Label: Common Core Record Type Assigned: Forthcoming Work Source Basis: Repeated summary phrase Confirmation Level: None Access Path: None Correction Status: Removal requested Removal Outcome: Partial\n\nRecorded Problem: The phrase “common core” was treated as a title.\n\nThe record interpreted repeated mention as publication preparation.\n\nThe absence of a publication date was displayed as “date unavailable,” rather than “publication unconfirmed.”\n\nThe absence of an access path was displayed as “not yet available,” rather than “no access path maintained.”\n\nCorrection Submitted: Change status from “forthcoming work” to “external inference object.”\n\nRemove title formatting.\n\nRemove expected publication marker.\n\nAdd limitation note:\n\nThis record does not correspond to a confirmed publication. It reflects metadata generated from summary convergence.\n\nResult: The main catalogue updated the status field.\n\nSearch previews retained the title field.\n\nRecommendation cards continued to display “Common Core” as a related work.\n\nThe placeholder was not removed.\n\nIt changed shape.",
        sourceWorkId: "the-available-edition",
        sourceTitle: "The Available Edition",
      },
      {
        id: "the-available-edition-fragment-04",
        text: "14. Boundary Failure Note\n\nA boundary statement can be copied without its boundary.\n\nWhen copied, it may become a definition table.\n\nWhen summarized, it may become a theory.\n\nWhen cited, it may become authority.\n\nThis document therefore cannot guarantee the separation it marks.\n\nIt records where separation was needed.",
        sourceWorkId: "the-available-edition",
        sourceTitle: "The Available Edition",
      },
    ],
  },
  {
    workId: "the-office-of-allocated-meaning",
    title: "The Office of Allocated Meaning",
    fragments: [
      {
        id: "the-office-of-allocated-meaning-fragment-01",
        text: "A block of meaning arrived before sunrise.\n\nIt came in through Receiving Gate Three, wrapped in gray membrane and carried on a low insulated cart whose wheels made almost no sound against the tiled corridor. The night staff had signed for it at 05:12, placed it beneath the first inspection lamp, and left the intake slate blinking beside it.\n\nBy the time Mara Venn entered the preparation room, the block had already begun to settle.",
        sourceWorkId: "the-office-of-allocated-meaning",
        sourceTitle: "The Office of Allocated Meaning",
      },
      {
        id: "the-office-of-allocated-meaning-fragment-02",
        text: "Tomas Reil joined the meaning queue before the doors opened.\n\nHe was not early. Not by district standards. By the time he reached the square, the line already curved around the west side of the Public Explanation Center, passed beneath the awning of the closed shoe repair shop, and ended near the breakfast carts where steam rose from the broth kettles in pale strips.\n\nThe morning was cold enough to show breath but not cold enough to excuse impatience. People stood close without touching. They held ration cards in gloved hands, folded request slips against their sleeves, checked the overhead boards, looked away, looked back again.",
        sourceWorkId: "the-office-of-allocated-meaning",
        sourceTitle: "The Office of Allocated Meaning",
      },
      {
        id: "the-office-of-allocated-meaning-fragment-04",
        text: "He woke before the building pipes began knocking and lay still, waiting for the sound that usually came first: paper under the door, card warmth, a board chime from the street, someone in the stairwell saying a word too softly. Nothing came.\n\nThe room remained itself.\n\nBed. Cup. Manual. Shoe. Sink. Blanket. Door. Night.\n\nThe list was still on the table under Sava’s note. He did not read it. He knew what it said. He knew what it failed to prove.\n\nHe got up and made tea.\n\nThe chipped blue cup had a brown mark along the inside where he had let leaves sit too long. He rubbed it with his thumb and did not remove the stain. The kettle hissed unevenly. The window had fogged at the bottom. Someone in the apartment below coughed twice, then dragged something small across the floor.\n\nNo official surface formed around any of it.",
        sourceWorkId: "the-office-of-allocated-meaning",
        sourceTitle: "The Office of Allocated Meaning",
      },
      {
        id: "the-office-of-allocated-meaning-fragment-05",
        text: "The queue arrived before the explanation that would not arrive.\n\nIt formed in the half-light outside the Public Explanation Center, beginning with three people under the left pillar and becoming twenty before the doors opened. Some carried old notices. Some carried notebooks. Some carried nothing because yesterday had taught them that nothing could still be a document if held correctly.\n\nThe exterior board showed the public service version of the notice.\n\nTEMPORARY NON-ALLOCATION Morning general allocation deferred. No substitute explanation will be issued. Priority notices remain in effect. Temporary non-allocation period: until end of current civic day.\n\nA gray envelope had been taped beside the board.\n\nTEMPORARY NON-ALLOCATION Valid for one day\n\nSomeone had circled valid for one day in pencil.\n\nSomeone else had written beneath it:\n\nthen what is today?\n\nMaintenance had not removed it.\n\nThe worker assigned to the board had stood before the pencil line at 06:10, rag in hand, and decided that removing it would create a cleaner surface than the city deserved. He cleaned the frame instead.",
        sourceWorkId: "the-office-of-allocated-meaning",
        sourceTitle: "The Office of Allocated Meaning",
      },
    ],
  },
  {
    workId: "the-city-of-the-residual-miracle",
    title: "The City of the Residual Miracle",
    fragments: [
      {
        id: "the-city-of-the-residual-miracle-fragment-01",
        text: "The small ward stood behind the east wall of the old temple hospital, where the plaster had been repaired so many times that it no longer held one color. Morning entered through three narrow windows. Below them were stone basins, a shelf for folded linen, two cots, an oil lamp, and a low table where instruments were kept wrapped in cloth. The ward had once served pilgrims with fever. Later it had received masons after a tower fire, then children during the summer cough years, then old women whose hearts forgot their rhythm during winter.\n\nNow it was used for small healings.\n\nSmall did not mean simple. It meant the city expected the patient to live.",
        sourceWorkId: "the-city-of-the-residual-miracle",
        sourceTitle: "The City of the Residual Miracle",
      },
      {
        id: "the-city-of-the-residual-miracle-fragment-02",
        text: "At the west end stood two bridge wardens in brown coats marked with pale stitching at the cuffs. One kept the crossing count on a wooden tablet. The other held a dull bell by its strap.\n\nThe bell was small, iron, and badly made on purpose.\n\nIt had no clear tone. When struck, it gave a short flat sound that did not travel. It was not meant to warn crowds. It was not meant to call priests. It was not meant to honor anything. A clear bell invited attention. A bright bell asked the air to remember it.\n\nDull bells were for work that should not be praised.\n\nThe warden holding it was named Pera. She had served the Nine Repairs for eleven years and had learned that old bridges disliked two things: sudden silence above them and admiration beneath them. She trusted wheel noise, hoof noise, bargaining, arguing, complaint, weather, and river. She did not trust reverence.",
        sourceWorkId: "the-city-of-the-residual-miracle",
        sourceTitle: "The City of the Residual Miracle",
      },
      {
        id: "the-city-of-the-residual-miracle-fragment-03",
        text: "His mother placed a basket of folded linen beside him.\n\n“Take these upstairs,” she said.\n\n“I won’t,” Ilo said.\n\nBy the time the words reached the room, they had become, “If you need me to.”\n\nHis mother smiled faintly, not with happiness, but with relief that a difficulty had dissolved before becoming visible.\n\n“Thank you,” she said.\n\nIlo looked at the basket.\n\nHe had said no.\n\nHe was sure he had said no.\n\nHe had felt the shape of it in his mouth: round at the start, hard at the end, a small wall made of breath. It had left him as refusal. But it had arrived elsewhere as help.",
        sourceWorkId: "the-city-of-the-residual-miracle",
        sourceTitle: "The City of the Residual Miracle",
      },
      {
        id: "the-city-of-the-residual-miracle-fragment-05",
        text: "By morning, the plain water had done nothing anyone could report.\n\nThat was almost the first useful thing about it.\n\nThe cup still sat beside the old threshold, not on it, its uneven clay rim covered by the poor lid. No damp mark spread from it. No old stone darkened. No inscription rose where there had never been an inscription. No ward bell answered from above. No door in the hospital opened by itself.\n\nThe threshold remained a threshold.\n\nDark stone.\n\nWorn middle.\n\nNo proof.\n\nOrrin stood three steps away with Bray and watched nothing happen until watching began to feel like asking.\n\nThen Bray said, “Enough.”\n\nOrrin looked at him.\n\n“If we keep staring, we become an audience.”\n\nThey went back up without touching the cup.\n\nThat mattered too.",
        sourceWorkId: "the-city-of-the-residual-miracle",
        sourceTitle: "The City of the Residual Miracle",
      },
    ],
  },
  {
    workId: "the-repair-of-neglected-wings",
    title: "The Repair of Neglected Wings",
    fragments: [
      {
        id: "the-repair-of-neglected-wings-fragment-01",
        text: "Ira sat alone at Bay Three of the night office, one hand around a paper cup of black vending-machine coffee, the other resting beside the listening kit. The office occupied the back half of a former municipal vehicle depot, a long concrete room with old drainage maps pinned over newer ones, shelves of sealed dust jars, and twelve workstations arranged beneath fluorescent lights that never all worked at once.\n\nOutside, the Old Capital District was wet and awake.\n\nIt was always awake in pieces. The late trams still moved along the coastal line. Fish trucks still crossed the market quarter. Night clerks still stamped forms in the lower courts. Pumps still drew water through pipes laid by three administrations that had never agreed on a single numbering system. The city had lost the capital sixty years ago, but it had not lost traffic, sewage, weather, paperwork, or memory.\n\nThose stayed.",
        sourceWorkId: "the-repair-of-neglected-wings",
        sourceTitle: "The Repair of Neglected Wings",
      },
      {
        id: "the-repair-of-neglected-wings-fragment-02",
        text: "Merek straightened. “Who are you?”\n\n“Rul Korr. Map custody.”\n\n“There is staff here at this hour?”\n\n“No.”\n\n“Then why are you here?”\n\nRul lifted the empty cup. “Could not sleep.”\n\n“That is not an answer.”\n\n“It is the one that does not require paperwork.”\n\nIra said, “Kavi found you?”\n\nRul looked toward the ceiling as if sound could travel through court stone more easily than through devices.\n\n“Your dispatcher sent three access pings, two malformed maintenance requests, and one message that said, ‘If you are still alive and near the old maps, do not let the repair technician open the acceptable drawer first.’”\n\nMerek looked at Ira.\n\nIra said nothing.\n\nRul set the cup on a map cabinet. “He also wrote that the form in his office was ugly and stable. That seemed like serious language.”\n\n“It is,” Ira said.",
        sourceWorkId: "the-repair-of-neglected-wings",
        sourceTitle: "The Repair of Neglected Wings",
      },
      {
        id: "the-repair-of-neglected-wings-fragment-04",
        text: "Ira said, “No list opening.”\n\nBria replied, “No list opening.”\n\nKavi added, “Her hand is steady.”\n\nBria said, “It is not.”\n\nRul said, “Do not let compensation delay become people yet.”\n\nCounsel said, “It may be people.”\n\n“It may,” Ira said. “Not yet.”\n\nMerek looked at her.\n\n“That still feels wrong.”\n\n“Yes.”\n\n“Because not saying people can protect a system.”\n\n“Yes.”\n\n“And saying people too early can convert them into claim units.”\n\n“Yes.”\n\nHe held that discomfort.\n\nDid not resolve it.\n\nThe display stabilized.",
        sourceWorkId: "the-repair-of-neglected-wings",
        sourceTitle: "The Repair of Neglected Wings",
      },
      {
        id: "the-repair-of-neglected-wings-fragment-05",
        text: "Most people did not need the whole city under their counter.\n\nOutside, Pel Row was still dark. Delivery vans moved along the street. A drainage grate at the corner clicked once as water passed below it. Someone upstairs opened a window and closed it again. The city prepared for morning without asking whether morning had been received.\n\nIra stood beside the van and listened.\n\nNot with the device at first.\n\nWith her body.\n\nThe background frequency was still there.\n\nLow.\n\nUnder the bakery.\n\nUnder Pel Row.\n\nUnder Glassmere.\n\nUnder the old court.\n\nUnder the maps that remained incomplete and the reports that refused to close.\n\nIt had not become louder.\n\nIt had become harder not to hear.\n\nShe took out the listening device.\n\nThe screen took longer than usual to wake.\n\nThen it showed:\n\nBACKGROUND FREQUENCY:\nACTIVE\n\nRESPONSIBILITY SIGNAL:\nRECORDED\n\nZERO STATE:\nUNAVAILABLE\n\nIra did not smile.\n\nThat would have been too much like satisfaction.\n\nShe saved the reading.\n\nNot to close it.\n\nTo keep it from being called nothing.",
        sourceWorkId: "the-repair-of-neglected-wings",
        sourceTitle: "The Repair of Neglected Wings",
      },
    ],
  },
  {
    workId: "the-house-without-evidence",
    title: "The House Without Evidence",
    fragments: [
      {
        id: "the-house-without-evidence-fragment-01",
        text: "The office returned around him.\n\nKeyboards.\nPrinters.\nA message chime from someone’s computer.\nThe soft, trained laughter from the open sales area where Callen Rusk was telling a polished client anecdote loud enough for nearby managers to hear.\n\nNolan saved the call notes.\n\nHe wrote:\n\nClient concerned about beneficiary transition.\nPrefers daughter not be informed immediately.\nPrepare document checklist.\nNo pressure language.\nSend checklist by 16:00.\n\nHe removed the phrase “appears anxious” before saving.\n\nIt was true, but it was not useful. Anxiety did not belong in the record unless it changed the policy action. Nolan had learned that, too. The system allowed certain kinds of care only when they could be converted into procedure.",
        sourceWorkId: "the-house-without-evidence",
        sourceTitle: "The House Without Evidence",
      },
      {
        id: "the-house-without-evidence-fragment-02",
        text: "Slide 2: Why Now\nSlide 3: The Family Transition Window\nSlide 4: Naming the Unasked Question\nSlide 5: Trust Expansion Pathway\nSlide 6: Conversation Framework\nSlide 7: Client Scenarios\nSlide 8: Next-Step Ownership\n\nHis notes had not had windows, pathways, or ownership.\n\nThey had had beneficiaries, document lists, hospital forms, daughters who did not know they had been named, clients who apologized for not understanding letters, older men who needed someone to explain what a discharge summary was.\n\nCallen had not removed these things.\n\nHe had lifted them until they no longer looked afraid.\n\nNolan opened a blank section beneath Slide 7.\n\nClient Scenario 1.\n\nHe stopped.\n\nThe company required anonymization. That part was simple. Names removed. Dates shifted. Policy numbers omitted. Medical conditions generalized. Family roles preserved only when relevant. He knew how to do that.\n\nWhat he did not know was how much of the client to leave alive.\n\nIf he wrote too much, the scenario would become heavy.\nIf he wrote too little, it would become useful.",
        sourceWorkId: "the-house-without-evidence",
        sourceTitle: "The House Without Evidence",
      },
      {
        id: "the-house-without-evidence-fragment-03",
        text: "At 07:06, his mother sent a message.\n\nRain maybe afternoon. Bring umbrella.\n\nThen:\n\nEat.\n\nThen, after a pause:\n\nDon’t make everything stand guard today.\n\nNolan looked at the third sentence.\n\nShe had kept his sentence.\n\nChanged it.\n\nReturned it.\n\nNot as analysis.\n\nAs weather advice.\n\nHe typed:\n\nI’ll try.\n\nThen added, after a moment:\n\nUmbrella also stands guard.\n\nHe nearly deleted it.\n\nToo close to a joke.\n\nToo strange.\n\nToo much like himself.\n\nHe sent it.\n\nHer reply came quickly.\n\nUmbrella is allowed.\n\nThen:\n\nEat.",
        sourceWorkId: "the-house-without-evidence",
        sourceTitle: "The House Without Evidence",
      },
      {
        id: "the-house-without-evidence-fragment-05",
        text: "In the apartment, the bathroom shelf still showed the missing space.\n\nTwo filters remained.\n\nThe room had not collapsed.\n\nHe took the orange from his pocket and placed it on the table.\n\nOne thing had left.\n\nOne thing had arrived.\n\nNot replacement.\n\nNot balance.\n\nJust life moving objects through rooms.\n\nHe opened the blue notebook.\n\nThird page.\n\nFilter gone.\n\nThen he stopped.\n\nThat was not the sentence.\n\nHe tried again.\n\nOne thing left and the room remained.\n\nToo neat.\n\nHe looked toward the bathroom shelf.\n\nThe shelf did not look healed.\n\nIt looked less defended by one object.\n\nHe had already written that.",
        sourceWorkId: "the-house-without-evidence",
        sourceTitle: "The House Without Evidence",
      },
    ],
  },
] satisfies readonly FictionWorkFragments[];

const workIds = new Set<string>();

for (const pool of fictionFragments) {
  if (pool.fragments.length === 0) {
    throw new Error(`Fiction fragment pool "${pool.workId}" must contain at least one fragment.`);
  }

  if (workIds.has(pool.workId)) {
    throw new Error(`Duplicate fiction fragment work id: ${pool.workId}`);
  }

  workIds.add(pool.workId);

  const fragmentIds = new Set<string>();
  for (const fragment of pool.fragments) {
    if (fragmentIds.has(fragment.id)) {
      throw new Error(`Duplicate fiction fragment id "${fragment.id}" in "${pool.workId}".`);
    }

    fragmentIds.add(fragment.id);
  }
}

export function utcDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function stableHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function fragmentIndexForDate(workId: string, dateKey: string, fragmentCount: number): number {
  if (!Number.isInteger(fragmentCount) || fragmentCount < 1) {
    throw new Error(`Fragment count must be a positive integer for "${workId}".`);
  }

  return stableHash(`${dateKey}:${workId}`) % fragmentCount;
}

export function selectDailyFragment(workId: string, dateKey = utcDateKey()) {
  const pool = fictionFragments.find((candidate) => candidate.workId === workId);

  if (!pool) {
    throw new Error(`Unknown fiction fragment work id: ${workId}`);
  }

  const fragmentIndex = fragmentIndexForDate(pool.workId, dateKey, pool.fragments.length);

  return {
    pool,
    fragment: pool.fragments[fragmentIndex],
  };
}
