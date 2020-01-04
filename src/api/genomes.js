/**
 * Code responsible for interacting with /api/genomes
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.genomes
 */
import * as Common from "./_common";


class Genome extends Common.Model {
    static entity = 'Genome';
    static primaryKey = 'id';

    static fields() {
        return {
            ...super.fields(),
            id: this.string(null),
            name: this.string(null).nullable(),
        }
    }

    // TODO GET /api/genomes/{id}/indexes?type={table name}
    // TODO GET /api/genomes/{id}/sequences

    //Vuex ORM Axios Config
    static apiConfig = {
        url: '/api/genomes',
        dataTransformer(response) {
            //TODO Bandaid to deal with lazy api output
            if (response.config.url.match('/api/genomes$')) {
                let data = [];
                for (let i = 0; i < response.data.length; ++i) {
                    if (response.data[i][0] === '----- Additional Species Are Below -----') continue; // Handle https://github.com/galaxyproject/galaxy/issues/8612
                    data[i] = {name: response.data[i][0], id: response.data[i][1]};
                }
                return data;
            }
            return response.data;
        },
    };

    static methodConf = {
        http: {

        },
        methods: {
            $fetch: {
                name: 'fetch',
                http: {
                    url: '',
                    method: 'get',
                },
            },
            $get: {
                name: 'get',
                http: {
                    url: '/:id',
                    method: 'get',
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
    database.register(Genome, Module);
}

export {
    Genome,
    Module,
    register,
};