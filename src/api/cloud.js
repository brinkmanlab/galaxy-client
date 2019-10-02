/**
 * Code responsible for interacting with /api/cloud
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.cloud
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.cloudauthz
 * TODO not implemented
 */
throw Error('Not Implemented');
import * as Common from "./_common";

class Storage extends Common.Model {
    static entity = 'Storage';
    static primaryKey = 'id';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            //TODO fill in fields
        }
    }

    // TODO GET /api/cloud/storage
    // TODO POST /api/cloud/storage/get
    // TODO POST /api/cloud/storage/send
    // TODO GET /api/cloud/authz
    // TODO POST /api/cloud/authz
    // TODO DELETE /api/cloud/authz/{encoded_authz_id}
    // TODO PUT /api/cloud/authz/{encoded_authz_id}


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
    database.register(Storage, Module);
}

export {
    Storage,
    Module,
    register,
};