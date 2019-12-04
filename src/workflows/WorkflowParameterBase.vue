<template>
    <b-card class="galaxy-workflow-parameter" v-bind:border-variant="validation_message ? 'danger' : 'default'">
        <b-card-header @click="toggleCollapsed">
            <div>{{ label+(optional?' (Optional)': '') }}</div>
            <div v-if="optional && collapsed" class="galaxy-workflow-parameter-collapse">Show <i class="icon icon-uncollapse"></i></div>
            <div v-if="optional && !collapsed" class="galaxy-workflow-parameter-collapse">Hide  <i class="icon icon-collapse"></i></div>
        </b-card-header>
        <b-card-body :body-class="collapsed?'collapsed':''">
            <slot />
        </b-card-body>
        <b-card-footer v-if="validation_message" footer-text-variant="danger">
            <em>{{validation_message}}</em>
        </b-card-footer>
        <b-card-footer v-else>
            {{ annotation }}
        </b-card-footer>
    </b-card>
</template>

<script>
    export default {
        name: "WorkflowParameterBase",
        props: {
            /**
             * Input label
             */
            label: {
                type: String,
                required: true,
            },

            /**
             * Input annotation
             */
            annotation: {
                type: String,
                default: '',
            },

            /**
             * User input optional
             */
            optional: {
                type: Boolean,
                default: false,
            },

            /**
             * Hide body by default
             */
            collapse: {
                type: Boolean,
                default: false,
            },

            validation_message: {
                type: String,
                default: '',
            }
        },
        data() {return {
            collapsed: this.collapse,
        }},
        methods: {
            toggleCollapsed() {
                if (this.optional) this.collapsed = !this.collapsed;
            }
        }
    }
</script>

<style scoped>
    .card-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .card-header > a:last-child {
        text-decoration: none;
    }

    .collapsed {
        display: none;
    }
</style>