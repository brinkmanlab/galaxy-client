/**
 * Code responsible for interacting with /api/jobs
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.jobs
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.job_files
 */
import * as Common from "./_common";
import {History} from "./histories";
import {HistoryDatasetAssociation} from "./history_contents";

/**
 * Model representing a invocation of a tool
 */
class Job extends Common.Model {
    static entity = 'Jobs';
    static primaryKey = 'id';
    static end_states = ['ok', 'error', 'deleted', 'deleted_new'];
    static apiPath = '/api/jobs/';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            tool_id: this.string().nullable(),
            update_time: this.string().nullable(),
            history_id: this.string().nullable(),
            exit_code: this.number().nullable(),
            state:	this.string().nullable(), // ‘new’, ‘upload’, ‘waiting’, ‘queued’, ‘running’, ‘ok’, ‘error’, ‘paused’, ‘deleted’, ‘deleted_new’
            create_time: this.string().nullable(),
            model_class: this.string("Job"),
            inputs: this.attr(),
            outputs: this.attr(),
            params: this.attr(),

            //ORM Only
            history: this.belongsTo(History, 'history_id'),
            workflow_invocation_step_id: this.string().nullable(),
        }
    }

    // TODO GET /api/jobs/{job_id}/files
    // TODO POST /api/jobs/{job_id}/files
    // TODO GET /api/jobs/{id}/common_problems
    // TODO GET /api/jobs/{id}/inputs
    // TODO GET /api/jobs/{id}/outputs
    // TODO DELETE /api/jobs/{id}
    // TODO PUT /api/jobs/{id}/resume
    // TODO GET /api/jobs/{job_id}/metrics
    // TODO GET /api/jobs/{job_id}/parameters_display
    // TODO POST /api/jobs/search
    // TODO POST /api/jobs/{id}/error

    /**
     * Helper to aggregate all step job errors.
     * @param label {string} Label for job in output
     * @returns {Promise<string>} Concatenation of the error output of all jobs with error state
     */
    async get_error_log(label) {
        let self = this;
        if (self.state !== 'error') return '';

        // Fetch complete job state
        if (!self.inputs || !self.outputs) {
            await self.reload();
            self = self.constructor.find(self.id);
        }

        // Fetch assocated history
        if (!self.history) {
            self.history = await History.findOrLoad(self.history_id);
        }

        let log = '';
        label = label || self.tool_id;

        // Resolve input identifiers
        let input_identifier = Object.keys(self.inputs)
                .filter(key => self.params.hasOwnProperty(`${key}|__identifier__`))
                .map(key => self.params[`${key}|__identifier__`]);
        if (input_identifier.length === 1) input_identifier = input_identifier[0];
        else if (input_identifier.length > 1) input_identifier = `[${input_identifier.join(', ')}]`;
        else input_identifier = '';

        // Iterate job outputs and concatenate logs
        for (const [key, val] of Object.entries(self.outputs)) {
            switch (val.src) {
                case 'hda': {
                    const hda = await HistoryDatasetAssociation.findOrLoad(val.id, self.history);
                    if (hda.state === 'error') {
                        log += `${label} on ${input_identifier} - ${key}: ${hda.misc_info}\n`;
                        // TODO move to Dataset model
                        const response = await this.request('get', {url: '/datasets/' + hda.id + '/stderr', responseType: 'text', save: false});
                        if (response.data) log += response.data + '\n';
                    }
                    break;
                }
                case 'hdca': {
                    // TODO
                    break;
                }
                default:
                    break;
            }
        }
        return log;
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
    database.register(Job, Module);
}

export {
    Job,
    Module,
    register,
};
