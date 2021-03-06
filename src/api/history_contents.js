/**
 * Code responsible for interacting with /api/history_contents
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.history_contents
 */
import * as Common from "./_common";
import { History } from './histories';

const anchor = document.createElement("a"); // Global anchor used for download() below

class HistoryAssociation extends Common.Model {
    static end_states = ['ok', 'error', 'paused', 'failed'];
    static error_states = ['error', 'failed'];
    static ready_states = ['ok', 'queued'];
    static ghost_hid = 0;

    constructor(...args) {
        super(...args);
        // Add HasState mixin
        for (const key of Object.keys(Common.HasState)) {
            if (!(key in this)) this[key] = Common.HasState[key];
        }
    }

    static fields() {
        return {
            ...super.fields(),
        }
    }

    /**
     * Build base url for model instance specific api endpoint.
     * @returns {string} Base url for model api endpoint
     */
    build_url() {
        return `${History.build_url()}${this.history_id}/${this.constructor.apiPath}${this.id}`;
    }

    static build_url() {
        throw("HistoryDatasetAssociation url is relative to history, must call on a model instance");
    }

    static async fetch(history, options) {
        const response = await this.request('get', {url: `${history.build_url()}${this.apiPath}`, ...options});
        if (response.entities) {
            return response.entities[this.entity];
        }
        return this.all();
    }

    static async post(history, options) {
        const response = await this.request('post', {url: `${history.build_url()}${this.apiPath}`, ...options});
        return response.entities[this.entity][0];
    }

    /**
     * Find model with specified id, or get it from the Galaxy server
     * @param id Model id
     * @param history Associated history instance
     * @param options {Object} Options to pass to api().get()
     * @returns {Promise<Model|null>} model instance if the id is found or null
     */
    static async findOrLoad(id, history, options={}) { //eslint-disable-line
        const result = this.find(id);
        if (result) return result;

        const response = await this.request('get', {url: `${history.build_url()}${this.apiPath}${id}`, ...options});
        if (response.entities) {
            return response.entities[this.entity][0]; // There should only be one
        }
        return this.find(id);
    }

    /**
     * Delete this instance on the Galaxy server
     * @param options {Object} options to pass to $delete()
     * @returns {Promise<null|*>} Null if ghost instance or the result of $delete()
     */
    async delete(options = {}) {
        this.deleted = true; // TODO is this necessary any more?
        if (this.hid === this.constructor.ghost_hid) {
            //If ghost item, delete local only
            options.local_only = true;
        }
        return super.delete(options);
    }

    /**
     * Generate object expected for workflow invocation
     * @returns {{src: string, id: string}}
     */
    toInput() {
        return {id: this.id, src: this.constructor.srcName};
    }

    /**
     * Download data to client
     * @param url_xform optional function to modify URL before making request. Defaults to identity function "x=>x".
     */
    download(url_xform) {
        if (typeof url_xform !== 'function') url_xform = x=>x;
        let url;
        if (this.download_url) {
            // HDA
            url = url_xform(`${this.download_url}?to_ext=${this.extension}&filename_pattern=${this.name}.${this.extension}`);
            anchor.setAttribute("download", `${this.name}.${this.extension}`);
        } else {
            // HDCA
            url = url_xform(`${this.build_url()}/download`);
            anchor.setAttribute("download", "");
        }
        anchor.href = url;
        anchor.style.display = "none";
        //document.body.appendChild(anchor);
        //setTimeout(function() {
            anchor.click();
            //document.body.removeChild(anchor);
        //}, 66);
    }
}

class HistoryDatasetAssociation extends HistoryAssociation {
    static entity = 'HistoryDatasetAssociation';
    static primaryKey = 'id';
    static apiPath = 'contents/datasets/';
    static srcName = 'hda';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null).nullable(),
            accessible: this.boolean(false),
            type_id: this.string(null).nullable(),
            file_name: this.string(null).nullable(),
            resubmitted: this.boolean(false),
            create_time: this.string((new Date).toISOString()),
            creating_job: this.string(null).nullable(),
            dataset_id: this.string(null).nullable(),
            file_size: this.number(0),
            file_ext: this.string(null).nullable(),
            misc_info: this.string(''),
            hda_ldda: this.string('hda'),
            download_url: this.string(null).nullable(),
            state: this.string('pending'),
            display_types: this.attr([]),
            display_apps: this.attr([]),
            metadata_dbkey: this.string('?'),
            type: this.string(null).nullable(),
            misc_blurb: this.string(''),
            peek: this.string(''),
            update_time: this.string((new Date).toISOString()),
            data_type: this.string(null).nullable(),
            tags: this.attr([]),
            deleted: this.boolean(false),
            history_id: this.string(null).nullable(),
            meta_files: this.attr([]),
            genome_build: this.string('?'),
            metadata_sequences: this.number(0),
            hid: this.number(this.ghost_hid),
            model_class: this.string('HistoryDatasetAssociation'),
            metadata_data_lines: this.number(0),
            annotation: this.string(null).nullable(),
            permissions: this.attr({
                access: [],
                manage: [],
            }),
            history_content_type: this.string('dataset'),
            name: this.string('New dataset'),
            extension: this.string(''),
            visible: this.boolean(true),
            url: this.string(null).nullable(),
            uuid: this.string(null).nullable(),
            visualizations: this.attr([]),
            rerunnable: this.boolean(false),
            purged: this.boolean(false),
            api_type: this.string(null).nullable(),

            //ORM only
            history: this.belongsTo(History, 'history_id'),
            //TODO dataset: this.hasOne(Dataset, 'dataset_id'),
            file: this.attr(null),
            upload_progress: this.number(100),
        };
    }

    // TODO GET /api/histories/{encoded_history_id}/contents/{encoded_content_id}/extra_files
    // TODO GET /api/histories/{encoded_history_id}/contents/{encoded_content_id}/display
    // TODO GET /api/histories/{history_id}/contents/{history_content_id}/metadata_file

    /**
      * Helper to check the 'readyness' of the dataset for use in a workflow or tool invocation
      * @returns {boolean} True if ready, False otherwise.
     */
    ready() {
        return this.constructor.ready_states.includes(this.state);
    }

    static waiting_uploads = []; // TODO switch to a promise pool library?

    /**
     * Upload file to server
     * @param file {File} handle to file for upload
     * @param history_id {string} ID of history to upload to
     * @param file_type {string} Optional type of file, skips server side type sniff step
     * @returns {Promise<HistoryDatasetAssociation>} Model representing uploaded dataset
     */
    static async upload(file, history_id, file_type = 'auto') {
        //TODO move to Dataset, this was placed here because the api returns an hda object (a dataset must have an hda to exist)
        // Create placeholder hda while uploading
        const tmp_id = file.name+Math.floor(Math.random()*10**16).toString();
        let ext = file.name.match(/[^.]+$/);
        ext = ext ? ext[0] : '';
        await HistoryDatasetAssociation.insert({
            data: {
                id: tmp_id,
                file: file,
                name: file.name,
                hid: this.ghost_hid,
                history_id: history_id,
                upload_progress: 0,
                state: "uploading",
                extension: ext,
            }
        });

        // Prepare upload request
        const formData = new FormData();
        const inputs = {
            'file_count': 1,
            'files_0|NAME'  : file.name,
            'files_0|type'  : 'upload_dataset',
            //'files_0|space_to_tab':null,
            //'files_0|to_posix_lines':"Yes",
            'files_0|file_type':file_type,
            'files_0|dbkey':'?',
            'dbkey'         : '?',
            'file_type'     : file_type,
            'ajax_upload'   : 'true',
        };
        formData.append('history_id', history_id);
        formData.append('inputs', JSON.stringify(inputs));
        formData.append('tool_id', 'upload1');
        formData.append('files_0|file_data', file);
        //formData.append('key', apiKey);

        // TODO Resumable uploads
        // Change inputs to: 'files_0|file_data': {session_id='generated string', name=''}
        // Post to /api/uploads with multipart/form-data:
        //"session_id": ...
        //"session_start": 0 (chunk start byte)
        //"session_chunk": Blob()

        // Throttle uploads
        // TODO This totally undermines the asyncronous nature of this function and needs to be reapproached
        // This effectively just 'yields' the function
        let resolve;
        const throttle = new Promise(r=>resolve = r);
        this.waiting_uploads.push(throttle);
        while (this.waiting_uploads[0] !== throttle) await this.waiting_uploads[0];

        // Initiate upload
        try {
            const response = await this.request('post', {
                url: '/api/tools',
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: progressEvent => {
                    // Update placeholder hda with progress
                    let upload_progress = (progressEvent.loaded * 100 / progressEvent.total) - 1; //-1 To keep progress indicator active until temporary hda deleted
                    HistoryDatasetAssociation.update({
                        where: tmp_id,
                        data: {upload_progress: upload_progress}
                    });
                },
                validateStatus: status => { return status === 200 }, //TODO is code 200 the only valid response? 201? 202?
                dataTransformer(response) {
                    return response.data.outputs[0];
                },
            });

            // Update or replace placeholder hda
            HistoryDatasetAssociation.delete(tmp_id);
            return response.entities[this.entity][0];
        } catch (e) {
            HistoryDatasetAssociation.update({
                where: tmp_id,
                data: { name: 'Failed to upload ' + file.name, state: "failed" }
            });
            throw e;
        } finally {
            // Allow next waiting upload
            this.waiting_uploads.shift();
            resolve();
        }
    }
}

class HistoryDatasetCollectionAssociation extends HistoryAssociation {
    static entity = 'HistoryDatasetCollectionAssociation';
    static primaryKey = 'id';
    static apiPath = 'contents/dataset_collections/';
    static srcName = 'hdca';

    static fields() {
        return {
            ...super.fields(),
            //Request data
            id: this.string(null).nullable(),
            history_content_type: this.string('dataset_collection'),
            populated_state_message: this.string(null).nullable(),
            name: this.string('New collection'),
            populated: this.boolean(false),
            deleted: this.boolean(false),
            type: this.string('collection'),
            history_id: this.string(null).nullable(),
            tags: this.attr([]),
            visible: this.boolean(true),
            job_source_id: this.string(null).nullable(), //TODO add relation
            job_source_type: this.string(null).nullable(),
            collection_type: this.string('list'),
            url: this.string(null).nullable(),
            model_class: this.string('HistoryDatasetCollectionAssociation'),
            hid: this.number(0),
            element_count: this.number(0),
            populated_state: this.string('ok'),
            elements: this.attr([]), //TODO add relation

            //ORM only
            history: this.belongsTo(History, 'history_id'),
        }
    }

    /**
     * Poll model state until it is an end_state
     * @param callback Called when state changes to end_state, return true to stop polling, false to continue
     * @param extra Additional parameters passed to Model.start_polling()
     */
    poll_state(callback = ()=>true, ...extra) {
        this.poll_state_callback(x=>x.populated_state, callback, ...extra);
    }
}

const srcMap = [
    HistoryDatasetAssociation,
    HistoryDatasetCollectionAssociation,
].reduce((acc, cur)=>{
    acc[cur.srcName] = cur;
    return acc;
}, {});

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
    database.register(HistoryDatasetAssociation, Module);
    database.register(HistoryDatasetCollectionAssociation, Module);
}

export {
    HistoryDatasetAssociation,
    HistoryDatasetCollectionAssociation,
    Module,
    register,
    srcMap,
};
