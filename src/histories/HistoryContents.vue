<template>
    <b-container class="galaxy-history-contents">
        <b-row>
            <b-input-group size="sm" prepend="Filter">
                <b-form-input
                    v-model="search"
                    type="search"
                    placeholder="Type to Search"
                />
                <b-input-group-append>
                    <b-button :disabled="!search" @click="search_next(true)" title="Previous match"><i class="icon icon-prev"/></b-button>
                    <b-button :disabled="!search" @click="search_next(false)" title="Next match"><i class="icon icon-next"/></b-button>
                </b-input-group-append>
            </b-input-group>

            <FunctionIcon label="Upload" description="Select a dataset to upload" icon="icon-file-upload" v-bind:action="show_upload" />
            <input type="file" hidden multiple
                   ref="upload"
                   v-bind:accept="accepted_upload_types.map(ext=>'.'+ext)"
                   @input.prevent="dragdrop"
            />
        </b-row>

        <b-row>
            <b-table
                     show-empty
                     small
                     borderless
                     sticky-header="10rem"
                     per-page="0"
                     primary-key="key"
                     :items="items"
                     :busy="isLoading"
                     :selectable="selectable"
                     select-mode="range"
                     :fields="['item']"
                     sort-by="hid"
                     empty-text="Drag and drop files here to upload"
                     thead-class="hidden_header"
                     :tbody-tr-class="rowClass"
                     @row-selected="row_selected"
                     @dragstart.native.stop.prevent @dragover.native.prevent="upload_dragging=true" @dragleave.native="upload_dragging=false" @dragexit.native="upload_dragging=false" @drop.native.prevent="dragdrop"
                     ref="table"
                     @keydown.native="handle_hotkey"
            >
                <template v-slot:cell(item)="row">
                    <DatasetItem
                            v-if="row.value.history_content_type==='dataset'"
                            v-bind:model="row.value"
                            v-bind:class="{'table-danger': row.value.state in row.value.constructor.error_states}"
                            draggable="true"
                            @dragstart="dragstart($event, row.value)"
                    />
                    <CollectionItem
                            v-else-if="row.value.history_content_type==='dataset_collection'"
                            v-bind:model="row.value"
                            draggable="true"
                            @dragstart="dragstart($event, row.value)"
                    />
                </template>

                <!--template slot="row-details" slot-scope="row">
                    <b-card>
                        TODO add peek and other options
                    </b-card>
                </template-->
                <template slot="table-busy">
                    <div class="text-center loading-spinner">
                        <b-spinner class="align-middle"></b-spinner>
                        <strong>Loading...</strong>
                    </div>
                </template>
                <template slot="[]">Unexpected column</template>
            </b-table>
        </b-row>
    </b-container>
</template>

<script>
    import { History } from "../api/histories";
    import { HistoryDatasetAssociation } from "../api/history_contents";
    import DatasetItem from './HistoryItems/Dataset';
    import CollectionItem from "./HistoryItems/Collection";
    import FunctionIcon from "../misc/FunctionIcon";

    const temporary_extension_to_datatype_map = {
        "genbank": "genbank", "gbk": "genbank", "embl": "embl", "gbff": "genbank", "newick": "newick", "nwk": "newick"
    };

    const HISTCONTENT_MIME = 'application/vnd.galaxy.historycontent+json';

    /**
     * Match criteria for searchbox
     * @param query {String} Search string to compare
     * @param item {HistoryDatasetAssociation || HistoryDatasetCollectionAssociation} item to evaluate
     */
    function search_match(query, item) {
        return item.hid.toString() === query || item.name.includes(query);
    }

    /**
     * History contents list
     */
    export default {
        name: "HistoryContents",
        components: {
            FunctionIcon,
            CollectionItem,
            DatasetItem,
        },
        props: {
            /**
             * History model
             */
            history: {
                validator(prop) {return prop instanceof History || prop === null},
                required: true,
            },

            /**
             * Filter callback
             * Takes a parameter of either a HistoryDatasetAssociation or a HistoryDatasetCollectionAssociation
             * Returns true to display the item, false otherwise
             */
            filter: {
                type: Function,
                default: ()=>true,
            },

            /**
             * Initial selected items
             * @model
             */
            value: {
                type: Array,
                default() { return [] },
            },

            /**
             * Array of file extensions to allow uploading.
             */
            accepted_upload_types: {
                type: Array,
                default() { return [] },
            },

            /**
             * Contents are selectable. 'input' events will be emitted when the selection changes
             */
            selectable: {
              type: Boolean,
              default() { return false },
            }
        },
        data() {return{
            upload_dragging: false,
            search: '',
            search_target: null,
        }},
        computed: {
            /**
             * Aggregate all history items, filter, sort, and transform for b-table
             * @returns {Array<{'item': (HistoryDatasetAssociation|HistoryDatasetCollectionAssociation), 'hid': Number, 'key': string}>}
             */
            items() {
                if (this.history === null || this.upload_dragging) return [];
                //TODO when features available replace concat with v-for..of or model.morphTo(element property)
                return this.history.datasets
                    .concat(this.history.collections)
                    .filter(item=>!item.deleted && this.filter(item)) //TODO make deleted optional, needs ui control
                    .sort((a,b)=>(a.hid === a.constructor.ghost_hid)?-1:b.hid-a.hid)
                    .reduce((acc, cur)=>{acc.push({item: cur, hid: cur.hid, key: cur.id}); return acc;}, []);
            },

            /**
             * Asset loading state
             */
            isLoading() {
                return this.history === null || !this.history.contentsFetched;
            }
        },
        methods: {
            rowClass(item, type) {
                if (!item || type !== 'row') return;
                if (item.item === this.search_target) return 'search-target';
            },

            /**
             * Open the browser file selection dialog
             * @public
             */
            show_upload() {
                this.$refs.upload.click();
            },

            /**
             * Translate row selection event of b-table to input event
             * @param items {Array<HistoryDatasetAssociation|HistoryDatasetCollectionAssociation>} Selected history items
             */
            row_selected(items) {
                this.$emit('input', items.map(item=>item.item));
            },

            /**
             * Find next match in items, highlight and scroll to row
             * @param reverse {Boolean} Search backwards
             */
             search_next(reverse = false) {
                 const step = reverse ? 1 : -1; // 0 is at bottom

                let index = this.items.findIndex(item=>item.item === this.search_target);

                 // Ensure current index is not more than one step from items bounds and wrap if needed
                 index += step;
                 if (index < 0) index = reverse ? 0 : this.items.length-1;
                 else if (index >= this.items.length) index = reverse ? 0 : this.items.length-1;
                 const start_index = index;

                 // Iterate until next match
                 do {
                     const item = this.items[index].item;
                     if (search_match(this.search, item)) {
                         // Match found
                         this.search_target = item;

                         // Scroll to new target
                         const tbody = this.$refs.table.$el.querySelector('tbody');
                         const row = tbody.querySelectorAll('tr')[this.items.length - index -1];
                         row.scrollIntoView();
                         return;
                     }
                     index += step;

                     // Wrap in appropriate direction
                     if (index < 0) index = this.items.length-1;
                     else if (index >= this.items.length) index = 0;
                 } while (index !== start_index); // Don't wrap past start_index

                 // No next match found
                 this.search_target = null;
             },

            /**
             * Handle hda, or hdca dragging
             * @param {DragEvent} browser event
             * @param {HistoryDatasetAssociation | HistoryDatasetCollectionAssociation} item to copy to other history
             */
            dragstart(evt, item) {
               evt.dataTransfer.setData(HISTCONTENT_MIME, JSON.stringify({hist_id: this.history.id, ...item.toInput()}));
               evt.dataTransfer.effectAllowed = (item instanceof HistoryDatasetAssociation) ? 'move' : 'copyMove'; // copy = deep, move == shallow
            },

            /**
             * Handle drop events
             * @param {DragEvent} browser event
             */
            dragdrop(evt) {
              if (!evt.dataTransfer || !evt.dataTransfer.types.includes(HISTCONTENT_MIME)) return this.uploadHandler(evt);
              if (evt.dataTransfer) {
                const content = JSON.parse(evt.dataTransfer.getData(HISTCONTENT_MIME));
                if (this.history.id !== content.hist_id)
                  this.history.copy_into(content, evt.dataTransfer.dropEffect === 'copy');
              }
            },

            /**
             * Handle upload events
             * @param {DragEvent} browser event
             */
            uploadHandler(evt) {
                this.upload_dragging=false;
                if (this.history === null) return; //If user tries to upload before finished loading, do nothing.
                const files = evt.dataTransfer ? evt.dataTransfer.files : evt.target.files;

                // Enforce accepted file types
                const accepted_files = [];
                for (const file of files) {
                    let ext = file.name.match(/[^.]+$/);
                    if (this.accepted_upload_types.length && !(ext && this.accepted_upload_types.includes(ext[0]))) {
                        let tmp_id = file.name + Math.floor(Math.random() * 10 ** 16).toString();
                        HistoryDatasetAssociation.insert({
                            data: {
                                id: tmp_id,
                                file: file,
                                name: "Incorrect file format: " + file.name,
                                hid: HistoryDatasetAssociation.ghost_hid,
                                history_id: this.history.id,
                                extension: this.accepted_upload_types[0],
                                state: "failed"
                            }
                        });
                    } else {
                        accepted_files.push(file);
                    }
                }

                // Hand off upload event to parent for further processing if listening
                const self = this;
                const skip_sniff = ()=>{
                  for (const file of accepted_files) {
                    // TODO handle specifying extension elsewhere
                    // TODO hardcoded extension mapping to avoid sniff for now
                    let ext = file.name.match(/[^.]+$/);
                    if (ext && temporary_extension_to_datatype_map.hasOwnProperty(ext[0])) self.history.fileUpload(file, temporary_extension_to_datatype_map[ext[0]]);
                    else self.history.fileUpload(file);
                  }
                };

                if ('upload' in this.$listeners) {
                  this.$emit('upload', {
                    history: this.history,
                    files: accepted_files,
                    default: skip_sniff,
                  });
                } else {
                  skip_sniff();
                }
            },

            /**
             * Check keypress events for supported hotkeys
             * @param evt {KeyPressEvent} event object
             */
            handle_hotkey(evt) {
                if ((evt.ctrlKey || evt.metaKey) && evt.key === 'a') {
                    this.$refs.table.selectAllRows();
                    evt.preventDefault();
                    evt.stopPropagation();
                }
            },

            /**
             *  Clear selection
             *  @public
             */
            clearSelected() { this.$refs.table.clearSelected(); },
        },
        watch: {
            search() {
                if (!this.search) {
                    this.search_target = null;
                } else if (this.search_target === null || !search_match(this.search, this.search_target)) {
                    // Only search next if no current target or current target doesn't match
                    this.search_next();
                }
            }
        },
        mounted() {
            if (this.value.length) {
                // Select any items passed in value prop
                for (const [index, item] of this.items.elements()) {
                    if (this.value.includes(item)) this.$refs.table.selectRow(index);
                }
            }
        },
    }
</script>

<style scoped>
    >>> .search-target {
        outline: 1px dotted grey;
    }

    >>> .hidden_header {
        display: none;
    }

    >>> .b-table-sticky-header {
        width: 100%;
        margin-bottom: unset;
    }

    >>> .row:first-child {
        flex-wrap: nowrap;
        align-items: center;
    }

    >>> .row:first-child .galaxy-function i {
        font-size: 1.5rem;
        padding-left: 0.5vw;
    }

    >>> .loading-spinner {
        margin: 1em;
    }

    >>> .loading-spinner strong {
        padding-left: 1em;
    }
</style>
