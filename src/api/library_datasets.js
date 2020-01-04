/**
 * Code responsible for interacting with /api/libraries/datasets
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.library_datasets
 * TODO not implemented
 */
throw Error('Not Implemented');
/* eslint-disable no-unreachable */
import * as Common from "./_common";


class LibraryDataset extends Common.Model { // TODO LibraryDatasetAssociation?
    static entity = 'LibraryDataset';
    static primaryKey = 'id';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            //TODO fill in fields
        }
    }

    // TODO GET /api/libraries/datasets/{encoded_dataset_id}/versions/{encoded_ldda_id}
    // TODO GET /api/libraries/datasets/{encoded_dataset_id}/permissions
    // TODO PATCH /api/libraries/datasets/{encoded_dataset_id}
    // TODO POST /api/libraries/datasets/{encoded_dataset_id}/permissions
    // TODO POST POST /api/libraries/datasets
    // TODO GET /api/libraries/datasets/download/{format}
    // TODO POST /api/libraries/datasets/download/{format}

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
    database.register(LibraryDataset, Module);
}

export {
    LibraryDataset,
    Module,
    register,
};