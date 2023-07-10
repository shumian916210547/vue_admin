<template>
  <CommonPage
    :className="targetClass"
    :innerContainerTitle="false"
  ></CommonPage>
</template>
  
  
<script setup>
import CommonPage from "@/components/CommonPage.vue";
import { useRoute } from "vue-router";
const route = useRoute();
const { targetClass } = route.meta;
</script>