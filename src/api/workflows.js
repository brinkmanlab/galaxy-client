/**
 * Code responsible for interacting with /api/workflows
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.workflows
 */
import * as Common from "./_common";
import { HistoryDatasetAssociation, HistoryDatasetCollectionAssociation } from "./history_contents";
import { History } from "./histories";
import { Job } from "./jobs";

//const INPUT_STEP_TYPES = ['data_input', 'data_collection_input', 'parameter_input'];

/**
 * Model of a workflow invocation step
 */
class WorkflowInvocationStep extends Common.Model {
    static entity = 'WorkflowInvocationStep';
    static primaryKey = 'id';
    static end_states = ['scheduled','error','failed'];

    constructor(...args) {
        super(...args);
        Object.assign(this, Common.HasState);
    }

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null).nullable(),
            workflow_step_uuid: this.string(null).nullable(),
            update_time: this.string(null).nullable(),
            jobs: this.hasMany(Job, 'workflow_invocation_step_id'),
            job_id: this.string(null).nullable(),
            outputs: this.attr(), //this.hasMany(HistoryDatasetAssociation, 'id'), //TODO
            order_index: this.number(0),
            output_collections: this.attr(), //this.hasMany(HistoryDatasetCollectionAssociation, 'id'), //TODO
            workflow_step_label: this.string(''),
            state: this.string(null).nullable(),
            action: this.string(null).nullable(),
            model_class: this.string("WorkflowInvocationStep"),
            workflow_step_id: this.string(null).nullable(),
            workflow_invocation_id: this.string(null),

            //ORM only
            //workflow_step: this.belongsTo(StoredWorkflowStep, 'workflow_step_id') //TODO create model
            invocation: this.belongsTo(WorkflowInvocation, 'workflow_invocation_id') //TODO no backreference
        }
    }

    /**
     * Count the number of states in jobs
     * @returns {Object<Number>} Mapping of {state name: count, ...}
     */
    states() {
        let tmp = {};
        if (!this.jobs.length) {
            tmp[this.state] = 1;
            return tmp;
        }
        return this.jobs.reduce((acc, cur) => {
            //Count the number of jobs for each state
            acc[cur.state] = (acc[cur.state] || 0) + 1;
            return acc
        }, tmp);
    }

    /**
     * Helper to aggregate the overall state of a invocation.
     * @returns {string} Name of current aggregate state
     */
    aggregate_state() {
        if (this.state === "cancelled") return this.state;
        let states = this.states();
        if (Object.entries(states).length === 0) return "new";
        if (states.new) return "running";
        if (states.error) return "error";
        return "done";
    }

    /**
     * Helper to aggregate all step job errors.
     * @returns {Promise<string>} Concatenation of the error output of all jobs with error state
     */
    async get_error_log() {
        let log = '';
        //if (this.state !== 'error') return log;
        for (const job of this.jobs) {
            log += await job.get_error_log(this.workflow_step_label);
        }
        return log;
    }
}

/*class WorkflowInvocationOutput extends Common.Model {
    static entity = "WorkflowInvocationOutput";
    static primaryKey = 'label';

    static fields() {
        return {
            label: this.string(null),
            id: this.string(null),
            src: this.string(null),
        }
    }
}*/

/**
 * Model of a workflow invocation
 */
class WorkflowInvocation extends Common.Model {
    static entity = 'WorkflowInvocation';
    static primaryKey = 'id';
    static end_states = ["cancelled", "error", "done", "failed"];
    static apiPath = 'invocations/';

    constructor(...args) {
        super(...args);
        Object.assign(this, Common.HasState);
    }

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null).nullable(),
            update_time: this.string(null).nullable(),
            uuid: this.string(null).nullable(),
            outputs: this.attr({}),
            output_collections: this.attr({}),
            history_id: this.string(null).nullable(),
            workflow_id: this.string(null).nullable(),
            state: this.string(null).nullable(),
            model_class: this.string("WorkflowInvocation"),
            inputs: this.attr({}),
            steps: this.hasMany(WorkflowInvocationStep, 'workflow_invocation_id'),

            //ORM only
            workflow: this.belongsTo(StoredWorkflow, 'workflow_id'),
            history: this.belongsTo(History, 'history_id'),
            output_models: this.hasManyBy(HistoryDatasetAssociation, 'outputs'),
            output_collection_models: this.hasManyBy(HistoryDatasetCollectionAssociation, 'output_collections'),
        }
    }

    /**
     * Overrides parent to attach workflow id to url
     * @returns {string} api url for this model instance
     */
    build_url() {
        return `${StoredWorkflow.build_url()}${this.workflow_id}/invocations/${this.id}/`
    }

    static build_url() {
        throw("WorkflowInvocation url is relative to workflow, must call on a model instance");
    }

    static async fetch(workflow, options) {
        const response = await this.request('get', {url: `${workflow.build_url()}${this.apiPath}`, ...options});
        if (response.entities) {
            return response.entities[this.entity];
        }
        return this.all();
    }

    /**
     * Count the number of states in steps
     * @returns {Object<Number>} Mapping of state name to count
     */
    states() {
        let tmp = {};
        if (!this.steps) {
            tmp[this.state] = 1;
            return tmp;
        }
        //Count the number of jobs/steps for each state
        return this.steps.reduce((acc, step) => {
            Object.entries(step.states()).forEach(([state, count]) => {
                acc[state] = (acc[state] || 0) + count;
            });
            return acc;
        }, tmp);
    }

    /**
     * Helper to aggregate the overall state of a invocation.
     * @returns {string} Name of current aggregate state
     */
    aggregate_state() {
        if (this.state === "cancelled" || this.state === 'failed') return this.state;
        let states = this.states();
        if (Object.entries(states).length === 0) return "new";
        if (states.new) return "running";
        if (states.error) return "error";
        if (states.paused) return "error";
        return "done";
    }

    /**
     * Helper to aggregate all step job errors.
     * @returns {Promise<string>} Concatenation of the error output of all jobs with error state
     */
    async get_error_log() {
        let log = '';
        //if (this.state !== 'error') return log;
        for (const step of this.steps) {
            log += await step.get_error_log();
        }
        return log;
    }

    async getOutputs() {
        if (!this.history) this.history = History.findOrLoad(this.history_id);
        let result = {};
        for (let key of Object.keys(this.outputs)) {
            let hda = await this.history.getAssociation(this.outputs[key].id);
            if (hda) {
                result[key] = hda;
                hda.poll_state();
            }
        }
        return result;
    }

    //Vuex ORM Axios Config
    static apiConfig = {
        dataTransformer(response) {
            //TODO Bandaid to fix incorrect workflow_id
            let id = response.config.url.match(/\/api\/workflows\/([^/]+)\/invocations/);
            if (id) {
                let data = response.data;
                if (!(data instanceof Array)) data = [data];
                for (let datum of data) {
                    datum.workflow_id = id[1];
                }
            }

            //TODO Bandaid to deal with invocation not storing ids of steps
            if (Array.isArray(response.data)) {
                response.data.forEach(invocation =>{
                    if (invocation.hasOwnProperty('steps')) invocation.steps.forEach(step => {
                        step.workflow_invocation_id = response.data.id;
                        if (step.jobs) {
                            step.jobs.forEach(job => {
                                job.workflow_invocation_step_id = step.id;
                            });
                        }
                    })});
            } else if (response.data.hasOwnProperty('steps')) {
                response.data.steps.forEach(step => {
                    step.workflow_invocation_id = response.data.id;
                    if (step.jobs) {
                        step.jobs.forEach(job => {
                            job.workflow_invocation_step_id = step.id;
                        });
                    }
                });
            }

            //TODO Bandaid to deal with receiving dict for outputs and output_collections
            //response.data.outputs = Object.keys(response.data.outputs).reduce((acc, cur)=>{acc.append({label: cur, ...response.data.outputs[cur]})}, []);
            return response.data;
        },
    };
}

/**
 * Model of a stored workflow
 */
class StoredWorkflow extends Common.Model {
    static entity = 'StoredWorkflow';
    static primaryKey = 'id';
    static apiPath = '/api/workflows/';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null).nullable(),
            name: this.string("Unnamed workflow"),
            tags: this.attr([]),
            deleted: this.boolean(false),
            latest_workflow_uuid: this.string(null).nullable(),
            show_in_tool_panel: this.boolean(false),
            url: this.string(null).nullable(),
            number_of_steps: this.number(0),
            published: this.boolean(false),
            owner: this.string(null).nullable(),
            model_class: this.string("StoredWorkflow"),
            inputs: this.attr({}),
            annotation: this.string(''),
            version: this.number(0),
            steps: this.attr({}),

            //ORM only
            invocations: this.hasMany(WorkflowInvocation, 'workflow_id'),
        }
    }

    //TODO workflow menu logic
    //TODO GET /api/workflows/{encoded_workflow_id}/versions
    //TODO GET /api/workflows/{encoded_workflow_id}/download
    //TODO POST /api/workflows/import

    //TODO POST /api/workflows/{encoded_workflow_id}/invocations. Done in WorkflowInvocation $create?

    /**
     * Invoke the stored workflow
     * @param inputs {Object<Object>} Mapping of workflow inputs keyed on step index
     * @param history {History|undefined} Optional history to store invocation data, if undefined a new history will be created.
     * @param label {string} If history is undefined, the created history will be assigned this label. If no label provided, the workflow name will be used.
     * @returns {Promise<WorkflowInvocation|null>} Resulting workflow invocation model
     */
    async invoke(inputs, history, label) {
        let response = null;

        // Backfill label if not provided
        if (label === undefined) label = this.name;

        // Create a new history if not provided
        if (history === undefined) {
            //Create history to store run
            try {
                history = await History.post({
                    name: label,
                });
            } catch (e) {
                throw "Failed to create job history.";
            }

            // Tag the new history with the workflow id for future lookup
            history.tags.push(this.id);
            history.put(['tags']);
        }

        // Create new collections before invocation
        // TODO test if 'new_collection' as src will autogenerate a collection upon invocation
        for (const [index, input] of Object.entries(inputs)) {
            if (input.src === 'new_collection') {
                //Create collection of inputs in new history
                try {
                    response = await this.request('post', {data: {
                        name: input.name,
                        type: 'dataset_collection',
                        collection_type: this.steps[index].tool_inputs.collection_type,
                        copy_elements: true,
                        element_identifiers: input.element_identifiers,
                    }});
                    inputs[index] = {id: response.id, src: 'hdca'};
                } catch (e) {
                    history.delete();
                    throw "Failed to create job dataset collection.";
                }
            }
        }

        // Invoke workflow
        try {
            return WorkflowInvocation.post({
                // new_history_name: specify a new history and leave history_id: null TODO if new_collection as src above works, swap history_id for this
                history_id: history.id,
                no_add_to_history: true,
                inputs: inputs,
            });
        } catch (e) {
            // Invocation failed, cleanup.
            history.delete();
            throw "Failed to create job.";
        }
    }

    /**
     * Fetch all invocations, optionally filtering on a set of histories
     * @param histories {Array<History>|undefined} Optional Array of histories to limit fetch
     * @returns {Promise<Collection<WorkflowInvocation>>} Array of all invocations
     */
    async fetch_invocations(histories) {
        if (histories) {
            // Fetch each invocation individually by history id
            await Promise.all(histories.map(history=>{
                return WorkflowInvocation.fetch(this, {
                    params: {view: "element", step_details: true, history_id: history.id}
                })
            }));
        } else {
            await WorkflowInvocation.fetch({
                params: {view: "element", step_details: true}
            });
        }

        return this.get_invocations_query();
    }

    /**
     * Query currently loaded invocations
     * @returns
     */
    get_invocations_query() {
        // TODO this.invocations should be reactive and not need this function
        return WorkflowInvocation.query().where('workflow_id', this.id).whereHas('history', q => q.where('deleted', false)).with('history|workflow|steps.jobs');
    }
}

const Module = {
    ...Common.Module,
    state: Common.State({

    }),
    mutations: {
        ...Common.Mutations,
    },
    actions: {
        ...Common.Actions,
    },
    getters: {
        ...Common.Getters,
    },
};

function register(database) {
    database.register(WorkflowInvocationStep, Module);
    database.register(WorkflowInvocation, Module);
    database.register(StoredWorkflow, Module);
}

export {
    Module,
    StoredWorkflow,
    WorkflowInvocation,
    WorkflowInvocationStep,
    register,
};