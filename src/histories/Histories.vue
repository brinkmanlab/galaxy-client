<template>
    <b-card class="galaxy-histories" no-body>
        <b-card-header>
            <b-nav tabs @mousemove="scroll" @wheel.prevent.stop="wheel" ref="tabs" title="Ctrl-click (⌘ for mac) tabs to show multiple. Drag to scroll.">
                <b-nav-item v-for="item of items" :key="item.model.id" :active="item.active"
                            @mousedown.prevent="mousestart=$event.clientX"
                            @mouseup="activate($event, item)"
                            >
                    <slot name="tab" :item="item" :model="item.model">
                        {{ item.model.name }}
                    </slot>
                </b-nav-item>
            </b-nav>
            <b-dropdown split class="options" @click="$refs.create.do_action()">
                <template #button-content>
                    <Create ref="create" v-on="$listeners" description="Create a new history"/>
                </template>
                <template #default>
                    <b-dropdown-item @click="$refs.create.do_action()"><Create v-on="$listeners" description="Create a new history"/></b-dropdown-item>
                    <slot name="options" />
                </template>
            </b-dropdown>
        </b-card-header>
        <b-card-body>
            <!-- Extra div required because flex align-items: stretch calculates _visible_ height of parent. Overflow: scroll messes with that -->
            <div class="galaxy-histories-contents">
                <slot name="default" :models="active_models" />
            </div>
        </b-card-body>
    </b-card>
</template>

<script>

import Create from './HistoryFunctions/Create'

/**
 * Multi History view
 */
export default {
    name: "Histories",
    components: {Create},
    props: {
        /**
         * History model instance
         */
        models: {
            type: Array,
            required: true,
        },
    },
    data() {return {
        items: [],
        mousestart: 0, // Used to differentiate click from scroll of tabs
    }},
    methods: {
        activate(evt, item) {
            if (Math.abs(evt.clientX - this.mousestart) > 4) return;
            if (!(evt.ctrlKey || evt.metaKey)) this.items.forEach(i => this.$set(i, 'active', false));
            this.$set(item, 'active', true);
        },
        scroll(evt) {
            if (evt.buttons === 1)
                this.$refs.tabs.scrollLeft -= evt.movementX;
        },
        wheel(evt) {
            const delta1 = Math.max(evt.deltaX, evt.deltaY, evt.deltaZ);
            const delta2 = Math.min(evt.deltaX, evt.deltaY, evt.deltaZ);
            this.$refs.tabs.scrollLeft += (Math.abs(delta1) > Math.abs(delta2) ? delta1 : delta2) * 4;
        }
    },
    computed: {
        active_items() {
            return this.items.filter(i => i.active);
        },
        active_models() {
            return this.active_items.map(i => i.model);
        },
        filtered_models() {
            return this.models.filter(m=>!m.deleted);
        }
    },
    watch: {
        filtered_models(new_val) {
            const active = new Set(this.active_models.map(m=>m.id));
            if (active.size === 0 && new_val.length > 0) active.add(new_val[0].id);
            this.items = new_val.map(m => ({active: active.has(m.id), model: m}));
        }
    }
}
</script>

<style scoped>
.galaxy-histories >>> .card-header {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    padding-left: 0.2em;
    padding-right: 0;
    padding-bottom: 0;
}

.galaxy-histories >>> .nav {
    flex-grow: 1;
    flex-wrap: nowrap;
    overflow: hidden;
    cursor: grab;
}

.galaxy-histories >>> .nav-item {
    white-space: nowrap;
}

.galaxy-histories >>> .nav-item * {
    user-drag: none;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-select: none;
}

.galaxy-histories >>> .options {
    min-width: max-content;  /* Firefox only */
}

.galaxy-histories >>> .options > button {
    background-color: #F8F5F0;
    border-color: #DFD7CA;
    border-bottom-left-radius: 0;
    color: #8E8C84;
}

.galaxy-histories >>> .options .dropdown-item .galaxy-function {
    text-decoration: none;
    font-size: 1em;
}

.galaxy-histories >>> .options .dropdown-item .galaxy-function-icon {
    margin-right: 0.5ch;
}

.galaxy-histories >>> .card-body {
    overflow: scroll;
    padding: 0.5ch 0 0;
}

.galaxy-histories >>> .galaxy-histories-contents {
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: stretch;
}

.galaxy-histories >>> .galaxy-history {
    padding: 0 0.5ch;
    min-width: 16em;
    width: 100%;
    display: grid;
    border-left: 1px solid rgba(223, 215, 202, 0.75);
    grid-template-columns: auto auto;
    grid-template-rows: min-content min-content auto;
    grid-template-areas:
        "name functions"
        "updated updated"
        "content content";
}

.galaxy-histories >>> .galaxy-history:first-of-type {
    border-left: none;
}

.galaxy-histories >>> .galaxy-history > * {
    display: block;
}

.galaxy-histories >>> .galaxy-history .galaxy-history-label {
    grid-area: name;
    font-weight: bold;
}

.galaxy-histories >>> .galaxy-history .galaxy-history-functions {
    grid-area: functions;
}

.galaxy-histories >>> .galaxy-history .galaxy-history-state {
    display: none;
}

.galaxy-histories >>> .galaxy-history .galaxy-history-updated {
    grid-area: updated;
}

.galaxy-histories >>> .galaxy-history .galaxy-history-contents {
    grid-area: content;
}

.galaxy-histories >>> .galaxy-history .galaxy-history-contents-list {
    height: 100%;
}

</style>
