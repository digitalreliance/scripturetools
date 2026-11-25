/**
 * The chiastic (mirrored) structure of Revelation, from a printed chart
 * supplied by the project owner: 51 nested levels (A … YY) that descend from
 * Revelation 1:1 to a centre at 12:9–10 and climb back out to 22:20.
 *
 * - `sourceLabel` and `printedDistance` are the chart's own words and numbers,
 *   kept verbatim (typos included) so the app can show where it differs.
 * - `label` and `phrases` quote the KJV, which is the text the app displays.
 *   Every phrase is an exact substring of its passage (tested).
 * - Distances are always recomputed from KJV verse numbering (see compute.ts).
 *
 * Provenance, discrepancies and policy: docs/data/revelation-chiasm.md.
 */

export interface Member {
  /** Chart letter, e.g. "RR". */
  letter: string;
  /** True for the second (mirrored) half, printed with a superscript ¹. */
  prime: boolean;
  /** Canonical reference, e.g. "REV 11:18-12:3". */
  ref: string;
  /** Short label in KJV wording. */
  label: string;
  /** The chart's printed label, verbatim. */
  sourceLabel: string;
  /** The chart's number in parentheses, verbatim; null for the centre. */
  printedDistance: string | null;
  /** Exact KJV substrings that carry what the pair shares. */
  phrases: readonly string[];
}

export interface Level {
  /** 1 = A (outermost) … 51 = YY (centre). */
  level: number;
  letter: string;
  /** Index into the chart's 7-colour cycle (0 red … 6 purple); null for the centre. */
  colorIndex: number | null;
  isCenter: boolean;
  /** What the two halves share, in a few words. */
  theme: string;
  first: Member;
  second: Member;
}

export interface Section {
  id: string;
  /** Inclusive level range. */
  levels: readonly [from: number, to: number];
  /** Title for the first half and for its mirror. */
  first: string;
  second: string;
}

export interface ChartNote {
  letter: string;
  prime: boolean;
  note: string;
}

export const CHART_SOURCE = {
  title: "Chiastic structure of Revelation (chart)",
  author: null as string | null,
  url: null as string | null,
  note: "Supplied by the project owner. The original author has not been identified yet.",
} as const;

type Side = readonly [ref: string, label: string, sourceLabel: string, printed: string | null, phrases: readonly string[]];
type Row = readonly [letter: string, theme: string, first: Side, second: Side];

const ROWS: readonly Row[] = [
  ["A", "Soon to come",
    ["REV 1:1", "Things which must shortly come to pass", "Things that must happen quickly", "202", ["things which must shortly come to pass"]],
    ["REV 22:20", "Surely I come quickly", "I am coming quickly", "199", ["Surely I come quickly"]]],
  ["B", "The words of this prophecy",
    ["REV 1:3", "They that hear the words of this prophecy", "Hears the words of this prophecy", "200", ["hear the words of this prophecy"]],
    ["REV 22:18", "Every man that heareth the words of the prophecy", "Hears the words of the prophecy", "197", ["heareth the words of the prophecy of this book"]]],
  ["C", "Alpha and Omega",
    ["REV 1:8", "I am Alpha and Omega, the beginning and the ending", "Alpha/Omega ... beginning/end", "195", ["I am Alpha and Omega, the beginning and the ending"]],
    ["REV 22:13", "I am Alpha and Omega, the beginning and the end", "Alpha/Omega ... beginning/end", "192", ["I am Alpha and Omega, the beginning and the end"]]],
  ["D", "Fallen at his feet",
    ["REV 1:17", "When I saw him, I fell at his feet", "When I saw, I fell at his feet", "186", ["when I saw him, I fell at his feet"]],
    ["REV 22:8", "When I had heard and seen, I fell down", "When I heard and saw, I fell at his feet", "187", ["when I had heard and seen, I fell down to worship before the feet"]]],
  ["E", "Things to come",
    ["REV 1:19", "The things which shall be hereafter", "The things which shall take place", "184", ["the things which shall be hereafter"]],
    ["REV 22:6", "The things which must shortly be done", "The things which must take place", "185", ["the things which must shortly be done"]]],
  ["F", "In the midst",
    ["REV 2:1", "In the midst of the seven golden candlesticks", "In the midst of seven lampstands", "182", ["in the midst of the seven golden candlesticks"]],
    ["REV 22:2", "In the midst of the street of it", "In the midst of its street", "181", ["In the midst of the street of it"]]],
  ["G", "The tree of life",
    ["REV 2:7", "To eat of the tree of life", "the tree of life", "176", ["the tree of life"]],
    ["REV 22:2", "There was the tree of life", "The tree of life", "181", ["the tree of life"]]],
  ["H", "Names written",
    ["REV 2:17", "A white stone, and in the stone a new name written", "White stone, new name written", "166", ["a white stone, and in the stone a new name written"]],
    ["REV 21:12-14", "Names written thereon; twelve foundations", "New names written ... the city had twelve foundation stones", "164-66", ["names written thereon", "twelve foundations"]]],
  ["I", "He that overcometh",
    ["REV 2:26", "He that overcometh … to him will I give power", "He who overcomes ... will give authority", "157", ["he that overcometh", "to him will I give power over the nations"]],
    ["REV 21:7", "He that overcometh shall inherit all things", "He who overcomes I will give these things", "159", ["He that overcometh shall inherit all things"]]],
  ["J", "Not found",
    ["REV 3:1-2", "I have not found thy works perfect", "A name ... not found your deeds complete", "152-53", ["thou hast a name that thou livest, and art dead", "I have not found thy works perfect"]],
    ["REV 20:15", "Whosoever was not found written in the book of life", "Anyone's name was not found in the book of life", "152", ["whosoever was not found written in the book of life"]]],
  ["K", "White, and the book of life",
    ["REV 3:5", "Clothed in white raiment … the book of life", "Clothed in white ... book of life", "149", ["clothed in white raiment", "the book of life"]],
    ["REV 20:11-12", "A great white throne … the book of life", "Great white throne ... book of life", "149", ["a great white throne", "which is the book of life"]]],
  ["L", "Down from God out of heaven",
    ["REV 3:12", "New Jerusalem, which cometh down out of heaven", "City of God comes down from God out of heaven", "142", ["the city of my God, which is new Jerusalem, which cometh down out of heaven from my God"]],
    ["REV 20:9", "Fire came down from God out of heaven", "They surround the city, fire came down from God out of heaven", "146", ["the beloved city", "fire came down from God out of heaven"]]],
  ["M", "Out of his mouth",
    ["REV 3:16", "I will spue thee out of my mouth", "Vomit you out of my mouth", "138", ["I will spue thee out of my mouth"]],
    ["REV 19:21", "The sword … which proceeded out of his mouth", "Killed with the sword out of the mouth of God", "137", ["slain with the sword", "which sword proceeded out of his mouth"]]],
  ["N", "The supper",
    ["REV 3:20", "I will come in to him, and will sup with him", "I will sup with him", "134", ["will sup with him"]],
    ["REV 19:17", "The supper of the great God", "The supper of the great God", "133", ["the supper of the great God"]]],
  ["O", "Heaven opened",
    ["REV 4:1", "Behold, a door was opened in heaven", "I saw and behold, a door was opened in heaven", "131", ["behold, a door was opened in heaven"]],
    ["REV 19:11", "I saw heaven opened", "Behold, I saw heaven opened", "129", ["I saw heaven opened"]]],
  ["P", "Crowned and clothed",
    ["REV 4:4", "Elders clothed in white raiment, crowns of gold", "24 elders, sitting clothed in white/crowns on heads", "128", ["clothed in white raiment", "crowns of gold"]],
    ["REV 19:11-13", "On his head were many crowns; clothed with a vesture", "A white horse. He who sat on it/head of diadems/clothed with robe", "127-29", ["a white horse", "on his head were many crowns", "clothed with a vesture dipped in blood"]]],
  ["Q", "Glory and honour to him",
    ["REV 4:9", "Those beasts give glory and honour", "Living creatures give glory to him", "123", ["give glory and honour and thanks to him that sat on the throne"]],
    ["REV 19:7", "Let us be glad … and give honour to him", "Let us give glory to him", "123", ["give honour to him"]]],
  ["R", "The elders fall and worship",
    ["REV 4:10-5:1", "The four and twenty elders fall down … and worship", "24 elders fall down/God sits on throne/worship", "120-22", ["The four and twenty elders fall down before him that sat on the throne, and worship him"]],
    ["REV 19:4", "The elders … fell down and worshipped God", "24 elders fell down/worshiped God who wits on the throne", "120", ["the four and twenty elders", "fell down and worshipped God that sat on the throne"]]],
  ["S", "The slain",
    ["REV 5:6", "A Lamb as it had been slain", "Lamb standing as though slain", "115", ["stood a Lamb as it had been slain"]],
    ["REV 18:24", "All that were slain upon the earth", "All who have been slain on earth", "116", ["all that were slain upon the earth"]]],
  ["T", "Riches",
    ["REV 5:12", "Worthy is the Lamb … to receive power, and riches", "Worthy is the Lamb to receive riches", "109", ["Worthy is the Lamb that was slain to receive power, and riches"]],
    ["REV 18:17", "In one hour so great riches is come to nought", "Great riches have been laid waste", "109", ["so great riches is come to nought"]]],
  ["U", "Wheat, oil and wine",
    ["REV 6:6", "A measure of wheat … the oil and the wine", "A quart of wheat/oil and wine", "101", ["A measure of wheat for a penny", "the oil and the wine"]],
    ["REV 18:12-13", "Wine, and oil, and fine flour, and wheat", "Wine and oil/wheat", "104", ["The merchandise of gold", "wine, and oil, and fine flour, and wheat"]]],
  ["V", "Judging and avenging",
    ["REV 6:10", "How long … dost thou not judge and avenge our blood", "How long until you judge and avenge", "97", ["How long, O Lord, holy and true, dost thou not judge and avenge our blood"]],
    ["REV 18:6-8", "Strong is the Lord God who judgeth her", "Pay her back as she gave/the Lord God judges her", "98-100", ["Reward her even as she rewarded you", "strong is the Lord God who judgeth her"]]],
  ["W", "Falling",
    ["REV 6:13", "The stars of heaven fell unto the earth", "Stars of the sky fell to earth", "94", ["the stars of heaven fell unto the earth"]],
    ["REV 18:2", "Babylon the great is fallen, is fallen", "Fallen, fallen is Babylon", "94", ["Babylon the great is fallen, is fallen"]]],
  ["X", "The kings of the earth",
    ["REV 6:15-16", "The kings of the earth … said … Fall on us", "Kings of the earth say, \"Fall on us...\"", "91-92", ["the kings of the earth", "Fall on us"]],
    ["REV 17:18-18:2", "Reigneth over the kings of the earth … is fallen", "King of the earth ... Babylon is fallen", "92-94", ["reigneth over the kings of the earth", "Babylon the great is fallen"]]],
  ["Y", "Blessing and blasphemy",
    ["REV 7:12", "Blessing, and glory … be unto our God", "The blessing of the righteous", "78", ["Blessing, and glory, and wisdom, and thanksgiving"]],
    ["REV 17:5", "MYSTERY, BABYLON THE GREAT, THE MOTHER OF HARLOTS", "The blasphemy of the whore", "79", ["MYSTERY, BABYLON THE GREAT, THE MOTHER OF HARLOTS"]]],
  ["Z", "Arrayed",
    ["REV 7:13", "What are these which are arrayed in white robes?", "Who are these arrayed in white robes?", "77", ["arrayed in white robes"]],
    ["REV 17:4", "The woman was arrayed in purple and scarlet", "The woman was arrayed in purple and scarlet", "78", ["the woman was arrayed in purple and scarlet colour"]]],
  ["AA", "The fountain and the cup",
    ["REV 7:17", "Shall lead them unto living fountains of waters", "Lamb will lead them to fountains of living waters", "73", ["shall lead them unto living fountains of waters"]],
    ["REV 16:19", "The cup of the wine of the fierceness of his wrath", "Great Babylon given the cup of the wine of wrath", "72", ["great Babylon came in remembrance before God", "the cup of the wine of the fierceness of his wrath"]]],
  ["BB", "Before the throne",
    ["REV 8:2-3", "Seven angels; the golden altar before the throne", "Seven angels/altar before the throne", "70-71", ["the seven angels which stood before God", "the golden altar which was before the throne"]],
    ["REV 16:17", "A great voice … from the throne, saying, It is done", "Seventh angel ... voice from the throne", "70", ["the seventh angel poured out his vial", "from the throne, saying, It is done"]]],
  ["CC", "The sea and the river",
    ["REV 8:8", "The second angel sounded … the sea became blood", "Second angel", "65", ["the second angel sounded", "the third part of the sea became blood"]],
    ["REV 16:12", "The sixth vial, upon the great river Euphrates", "Sixth angel", "65", ["the sixth angel poured out his vial upon the great river Euphrates"]]],
  ["DD", "A lamp and darkness",
    ["REV 8:10", "There fell a great star from heaven, burning", "Third angel", "63", ["there fell a great star from heaven, burning as it were a lamp"]],
    ["REV 16:10", "His kingdom was full of darkness", "Fifth angel", "63", ["his kingdom was full of darkness"]]],
  ["EE", "The sun smitten",
    ["REV 8:12", "The third part of the sun was smitten", "Fourth angel/a third of the sun", "61", ["the fourth angel sounded", "the third part of the sun was smitten"]],
    ["REV 16:8", "The fourth angel poured out his vial upon the sun", "Fourth angel poured bowl upon the sun", "61", ["the fourth angel poured out his vial upon the sun"]]],
  ["FF", "Breastplates and girdles",
    ["REV 9:9", "Breastplates, as it were breastplates of iron", "Breastplates of iron", "51", ["breastplates of iron"]],
    ["REV 15:6", "Their breasts girded with golden girdles", "Girded around their breasts with golden girdles", "51", ["having their breasts girded with golden girdles"]]],
  ["GG", "The king and his name",
    ["REV 9:11", "A king … whose name in the Hebrew tongue is Abaddon", "King ... his name in Hebrew", "49", ["they had a king over them", "whose name in the Hebrew tongue is Abaddon"]],
    ["REV 15:3-4", "Thou King of saints. Who shall not fear thee?", "King of the nations ... who will not fear your name?", "48-49", ["thou King of saints", "Who shall not fear thee, O Lord, and glorify thy name?"]]],
  ["HH", "Fire, horses and blood",
    ["REV 9:16-17", "The horses … out of their mouths issued fire", "Heads of horses/fire from mouths/myriads of myriads", "43-44", ["two hundred thousand thousand", "out of their mouths issued fire"]],
    ["REV 14:18-20", "Power over fire … blood unto the horse bridles", "Angel has power over fire/horses' bridles/1600 stadia", "43-45", ["which had power over fire", "even unto the horse bridles", "a thousand and six hundred furlongs"]]],
  ["II", "Clothed with a cloud",
    ["REV 10:1", "A mighty angel, clothed with a cloud: and a rainbow", "Angel clothed with a cloud/rainbow upon head", "38", ["clothed with a cloud", "a rainbow was upon his head"]],
    ["REV 14:14", "A white cloud … having on his head a golden crown", "White cloud/Son of Man with a golden crown upon head", "39", ["a white cloud", "having on his head a golden crown"]]],
  ["JJ", "Him that made heaven",
    ["REV 10:6", "Sware by him … who created heaven … the sea", "Swore by him who made heaven/earth/sea", "33", ["sware by him that liveth for ever and ever, who created heaven"]],
    ["REV 14:7", "Worship him that made heaven, and earth, and the sea", "Worship him who create heaven/earth/sea", "32", ["worship him that made heaven, and earth, and the sea"]]],
  ["KK", "The gospel proclaimed",
    ["REV 10:7", "As he hath declared to his servants the prophets", "He preached the gospel to his servants", "32", ["the mystery of God should be finished", "as he hath declared to his servants the prophets"]],
    ["REV 14:6", "The everlasting gospel to preach unto them", "An eternal gospel to preach to those on earth", "31", ["having the everlasting gospel to preach unto them that dwell on the earth"]]],
  ["LL", "In the mouth",
    ["REV 10:9", "In thy mouth sweet as honey", "Sweet as honey in mouth", "30", ["in thy mouth sweet as honey"]],
    ["REV 14:5", "In their mouth was found no guile", "In mouth was found no deceit", "30", ["in their mouth was found no guile"]]],
  ["MM", "A number to count",
    ["REV 11:3", "Prophesy a thousand two hundred and threescore days", "Prophesy for 1260 days", "25", ["prophesy a thousand two hundred and threescore days"]],
    ["REV 13:18", "His number is Six hundred threescore and six", "His number is 666", "26", ["his number is Six hundred threescore and six"]]],
  ["NN", "Fire from heaven",
    ["REV 11:8", "Spiritually is called Sodom and Egypt", "Sodom/Egypt saw fire from heaven", "20", ["which spiritually is called Sodom and Egypt"]],
    ["REV 13:13", "He maketh fire come down from heaven", "Beast makes fire come down from heaven", "21", ["he maketh fire come down from heaven"]]],
  ["OO", "Back from death",
    ["REV 11:9-11", "The Spirit of life from God entered into them", "Martyred witnesses raised from death", "17-19", ["their dead bodies", "the Spirit of life from God entered into them"]],
    ["REV 13:12", "Whose deadly wound was healed", "Beast is healed of deadly wound", "20", ["whose deadly wound was healed"]]],
  ["PP", "Praise and blasphemy",
    ["REV 11:15", "The kingdoms of our Lord, and of his Christ", "Praise of the elders", "13", ["there were great voices in heaven", "The kingdoms of this world are become the kingdoms of our Lord"]],
    ["REV 13:6", "He opened his mouth in blasphemy against God", "Blasphemy of the beast", "13", ["he opened his mouth in blasphemy against God"]]],
  ["QQ", "Worship",
    ["REV 11:16-17", "The four and twenty elders … worshipped God", "24 elders worshiped God saying", "11-12", ["fell upon their faces, and worshipped God"]],
    ["REV 13:4", "They worshipped the beast, saying, Who is like", "They worshiped the beast saying", "11", ["they worshipped the beast, saying, Who is like unto the beast?"]]],
  ["RR", "Wrath, the woman, the dragon",
    ["REV 11:18-12:3", "The nations were angry … a woman … a great red dragon", "Nations enraged/woman with child/dragon", "6-10", ["the nations were angry", "a woman clothed with the sun", "a great red dragon"]],
    ["REV 12:17", "The dragon was wroth with the woman", "Dragon enraged at woman and her offspring", "10", ["the dragon was wroth with the woman"]]],
  ["SS", "Seven heads, ten horns",
    ["REV 12:3", "A great red dragon, having seven heads and ten horns", "Behold, dragon with seven heads/ten horns/seven diadems", "6", ["having seven heads and ten horns, and seven crowns upon his heads"]],
    ["REV 13:1", "A beast … having seven heads and ten horns", "Beast with ten horns/seven heads/ten diadems", "8", ["a beast rise up out of the sea, having seven heads and ten horns, and upon his horns ten crowns"]]],
  ["TT", "The dragon against the woman",
    ["REV 12:4", "The dragon stood before the woman … to devour", "Dragon's tail swept 1/3 to earth/stood before the woman to devour", "5", ["his tail drew the third part of the stars of heaven", "the dragon stood before the woman"]],
    ["REV 12:15-16", "Water as a flood after the woman; the earth helped", "Serpent's mouth to sweep away/earth helped the woman", "5-6", ["the serpent cast out of his mouth water as a flood after the woman", "the earth helped the woman"]]],
  ["UU", "The man child",
    ["REV 12:5", "She brought forth a man child", "she gave birth to a son, a male child", "4", ["she brought forth a man child"]],
    ["REV 12:13", "The woman which brought forth the man child", "Woman gave birth to a male child", "3", ["the woman which brought forth the man child"]]],
  ["VV", "Into the wilderness",
    ["REV 12:6", "The woman fled into the wilderness … a place prepared", "Woman fled into wilderness/place prepared by God/nourished", "3", ["the woman fled into the wilderness, where she hath a place prepared of God"]],
    ["REV 12:13-14", "That she might fly into the wilderness, into her place", "Woman with wings ... fly to wilderness/place/nourished", "3-4", ["two wings of a great eagle, that she might fly into the wilderness, into her place, where she is nourished"]]],
  ["WW", "Heaven against the dragon",
    ["REV 12:7", "There was war in heaven … against the dragon", "War in heaven/dragon", "2", ["there was war in heaven", "fought against the dragon"]],
    ["REV 12:12-13", "Rejoice, ye heavens … the dragon … cast unto the earth", "Rejoice O heaven! Dragon thrown to earth", "2-3", ["rejoice, ye heavens", "when the dragon saw that he was cast unto the earth"]]],
  ["XX", "Prevailing",
    ["REV 12:8", "And prevailed not", "Devils did not prevail", "1", ["prevailed not"]],
    ["REV 12:11", "They overcame him by the blood of the Lamb", "Martyrs overcame them", "1", ["they overcame him by the blood of the Lamb"]]],
  ["YY", "Cast down",
    ["REV 12:9", "The great dragon was cast out, that old serpent", "Dragon/serpent/devil/Satan thrown down who deceives world", null, ["the great dragon was cast out, that old serpent, called the Devil, and Satan"]],
    ["REV 12:10", "Now is come salvation … the accuser … is cast down", "Salvation/power/kingdom/authority of God and Christ ... accuser is thrown down", null, ["Now is come salvation, and strength, and the kingdom of our God", "the accuser of our brethren is cast down"]]],
];

const member = (letter: string, prime: boolean, [ref, label, sourceLabel, printedDistance, phrases]: Side): Member => ({
  letter,
  prime,
  ref,
  label,
  sourceLabel,
  printedDistance,
  phrases,
});

export const LEVELS: readonly Level[] = ROWS.map(([letter, theme, first, second], i) => {
  const isCenter = i === ROWS.length - 1;
  return {
    level: i + 1,
    letter,
    colorIndex: isCenter ? null : i % 7,
    isCenter,
    theme,
    first: member(letter, false, first),
    second: member(letter, true, second),
  };
});

export const CENTER_LEVEL = LEVELS[LEVELS.length - 1];

/** Thematic groupings for the outline; each mirrored half gets its own title. */
export const SECTIONS: readonly Section[] = [
  { id: "frame", levels: [1, 5], first: "Prologue", second: "Epilogue" },
  { id: "churches", levels: [6, 14], first: "Letters to the seven churches", second: "The new Jerusalem and the last judgment" },
  { id: "throne", levels: [15, 20], first: "The throne and the Lamb", second: "The rider, the hallelujahs and Babylon's ruin" },
  { id: "seals", levels: [21, 27], first: "The seals and the great multitude", second: "Babylon, the great city" },
  { id: "trumpets", levels: [28, 33], first: "The trumpets", second: "The vials" },
  { id: "book", levels: [34, 38], first: "The army and the little book", second: "The everlasting gospel and the harvest" },
  { id: "witnesses", levels: [39, 43], first: "The two witnesses", second: "The beasts" },
  { id: "dragon", levels: [44, 51], first: "The woman and the dragon", second: "The dragon cast down" },
];

/** Where the chart's references or wording needed interpretation. */
export const CHART_NOTES: readonly ChartNote[] = [
  { letter: "E", prime: false, note: "Printed \"1.19\"; read as 1:19." },
  { letter: "P", prime: false, note: "Printed \"4.4\"; read as 4:4." },
  { letter: "R", prime: true, note: "Printed \"who wits on the throne\"; the verse says \"sat on the throne\"." },
  { letter: "U", prime: true, note: "Cites 18:12, but the wine, oil and wheat are in 18:13 (in the KJV and in modern versions). The app uses 18:12–13." },
  { letter: "X", prime: true, note: "No reference printed. Its numbers (92–94) place it at 17:18–18:2, which matches the label." },
];

const byLetter = new Map(LEVELS.map((l) => [l.letter, l]));

export function getLevel(letter: string): Level | undefined {
  return byLetter.get(letter);
}

/** "A", "A¹" style display letter. */
export function displayLetter(member: Pick<Member, "letter" | "prime">): string {
  return member.prime ? `${member.letter}¹` : member.letter;
}
