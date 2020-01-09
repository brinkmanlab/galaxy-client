<!--template>

</template-->

<script>
    import FunctionIcon from "../../misc/FunctionIcon";
    import WorkflowInvocation from "../../workflows/WorkflowInvocation";

    /**
     * Error Info modal button
     * Generates a model showing the workflow error log
     */
    export default {
        extends: FunctionIcon,
        name: "ErrorInfo",
        props: {
            /**
             * @ignore
             */
            icon: {
                type: String,
                default: 'icon-errorinfo',
            },

            /**
             * @ignore
             */
            label: {
                type: String,
                default: 'Error Info',
            },

            /**
             * @ignore
             */
            description: {
                type: String,
                default: 'View error log',
            },

            /**
             * WorkflowInvocation Vue instance with model to show log
             */
            item: {
                type: WorkflowInvocation,
                required: true,
            },

            /**
             * @ignore
             */
            action: {
                type: Function,
                required: false,
                default() {
                    this.item.model.get_error_log().then(log=>{
                        this.item.$bvModal.msgBoxOk(this.item.$createElement('pre', {class: "error-log"}, [log]), {
                            title: 'Error',
                            size: 'xl',
                            buttonSize: 'sm',
                            okVariant: 'danger',
                            headerClass: 'p-2 border-bottom-0',
                            footerClass: 'p-2 border-top-0',
                            centered: true
                        })
                    });
                }
            },
        },
    }
</script>

<style scoped>

</style>