/**
 * Code responsible for interacting with /api/folders
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.folders
 * TODO not implemented
 */
throw Error('Not Implemented');
import * as Common from "./_common";


class Folder extends Common.Model {
    static entity = 'Folder';
    static primaryKey = 'id';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            //TODO fill in fields
        }
    }

    // TODO GET /api/folders/
    // TODO GET /api/folders/{encoded_folder_id}
    // TODO POST /api/folders/{encoded_parent_folder_id}
    // TODO GET /api/folders/{id}/permissions
    // TODO POST /api/folders/{encoded_folder_id}/permissions
    // TODO DELETE /api/folders/{encoded_folder_id}
    // TODO PATCH /api/folders/{encoded_folder_id}

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
    database.register(Model, Module);
}

export {
    Model,
    Module,
    register,
};