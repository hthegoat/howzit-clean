<template>
  <BrutalCard v-if="faqs.length" class="p-4 sm:p-6">
    <h2 class="text-lg font-black uppercase mb-4">FAQ</h2>
    <div class="divide-y divide-gray-200">
      <details 
        v-for="(faq, index) in faqs" 
        :key="index"
        class="group py-3 first:pt-0 last:pb-0"
      >
        <summary class="flex justify-between items-center cursor-pointer list-none font-semibold text-gray-900 hover:text-black pr-2">
          <span class="pr-4">{{ faq.question }}</span>
          <svg class="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <p class="mt-2 text-gray-600 text-sm leading-relaxed">{{ faq.answer }}</p>
      </details>
    </div>
  </BrutalCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  spotName: { type: String, required: true },
  state: { type: String, default: '' },
  waterTemp: { type: [Number, String], default: null },
  waveHeight: { type: String, default: null },
  tides: { type: Array, default: () => [] },
  sunrise: { type: String, default: null },
  sunset: { type: String, default: null },
  bestSwell: { type: [String, Array], default: null },
  bestWind: { type: [String, Array], default: null },
  bestTide: { type: String, default: null },
  skillLevel: { type: String, default: null }
})

// Get today's high/low tides
const todayTides = computed(() => {
  if (!props.tides?.length) return { high: null, low: null }
  
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  
  const todaysTides = props.tides.filter(t => {
    const tideTime = new Date(t.timestamp)
    return tideTime >= todayStart && tideTime < todayEnd
  })
  
  const highTide = todaysTides.find(t => t.type === 'HIGH')
  const lowTide = todaysTides.find(t => t.type === 'LOW')
  
  const formatTime = (t) => {
    if (!t) return null
    return new Date(t.timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZone: 'America/New_York'
    })
  }
  
  return {
    high: highTide ? formatTime(highTide) : null,
    low: lowTide ? formatTime(lowTide) : null
  }
})

// Format arrays to readable strings
const formatList = (val) => {
  if (!val) return null
  if (Array.isArray(val)) return val.join(', ')
  return val
}

// Build dynamic FAQs
const faqs = computed(() => {
  const questions = []
  
  // Water temperature
  if (props.waterTemp && props.waterTemp !== '--') {
    questions.push({
      question: `What is the water temperature at ${props.spotName}?`,
      answer: `The current water temperature at ${props.spotName} is ${props.waterTemp}°F. ${getWetsuitRec(props.waterTemp)}`
    })
  }
  
  // Wave height
  if (props.waveHeight && props.waveHeight !== '--') {
    questions.push({
      question: `What is the surf like at ${props.spotName} today?`,
      answer: `${props.spotName} currently has waves around ${props.waveHeight}ft. Conditions change throughout the day, so check back for updated forecasts.`
    })
  }
  
  // High tide
  if (todayTides.value.high) {
    questions.push({
      question: `What time is high tide at ${props.spotName}?`,
      answer: `Today's high tide at ${props.spotName} is at ${todayTides.value.high} ET. Tide times shift daily, so check our forecast for upcoming tide schedules.`
    })
  }
  
  // Low tide
  if (todayTides.value.low) {
    questions.push({
      question: `What time is low tide at ${props.spotName}?`,
      answer: `Today's low tide at ${props.spotName} is at ${todayTides.value.low} ET. Tide times shift daily, so check our forecast for upcoming tide schedules.`
    })
  }
  
  // Sunrise/Sunset
  if (props.sunrise && props.sunset) {
    questions.push({
      question: `What time is sunrise and sunset at ${props.spotName}?`,
      answer: `Today at ${props.spotName}, sunrise is at ${props.sunrise} and sunset is at ${props.sunset}. Dawn patrol starts about 30 minutes before sunrise when there's enough light to surf.`
    })
  }
  
  // Best conditions
  const bestSwell = formatList(props.bestSwell)
  const bestWind = formatList(props.bestWind)
  if (bestSwell || bestWind) {
    let answer = `${props.spotName} works best with `
    if (bestSwell) answer += `swells from the ${bestSwell}`
    if (bestSwell && bestWind) answer += ' and '
    if (bestWind) answer += `${bestWind} winds (offshore)`
    answer += `. ${props.bestTide ? `The ideal tide is ${props.bestTide.toLowerCase()}.` : ''}`
    
    questions.push({
      question: `What are the best conditions for surfing ${props.spotName}?`,
      answer: answer.trim()
    })
  }
  
  // Skill level
  if (props.skillLevel) {
    questions.push({
      question: `Is ${props.spotName} good for beginners?`,
      answer: getSkillAnswer(props.spotName, props.skillLevel)
    })
  }
  
  return questions
})

function getWetsuitRec(temp) {
  if (!temp || temp === '--') return ''
  const t = typeof temp === 'string' ? parseInt(temp) : temp
  if (t >= 72) return 'Boardshorts or a rashguard should be comfortable.'
  if (t >= 68) return 'A springsuit or shorty wetsuit is recommended.'
  if (t >= 62) return 'A 3/2mm wetsuit is recommended.'
  if (t >= 55) return 'A 4/3mm wetsuit with optional boots is recommended.'
  if (t >= 50) return 'A 5/4mm wetsuit with boots and gloves is recommended.'
  return 'A 6/5mm wetsuit with boots, gloves, and hood is essential.'
}

function getSkillAnswer(name, level) {
  const l = level?.toLowerCase() || ''
  if (l.includes('beginner') || l.includes('all')) {
    return `Yes, ${name} is suitable for beginners, especially on smaller days. It's always a good idea to check conditions before paddling out and consider taking a lesson if you're new to surfing.`
  }
  if (l.includes('intermediate')) {
    return `${name} is best suited for intermediate surfers who are comfortable paddling out and catching unbroken waves. Beginners may find it challenging on bigger days.`
  }
  if (l.includes('advanced') || l.includes('expert')) {
    return `${name} is recommended for experienced surfers only. The waves here can be powerful and conditions challenging. Beginners should look for more forgiving spots nearby.`
  }
  return `${name} accommodates various skill levels depending on conditions. Check the current wave height and period to gauge if it matches your experience.`
}
</script>
