<!--template>

</template-->

<script>
    import FunctionIcon from "@/galaxy/src/misc/FunctionIcon";
    import HistoryItem from "@/galaxy/src/histories/HistoryItem";

    /**
     * Rename history item button
     */
    export default {
        extends: FunctionIcon,
        name: "Rename",
        props: {
            /**
             * @ignore
             */
            icon: {
                type: String,
                default: 'icon-rename',
            },

            /**
             * @ignore
             */
            label: {
                type: String,
                default: 'Rename',
            },

            /**
             * @ignore
             */
            description: {
                type: String,
                default: 'Rename this item',
            },

            /**
             * HistoryItem Vue instance with model to rename
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
                    this.$emit('galaxy-history-item-rename', this.item.model);
                },
            },
        },
    }
</script>

<style scoped>

</style>