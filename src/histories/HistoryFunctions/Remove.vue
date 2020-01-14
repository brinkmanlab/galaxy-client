<!--template>

</template-->

<script>
    import FunctionIcon from '../../misc/FunctionIcon';
    import History from "../../histories/History";

    /**
     * Remove button for History
     */
    export default {
        extends: FunctionIcon,
        name: "Remove",
        props: {
            /**
             * @ignore
             */
            icon: {
                type: String,
                default: 'icon-trash',
            },

            /**
             * @ignore
             */
            label: {
                type: String,
                default: 'Remove',
            },

            /**
             * @ignore
             */
            description: {
                type: String,
                default: 'Remove this history',
            },

            /**
             * History Vue instance with model to Remove
             */
            item: {
                type: History,
                required: true,
            },

            /**
             * @ignore
             */
            action: {
                type: Function,
                default() {
                    this.item.model.delete();
                    this.$emit('galaxy-history-deleted', this.item.model);
                },
            },
        },
    }
</script>

<style scoped>

</style>