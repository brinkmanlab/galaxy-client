<template>
    <b-link class="galaxy-function" v-bind:title="description" @click.stop.prevent="do_action" href="">
        <i class="galaxy-function-icon" v-bind:class="icon"></i>
        {{label}}
    </b-link>
</template>

<script>
    /**
     * Base component for all icon buttons
     */
    export default {
        name: "FunctionIcon",
        props: {
            /**
             * CSS class targeting intended font-awesome icon
             */
            icon: {
                type: String,
                default: '',
            },

            /**
             * Label to show with icon
             */
            label: {
                type: String,
                default: '',
            },

            /**
             * Tooltip description of button
             */
            description: {
                type: String,
                default: '',
            },

            /**
             * Callback when user clicks button
             * 'this' is bound to the button Vue instance
             */
            action: {
                type: Function,
                required: true,
            }
        },
        methods: {
            do_action() {
                this.action.call(this); // Call action setting 'this' to this component
            }
        }
    }
</script>

<style scoped>

</style>