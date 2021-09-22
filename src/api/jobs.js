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
            galaxy_version: this.string(),
            command_version: this.string(),
            model_class: this.string("Job"),
            inputs: this.attr(),
            outputs: this.attr(),
            params: this.attr(),
            tool_stdout: this.string(),
            tool_stderr: this.string(),
            job_stdout: this.string(),
            job_stderr: this.string(),
            stderr: this.string(),
            stdout: this.string(),
            job_messages: this.attr(),

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
        if (this.state !== 'error') return '';

        // Fetch complete job state
        if (!self.stderr) {
            await self.reload({params:{full: true}});
            self = self.constructor.find(self.id);
        }

        label = label || self.tool_id;

        return `${label}: ${self.stderr}\n`
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
