/**
 * Code responsible for interacting with /api/datasets
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.datasets
 * See history_contents.js for:
 * GET /api/histories/{encoded_history_id}/contents/{encoded_content_id}/extra_files
 * GET /api/histories/{encoded_history_id}/contents/{encoded_content_id}/display
 * GET /api/histories/{history_id}/contents/{history_content_id}/metadata_file
 * TODO not implemented
 */
throw Error('Not Implemented');
import * as Common from "./_common";


class Dataset extends Common.Model {
    static entity = 'Dataset';
    static primaryKey = 'id';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            accessible: this.boolean(false),
            type_id: this.string(null).nullable(),
            resubmitted: this.boolean(false),
            create_time: this.string((new Date).toISOString()),
            creating_job: this.string(null).nullable(),
            file_size: this.number(0),
            file_ext: this.string("txt"),
            misc_info: this.string(null).nullable(),
            download_url: this.string(null).nullable(),
            state: this.string("ok"),
            display_types: this.attr([]),
            display_apps: this.attr([]),
            metadata_dbkey: this.string("?"),
            type: this.string("file"),
            misc_blurb: this.string(null).nullable(),
            peek: this.string(""),
            update_time: this.string((new Date).toISOString()),
            data_type: this.string("galaxy.datatypes.data.Text"),
            deleted: this.boolean(false),
            genome_build: this.string("?"),
            model_class: this.string("Dataset"),
            metadata_data_lines: this.number(0),
            annotation: this.string(null).nullable(),
            permissions: this.attr({
                access: [],
                manage: [],
            }),
            name: this.string("New Dataset"),
            extension: this.string("txt"),
            url: this.string(null).nullable(),
            uuid: this.string(null).nullable(),
            visualizations: this.attr([]),
            rerunnable: this.boolean(true),
            purged: this.boolean(false),
            api_type: this.string("file"),
        }
    }

    // TODO PUT /api/datasets/{encoded_dataset_id}/permissions
    // TODO GET /api/datasets/{dataset_id}/converted/{ext}
    // TODO GET /api/datasets/{dataset_id}/metrics
    // TODO GET /api/datasets/{dataset_id}/parameters_display


    //Vuex ORM Axios Config
    static methodConf = {
        http: {
            url: '' //TODO
        },
        methods: {
            $fetch: {
                name: 'fetch',
                http: {
                    url: '', //TODO
                    method: 'get',
                },
            },
            $get: {
                name: 'get',
                http: {
                    url: '/:id', //TODO
                    method: 'get',
                },
            },
            $create: {
                name: 'create',
                http: {
                    url: '', //TODO
                    method: 'post',
                },
            },
            $update: {
                name: 'update',
                http: {
                    url: '/:id', //TODO
                    method: 'put',
                },
            },
            $delete: {
                name: 'delete',
                http: {
                    url: '/:id', //TODO
                    method: 'delete',
                },
            },
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
    database.register(Dataset, Module);
}

export {
    Dataset,
    Module,
    register,
};