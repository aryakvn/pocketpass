<template>
  <v-app>
    <v-navigation-drawer
      color="surface"
      permanent
      rail
      rail-width="75"
    >
      <template #prepend>
        <div class="d-flex justify-center align-center py-2">
          <img
            alt="Pocket Pass"
            src="../../assets/logo.png"
            style="width: 42px;"
          >
        </div>
      </template>

      <template #append>
        <div class="d-flex justify-center align-center pa-2 pb-3">
          <v-avatar
            color="background"
            icon="mdi-account-outline"
            size="42"
          />
        </div>
      </template>


      <div class="d-flex flex-column align-center py-5 ga-5">
        <v-tooltip
          text="Passwords"
        >
          <template #activator="{props}">
            <router-link
              active-class="border-sm"
              class="text-primary rounded-lg pa-2"
              style="border-color: rgb(var(--v-theme-primary)) !important;"
              to="/"
              v-bind="props"
            >
              <v-icon
                icon="mdi-lock"
              />
            </router-link>
          </template>
        </v-tooltip>
      </div>
    </v-navigation-drawer>

    <v-navigation-drawer
      color="surface"
      permanent
    />

    <v-main>
      <v-container fluid>
        <div class="d-flex justify-space-between align-center">
          <v-breadcrumbs
            class="text-h5 px-0"
            divider="/"
            :items="breadcrumbs"
          />

          <v-spacer/>

          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            text="Add"
            variant="flat"
            width="150"
          />
        </div>
        <slot/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
defineProps({
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>

</style>
