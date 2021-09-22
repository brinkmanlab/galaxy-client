<template xmlns:v-slot="http://www.w3.org/1999/XSL/Transform">
    <b-container class="galaxy-history-item" :draggable="draggable" @dragstart.passive="dragstart">
        <slot name="before"/>
        <span class="galaxy-history-item-hid">{{ model.hid }}</span>
        <EditableLabel class="galaxy-history-item-name" @update="update_label" v-bind:value="model.name" placeholder="Enter a name to identify this dataset" ref="label"></EditableLabel>
        <!-- TODO add more progress states depending on hda state -->
        <b-progress v-bind:class="'galaxy-history-item-progress w-100 '+this.model.state"
                    v-if="model.upload_progress<100 || model.state === 'queued' || model.state === 'running'"
                    v-bind:max="100"
                    variant="info" striped animated>
            <b-progress-bar class="galaxy-history-item-progressbar" v-bind:value="model.upload_progress"></b-progress-bar>
        </b-progress>
        <span v-if="working" class="galaxy-history-item-status"><b-spinner small type="grow" v-bind:label="working"></b-spinner> {{ working }}</span>
        <slot></slot>
        <HistoryItemFunctions v-bind:item="this" v-on:galaxy-history-item-rename="$refs.label.start_edit()" v-on="$listeners">
            <template v-slot:default="slot">
                <slot name="history_item_functions" v-bind:item="slot.item" v-bind:listeners="$listeners"></slot>
            </template>
        </HistoryItemFunctions>
        <slot name="after"/>
    </b-container>
</template>

<script>
    import {HistoryDatasetAssociation, HistoryDatasetCollectionAssociation} from "../api/history_contents";
    import HistoryItemFunctions from "./HistoryItemFunctions";
    import EditableLabel from "../misc/EditableLabel";

    export const HISTCONTENT_MIME = 'application/vnd.galaxy.historycontent+json';

    /**
     * Base component for history items
     */
    export default {
        name: "HistoryItem",
        components: {
            EditableLabel,
            HistoryItemFunctions,
        },
        data: ()=>{return{
        }},
        props: {
            /**
             * Allow item to be dragged
             */
            draggable: {
                type: Boolean,
                default: false
            },

            /**
             * Model of history item
             */
            model: {
                type: [HistoryDatasetAssociation, HistoryDatasetCollectionAssociation],
                required: true,
            },
        },
        computed: {
            /**
             * Helper to translate state to readable message
             * @returns {string|null} Human readable message of the working state
             */
            working() {
                // TODO add other unready states
                if (this.model.file_ext === 'auto') return "Verifying data type";
                if (this.model.state === 'error') return "Error";
                return null;
            }
        },
        methods: {
            /**
             * Handle input from editable label
             * @param value {string} New label value
             */
            update_label(value) {
                this.model.name = value;
                this.model.put(['name']);
            },

            /**
             * Handle hda, or hdca dragging
             * @param {DragEvent} browser event
             */
            dragstart(evt) {
                evt.dataTransfer.setData(HISTCONTENT_MIME, JSON.stringify({hist_id: this.model.history_id, ...this.model.toInput()}));
                evt.dataTransfer.effectAllowed = (this.model instanceof HistoryDatasetAssociation) ? 'move' : 'copyMove'; // copy = deep, move == shallow
            },
        },
        mounted() {
            if (this.model.hid > this.model.constructor.ghost_hid) {
                const self = this;
                self.model.poll_state(()=>{
                    // When state === ok the extension is not updated immediately
                    return self.model.extension !== 'auto';
                }, undefined, 3000);
            }
        },
        beforeDestroy() {
            if (this.model) this.model.stop_polling();
        }
    }
</script>

<style scoped>
    .galaxy-history-item {
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
        user-select: none;
    }

    .galaxy-history-item >>> .galaxy-history-item-functions {
        height: 1.1em;
    }

</style>
