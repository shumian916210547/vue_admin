<template>
  <div id="container"></div>
</template>

<script setup>
import { onMounted, reactive } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
let AMap = reactive();
let map = reactive();

/* 初始化地图 */
const initMap = async () => {
  AMap = await AMapLoader.load({
    key: process.env.VUE_APP_MAP_KEY, // 申请好的Web端开发者Key，首次调用 load 时必填
    version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: [], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
  });

  map = new AMap.Map("container", {
    zoom: 10, //设置地图缩放
    mapStyle: "amap://styles/normal", //设置地图的显示样式
  });

  AMap.plugin(
    [
      "AMap.ToolBar",
      "AMap.Scale",
      "AMap.HawkEye",
      "AMap.MapType",
      "AMap.Geolocation",
    ],
    () => {
      // 在图面添加工具条控件，工具条控件集成了缩放、平移、定位等功能按钮在内的组合控件
      map.addControl(new AMap.ToolBar());

      // 在图面添加比例尺控件，展示地图在当前层级和纬度下的比例尺
      map.addControl(new AMap.Scale());

      // 在图面添加鹰眼控件，在地图右下角显示地图的缩略图
      map.addControl(new AMap.HawkEye({ isOpen: true }));

      // 在图面添加类别切换控件，实现默认图层与卫星图、实施交通图层之间切换的控制
      map.addControl(new AMap.MapType());

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
    }
  );

  map.on("click", function (ev) {
    console.log(ev);
  });
};

onMounted(() => {
  initMap();
});
</script>

<style lang="scss" scoped>
#container {
  height: 100%;
}
</style>
