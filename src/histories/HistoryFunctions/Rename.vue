<!--template>

</template-->

<script>
    import FunctionIcon from '../../misc/FunctionIcon';
    import History from "@/galaxy/src/histories/History";

    /**
     * Rename History button
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
             * History Vue instance to rename
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
                    this.$emit('galaxy-history-rename', this.item.model);
                },
            },
        },
    }
</script>

<style scoped>

</style>