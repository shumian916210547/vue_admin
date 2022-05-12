<template>
  <div id="container"></div>
</template>

<script>
import { defineComponent, onMounted, reactive, ref } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
export default defineComponent({
  setup() {
    let AMap = reactive();
    let map = reactive();

    /* 初始化地图 */
    const initMap = async () => {
      AMap = await AMapLoader.load({
        key: "c23fdefb2ef6285cb1084f7a80278c6c", // 申请好的Web端开发者Key，首次调用 load 时必填
        version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
        plugins: [], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
      });

      map = new AMap.Map("container", {
        zoom: 10, //设置地图缩放
        mapStyle: "amap://styles/normal", //设置地图的显示样式
      });

      AMap.plugin("AMap.Geolocation", () => {
        let geolocation = new AMap.Geolocation({
          // 是否使用高精度定位，默认：true
          enableHighAccuracy: true,
          // 设置定位超时时间，默认：无穷大
          timeout: 10000,
          zoomToAccuracy: true,
        });
        map.addControl(geolocation);
        geolocation.getCurrentPosition((status, result) => {
          console.log(result);
          //获取用户当前的精确位置
          if (status == "complete") {
            console.log("result", result);
          }
        });
      });
    };

    onMounted(() => {
      initMap();
    });

    return {};
  },
});
</script>

<style lang="scss" scoped>
#container {
  height: 100%;
}
</style>
