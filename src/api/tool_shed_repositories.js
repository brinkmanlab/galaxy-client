/**
 * Code responsible for interacting with /api/tool_shed_repositories
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.tool_shed_repositories
 * TODO not implemented
 */
throw Error('Not Implemented');
import * as Common from "./_common";


class Model extends Common.Model {
    static entity = 'tool_shed_repositories';
    static primaryKey = 'id';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            //TODO fill in fields
        }
    }

    // TODO GET /api/tool_shed_repositories/check_for_updates
    // TODO GET /api/tool_shed_repositories/{encoded_tool_shed_repository_id}/exported_workflows
    // TODO POST /api/tool_shed_repositories/get_latest_installable_revision
    // TODO GET /api/tool_shed_repositories/shed_category
    // TODO GET /api/tool_shed_repositories/shed_repository
    // TODO GET /api/tool_shed_repositories/shed_search
    // TODO POST /api/tool_shed_repositories/import_workflow
    // TODO POST /api/tool_shed_repositories/install
    // TODO POST /api/tool_shed_repositories/install_repository_revision
    // TODO POST /api/tool_shed_repositories/install_repository_revisions
    // TODO POST /api/tool_shed_repositories/repair_repository_revision
    // TODO PUT /api/tool_shed_repositories/reset_metadata_on_installed_repositories
    // TODO GET /api/tool_shed_repositories/{id}/status

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