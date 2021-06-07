/**
 * Code responsible for interacting with /api/workflows
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.workflows
 */
import * as Common from "./_common";
import {
    HistoryDatasetCollectionAssociation,
    srcMap
} from "./history_contents";
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
            workflow_invocation_id: this.string(""),
            subworkflow_invocation_id: this.string(null).nullable(),

            //ORM only
            //workflow_step: this.belongsTo(StoredWorkflowStep, 'workflow_step_id') //TODO create model
            invocation: this.belongsTo(WorkflowInvocation, 'workflow_invocation_id'), //TODO no backreference
            subinvocation: this.belongsTo(WorkflowInvocation, 'subworkflow_invocation_id'), //TODO no backreference
        }
    }

    /**
     * Count the number of states in jobs
     * @returns {Object<Number>} Mapping of {state name: count, ...}
     */
    states() {
        // TODO subworkflow state
        if (!this.jobs || !this.jobs.length) this.jobs = Job.query().where('workflow_invocation_step_id', this.id).get();
        if (!this.jobs || !this.jobs.length) {
            return {[this.state]: 1};
        }
        return this.jobs.reduce((acc, cur) => {
            //Count the number of jobs for each state
            acc[cur.state] = (acc[cur.state] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Helper to aggregate the overall state of a invocation step.
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
        if (!this.invocation) this.invocation = WorkflowInvocation.find(this.workflow_invocation_id);
        if (this.subworkflow_invocation_id) {
            const subworkflow = await WorkflowInvocation.findOrLoad(this.subworkflow_invocation_id, {
                url: `/api/invocations/${this.subworkflow_invocation_id}/`,
                params: {view: "element", step_details: true, history_id: this.invocation.history_id}
            });
            log += await subworkflow.get_error_log();
        }
        if (!this.jobs || !this.jobs.length) {
            this.jobs = Job.query().where('workflow_invocation_step_id', this.id).get();
        }
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
            output_models: this.attr({}), //this.hasManyBy(HistoryDatasetAssociation, 'outputs'), // TODO are hda and hdca mixed in outputs?
            //output_collection_models: this.hasManyBy(HistoryDatasetCollectionAssociation, 'output_collections'),
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

    static async post(workflow, data, options) {
        const response = await this.request('post', {url: `${workflow.build_url()}${this.apiPath}`, data, ...options});
        return response.entities[this.entity][0];
    }

    async delete(options = {}) {
        try {
            return await super.delete(options);
        } catch (e) {
            // Ignore deleting completed workflows throwing error
            if (e.response && e.response.status === 400 && e.response.data.err_code === 0) return;
            throw(e);
        }
    }

    //TODO add support for /api/invocation/<id>/step_jobs_summary
    /*
    0
    id	"d158a6cce97e3331"
    populated_state	"ok"
    model	"ImplicitCollectionJobs"
    states
    error	4
    1
    id	"c55cc6ad09407e92"
    populated_state	"ok"
    model	"ImplicitCollectionJobs"
    states
    paused	4
    2
    id	"43cee75e648fc2b4"
    populated_state	"ok"
    model	"ImplicitCollectionJobs"
    states
    paused	4
    3
    id	"41454a2d6e8db7f3"
    populated_state	"ok"
    model	"ImplicitCollectionJobs"
    states
    paused	4
     */

    /**
     * Count the number of states in steps
     * @returns {Object<Number>} Mapping of state name to count
     */
    states() {
        //TODO use /api/invocation/<id>/jobs_summary
        /*
        id	"bdbb49fafe32786f"
        model	"WorkflowInvocation"
        states
        ok	3
        error	5
        paused	20
        populated_state	"ok"
         */

        if (!this.steps || !this.steps.length) {
            this.steps = WorkflowInvocationStep.query().where('workflow_invocation_id', this.id).get();
        }
        if (!this.steps || !this.steps.length) {
            return {[this.state]: 1};
        }
        //Count the number of jobs/steps for each state
        return this.steps.reduce((acc, step) => {
            Object.entries(step.states()).forEach(([state, count]) => {
                acc[state] = (acc[state] || 0) + count;
            });
            return acc;
        }, {});
    }

    /**
     * Helper to aggregate the overall state of a invocation.
     * @returns {string} Name of current aggregate state
     */
    aggregate_state() {
        if (this.state === "cancelled" || this.state === 'failed') return this.state;
        const states = this.states();
        if (Object.entries(states).length === 0) return "new";
        if (states.new) return "running";
        if (states.queued) return "running";
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
        if (!this.steps || !this.steps.length) {
            this.steps = WorkflowInvocationStep.query().where('workflow_invocation_id', this.id).with('jobs|invocation').get();
        }
        for (const step of this.steps) {
            log += await step.get_error_log();
        }
        return log;
    }

    all_outputs() {
        let all_outputs = {};
        if (this.outputs) all_outputs = Object.assign(all_outputs, this.outputs);
        if (this.output_collections) all_outputs = Object.assign(all_outputs, this.output_collections);
        return all_outputs;
    }

    async getOutputs() {
        const history = this.history || await History.findOrLoad(this.history_id);
        let result = {};
        const all_outputs = this.all_outputs();

        for (const key of Object.keys(all_outputs)) {
            const elem = await srcMap[all_outputs[key].src].findOrLoad(all_outputs[key].id, history);
            if (elem) {
                result[key] = elem;
                elem.poll_state();
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
                for (const datum of data) {
                    datum.workflow_id = id[1];
                }
            }

            //TODO Bandaid to deal with invocation not storing ids of steps
            if (Array.isArray(response.data)) {
                response.data.forEach(invocation =>{
                    if (invocation.hasOwnProperty('steps')) invocation.steps.forEach(step => {
                        step.workflow_invocation_id = invocation.id;
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
            invocationsFetched: this.boolean(false),
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

        // Deal with https://github.com/galaxyproject/galaxy/issues/10899
        for (const key in Object.keys(this.inputs)) if (!(key in inputs)) inputs[key] = null;

        // Create a new history if not provided
        if (history === undefined) {
            //Create history to store run
            try {
                history = await History.post({
                    name: label,
                });
            } catch (e) {
                throw "Failed to create job history";
            }

            // Tag the new history with the workflow id for future lookup
            history.tags.push(this.id);
            history.put(['tags']);
        }

        // Create new collections before invocation
        // TODO test if 'new_collection' as src will autogenerate a collection upon invocation
        for (const [index, input] of Object.entries(inputs)) {
            if (input && input.src === 'new_collection') {
                //Create collection of inputs in new history
                try {
                    response = await HistoryDatasetCollectionAssociation.post(history, {data: {
                        name: input.name,
                        type: 'dataset_collection',
                        collection_type: this.steps[index].tool_inputs.collection_type,
                        copy_elements: true,
                        element_identifiers: input.element_identifiers,
                    }});
                    inputs[index] = {id: response.id, src: 'hdca'};
                } catch (e) {
                    history.delete();
                    throw "Failed to create job dataset collection";
                }
            }
        }

        // Invoke workflow
        try {
            response = await WorkflowInvocation.post(this,{
                // new_history_name: specify a new history and leave history_id: null TODO if new_collection as src above works, swap history_id for this
                history_id: history.id,
                no_add_to_history: true,
                inputs: inputs,
            });
            return response;
        } catch (e) {
            // Invocation failed, cleanup.
            history.delete();
            console.log(e);
            throw "Failed to create job";
        }
    }

    /**
     * Fetch all invocations, optionally filtering on a set of histories
     * @param histories {Array<History>|undefined} Optional Array of histories to limit fetch
     * @returns {Promise<Collection<WorkflowInvocation>>} Array of all invocations
     */
    async fetch_invocations(histories) {
        let result;
        if (histories) {
            // Fetch each invocation individually by history id
            result = (await Promise.all(histories.map(history => {
                return WorkflowInvocation.fetch(this, {
                    params: {view: "element", step_details: true, history_id: history.id}
                })
            }))).flat();
        } else {
            result = await WorkflowInvocation.fetch({
                params: {view: "element", step_details: true}
            });
        }
        this.constructor.update({where: this[this.constructor.primaryKey], data: {invocationsFetched: true}});
        return result;
    }

    //Vuex ORM Axios Config
    static apiConfig = {
        dataTransformer(response) {
            // TODO BANDAID to deal with https://github.com/galaxyproject/galaxy/issues/10900
            if (response.data.hasOwnProperty('steps') && response.data.hasOwnProperty('inputs')) {
                Object.keys(response.data.inputs).forEach(i => {
                    const param = response.data.steps[i].tool_inputs;
                    if (typeof param.format === 'string') param.format = param.format.split(',').map(x => x.trim());
                });
            }

            return response.data;
        }
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
