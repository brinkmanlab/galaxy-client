/**
 * Code responsible for interacting with /api/histories
 * https://docs.galaxyproject.org/en/latest/api/api.html#module-galaxy.webapps.galaxy.api.histories
 */
import * as Common from "./_common";

import { HistoryDatasetAssociation, HistoryDatasetCollectionAssociation } from "./history_contents";
import {api as galaxy} from "../index"; //eslint-disable-line


class History extends Common.Model {
    static entity = 'History';
    static primaryKey = 'id';
    static end_states = ['ok','error'];
    static apiPath = '/api/histories/';

    constructor(...args) {
        super(...args);
        Object.assign(this, Common.HasState);
    }

    static fields() {
        return {
            ...super.fields(),
            //Request data
            id: this.string(null),
            importable: this.boolean(false),
            create_time: this.string((new Date).toISOString()),
            contents_url: this.string(null).nullable(),
            size: this.number(0),
            user_id: this.string(null).nullable(),
            username_and_slug: this.string(null).nullable(),
            annotation: this.string(null).nullable(),
            state_details: this.attr({
                paused: 0,
                ok: 0,
                failed_metadata: 0,
                upload: 0,
                discarded: 0,
                running: 0,
                setting_metadata: 0,
                error: 0,
                new: 0,
                queued: 0,
                empty: 0,
            }),
            state: this.string('ok'),
            empty: this.boolean(true),
            update_time: this.string((new Date).toISOString()),
            tags: this.attr([]),
            deleted: this.boolean(false),
            genome_build: this.string(null).nullable(),
            slug: this.string(null).nullable(),
            name: this.string("Unnamed History"),
            url: this.string(null).nullable(),
            state_ids: this.attr({
                paused: [],
                ok: [],
                failed_metadata: [],
                upload: [],
                discarded: [],
                running: [],
                setting_metadata: [],
                error: [],
                new: [],
                queued: [],
                empty: [],
            }),
            published: this.boolean(false),
            model_class: this.string("History"),
            purged: this.boolean(false),

            //ORM only
            datasets: this.hasMany(HistoryDatasetAssociation, 'history_id'),
            collections: this.hasMany(HistoryDatasetCollectionAssociation, 'history_id'),
            contentsFetched: this.boolean(false),
        }
    }

    //TODO GET /api/histories/most_recently_used
    //TODO GET /api/histories/shared_with_me
    //TODO GET /api/histories/published
    //TODO GET /api/histories/deleted -- May want a DeletedHistory subclass
    //TODO POST /api/histories/deleted/{id}/undelete
    //TODO GET /api/histories/{id}/custom_builds_metadata
    //TODO PUT /api/histories/{id}/exports
    //TODO GET /api/histories/{id}/exports/{jeha_id}

    /**
     * Upload a file to this history
     * @param file {File} File to upload
     * @param file_type {string} Optional file type to skip sniffing
     * @returns {Promise<HistoryDatasetAssociation|null>} HDA model of uploaded dataset
     */
    async fileUpload(file, file_type) {
        if (file.kind) {
            // Use DataTransferItemList interface to access the file(s)
            if (file.kind === 'file') file = file.getAsFile();
            else return null; // If dropped items aren't files, reject them
        } // Else use DataTransfer interface to access the file(s)
        if (file)
            return await HistoryDatasetAssociation.upload(file, this.id, file_type);
    }

    /**
     * Copy hda, hdca, ldda, ldca into history
     * @param content {{id: string, src: 'hda'|'hdca'|'ldda'|'ldca'} | HistoryDatasetAssociation | HistoryDatasetCollectionAssociation}
     * @param deep {boolean} Copy collection elements with collection
     * @param options {object} Options to pass to post()
     * @return {Promise<HistoryDatasetAssociation | HistoryDatasetCollectionAssociation>}
     */
    async copy_into(content, deep = false, options = {}) {
        const id = content.id;
        let source, type;
        if (content instanceof HistoryDatasetAssociation || content instanceof HistoryDatasetCollectionAssociation) source = content.constructor.srcName;
        else source = content.src;
        // TODO is 'ldda' and 'ldca' correct?
        switch (source) {
            case 'ldda':
                source = 'library';
                //fallthrough
            case 'hda':
                type = HistoryDatasetAssociation;
                break;
            case 'ldca':
                source = 'library_folder';
                //fallthrough
            case 'hdca':
                type = HistoryDatasetCollectionAssociation;
                break;
        }
        return type.post(this, {data: { source, content: id, copy_elements: deep }, ...options});
    }

    static async fetch(options = {}) {
        return super.fetch({params: {view: 'detailed', ...options.params}, ...options})
    }

    // TODO GET /api/histories/{history_id}/contents/near/{hid}/{limit}
    // https://docs.galaxyproject.org/en/latest/lib/galaxy.webapps.galaxy.api.html#galaxy.webapps.galaxy.api.history_contents.HistoryContentsController.contents_near

    async loadContents() {
        if (this.datasets.length === 0) {
            await galaxy.history_contents.HistoryDatasetAssociation.fetch(this);
        }
        /*if (history.collections.length === 0) { TODO
            await galaxy.history_contents.HistoryDatasetCollectionAssociation.$fetch({
                params: {
                    url: history.get_contents_url(),
                }
            });
        }*/
        this.constructor.update({where: this[this.constructor.primaryKey], data: {contentsFetched: true}});
    }

    static apiConfig = {
        dataTransformer(response) {
            if (response.config.method === 'post') {
                response.data['contentsFetched'] = true; // New histories don't have contents
            }
            return response.data
        }
    };
}

/*class HistoryExport extends Common.Model { //TODO
}*/

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
    database.register(History, Module);
}

export {
    History,
    Module,
    register,
};
