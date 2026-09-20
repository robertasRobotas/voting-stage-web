export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface Guide {
  slug: string;
  /** <h1> on the page. */
  title: string;
  /** <title> — keep under ~60 characters. */
  metaTitle: string;
  /** Meta description — keep under ~160 characters. */
  metaDescription: string;
  /** One or two sentences for cards and the article's opening. */
  excerpt: string;
  /** ISO date, for Article structured data. */
  published: string;
  sections: GuideSection[];
  /** Use-case slugs to link to at the end. */
  relatedIdeas: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "eurovision-style-voting",
    title: "Eurovision-style voting for anything: how the 12 points system works",
    metaTitle: "Eurovision-Style Voting for Anything — 12 Points Explained",
    metaDescription:
      "How the Eurovision 12 points system works, why there is no 9 or 11, and how to use douze points voting as a game for movies, food, trips or anything else.",
    excerpt:
      "One, two, three… eight, ten, twelve. How the most famous scoring system on television works, and how to borrow it for your own decisions.",
    published: "2026-09-20",
    sections: [
      {
        heading: "The system in one paragraph",
        paragraphs: [
          "Every voter ranks their ten favourites. First place gets 12 points, second gets 10, third gets 8, and then 7, 6, 5, 4, 3, 2 and 1. Each value is used exactly once, and anything outside the top ten gets nothing. Add up the points from all voters and the highest total wins.",
          "The Eurovision Song Contest has used this ladder since 1975. Since 2016 each country hands out two sets — one from a professional jury and one from the public — but the ladder itself has not changed.",
        ],
      },
      {
        heading: "Why is there no 9 or 11?",
        paragraphs: [
          "The gaps are the point. Dropping from 12 to 10 to 8 means a voter's first and second choices are worth noticeably more than the rest, so being somebody's favourite really matters. Below that the ladder falls one point at a time, so the lower places still count without deciding everything.",
          "It also makes for better television: \"douze points\" — French for twelve points, read out in both of the contest's official languages — is a bigger moment when twelve is a real jump from ten.",
        ],
      },
      {
        heading: "Why it works for ordinary decisions",
        paragraphs: [
          "Most group votes ask one question: what is your favourite? That throws away nearly everything people think. If four friends want four different films, a show of hands tells you nothing about which film all four would happily watch.",
          "A points ladder asks for a ranking instead. Second and third choices count, so the winner tends to be the option with the broadest support rather than the most passionate minority. Voting theorists call this family positional voting; the best known version is the Borda count.",
        ],
      },
      {
        heading: "Turn it into a 12 points voting game",
        paragraphs: [
          "The scoring system is half the fun. The other half is the reveal. To run a douze points game with friends:",
        ],
        list: [
          "Choose a topic and add the options — songs, snacks, holiday plans, each other's cooking.",
          "Share the link. Everyone drags their 12, 10, 8 and the rest onto the options on their own phone.",
          "Keep the results hidden. On Voting Stage only the host sees the live scoreboard.",
          "When everyone has voted, finish the voting and reveal the scoreboard. Reading out \"and our twelve points go to…\" is optional but recommended.",
        ],
      },
      {
        heading: "What if we have fewer than ten options?",
        paragraphs: [
          "Use the top of the ladder. With five options most people give 12, 10, 8, 7 and 6 and leave the remaining chips in the tray. The maths still works: the totals simply get larger.",
        ],
      },
    ],
    relatedIdeas: ["eurovision-party", "ranking-game", "movie-night"],
  },
  {
    slug: "how-to-decide-as-a-group",
    title: "How to make a group decision without the argument",
    metaTitle: "How to Decide as a Group — Group Decision Voting Guide",
    metaDescription:
      "Why group chats can't decide, why simple polls pick the wrong winner, and how a ranked group voting app gets friends or teams to a fair decision in minutes.",
    excerpt:
      "Why \"I don't mind, you choose\" never ends, why polls pick the wrong winner, and a five-minute method that works for friends and teams.",
    published: "2026-09-20",
    sections: [
      {
        heading: "Why group chats can't decide",
        paragraphs: [
          "A chat is good at collecting suggestions and terrible at closing. Nobody wants to be the one who overrules a friend, so the discussion circles until someone gives up or the loudest person wins. Neither outcome is a decision the group made.",
        ],
      },
      {
        heading: "The problem with a simple poll",
        paragraphs: [
          "A poll feels fair, but with more than two options it often picks the wrong winner. Say nine friends choose between three restaurants. Four want sushi and would hate the other two. Five prefer pizza or tacos and don't mind which — but they split three to two. Sushi wins with four votes, and five of the nine people are unhappy.",
          "This is called vote splitting. The poll only heard first choices, so it never learned that pizza was acceptable to almost everybody.",
        ],
      },
      {
        heading: "Rank instead of pick",
        paragraphs: [
          "The fix is to let everyone rank the options. Give points by position — most to the favourite, a little less to the next — and add them up. An option that is everyone's second choice can now beat an option that is loved by a few and disliked by the rest, which is usually what a group actually wants.",
          "Eurovision-style points (12, 10, 8, 7, 6 and so on) are a well-tested version of this. The big gap at the top rewards genuine favourites; the long tail makes sure lower preferences still count.",
        ],
      },
      {
        heading: "A five-minute method",
        list: [
          "Collect options first, judge later. Let everyone nominate without discussion.",
          "Put the full list on a voting board and share the link with the group.",
          "Everyone ranks privately. Hide the running total so nobody votes tactically or follows the crowd.",
          "Set a deadline — \"voting closes at six\" — then close it and reveal the result.",
          "Go with the winner. If it's close, run a quick second vote between the top two.",
        ],
      },
      {
        heading: "What to look for in a group voting tool",
        list: [
          "Ranked or points-based voting, not just a single choice.",
          "No app to install and no account needed for voters.",
          "Results hidden until the vote is closed.",
          "One ballot per person, with the option to require sign-in when it matters.",
          "A result everyone can see, including who voted for what, so nobody suspects the count.",
        ],
        paragraphs: [
          "Voting Stage was built around that list. It is free, runs in the browser, and takes about a minute to set up.",
        ],
      },
    ],
    relatedIdeas: ["where-to-eat", "trip-destination", "movie-night"],
  },
  {
    slug: "things-to-rank-with-friends",
    title: "50 things to rank with friends",
    metaTitle: "50 Things to Rank With Friends — Ranking Game Ideas",
    metaDescription:
      "Fifty ideas for a ranking game with friends: food, films, music, travel, and \"who is the best\" rounds. Rate anything together and reveal the group's verdict.",
    excerpt:
      "Fifty topics for a ranking game — from pizza toppings to \"who would survive a zombie apocalypse\" — and how to run a round in two minutes.",
    published: "2026-09-20",
    sections: [
      {
        heading: "How a round works",
        paragraphs: [
          "Pick a topic, add six to ten options to a board, and share the link. Everyone ranks the options in secret by handing out points. When the host closes the vote, the group's combined ranking is revealed — as a scoreboard or as an S-to-D tier list. Then the arguing starts, which is the point.",
        ],
      },
      {
        heading: "Food and drink",
        list: [
          "Pizza toppings",
          "Crisp flavours",
          "Fast food chains",
          "Breakfast foods",
          "Ice cream flavours",
          "Biscuits you can dunk",
          "Sandwich fillings",
          "Pasta shapes",
          "Christmas dinner components",
          "The group's signature dishes",
        ],
      },
      {
        heading: "Film and TV",
        list: [
          "Pixar films",
          "Film trilogies",
          "Sitcoms of the 2000s",
          "Bond actors",
          "Christmas films",
          "TV series finales",
          "Animated villains",
          "Films everyone pretends to have seen",
          "Reality shows",
          "Superhero films",
        ],
      },
      {
        heading: "Music",
        list: [
          "Albums by one artist you all like",
          "Eurovision winners",
          "Karaoke songs",
          "Decades of music",
          "Festival headliners",
          "Songs from your school years",
          "Film soundtracks",
          "Wedding dance-floor songs",
          "Boy bands and girl groups",
          "One-hit wonders",
        ],
      },
      {
        heading: "Travel and places",
        list: [
          "Cities you've visited together",
          "Dream holiday destinations",
          "European capitals",
          "Places to live for a year",
          "Local pubs or cafés",
          "Holiday types: beach, city, mountains, road trip",
          "Theme parks",
          "Airports, from best to worst",
          "Places for a group weekend away",
          "Seasons",
        ],
      },
      {
        heading: "\"Who is the best\" rounds",
        paragraphs: [
          "Add everyone in the group as an option and vote on each other. Keep it kind — every ballot is visible once the results are revealed.",
        ],
        list: [
          "Who is the best cook?",
          "Who would survive longest in a zombie apocalypse?",
          "Who gives the best advice?",
          "Who is most likely to be late?",
          "Who would win a reality show?",
          "Who is the best driver?",
          "Who has the best music taste?",
          "Who would you want on your quiz team?",
          "Who is the most competitive?",
          "Who tells the best stories?",
        ],
      },
    ],
    relatedIdeas: ["ranking-game", "tier-list-with-friends", "eurovision-party"],
  },
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
