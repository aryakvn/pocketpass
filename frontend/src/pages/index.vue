<template>
  <DashboardLayout
    :breadcrumbs="[
      { title: 'Home', disabled: false, href: '/' },
      { title: 'Dashboard', disabled: true },
    ]"
  >
    <v-data-table
      class="bg-transparent"
      item-value="name"
      :items="[
        { name: 'Frozen Yogurt', calories: 159, fat: 6.0, carbs: 24, protein: 4.0 },
        { name: 'Ice cream sandwich', calories: 237, fat: 9.0, carbs: 37, protein: 4.3 },
        { name: 'Eclair', calories: 262, fat: 16.0, carbs: 24, protein: 6.0 },
        { name: 'Cupcake', calories: 305, fat: 3.7, carbs: 67, protein: 4.3 },
        { name: 'Gingerbread', calories: 356, fat: 16.0, carbs: 49, protein: 3.9 },
        { name: 'Jelly bean', calories: 375, fat: 0.0, carbs: 94, protein: 0.0 },
        { name: 'Lollipop', calories: 392, fat: 0.2, carbs: 98, protein: 0.0 },
        { name: 'Honeycomb', calories: 408, fat: 3.2, carbs: 87, protein: 6.5 },
        { name: 'Donut', calories: 452, fat: 25.0, carbs: 51, protein: 4.9 },
        { name: 'KitKat', calories: 518, fat: 26.0, carbs: 65, protein: 7.0 },
      ]"
      show-select
      sticky
      style="height: 100vh; max-height: calc(100svh - 112px)"
    />
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from "@/components/layouts/DashboardLayout.vue";

import crypto from "@/utils/crypto.js";

window.c = crypto;

</script>

<style scoped>
.v-data-table:deep(thead),
.v-data-table:deep(thead th) {
  background: rgb(var(--v-theme-background)) !important;
}
</style>
