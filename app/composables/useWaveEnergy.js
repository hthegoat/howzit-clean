// Wave energy — the number that separates 3ft at 16s from 3ft at 8s
//
// Deep-water wave power per metre of crest is:
//
//   P = (rho * g^2 / 64pi) * Hs^2 * Te  ~=  0.49 * Hs^2 * Te   [kW/m]
//
// with Hs in metres and Te in seconds. That is power -- energy per second.
// We report energy per WAVE instead, which is that power integrated over one
// wave period:
//
//   E = P * Te  =  0.49 * Hs^2 * Te^2   [kJ per metre of crest]
//
// kW/m x s = kJ/m, so there is no fudge factor here; it is the same physics
// asked a different question. "How much energy does one wave deliver to each
// metre of beach" is the question a surfer is actually asking, and it is the
// scale surfers already read on other surf apps. All model data (Open-Meteo, WW3,
// ECMWF) is in metres, so no conversion is needed on the way in.
//
// NOTE THE T^2. Under kW/m, doubling the period doubled the number. Under
// kJ/m it quadruples it, because a longer wave is both more powerful and
// takes longer to pass. 3ft at 16s is now ~4x 3ft at 8s, not ~2x. That is
// correct, and it is the whole reason the card exists -- but it means the
// bands below had to be re-derived from scratch, not rescaled by a constant.
//
// WHY COMPONENTS RATHER THAN ONE HEIGHT x ONE PERIOD:
// Energy is additive across wave components, because total variance is the
// sum of component variances. So the honest calculation is
//
//   E = 0.49 * SUM( Hi^2 * Ti^2 )
//
// summed over the swell and wind-wave partitions, each component carrying
// its OWN period. This avoids the trap of pairing a combined height with a
// swell period, which quietly inflates the number every time wind chop is in
// the water -- and squaring the period makes that trap twice as expensive.
//
// WHAT THIS IS NOT:
// This is the energy in the water at the model's cell. It is NOT an
// offshore-vs-nearshore pair. Producing that honestly needs a nearshore
// propagation model -- bathymetry, refraction, shadowing -- which we do not
// have. Do not fake it by labelling WW3 "offshore" and Open-Meteo
// "nearshore"; those are two models with different biases, not a
// deepwater/nearshore pair, and presenting their disagreement as energy
// loss would be dressing up model spread as physics.

export const useWaveEnergy = () => {

  // rho * g^2 / (64 * pi), for seawater. In kJ/m once multiplied by
  // H^2 * T^2 with H in metres and T in seconds.
  const ENERGY_COEFFICIENT = 0.49

  // Bands re-derived for kJ/m against the same real East Coast days, where
  // most of the spot list lives:
  //   2ft @ 6s   ~    7 kJ/m   weak
  //   3ft @ 8s   ~   26 kJ/m   moderate
  //   3ft @ 9s   ~   33 kJ/m   moderate
  //   3ft @ 16s  ~  104 kJ/m   strong
  //   4ft @ 12s  ~  105 kJ/m   strong
  //   6ft @ 14s  ~  322 kJ/m   powerful
  //  10ft @ 16s  ~ 1170 kJ/m   heavy
  //
  // The Strong threshold sits at 75 specifically so that the headline case
  // clears it and its twin does not. 3ft @ 16s is a real groundswell -- long
  // lines, it breaks with authority, you feel it -- and 3ft @ 8s is not.
  // They come out at 104 and 26, four times apart, so the T^2 scaling has
  // widened the exact gap this number exists to draw.
  //
  // Deliberately NOT the rating vocabulary (Epic/Good/Junky/Flat). Energy
  // is how much power is in the water, not how good the surf is -- 400 kJ/m
  // under a 30mph onshore is a washing machine, and the labels must not
  // imply otherwise.
  const ENERGY_BANDS = [
    { min: 750, label: 'Heavy' },
    { min: 250, label: 'Powerful' },
    { min: 75,  label: 'Strong' },
    { min: 10,  label: 'Moderate' },
    { min: 0,   label: 'Weak' },
  ]

  const num = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v)
    return Number.isFinite(n) && n > 0 ? n : 0
  }

  /**
   * Energy of a single wave component, in kJ per metre of crest.
   */
  const componentEnergy = (heightM, periodS) => {
    const h = num(heightM)
    const t = num(periodS)
    if (!h || !t) return 0
    return ENERGY_COEFFICIENT * h * h * t * t
  }

  const energyBand = (kjPerM) => {
    return ENERGY_BANDS.find(b => kjPerM >= b.min)?.label ?? 'Weak'
  }

  /**
   * Small numbers need a decimal to be meaningful (1.4 vs 2.1 is a real
   * difference at the bottom end); large ones don't. Above 100 we round to
   * the nearest 10 -- these are model estimates, and "1174" claims a
   * precision the input does not have. It also stops the readout flickering
   * through four digits while you scrub.
   */
  const formatEnergy = (kjPerM) => {
    if (kjPerM === null) return '--'
    if (kjPerM < 10) return kjPerM.toFixed(1)
    if (kjPerM < 100) return String(Math.round(kjPerM))
    return String(Math.round(kjPerM / 10) * 10)
  }

  /**
   * Wave energy for a forecast row.
   *
   * @param {Object} f - a row from the `forecasts` table
   * @returns {{ kjPerM: number|null, swell: number, windWave: number,
   *             display: string, band: string, method: string }}
   */
  const getWaveEnergy = (f) => {
    if (!f) {
      return { kjPerM: null, swell: 0, windWave: 0, display: '--', band: '', method: 'no data' }
    }

    const swell = componentEnergy(f.swell_wave_height, f.swell_wave_period)
    const windWave = componentEnergy(f.wind_wave_height, f.wind_wave_period)

    if (swell || windWave) {
      const total = swell + windWave
      return {
        kjPerM: total,
        swell,
        windWave,
        display: formatEnergy(total),
        band: energyBand(total),
        method: 'components'
      }
    }

    // Fallback: no partition data, so use the combined sea state. Less
    // precise when chop and swell are mixed, but better than showing
    // nothing, and it degrades in the right direction (a single combined
    // period sits between the two component periods).
    const height = f.blended_wave_height ?? f.wave_height
    const period = f.blended_wave_period ?? f.wave_period
    const combined = componentEnergy(height, period)

    if (!combined) {
      return { kjPerM: null, swell: 0, windWave: 0, display: '--', band: '', method: 'no data' }
    }

    // No partition available, so the split is unknown rather than zero.
    // Attributed wholesale to swell so the stacked view still totals
    // correctly; `method` is what callers should check before trusting it.
    return {
      kjPerM: combined,
      swell: combined,
      windWave: 0,
      display: formatEnergy(combined),
      band: energyBand(combined),
      method: 'combined'
    }
  }

  return {
    getWaveEnergy,
    componentEnergy,
    energyBand,
    formatEnergy,
    ENERGY_COEFFICIENT,
    ENERGY_BANDS
  }
}
