/**
 * Code responsible for interacting with /api/dataset_collections
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.dataset_collections
 * TODO not implemented
 */
import * as Common from "./_common";


class DatasetCollection extends Common.Model {
    static entity = 'DatasetCollection';
    static primaryKey = 'id';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            //TODO fill in fields
        }
    }

    // TODO POST /api/dataset_collections

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
    database.register(DatasetCollection, Module);
}

export {
    DatasetCollection,
    Module,
    register,
};