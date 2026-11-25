# Revelation's mirror: the chiasm dataset

`src/studies/revelation-chiasm/data/chiasm.ts`, tested in `data/__tests__/chiasm.test.ts`.

## Provenance

A printed chart supplied by the project owner: "the chiastic structure of
Revelation", 51 nested levels lettered A to Z and AA to YY, descending from
1:1 to a centre at 12:9–10 and back out to 22:20. **The original author has
not been identified yet**; the app says so (`CHART_SOURCE`). Fill in
`CHART_SOURCE.author` and `url` once known.

Every line was checked against the image, with the doubtful lines enlarged.

## What the numbers mean

Each line on the chart carries a number in parentheses: how many verses the
passage sits from the centre, counting Revelation's verses in order. With KJV
numbering (404 verses), 12:9 is verse 203 and 12:10 is verse 204, so a
first-half passage's distance is `203 − ordinal` and a second-half passage's is
`ordinal − 204`. The app recomputes every distance this way (`compute.ts`) and
never displays the printed number as fact.

Across the 51 levels the two halves differ by 1.07 verses on average, at most
5 (level G), 47 levels match within 3 verses, and the correlation of the two
distances is 0.9997.

## Where the chart differs from KJV counting

| Member | Chart | KJV count | Note |
|---|---|---|---|
| O¹ 19:11 | 129 | 127 | |
| MM¹ 13:18 | 26 | 25 | OO¹, NN¹, MM¹ all read one higher, as if the author's Bible had a 12:18 (some modern versions do) |
| NN¹ 13:13 | 21 | 20 | |
| OO¹ 13:12 | 20 | 19 | |
| RR¹ 12:17 | 10 | 7 | |

A single printed number inside a multi-verse passage counts as agreeing (e.g.
K¹ 20:11–12 printed 149, computed 148–149).

## Reading the chart (`CHART_NOTES`)

- E prints "1.19" and P prints "4.4": read as 1:19 and 4:4.
- R¹ prints "who wits on the throne": the verse says "sat".
- U¹ cites 18:12, but the wine, oil and wheat are in 18:13 in the KJV and in
  modern versions. The app uses 18:12–13 (computed 104–105, printed 104).
- X¹ has no reference. Its numbers (92–94) place it at 17:18–18:2, which fits
  its label ("King of the earth … Babylon is fallen").

## Labels and phrases

`sourceLabel` keeps the chart's wording verbatim, typos included. `label` is
written in KJV wording, because the app shows the KJV text. `phrases` are exact,
case-sensitive substrings of each passage's KJV text (markup stripped) and are
highlighted in the study; a test enforces this.

## Colours

The chart cycles seven colours by level (A red, B orange, C gold, D green, E
light blue, F dark blue, G purple, then again) and prints the centre in black.
The study deepens each colour to at least 3.9:1 against its white canvas
(`src/studies/revelation-chiasm/colors.ts`).
