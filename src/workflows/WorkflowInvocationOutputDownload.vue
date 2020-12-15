<template>
  <b-dropdown size="sm" variant="outline-secondary" class="galaxy-workflow-output-download">
    <template #button-content>
      <i class="icon-download"></i>Download
    </template>
    <b-dropdown-item-button v-for="(output, name) in outputs" @click="output.download(url_xform)" :key="name">{{ name }}</b-dropdown-item-button>
  </b-dropdown>
</template>

<script>

export default {
  name: "WorkflowInvocationOutputDownload",
  props: {
    outputs: {
      required: true,
    },
    url_xform: {
      type: Function,
      default: x=>x
    }
  },
}
</script>

<style scoped>

</style>
