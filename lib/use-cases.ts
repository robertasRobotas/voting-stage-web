export interface UseCase {
  slug: string;
  /** Short label for cards and links. */
  label: string;
  emoji: string;
  /** <h1> on the page. */
  heading: string;
  /** <title> — keep under ~60 characters. */
  metaTitle: string;
  /** Meta description — keep under ~160 characters. */
  metaDescription: string;
  intro: string;
  /** Example contenders, to make the idea concrete. */
  contenders: string[];
  /** Why the 12-point ladder suits this decision better than a plain poll. */
  whyPoints: string;
  tips: string[];
  /** Page-specific questions, also published as FAQ structured data. */
  faq?: Array<{ q: string; a: string }>;
}

export const USE_CASES: UseCase[] = [
  {
    slug: "eurovision-party",
    label: "Eurovision party",
    emoji: "🎤",
    heading: "Eurovision party voting: score every song with your friends",
    metaTitle: "Eurovision Party Voting App — Free Online Scoreboard",
    metaDescription:
      "Run your own Eurovision party vote. Add the songs, share a link or QR code, and everyone gives 1–8, 10 and 12 points from their phone. Free, no app to install.",
    intro:
      "Watching the final with friends? Skip the paper scorecards. Add this year's songs to a board, put the QR code on the TV, and let every guest award their own douze points from the sofa. When the last song ends, close the voting and reveal your living room's winner.",
    contenders: ["Sweden", "Italy", "Ukraine", "France", "Lithuania", "Every other finalist"],
    whyPoints:
      "It's the real thing: each guest ranks their top ten, exactly like a national jury. A song that everyone quite likes can beat one that two people adore — which is what makes the reveal fun.",
    tips: [
      "Create the board before the show and add the running order, so guests can vote as songs are performed.",
      "Use \"Show QR\" on the admin page — nobody wants to type a link with a drink in their hand.",
      "Voters can change their ballot until you finish the voting, so first impressions aren't final.",
      "Finish the voting during the real jury results and read out your own 12 points.",
    ],
  },
  {
    slug: "movie-night",
    label: "Movie night",
    emoji: "🍿",
    heading: "Pick a movie with friends: vote on tonight's film",
    metaTitle: "Pick a Movie With Friends — Free Group Movie Vote",
    metaDescription:
      "End the 40-minute scroll. Add the shortlist, share a link, and let your friends vote by ranking the films. The fairest way to pick a movie as a group. Free.",
    intro:
      "A simple poll picks the film with the loudest fans. Ranked points pick the film the whole room is happy with. Add the shortlist, send the link to the group chat, and have an answer before the popcorn is ready.",
    contenders: ["The comfort rewatch", "The new release", "The three-hour epic", "The horror nobody admits wanting", "The animated one"],
    whyPoints:
      "Everyone's second and third choices count. The divisive pick that half the room hates loses to the film everybody put in their top three.",
    tips: [
      "Add a poster image to each film — people vote faster when they recognise the cover.",
      "Let everyone nominate one film first, then vote on the full list.",
      "Keep the board and reuse the runners-up as next week's shortlist.",
    ],
    faq: [
      {
        q: "How do we pick a movie when everyone wants something different?",
        a: "Have everyone rank the shortlist instead of naming one favourite. The film with the most points overall is the one most of the group is happy to watch, even if it's nobody's number one.",
      },
      {
        q: "Can my friends vote without making an account?",
        a: "Yes. Choose \"anyone with the link\" when you create the board and your friends can vote straight from the group chat.",
      },
    ],
  },
  {
    slug: "where-to-eat",
    label: "Where to eat",
    emoji: "🍜",
    heading: "Decide on a restaurant with friends: let the group vote",
    metaTitle: "Decide a Restaurant With Friends — Group Vote",
    metaDescription:
      "Can't decide where to eat? List the restaurants, share one link, and let your friends or team rank them. Settle dinner or team lunch in two minutes. Free.",
    intro:
      "\"I don't mind, you choose\" — said by eight people in a row. Put the options on a board, drop the link in the chat, and let the points decide where the table gets booked.",
    contenders: ["The ramen place", "Tacos", "That new pizzeria", "The reliable Thai", "Burgers", "Somewhere with a terrace"],
    whyPoints:
      "One person's hard no matters as much as another's favourite. Ranking surfaces the place nobody will complain about, not just the one with the most first-choice votes.",
    tips: [
      "Invite-only mode keeps a team vote to the team.",
      "Put dietary notes in the item title (\"Tacos — good vegan options\").",
      "Finish the voting at 11:30 and book for 12:30.",
    ],
    faq: [
      {
        q: "What's the fastest way to decide where to eat as a group?",
        a: "Put four to six options on a board and share the link. Everyone ranks them on their phone in under a minute, and the points pick the place the most people are happy with.",
      },
      {
        q: "Does it work for a big team?",
        a: "Yes. There is no limit on voters, and invite-only mode restricts the vote to your colleagues' email addresses.",
      },
    ],
  },
  {
    slug: "baby-names",
    label: "Baby names",
    emoji: "🍼",
    heading: "Baby name voting: let family and friends rank your shortlist",
    metaTitle: "Baby Name Voting — Let Family Rank Your Shortlist",
    metaDescription:
      "Share your baby name shortlist and let family and friends rank their favourites with Eurovision-style points. Private link, results hidden until you reveal them.",
    intro:
      "You have a shortlist and opinions are welcome — within limits. Share a private board, let grandparents and friends hand out their points, and keep the results to yourselves until you're ready. The final decision stays yours.",
    contenders: ["Sofia", "Lukas", "Emilia", "Noah", "Ada", "Matas"],
    whyPoints:
      "With a plain poll, the family favourite wins and you learn nothing else. With ranked points you see which names are liked across the board and which ones split the room.",
    tips: [
      "Results stay hidden from voters until you finish the voting — nobody is swayed by the running total.",
      "It makes a good baby shower game: reveal the winner at the end.",
      "You see each person's ballot, so you'll know exactly who gave your favourite one point.",
    ],
  },
  {
    slug: "hackathon-judging",
    label: "Hackathon & demo day",
    emoji: "🏆",
    heading: "Hackathon judging and audience voting, without a spreadsheet",
    metaTitle: "Hackathon Voting & Demo Day Judging Tool",
    metaDescription:
      "Collect audience or jury votes for hackathon demos in minutes. Add the teams, show a QR code, and rank projects with Eurovision-style points. Free.",
    intro:
      "Demos finish at five, prizes are at half past, and someone is still building the scoring spreadsheet. Add the teams to a board, put the QR code on the projector, and let judges or the whole audience rank their top ten.",
    contenders: ["Team 1 — the AI one", "Team 2 — the other AI one", "Team 3 — hardware that almost worked", "Team 4 — surprisingly useful", "Team 5 — great demo, no backend"],
    whyPoints:
      "Ranking ten projects is quicker and more consistent than scoring each one out of ten on five criteria — and it produces a clear order with fewer ties.",
    tips: [
      "Use the signed-in mode so every judge gets exactly one ballot.",
      "Run one board for the jury and another for the audience award.",
      "Live results are visible only to you while voting is open — keep the suspense for the ceremony.",
    ],
  },
  {
    slug: "book-club",
    label: "Book club",
    emoji: "📚",
    heading: "Book club voting: choose the next read together",
    metaTitle: "Book Club Voting — Choose Your Next Read",
    metaDescription:
      "Pick your book club's next read fairly. Add the nominations, share a link, and let members rank them with Eurovision-style points.",
    intro:
      "Every member nominates a book, everyone ranks the list, and the winner is the one most of the club actually wants to read — not just the pick of whoever spoke first.",
    contenders: ["The prize winner", "The 900-page classic", "The thriller", "The memoir", "Something short for once"],
    whyPoints:
      "The full ranking doubles as a reading queue: second and third place are your next two months, already agreed.",
    tips: [
      "Add cover images so the list is easy to scan.",
      "Members can update their ballot after reading the blurbs.",
      "Reopen nominations by resuming the board when the queue runs out.",
    ],
  },
  {
    slug: "trip-destination",
    label: "Trip destination",
    emoji: "✈️",
    heading: "Vote where to travel with friends",
    metaTitle: "Vote Where to Travel With Friends — Group Trip Vote",
    metaDescription:
      "Planning a group trip? Add the destinations, share one link, and let everyone rank them. A fair group vote for your trip destination in minutes. Free.",
    intro:
      "Six friends, one long weekend, and a group chat that has been arguing between Lisbon and Kraków since March. Put the destinations on a board, let everyone rank them, and book the flights before prices go up again.",
    contenders: ["Lisbon", "Kraków", "Copenhagen", "A cabin by a lake", "Sicily", "Wherever flights are cheapest"],
    whyPoints:
      "A trip needs everyone on board. With a plain poll, the three people who want a beach can outvote the rest and half the group goes along unhappy. Ranked points find the destination that most people put near the top.",
    tips: [
      "Put the rough cost in the item title (\"Lisbon — about €350\") so people vote with the budget in mind.",
      "Add a photo of each place. It matters more than you'd think.",
      "Run a second board afterwards for the dates, then a third for the accommodation.",
      "Invite-only mode keeps the vote to the people actually coming.",
    ],
    faq: [
      {
        q: "How do you choose a travel destination as a group?",
        a: "Collect every suggestion first, then let everyone rank the full list privately. Ranking avoids the loudest person winning, and hidden results stop people from voting tactically.",
      },
      {
        q: "What if there's a tie?",
        a: "The scoreboard shows how many people voted for each place and which points they gave, so you can see which destination has the broadest support — or run a quick second vote between the top two.",
      },
    ],
  },
  {
    slug: "ranking-game",
    label: "Ranking game",
    emoji: "🎲",
    heading: "The rank-anything game to play with friends online",
    metaTitle: "Rank Anything Game — Friends Ranking Game Online",
    metaDescription:
      "A free ranking game to play with friends online. Pick a topic, everyone secretly ranks the options, then reveal the group's verdict. Who is the best? Vote and find out.",
    intro:
      "Pick a topic — best pizza topping, greatest film trilogy, who in the group would survive longest on a desert island. Everyone ranks the options in secret, then you reveal the scoreboard together and argue about it. It works in the same room or across time zones.",
    contenders: ["Pineapple", "Pepperoni", "Mushrooms", "Four cheese", "Anchovies", "Just margherita"],
    whyPoints:
      "The reveal is the game. Nobody sees the running total, so every ballot is honest, and the final scoreboard shows exactly who gave twelve points to anchovies.",
    tips: [
      "\"Who is the best…\" rounds work well: add everyone in the group as an option and vote on who is the best cook, the worst driver, the most likely to be late.",
      "Play it on a video call: share your screen when you finish the voting for a live results moment.",
      "Switch the results to tier-list view for an instant S-to-D verdict.",
      "Keep rounds short — six to ten options is the sweet spot.",
    ],
    faq: [
      {
        q: "How do you play a ranking game with friends?",
        a: "One person creates a board with a topic and options, and shares the link. Everyone ranks the options by giving out points. When the host finishes the voting, the combined ranking is revealed to the whole group.",
      },
      {
        q: "Can we play online, in different places?",
        a: "Yes. It runs in the browser, so friends can vote from anywhere and at any time before the host closes the round.",
      },
      {
        q: "Can we vote on people, like \"who is the best\"?",
        a: "Yes — add each person as an option. Keep it friendly: every voter's ballot is visible to the group once the results are revealed.",
      },
    ],
  },
  {
    slug: "tier-list-with-friends",
    label: "Tier list with friends",
    emoji: "📊",
    heading: "Make a tier list with friends — one the whole group votes on",
    metaTitle: "Tier List With Friends — Make a Group Tier List",
    metaDescription:
      "Make a tier list with friends instead of alone. Everyone ranks the items, and the combined votes become one S-to-D group tier list. Free, online, nothing to install.",
    intro:
      "A normal tier list is one person's opinion. This one is the whole group's. Add the items, let every friend rank them, and the votes are combined into a single S, A, B, C, D tier list — so you can finally settle where everything really belongs.",
    contenders: ["Mario Kart", "Smash Bros", "Zelda", "Animal Crossing", "Pokémon", "Splatoon"],
    whyPoints:
      "Dragging items into tiers by yourself is easy; agreeing on tiers as a group is not. Each friend gives their top ten 12, 10, 8 and so on. Items that score close to the winner land in S tier, and the rest fall into A to D by their share of the top score.",
    tips: [
      "After you finish the voting, switch the results from \"Scoreboard\" to \"Tier list\".",
      "Add an image to each item — the tier list shows thumbnails.",
      "Works for anything: games, albums, snacks, football clubs, your friends' cooking.",
      "Everyone's individual ballot is shown with the results, so you can see who is responsible for that D-tier placement.",
    ],
    faq: [
      {
        q: "How do you make a tier list with friends?",
        a: "Create a board, add the items, and share the link. Each friend ranks the items by giving out points. When voting is finished, the results page shows the group's combined tier list from S to D.",
      },
      {
        q: "How are the tiers calculated?",
        a: "Every item's total points are compared with the winner's. Within 20% of the top score is S tier, then A, B and C in 20% steps, and anything under 20% is D tier.",
      },
      {
        q: "Is it a drag-and-drop tier maker?",
        a: "Not quite. Instead of one person dragging items into rows, everyone votes and the tiers come from the combined result. Voting itself is drag-and-drop: you drag point chips onto the items.",
      },
    ],
  },
];

export function findUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
