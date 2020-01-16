<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
    <div class="galaxy-workflow-invocation">
        <History
                v-if="model.history"
                v-bind:model="model.history"
                @galaxy-history-deleted="history_deleted"
        >
            <template v-slot="history">
                <slot :history="history" :invocation="this" />
                <span class="galaxy-workflow-invocation-state" v-bind:class="state">{{ state_label(state) }}</span>
                <span class="galaxy-workflow-invocation-progress" v-bind:class="state">
                    <b-progress class="w-100" v-bind:max="step_count()">
                        <b-progress-bar variant="success" v-bind:animated="false" v-bind:value="(states['scheduled'] || 0) + (states['ok'] || 0)" :title="progress_label('ok')">{{progress_label('ok')}}</b-progress-bar>
                        <b-progress-bar variant="success" v-bind:animated="true" v-bind:value="states['running']" :title="progress_label('running')">{{progress_label('running')}}</b-progress-bar>
                        <b-progress-bar variant="danger" v-bind:animated="true" v-bind:value="states['error']" :title="progress_label('error')">{{progress_label('error')}}</b-progress-bar>
                        <b-progress-bar variant="info" v-bind:animated="false" v-bind:value="(states['new'] || 0) + (states['queued'] || 0)" :title="progress_label('new')">{{progress_label('new')}}</b-progress-bar>
                    </b-progress>
                </span>
                <slot name="end" :history="history" :invocation="this" />
            </template>
            <template v-slot:functions>
                <slot name="functions" v-bind="self" />
                <ErrorInfo v-if="states.error" v-bind:item="self" v-on="$listeners"/>
            </template>
        </History>
    </div>
</template>

<script>
    import History from "../histories/History";
    import ErrorInfo from "../workflows/WorkflowInvocationFunctions/ErrorInfo";
    import {WorkflowInvocation} from "../api/workflows";
    import {srcMap} from "../api/history_contents";

    export default {
        name: "WorkflowInvocation",
        components: {
            History,
            ErrorInfo,
        },
        props: {
            model: {
                type: WorkflowInvocation,
                required: true,
                //TODO validator to check that history and steps loaded
            },
        },
        data() {return {
            self: this,
        }},
        methods: {
            step_count() {
                return Object.values(this.states).reduce((a,b)=>a+b, 0);
            },
            state_label(state) {
                if (state === 'new') return 'queued';
                return state;
            },
            progress_label(state) {
                if (Object.values(this.states).length === 0) return '';
                if (state === 'ok') {
                    if (this.done) return 'done';
                    if (state in this.states)
                        return this.states[state] + ' done';
                    else if ('scheduled' in this.states) return this.states['scheduled'] + ' done';
                }
                if (this.done) return '';
                if (state === 'running') return this.states[state] + ' running';
                if (state === 'new' && state in this.states) return this.states[state] + ' pending';
                if (state === 'new' && 'queued' in this.states) return this.states['queued'] + ' pending';
                if (state === 'error') return this.states[state] + ' failed';
            },
            history_deleted() {
                this.model.delete();
            }
        },
        computed: {
            states() {
                return this.model.states();
            },
            state() {
                return this.model.aggregate_state();
            },
            done() {
                const models = Object.values(this.outputs);
                return models.length > 0 && models.every(o => o.state === 'ok');
            },
            outputs() {
                return Object.entries(this.model.outputs).reduce((acc, [key, output])=>{
                    const found = srcMap[output.src].find(output.id);
                    if (found) acc[key] = found;
                    return acc;
                }, {});
            }
        },
        created() {
            // Get outputs of workflow already complete
            this.model.getOutputs();
            // Poll the aggregate state of the model
            this.model.poll_state_callback(model=>model.aggregate_state(), ()=>{
                this.$emit('workflow-completed', this);
                if (this.states.pending) console.log(this.model);

                // Poll outputs upon completion
                this.model.getOutputs();
                return true;
            }, {params: {view: "element", step_details: true}});
        },
        beforeDestroy() {
            if (this.model)
                this.model.stop_polling();
        }
    }
</script>

<style scoped>
    .galaxy-workflow-invocation-progress {
        flex-wrap: nowrap;
    }
</style>
