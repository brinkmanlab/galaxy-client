/**
 * Code responsible for interacting with /api/forms
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.forms
 * TODO not implemented
 */
throw Error('Not Implemented');
/* eslint-disable no-unreachable */
import * as Common from "./_common";


class Form extends Common.Model {
    static entity = 'Form';
    static primaryKey = 'id';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            //TODO fill in fields
        }
    }

    // TODO GET /api/forms
    // TODO GET /api/forms/{encoded_form_id}
    // TODO POST /api/forms

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
    database.register(Form, Module);
}

export {
    Form,
    Module,
    register,
};