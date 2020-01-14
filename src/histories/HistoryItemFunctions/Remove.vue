<!--template>

</template-->

<script>
    import FunctionIcon from '../../misc/FunctionIcon';
    import HistoryItem from "../../histories/HistoryItem";

    /**
     * Remove history item button
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
                default: 'Remove this item from the history',
            },

            /**
             * HistoryItem Vue instance with model to remove
             */
            item: {
                type: HistoryItem,
                required: true,
            },

            /**
             * @ignore
             */
            action: {
                type: Function,
                required: false,
                default() {
                    this.item.model.delete();
                    this.$emit('galaxy-history-item-deleted', this.item.model);
                },
            },
        },
    }
</script>

<style scoped>

</style>