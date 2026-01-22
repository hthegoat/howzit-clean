---
title: "I Compared 3 Wave Forecast Models — Here's Why Your Surf App Might Be Lying to You"
description: "Most surf apps use one model. When it's wrong, you're wrong. So I pulled data from three models and compared them. They disagreed 85% of the time."
date: 2026-01-12
---

Drove an hour last month to check a swell. App said 3-4ft, clean. Pulled up to knee-high slop.

Sound familiar?

I've been surfing the East Coast for years and this keeps happening. Not occasionally — regularly. The forecasts just... miss. And I got tired of it.

So I did something probably stupid. I spent a weekend pulling data from three different wave models and comparing them for the same spot. Nerdy? Yes. Worth it? Actually, yeah.

## Here's the thing nobody talks about

Your surf app probably uses one model. Just one. Surfline has theirs. MSW has theirs. When that model screws up, you screwed up too.

Wave forecasting is hard. Like, genuinely difficult. The ocean doesn't care about our algorithms. Models make different guesses about wind patterns, how swells travel, what the seafloor does to waves. They're all kinda right and kinda wrong at the same time.

East Coast makes it worse:

- Hurricane swells that zig when models say zag
- Nor'easters that pop up fast
- Junky wind swell that's there one hour, gone the next

I figured — what if I just looked at all the models at once?

## What I actually did

Grabbed 48 hours of forecasts for a [New Jersey beach break](/spots/state/new-jersey) from three models:

**[WaveWatch III](https://polar.ncep.noaa.gov/waves/)** — NOAA runs this one. Been around since the 90s. American model, uses our weather data. Pretty good at catching swells early and tracking short-period stuff.

**[ECMWF WAM](https://www.ecmwf.int/en/forecasts)** — European model. These are the folks who [nailed Hurricane Sandy](https://www.washingtonpost.com/news/capital-weather-gang/wp/2012/10/26/hurricane-sandy-why-the-european-model-was-more-accurate/) when American models had it going out to sea. Generally solid for 3-7 days out.

**[Open-Meteo](https://open-meteo.com/)** — Open source thing that pulls from multiple places. Decent baseline, lots of detail on swell components.

Same beach. Same hours. Three answers.

## They disagreed. A lot.

Only matched within half a foot about **15% of the time**.

Fifteen percent! These models power the apps we all use. And they're giving different answers most of the time.

Check this out from January 10th:

| Time | WaveWatch III | ECMWF | Open-Meteo |
|------|---------------|-------|------------|
| 6 AM | 0.4 ft | 1.4 ft | 1.2 ft |
| Noon | 1.0 ft | 1.6 ft | 1.4 ft |
| 6 PM | 4.2 ft | 2.0 ft | 1.8 ft |

That 6 PM row though. WaveWatch saw something coming that the European models missed entirely. Some ENE energy that they smoothed over.

Ended up being a short-lived bump that evening. WW3 was right.

But — and this is important — ECMWF is usually better for planning a few days ahead. WW3 reacts faster to local stuff. Neither is "the best." They're good at different things.

## So what do you do with this?

If you showed a surfer all three numbers, they'd naturally average them out in their head. "Two say 2ft, one says 4ft... probably 2-something but worth watching."

That's basically what I built:

**All three close together?** Average them. High confidence. Go surf.

**Two agree, one's different?** Trust the pair more. Medium confidence.

**All over the place?** Take the middle number but flag it. Low confidence. Maybe check cams before driving.

Simple stuff. But no app was showing this.

## Why should you care?

When models agree — commit. Dawn patrol. Send it.

When they don't — stay loose. Check the buoy in the morning. Don't drive two hours on a guess.

Regular forecasts hide this from you. They give you one number like it's gospel. It's not. It's one model's opinion.

## I built this thing

Called it [Howzit](https://hwztsurf.com). Free forecast for 76 East Coast spots — from [Sebastian Inlet](/spots/sebastian-inlet) in Florida to [Higgins Beach](/spots/higgins-beach) in Maine.

There's a surf graph with a toggle — HWZT, WW3, ECMWF, OM. HWZT is the blend. But you can flip through each model and see exactly what it thinks. Hover on any hour and you see all three numbers plus confidence.

No mystery. No "trust our proprietary algorithm." Just the data.

## Bottom line

Nobody's cracked surf forecasting. Anyone saying otherwise is selling premium subscriptions.

But stacking models and being upfront about uncertainty? That's something. Sometimes you commit to dawn patrol. Sometimes you sleep in. At least you're deciding with real info instead of one algorithm's best guess.
