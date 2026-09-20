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
    heading: "Movie night voting: pick a film everyone can live with",
    metaTitle: "Movie Night Voting — Pick a Film as a Group",
    metaDescription:
      "End the 40-minute scroll. Add the shortlist, share a link, and let everyone rank the films Eurovision-style. The fairest way to pick a movie as a group.",
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
  },
  {
    slug: "where-to-eat",
    label: "Where to eat",
    emoji: "🍜",
    heading: "Where should we eat? Let the group vote",
    metaTitle: "Where to Eat? Group Restaurant Voting",
    metaDescription:
      "Settle team lunch or dinner with friends in two minutes. List the restaurants, share one link, and everyone ranks them with Eurovision-style points.",
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
];

export function findUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
