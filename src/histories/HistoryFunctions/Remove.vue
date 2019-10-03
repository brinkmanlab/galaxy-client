<!--template>

</template-->

<script>
    import FunctionIcon from '../../misc/FunctionIcon';
    import History from "@/galaxy/src/histories/History";
    export default {
        extends: FunctionIcon,
        name: "Remove",
        props: {
            icon: {
                type: String,
                default: 'icon-trash',
            },
            label: {
                type: String,
                default: 'Remove',
            },
            description: {
                type: String,
                default: 'Remove this history',
            },
            item: {
                type: History,
                required: true,
            },
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