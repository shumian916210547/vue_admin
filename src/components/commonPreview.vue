<template>
    <a-modal :footer="null" v-model:visible="visible" @cancel="handleCancel" :width="modalWidth" ref="modalRef"
        style="position: relative">
        <template #title>
            <div ref="modalTitleRef" style="width: 100%; cursor: move">
                {{ className }}
            </div>
        </template>
        <a-descriptions :title="dataMap.name" bordered>
            <template v-for="(key, index) in Object.keys(props.fields)" :key="index">
                <a-descriptions-item :label="props.fields[key].chineseName">
                    {{ colValue(dataMap[key], props.fields[key]) }}
                </a-descriptions-item>
            </template>
        </a-descriptions>
        <div class="bar" @mousedown="down($event)" ref="bar"></div>
        <template #modalRender="{ originVNode }">
            <div :style="transformStyle">
                <component :is="originVNode" />
            </div>
        </template>
    </a-modal>
</template>

<script setup>
import { useDraggable } from "@vueuse/core";
import { computed, ref, watch, watchEffect } from "vue";

const emit = defineEmits(["update:modalVisible"])
const props = defineProps({
    className: {
        required: true,
        type: String,
    },
    fields: {
        required: true,
        type: Object,
    },
    dataMap: {
        required: true,
        type: Object
    },
    modalVisible: {
        type: Boolean,
        default: false,
    }
});

const visible = ref(props.modalVisible);
watch(() => props.modalVisible, (n, o) => {
    visible.value = n
}, { deep: true })
const handleCancel = () => {
    emit("update:modalVisible", false)
}

const colValue = (value, colOption) => {
    switch (colOption.type) {
        case "Array":
            let str = ''
            if (colOption.isPointer) {
                value.forEach(item => {
                    str += item.name + '\n'
                })
            } else {
                value.forEach(item => { str += item + '\n' })
            }
            return str;
        case "Pointer": return value.name;
        default: return value;
    }
}

const modalWidth = ref("600px");
const modalTitleRef = ref();
const { x, y, isDragging } = useDraggable(modalTitleRef);
const startX = ref(0);
const startY = ref(0);
const startedDrag = ref(false);
const transformX = ref(0);
const transformY = ref(0);
const preTransformX = ref(0);
const preTransformY = ref(0);
const dragRect = ref({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
});
watch([x, y], () => {
    if (!startedDrag.value) {
        startX.value = x.value;
        startY.value = y.value;
        const bodyRect = document.body.getBoundingClientRect();
        const titleRect = modalTitleRef.value.getBoundingClientRect();
        dragRect.value.right = bodyRect.width - titleRect.width;
        dragRect.value.bottom = bodyRect.height - titleRect.height;
        preTransformX.value = transformX.value;
        preTransformY.value = transformY.value;
    }
    startedDrag.value = true;
});
watch(isDragging, () => {
    if (!isDragging) {
        startedDrag.value = false;
    }
});
watchEffect(() => {
    if (startedDrag.value) {
        transformX.value =
            preTransformX.value +
            Math.min(Math.max(dragRect.value.left, x.value), dragRect.value.right) -
            startX.value;
        transformY.value =
            preTransformY.value +
            Math.min(Math.max(dragRect.value.top, y.value), dragRect.value.bottom) -
            startY.value;
    }
});
const transformStyle = computed(() => {
    return {
        transform: `translate(${transformX.value}px, ${transformY.value}px)`,
    };
});

const down = (e) => {
    const startX = e.clientX;
    const offsetX = e.target.offsetLeft; //元素左边到窗口左边的距离
    e.target.setCaptrue; //设置鼠标捕获(之后的事件捕获会作用在当前元素上)
    document.onmousemove = (e) => {
        const endX = e.clientX;
        const width = offsetX - (startX - endX);
        if (width > 600) modalWidth.value = width + "px";
    };
    document.onmouseup = (e) => {
        document.onmousemove = null;
        document.onmouseup = null;
        e.target.releaseCaptrue; //释放鼠标捕获
    };
};
</script>

<style lang="scss" scoped>
.bar {
    cursor: col-resize;
    width: 24px;
    display: inline-block;
    line-height: 200px;
    vertical-align: middle;
    position: absolute;
    right: 0px;
    top: 0;
    height: 100%;
}
</style>