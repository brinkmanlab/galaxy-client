<template>
    <WorkflowParameterBase class="galaxy-workflow-parameter-simple" v-bind="{...$attrs, ...$props, optional: ['select'].includes(type) || optional, collapse: ['select'].includes(type) || $attrs.collapse}" :validation_message="validation_message">
        <!-- Boolean -->
        <b-form-radio-group v-if="this.type === 'boolean'" buttons
                            v-bind:state="validation_message ? 'invalid' : null"
                            v-model="user_input"
                            @input="onInput"
        >
            <option value="true">Yes</option>
            <option value="false">No</option>
            <b-form-invalid-feedback>{{validation_message}}</b-form-invalid-feedback>
        </b-form-radio-group>
        <b-form-group v-else
                      v-bind:invalid-feedback="validation_message"
                      v-bind:state="validation_message ? 'invalid' : null"
        >
            <!-- Select -->
            <b-form-select v-if="this.type === 'select'" v-model="user_input" :options="select_options" @input="onInput"/>

            <!-- Text, Integer, Float, Color -->
            <b-form-input v-else v-bind:type="form_type" v-bind:number="form_type === 'number'" v-model="user_input" ref="input" @input="onInput"/>
        </b-form-group>
    </WorkflowParameterBase>
</template>

<script>
    import WorkflowParameterBase from "../WorkflowParameterBase";

    export default {
        name: "SimpleParameter",
        components: {WorkflowParameterBase},
        props: {
            label: {
                type: String,
                required: true,
            },
            value: {
                type: String,
                default: '',
            },
            type: {
                type: String,
                required: true,
            },
            annotation: {
                type: String,
                default: '',
            },
            optional: {
                type: Boolean,
                default: false,
            },
            options: {
                validator(prop) {return prop instanceof Array || prop instanceof Object},
                default: [],
            }
        },
        data() {return{
            validation_message: '',
            user_input: this.value,
        }},
        computed: {
            form_type() {
                // Map Galaxy input types to HTML input types
                switch (this.type) {
                    default:
                    case 'boolean':
                    case 'text':
                        return 'text';
                    case 'integer':
                    case 'float':
                        return 'number';
                    case 'color':
                        return 'color';
                }
            },
            select_options() {
                if (Array.isArray(this.options))
                    return this.options;
                else
                    // The way bootstrap maps keys to the value of the select is stupid. You can't have multiple options map to the same value.
                    // Remap object k:v to list of entries
                    return Object.entries(this.options).reduce((acc, [text, value])=>{
                        acc.push({text, value, disabled: false});
                        return acc;
                    }, []);
            },
        },
        methods: {
            onInput(value) {
                this.$emit('input', value);
            },
            setCustomValidity(message){
                /* Sets a custom validity message for the element. If this message is not the empty string,
                then the element is suffering from a custom validity error, and does not validate.
                 */
                this.validation_message = message;
                if (!['boolean', 'select'].includes(this.type)) this.$refs.input.setCustomValidity(message);
            },
            checkValidity() {
                /* Returns a Boolean that is false if the element is a candidate for constraint validation,
                and it does not satisfy its constraints. In this case, it also fires an invalid event at the element.
                It returns true if the element is not a candidate for constraint validation, or if it satisfies
                its constraints.
                 */
                if (['boolean', 'select'].includes(this.type)) return true; // If a boolean value has only one valid state, why does it exist?
                else return this.$refs.input.checkValidity();
            },
            reportValidity() {
                /* Runs the checkValidity() method, and if it returns false (for an invalid input or no pattern
                attribute provided), then it reports to the user that the input is invalid in the same manner
                as if you submitted a form.
                 */
                if (!['boolean', 'select'].includes(this.type)) return this.$refs.input.reportValidity();
                return true;
            },
            reset() {
                this.user_input = this.value;
            },
        },
        mounted() {
            // Emit the default value if optional
            this.$emit('input', this.value);
        }
    }
</script>

<style scoped>
    .form-group {
        margin-bottom: 0;
    }
</style>
