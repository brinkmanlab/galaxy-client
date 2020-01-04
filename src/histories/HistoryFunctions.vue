<template>
    <b-button-group class="galaxy-history-functions">
        <slot v-bind:item="item"></slot>
    </b-button-group>
</template>

<script>
    import History from "@/histories/History";
    /**
     * Container component for History function buttons
     */
    export default {
        name: "HistoryFunctions",
        props: {
            /**
             * History Vue instance
             */
            item: {
                type: History,
                required: true,
            },

        }
    }
</script>

<style scoped>
    .galaxy-history-functions {
        display: inline-flex;
        flex-direction: row;
        align-items: stretch;
        margin-left: auto;
    }
</style>