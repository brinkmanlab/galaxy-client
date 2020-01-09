import api, {config, database} from "./api"
import VuexORM from "@vuex-orm/core"

import * as genomes from './genomes'
import * as histories from './histories'
import * as misc from './misc'
import * as workflows from './workflows'

export {
    api,
    config,
    genomes,
    histories,
    misc,
    workflows,
}

export default {
    install(Vue, options) {
        if (!options || !options.store) {
            throw new Error('Please initialise plugin with a Vuex store.')
        }
        if (options.baseURL) {
            config.baseURL = options.baseURL;
        }
        VuexORM.install(database, {namespace: 'galaxy'})(options.store)
        // https://vuejs.org/v2/guide/components-registration.html
        //Vue.component("", );
    }
};
