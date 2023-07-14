<template>
  <CommonPage
    ref="commonPage"
    :className="'Module'"
    @add="handleAdd"
    :innerContainer="true"
    innerContainerTitle="新增"
  >
    <!-- 字段列表 -->
    <template #innerContainer="{ record }">
      <a-table
        :columns="columns"
        :data-source="record.routes"
        :pagination="false"
      >
        <template #bodyCell="{ column, index }">
          <template v-if="column.key === 'operation'">
            <span class="table-operation">
              <a-button @click="handleEdit(record, index)"> 修改 </a-button>
              <a-divider type="vertical" />
              <a-popconfirm
                title="Are you sure delete this task?"
                ok-text="Yes"
                cancel-text="No"
                @confirm="handleDelete(record, index)"
                @cancel="() => {}"
              >
                <a-button type="danger"> 删除 </a-button>
              </a-popconfirm>
            </span>
          </template>
          <template v-else>
            <a-tooltip placement="top" arrowPointAtCenter>
              <template #title>
                <span>
                  {{
                    record.routes[index][column.key]?.name ||
                    record.routes[index][column.key]
                  }}
                </span>
              </template>
              <p
                style="
                  max-width: 200px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                "
              >
                {{
                  record.routes[index][column.key]?.name ||
                  record.routes[index][column.key]
                }}
              </p>
            </a-tooltip>
          </template>
        </template>
      </a-table>
    </template>
  </CommonPage>

  <!-- 字段编辑 -->
  <CommonForm
    :className="'Route'"
    :fields="fields"
    :editState="editState"
    :type="modalState.type"
    v-model:modalVisible="modalState.show"
    @onOk="handleSubmit"
  ></CommonForm>
</template>


<script setup>
import CommonPage from "@/components/CommonPage.vue";
import { onMounted, reactive, ref, watch } from "vue";
import { deepClone } from "@/utils/utils";
import {
  UpdateById,
  UpdateRoute,
  ModuleUpdateRoute,
  DeleteRoute,
} from "@/service/module.service";
import CommonForm from "@/components/CommonForm.vue";
import { findAll, findSchema } from "@/service/base.service";
import { visibleType } from "@/config/table.config";
const commonPage = ref();
const modalState = reactive({
  type: "add",
  show: false,
});
const editState = reactive({});
watch(
  () => modalState.show,
  (n) => {
    if (!n) {
      Object.keys(fields).forEach((key) => {
        editState[key] = fields[key].defaultValue || undefined;
      });
    }
  },
  { deep: true }
);

/* 添加字段 */
const handleAdd = (arg) => {
  modalState.type = "add";
  modalState.show = true;
  editState["moduleId"] = arg.objectId;
  editState["routes"] = arg.routes || [];
};

/* 编辑字段 */
const handleEdit = (record, index) => {
  editState["moduleId"] = record.objectId;
  editState["routes"] = deepClone(record.routes);
  modalState.type = "edit";
  Object.keys(record.routes[index]).forEach((key) => {
    if (Object.keys(fields).includes(key)) {
      editState[key] = record.routes[index][key];
    }
  });
  editState["index"] = index;
  modalState.show = true;
};

/* 删除字段 */
const handleDelete = async (record, index) => {
  let routes = deepClone(record.routes);
  await DeleteRoute(routes.splice(index, 1)[0]);
  await ModuleUpdateRoute(record.objectId, routes);
  commonPage.value.loadData(commonPage.value.queryState);
};

/* 上传数据 */
const handleSubmit = async (arg) => {
  switch (modalState.type) {
    case "add":
      await UpdateById(editState.moduleId, arg);
      break;
    case "edit":
      await UpdateRoute({ ...editState.routes[editState.index], ...arg });
      break;
    default:
      break;
  }
  modalState.show = false;
  commonPage.value.loadData(commonPage.value.queryState);
};
let fields = reactive({});
const columns = reactive([]);

/* 获取table字段并且保存 */
const loadFields = async () => {
  const result = await findSchema({ className: "Route" });
  if (!result) return;
  Object.keys(result.get("fields")).forEach((key) => {
    fields[key] = result.get("fields")[key];
    if (visibleType.includes(fields[key].type)) {
      columns.push({
        title: fields[key].chineseName,
        dataIndex: key,
        key: key,
      });
    }
  });
  columns.push({
    title: "操作",
    dataIndex: "operation",
    key: "operation",
  });
};

await loadFields();
await findAll("Route");
</script>