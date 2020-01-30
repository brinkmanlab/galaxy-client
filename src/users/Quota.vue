<template>
    <div class="galaxy-user-quota">
        <div class="progress-label">
            <span><slot /></span>
            <span>{{readable_usage}} / {{readable_quota}}</span>
        </div>
        <b-progress :max="quota || 10" :value="(quota && usage) || 1" :variant="variant" />
    </div>
</template>

<script>
    import byteSize from 'byte-size'

    export default {
        name: "Quota",
        props: {
            usage: {
                validator(prop) {return typeof prop === 'number' || prop === null},
                required: true,
            },
            quota: {
                validator(prop) {return typeof prop === 'number' || prop === null},
                required: true,
            }
        },
        computed: {
            readable_usage() {
                if (this.usage === null) return '';
                return byteSize(this.usage);
            },
            readable_quota() {
                if (!this.quota) return '∞';
                return byteSize(this.quota);
            },
            variant() {
                if (!this.quota) return 'info';
                const percent = this.usage / this.quota;
                if (percent < 80) return 'info';
                if (percent < 90) return 'warning';
                if (percent < 100) return 'danger';
                return 'info';
            }
        }
    }
</script>

<style scoped>
    .progress-label {
        margin-left: 1em;
        margin-right: 1em;
    }
</style>
