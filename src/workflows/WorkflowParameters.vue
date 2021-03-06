<template>
    <b-container class="galaxy-workflow-parameters">
        <b-row no-gutters>
            <slot name="before" v-bind="this"></slot>
        </b-row>

        <!-- Workflow inputs -->
        <b-row v-for="(input, index) of workflow_inputs"
               v-bind:key="index"
               no-gutters
        >
            <WorkflowParameter v-bind="input"
                               v-bind:history="history"
                               @input="onInput"
                               no-body
                               ref="params"
                               v-bind:class="input.label.replace(' ', '-')"
            />
        </b-row>

        <!-- Workflow Steps -->
        <b-row no-gutters class="galaxy-workflow-parameters-steps" v-if="workflow">
            <b-card no-body>
                <b-card-header header-tag="header" role="tab">
                    <b-button block href="#" v-b-toggle="`${_uid}-step-parameters`" variant="info">Step Parameters</b-button>
                </b-card-header>
                <b-collapse v-bind:id="`${_uid}-step-parameters`">
                    <!-- Step parameters -->
                    <b-card v-for="(step, index) of workflow.steps" v-bind:key="index">
                        <!-- TODO need to load tool info to get name and load stored workflow -->
                        <b-card-header header-tag="header">{{step.tool_id}}</b-card-header>
                        <!-- TODO move this out to a tool view -->
                        <!--WorkflowParameter v-for="[label, input] of step.tool_inputs" v-bind:key="label" /-->
                    </b-card>
                </b-collapse>
            </b-card>
        </b-row>

        <!-- Loading Spinner -->
        <div v-if="workflow_inputs.length === 0" class="text-center loading-spinner">
            <b-spinner class="align-middle"></b-spinner>
            <strong>Loading...</strong>
        </div>

        <b-row>
            <slot name="after" v-bind="this"></slot>
        </b-row>
    </b-container>
</template>

<script>
    import {History} from "../api/histories";
    import {StoredWorkflow} from "../api/workflows";

    export default {
        name: "WorkflowParameters",
        components: {WorkflowParameter: ()=>import("./WorkflowParameter")},
        props: {
            workflow: {
                validator(prop) {return prop instanceof StoredWorkflow || prop === null},
                required: true,
            },
            history: {
                validator(prop) {return prop instanceof History || prop === null},
                required: true,
            },
        },
        data() {return {
            inputs: {},
        }},
        computed: {
            workflow_inputs() {
                let inputs = [];
                if (!this.workflow) return inputs;
                for (const [index, input] of Object.entries(this.workflow.inputs)) {
                    const param = {index: index, uuid: input.uuid, label: input.label, type: this.workflow.steps[index].type, annotation: this.workflow.steps[index].annotation, order: 0};
                    Object.assign(param, this.workflow.steps[index].tool_inputs);
                    if (this.workflow.steps[index].annotation) {
                        // TODO Temporary until https://github.com/galaxyproject/galaxy/issues/10895
                        try {
                            // Unescape entities
                            const txt = document.createElement("textarea");
                            txt.innerHTML = param.annotation;
                            const annotation = txt.value;
                            const overrides = JSON.parse(annotation);
                            // annotation included json, but not necessarily an annotation value. Do not show json.
                            param.annotation = '';
                            Object.assign(param, overrides);
                        } catch (e) {
                            if (!(e instanceof SyntaxError)) throw e;
                        }
                    }

                    if (param.default) param.value = param.default; // Handle default value of simple inputs
                    inputs.push(param);
                }
                inputs = inputs.sort((a,b)=>(a.order || 0) - (b.order || 0)).map(input=>{
                    if (input.validator) input.validator = new Function('selection', 'return ' + input.validator); // TODO collection inputs really need a validator criteria
                    return input;
                });
                return inputs;
            },
        },
        methods: {
            annotation(index) {
                if (this.workflow && this.workflow.steps)
                    return this.workflow.steps[index].annotation || '';
                return '';
            },
            onInput(value) {
                if (!this.workflow) throw("Workflow not ready");
                for (const [index, input] of Object.entries(value)) {
                    if (input === null) {
                        delete this.inputs[index];
                    } else {
                        this.inputs[index] = input;
                    }
                }

                //Object.assign(this.inputs, value);
                this.$emit('input', this.inputs);
            },
            checkValidity() {
                /* Returns a Boolean that is false if the element is a candidate for constraint validation,
                and it does not satisfy its constraints. In this case, it also fires an invalid event at the element.
                It returns true if the element is not a candidate for constraint validation, or if it satisfies
                its constraints.
                 */
                return this.$refs.params.every(param=>param.checkValidity());
            },
            reportValidity() {
                /* Runs the checkValidity() method, and if it returns false (for an invalid input or no pattern
                attribute provided), then it reports to the user that the input is invalid in the same manner
                as if you submitted a form.
                 */
                return this.$refs.params.every(param=>param.reportValidity());
            },
            reset() {
                /* Reset all parameters to their default state */
                this.$refs.params.forEach(param=>param.reset());
            }
        },
    }
</script>

<style scoped>
    .row:empty {
        display: none; /* Hide empty slots */
    }

    >>> .galaxy-history-contents-list {
        min-height: 10rem;
    }

    .loading-spinner {
        margin: 1em;
    }

    .loading-spinner strong {
        padding-left: 1em;
    }
</style>
