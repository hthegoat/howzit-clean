<template>
  <BrutalCard class="p-4 sm:p-6">
    <p class="text-card-title mb-4">5-Day Forecast</p>
    
    <!-- Mobile: Stack cards -->
    <div class="sm:hidden space-y-3">
      <div 
        v-for="day in forecast" 
        :key="day.dayName"
        class="p-3 border-2 border-gray-200 rounded-lg cursor-pointer relative overflow-hidden"
        :class="selectedDay?.dayName === day.dayName ? 'bg-gray-100 border-black' : ''"
        @click="$emit('select', day)"
      >
        <!-- Color bar -->
        <div 
          class="absolute left-0 top-0 bottom-0 w-1.5"
          :style="{ backgroundColor: scoreToColor(day.score) }"
        ></div>
        
        <div class="flex justify-between items-center mb-2 pl-2">
          <span class="font-bold">{{ day.dayName }}</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded" :style="{ backgroundColor: scoreToColor(day.score), color: getTextColor(day.score) }">
            {{ scoreToLabel(day.score) }}
          </span>
        </div>
        <div class="flex gap-4 text-sm font-mono pl-2">
          <span class="font-bold">{{ day.waveDisplay }}</span>
          <span>{{ day.period }}s</span>
          <span>{{ day.windSpeed }}mph</span>
        </div>
      </div>
    </div>

    <!-- Desktop: Table -->
    <div class="hidden sm:block">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b-2 border-black">
            <th class="text-left py-2 font-bold">Day</th>
            <th class="text-left py-2 font-bold">Waves</th>
            <th class="text-left py-2 font-bold">Period</th>
            <th class="text-left py-2 font-bold">Wind</th>
            <th class="text-right py-2 font-bold">Rating</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="day in forecast" 
            :key="day.dayName"
            class="border-b border-gray-200 cursor-pointer transition-colors relative"
            :class="selectedDay?.dayName === day.dayName ? 'bg-gray-100' : 'hover:bg-gray-50'"
            @click="$emit('select', day)"
          >
            <td class="py-3 font-bold">
              <div class="flex items-center gap-2">
                <div 
                  class="w-1 h-6 rounded-full"
                  :style="{ backgroundColor: scoreToColor(day.score) }"
                ></div>
                {{ day.dayName }}
              </div>
            </td>
            <td class="py-3 font-mono font-bold">{{ day.waveDisplay }}</td>
            <td class="py-3 font-mono">{{ day.period }}s</td>
            <td class="py-3 font-mono">{{ day.windSpeed }}mph</td>
            <td class="py-3">
              <div class="flex justify-end">
                <span 
                  class="text-xs font-bold px-2 py-1 rounded"
                  :style="{ backgroundColor: scoreToColor(day.score), color: getTextColor(day.score) }"
                >
                  {{ scoreToLabel(day.score) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BrutalCard>
</template>

<script setup>
const { scoreToColor, scoreToLabel } = useHowzitRating()

defineProps({
  forecast: { type: Array, required: true },
  selectedDay: { type: Object, default: null }
})

defineEmits(['select'])

const getTextColor = (score) => {
  // Dark text for light backgrounds (yellow, lime, light green)
  if (score >= 35 && score < 80) return '#000'
  // Light text for dark backgrounds (red, orange, dark green)
  return '#fff'
}
</script>
