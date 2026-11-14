# Script guide

The script decides whether the video works. The two reference shorts this format was built from
(73 s and 90 s) and the bundled example (67 s) share the rules below.

## Choosing a topic

If the user gives a topic, use it. If you choose, pick a **"why" question most people have wondered
about, that can be explained with one small invented world.**

Test a topic with these four questions. All four must be "yes".

1. Can the hook be a question of 12 words or fewer?
2. Can it be shown with a handful of people and one or two countable objects?
3. Is there one cause that sets off a chain of visible results?
4. Does it end with a real-world word the viewer already knows (inflation, interest, insurance…)?

Two shapes work:

- **Parable** (best): "One ___ explains it." A tiny world, one change, different outcomes for
  different people. Example: the island and the seashells; a village and one chicken each.
- **Reasons list**: "Why don't X do Y?" then 3–4 concrete reasons, each with a number and a
  comparison (slow ship vs fast ship, low deck vs high wall), then a one-line conclusion.

Starter ideas (all untested as videos; check any facts before using them):

| Hook | Small world |
| --- | --- |
| Why do banks pay you interest? | A village with one strongbox keeper |
| Why does insurance exist? | Ten fishermen and one storm a year |
| Why do shops have sales? | A baker with bread that goes stale at sunset |
| Why is compound interest so powerful? | One rabbit farm |
| Why do traffic jams appear from nowhere? | Ten carts on a one-lane bridge |
| Why do we have taxes? | A village that needs one well |
| Why are diamonds expensive and water cheap? | Two travellers in a desert |
| Why do companies sell shares? | A fisherman who needs a bigger boat |
| How does a rumour ruin a bank? | The same strongbox keeper, one bad morning |
| Why do prices end in .99? | Two market stalls side by side |

## Structure

| Part | Share of the video | Job | Example line |
| --- | --- | --- | --- |
| Hook | first 3 s | Ask the question | "Why does everything keep getting more expensive?" |
| Promise | next 2 s | Name the small world | "One tiny island explains it." |
| Setup | ~15% | State the rules with numbers | "Every day, they catch ten fish." |
| Change | ~10% | One event | "Then one morning, the chief finds a hidden cave." |
| Joy / first result | ~12% | The obvious, pleasant result | "Everyone is rich!" |
| Turn | 1 short line | Flip it | "But there's a problem." |
| Consequences | ~20% | The chain, step by step | "Twenty shells. Fifty. One hundred shells, for one fish." |
| Two fates | ~20% | Who won, who lost | "Her whole jar now buys a single fish." |
| Lesson | last 2 lines | Say the principle, then the word | "That is inflation." |

## Sentence rules

- **One idea per sentence. 2–12 words.** A sentence is a shot; a long sentence is a long, dull shot.
- Mix lengths. Use one- to three-word sentences as beats: "Simple." "Fifty." "They dance."
- Present tense. Plain words a ten-year-old knows. No jargon until the final line.
- Use small round numbers and repeat them (ten people, ten fish, one hundred shells).
- Use groups of three for rhythm: "They dance. They cheer. They run to the market."
- Give one or two characters a name or a role (the chief, old Mara). Viewers remember people.
- Write numbers as words ("one hundred", "thirty years") so the voice reads them correctly.
- No brand names, no "hey guys", no "in this video", no call to subscribe.
- End on the shortest line in the script.

## Gaps

`gap` is the silence after a sentence. Keep the pace quick.

| Situation | gap |
| --- | --- |
| Inside a rhythm group ("They dance." / "They cheer.") | 0.2 |
| Normal | 0.25–0.3 |
| End of a section, before a turn or a reveal | 0.4–0.5 |
| After the final sentence | 1.0–1.2 |

## Check before moving on

- [ ] Hook is a question and is over within 3 seconds.
- [ ] Sentence 2 makes the promise.
- [ ] Every sentence can be drawn. If you cannot say what is on screen, rewrite it.
- [ ] No sentence over 12 words; at least six sentences of 3 words or fewer.
- [ ] There is a clear turn.
- [ ] Two different outcomes for two different characters.
- [ ] The last line is 4 words or fewer.
- [ ] `tts.py` reports a duration inside the target range.

## The example script, with timings

From `template/script.json` (voice `am_michael`, speed 1.08, 184 words, 67.2 s):

| Time | Part | Line |
| --- | --- | --- |
| 0.2 | Hook | Why does everything keep getting more expensive? |
| 2.8 | Promise | One tiny island explains it. |
| 5.0 | Setup | On this island live ten people. |
| 7.1 | Setup | Every day, they catch ten fish. |
| 9.0 | Setup | And all the money on the island is one hundred seashells. |
| 12.7 | Setup | So one fish costs ten shells. |
| 14.7 | Beat | Simple. |
| 15.8 | Change | Then one morning, the chief finds a hidden cave. |
| 18.7 | Change | Full of shells. |
| 19.9 | Change | Thousands of them. |
| 21.3 | Change | He gives every islander a giant sack. |
| 23.7 | Joy | Everyone is rich! |
| 25.1 | Joy | They dance. / They cheer. / They run to the market. |
| 28.6 | Turn | But there's a problem. |
| 30.0 | Consequence | The sea didn't change. |
| 31.4 | Consequence | There are still only ten fish. |
| 33.4 | Consequence | Now everyone can pay more. / So they do. |
| 36.4 | Consequence | Twenty shells. / Fifty. / One hundred shells, for one fish. |
| 40.6 | Consequence | By sunset, everyone is holding ten times the money, |
| 43.9 | Consequence | and eating the exact same dinner. |
| 45.9 | Two fates | But two people did not end up the same. |
| 48.3 | Fate 1 | The chief spent his shells first, before prices rose. |
| 51.7 | Fate 1 | He got a new boat. |
| 53.1 | Fate 2 | And old Mara, who saved her shells in a jar for thirty years? |
| 57.2 | Fate 2 | Her whole jar now buys a single fish. |
| 60.0 | Lesson | Nobody got poorer by losing money. |
| 62.2 | Lesson | They got poorer because someone made more of it. |
| 64.9 | Lesson | That is inflation. |
