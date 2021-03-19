<template>
  <b-card class="galaxy-histories" no-body>
    <b-card-header>
      <b-nav card-header tabs title="Ctrl-click tabs to show multiple">
        <b-nav-item v-for="item of items" :key="item.model.id" :active="item.active" @click="activate($event, item)">
          <slot name="tab" :item="item" :model="item.model">
            {{ item.model.name }}
          </slot>
        </b-nav-item>
      </b-nav>
    </b-card-header>
    <b-card-body>
      <slot name="default" :model="item.model" v-for="item of active_items" :key="item.model.id" />
    </b-card-body>
  </b-card>
</template>

<script>

/**
 * Multi History view
 */
export default {
  name: "Histories",
  props: {
      /**
       * History model instance
       */
      models: {
        type: Array,
        required: true,
      },
  },
  data() { return {
    items: this.models.map((m, i)=>({active: i === 0, model: m})),
  }},
  methods: {
    activate(evt, item) {
      if (!evt.ctrlKey) this.items.forEach(i=>i.active=false)
      item.active = true;
    },
  },
  computed: {
    active_items() {
      return this.items.filter(i=>i.active);
    },
  }
}
</script>

<style scoped>
  .galaxy-histories >>> .card-body {
    display: flex;
    flex-flow: row nowrap;
    overflow-x: scroll;
    justify-content: flex-start;
    align-items: stretch;
  }
</style>
