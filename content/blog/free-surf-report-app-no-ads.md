---
title: "Free Surf Report App With No Ads — Why We Built Howzit"
description: "Every surf app is either paywalled, ad-infested, or both. So I built something else."
date: 2026-01-13
---

I was mid-scroll through a surf report when a full-screen ad for car insurance popped up. Closed it. Another one. Closed that too. By the time I saw the actual forecast, I forgot why I opened the app.

This happens constantly. The big surf apps are basically ad delivery platforms that occasionally show you wave heights.

So I built something else.

## The Problem With Surf Apps in 2026

Let's be honest about what's out there.

**Surfline** — The default. Decent data. But the free version is basically unusable. Ads everywhere. Half the features locked behind a $100/year paywall. And their forecasts? Single source. Black box. Trust us, bro.

**Magic Seaweed** — Was good. Then Surfline bought them. Now it's the same thing with a different logo.

**Windy/Windfinder** — Great for wind. Garbage for surf. Not built for wave riders.

**Random apps** — Either abandoned, full of ads, or both.

Every option is either paywalled, ad-infested, or just not built for surfers who want to check conditions without a 30-second commitment.

## What I Actually Wanted

Pretty simple list:

- **Open app. See waves.** No login wall. No "watch this ad first." No "upgrade to see today's forecast."
- **Real data I can trust.** Not one black-box algorithm. Show me what different models are predicting. Let me decide.
- **Works on my phone.** Fast. Clean. Doesn't drain my battery running ads in the background.
- **Free.** Actually free. Not "free trial" or "free with ads" or "free but the useful stuff costs money."

Couldn't find it. So I made it.

## How Howzit Works

We pull from three wave models — [WaveWatch III](https://polar.ncep.noaa.gov/waves/) (NOAA), [ECMWF](https://www.ecmwf.int/en/forecasts) (European), and [Open-Meteo](https://open-meteo.com/). Then we blend them.

When all three agree, you see high confidence. When they disagree, we tell you. No pretending we know something we don't.

Tides come from NOAA. Wind data too. Water temps. Everything's real, everything's sourced, nothing's made up.

You can toggle between models and see exactly what each one predicts. Try doing that on Surfline.

## Why No Ads?

Ads suck. That's basically it.

But also — ads create bad incentives. When you make money from ads, you want people to spend more time in the app. So you add features that waste time. Infinite scroll. Push notifications for non-events. Anything to juice engagement.

I want you to open Howzit, see if it's worth surfing, and close it. Done. Go live your life.

## Why Free Then?

Few reasons.

**Right now:** I'm building an audience. Proving the concept. Getting feedback from actual surfers. Charging money before the product is dialed would be dumb.

**Eventually:** Premium features for people who want them. Alerts when your spot hits a certain size. Custom thresholds. Maybe multi-spot dashboards. Stuff that's actually worth paying for.

But the core product — checking today's surf at your local break — stays free. Forever.

## What's Covered

76 spots across the East Coast right now:

- **New Jersey** — Manasquan, Asbury, LBI, the usual suspects
- **New York** — Rockaway, Long Beach, Montauk
- **North Carolina** — Outer Banks, Wrightsville, all of it
- **Florida** — Jacksonville down to Miami
- Plus Maine, New Hampshire, Massachusetts, Rhode Island, Delaware, Maryland, Virginia, South Carolina, Georgia

More coming. West Coast eventually. Hawaii probably.

## The Tech (For Nerds)

Built with Nuxt.js. Data stored in Supabase. Forecasts update every 6 hours from three independent APIs.

The rating algorithm factors in:

- Wave height (obviously)
- Wave period (the thing beginners ignore but matters most)
- Swell direction vs. beach orientation
- Wind speed and direction relative to the beach

It's not magic. It's just math. And we show our work on the [How We Forecast](/how-we-rate) page.

## Try It

That's the pitch. Free surf reports. No ads. Multiple forecast models. Actually useful.

Check your local spot: [hwztsurf.com/spots](https://hwztsurf.com/spots)

If it sucks, tell me. Feedback link is on every page. I actually read it.
