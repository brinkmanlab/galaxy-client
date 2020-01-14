import axios from 'axios';
import VuexORM, { Database } from '@vuex-orm/core';
import VuexORMAxios from "@vuex-orm/plugin-axios";

const database = new Database();

const config = {
    axios,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
};

VuexORM.use(VuexORMAxios, config);

//import * as annotations from './annotations';
//annotations.register(database);

//import * as cloud from './cloud';
//cloud.register(database);

//import * as configuration from './configuration';
//configuration.register(database);

//import * as dataset_collections from './dataset_collections';
//dataset_collections.register(database);

//import * as datasets from './datasets';
//datasets.register(database);

//import * as datatypes from './datatypes';
//datatypes.register(database);

//import * as extended_metadata from './extended_metadata';
//extended_metadata.register(database);

//import * as folders from './folders';
//folders.register(database);

//import * as forms from './forms';
//forms.register(database);

import * as genomes from './genomes';
genomes.register(database);

//import * as group_roles from './group_roles';
//group_roles.register(database);

//import * as group_users from './group_users';
//group_users.register(database);

//import * as groups from './groups';
//groups.register(database);

import * as histories from './histories';
histories.register(database);

import * as history_contents from './history_contents';
history_contents.register(database);

//import * as item_tags from './item_tags';
//item_tags.register(database);

import * as jobs from './jobs';
jobs.register(database);

//import * as libraries from './libraries';
//libraries.register(database);

//import * as library_contents from './library_contents';
//library_contents.register(database);

//import * as library_datasets from './library_datasets';
//library_datasets.register(database);

//import * as metrics from './metrics';
//metrics.register(database);

//import * as page_revisions from './page_revisions';
//page_revisions.register(database);

//import * as pages from './pages';
//pages.register(database);

//import * as plugins from './plugins';
//plugins.register(database);

//import * as provenance from './provenance';
//provenance.register(database);

//import * as quotas from './quotas';
//quotas.register(database);

//import * as remote_files from './remote_files';
//remote_files.register(database);

//import * as roles from './roles';
//roles.register(database);

//import * as search from './search';
//search.register(database);

//import * as tool_data from './tool_data';
//tool_data.register(database);

//import * as tool_dependencies from './tool_dependencies';
//tool_dependencies.register(database);

//import * as tool_shed_repositories from './tool_shed_repositories';
//tool_shed_repositories.register(database);

//import * as tools from './tools';
//tools.register(database);

//import * as toolshed from './toolshed';
//toolshed.register(database);

//import * as tours from './tours';
//tours.register(database);

import * as users from './users';
users.register(database);

//import * as visualizations from './visualizations';
//visualizations.register(database);

//import * as webhooks from './webhooks';
//webhooks.register(database);

import * as workflows from './workflows';
workflows.register(database);

import * as common from './_common';

const submodules = {
    common,
//    annotations,
//    authenticate,
//    cloud,
//    configuration,
//    dataset_collections,
//    datasets,
//    datatypes,
//    extended_metadata,
//    folder_contents,
//    folders,
//    forms,
    genomes,
//    group_roles,
//    group_users,
//    groups,
    histories,
    history_contents,
//    item_tags,
    jobs,
//    libraries,
//    library_contents,
//    library_datasets,
//    metrics,
//    page_revisions,
//    pages,
//    plugins,
//    provenance,
//    quotas,
//    remote_files,
//    roles,
//    search,
//    tool_data,
//    tool_dependencies,
//    tool_shed_repositories,
//    tools,
//    toolshed,
//    tours,
    users,
//    visualizations,
//    webhooks,
    workflows,
};

export {
    submodules as default,
    database,
    config,
}
