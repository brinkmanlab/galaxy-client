<!--template>

</template-->

<script>
    import FunctionIcon from '../../misc/FunctionIcon';
    import {History} from "../../api/histories";

    /**
     * Create button for History
     */
    export default {
        extends: FunctionIcon,
        name: "Create",
        props: {
            /**
             * @ignore
             */
            icon: {
                type: String,
                default: 'icon-plus',
            },

            /**
             * @ignore
             */
            label: {
                type: String,
                default: 'Create',
            },

            /**
             * @ignore
             */
            description: {
                type: String,
                default: 'Create a new history',
            },

            /**
             * @ignore
             */
            action: {
                type: Function,
                default() {
                    this.$emit('galaxy-history-create', History.post());
                },
            },
        },
    }
</script>

<style scoped>

</style>
