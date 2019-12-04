<template>
    <WorkflowParameterBase class="galaxy-workflow-parameter-dbkey" v-bind="{...$attrs, ...$props}" :validation_message="validation_message">
        <ReferenceGenomes v-bind:value="value" @input="onInput" ref="table" />
    </WorkflowParameterBase>
</template>

<script>
    import ReferenceGenomes from "../../genomes/ReferenceGenomes";
    import WorkflowParameterBase from "../WorkflowParameterBase";
    export default {
        name: "DBKeyParameter",
        components: {WorkflowParameterBase, ReferenceGenomes},
        props: {
            label: {
                type: String,
                required: true,
            },
            value: {
                type: String,
                default: '',
            },
            annotation: {
                type: String,
                default: '',
            },
            optional: {
                type: Boolean,
                default: false,
            }
        },
        data() {return {
            validation_message: '',
            selection: this.value,
        }},
        methods: {
            onInput(value) {
                if (!value) {
                    this.selection = '';
                    this.$emit('input', '');
                    return;
                }
                this.selection = value.id;
                this.$emit('input', value.id);
            },
            setCustomValidity(message){
                /* Sets a custom validity message for the element. If this message is not the empty string,
                then the element is suffering from a custom validity error, and does not validate.
                 */
                this.validation_message = message;
            },
            checkValidity() {
                /* Returns a Boolean that is false if the element is a candidate for constraint validation,
                and it does not satisfy its constraints. In this case, it also fires an invalid event at the element.
                It returns true if the element is not a candidate for constraint validation, or if it satisfies
                its constraints.
                 */
                return this.optional || this.selection !== '';
            },
            reportValidity() {
                /* Runs the checkValidity() method, and if it returns false (for an invalid input or no pattern
                attribute provided), then it reports to the user that the input is invalid in the same manner
                as if you submitted a form.
                 */
                if (this.checkValidity()) return true;
                else {
                    this.validation_message = "Please select a reference dataset";
                    return false;
                }
            },
            reset() {
                this.$refs.table.clearSelected();
            },
        },
        mounted() {
            // Emit value if optional
            if (this.optional) this.$emit('input', this.selection);
        }
    }
</script>

<style scoped>

</style>