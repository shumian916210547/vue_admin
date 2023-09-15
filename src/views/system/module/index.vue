<template>
  <CommonPage
    ref="commonPage"
    :className="'Module'"
    @add="handleAdd"
    :innerContainer="true"
    innerContainerTitle="新增"
  >
    <!-- 路由列表 -->
    <template #innerContainer="{ record }">
      <a-table
        :columns="columns"
        :data-source="formattingData(record.routes)"
        :pagination="false"
        rowKey="objectId"
      >
        <template #bodyCell="{ column, index }">
          <template v-if="column.key === 'operation'">
            <div style="max-width: 230px; display: flex; align-items: center">
              <span class="table-operation">
                <a-button
                  @click="handleEdit(record, index)"
                  v-permission="['permission:edit', permissions]"
                >
                  修改
                </a-button>
                <a-divider type="vertical" />
                <a-popconfirm
                  title="Are you sure delete this task?"
                  ok-text="Yes"
                  cancel-text="No"
                  @confirm="handleDelete(record, index)"
                  @cancel="() => {}"
                >
                  <a-button
                    type="danger"
                    v-permission="['permission:remove', permissions]"
                  >
                    删除
                  </a-button>
                </a-popconfirm>
              </span>
            </div>
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

  <!-- 路由编辑 -->
  <CommonForm
    :className="'Route'"
    :fields="formFields"
    :editState="editState"
    :type="modalState.type"
    v-model:modalVisible="modalState.show"
    @onOk="handleSubmit"
  ></CommonForm>
</template>


<script setup>
import CommonPage from "@/components/CommonPage.vue";
import { onMounted, reactive, ref, watch } from "vue";
import moment from "moment";
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
import { defaultFields } from "@/service/schema.service";

import { Mixins } from "@/mixins";
import Parse from "parse";

const { queryPermission } = Mixins();

/* 查询路由id */
const queryRouteId = async () => {
  const query = new Parse.Query("Route");
  query.equalTo("targetClass", "Route");
  const result = await query.first();
  return result.id;
};
const routeId = await queryRouteId();
const permissions = await queryPermission(routeId);

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

/* 添加路由 */
const handleAdd = (arg) => {
  modalState.type = "add";
  modalState.show = true;
  editState["moduleId"] = arg.objectId;
  editState["routes"] = arg.routes || [];
};

/* 编辑路由 */
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

/* 删除路由 */
const handleDelete = async (record, index) => {
  await DeleteRoute(record.routes.splice(index, 1)[0]);
  await ModuleUpdateRoute(
    record.objectId,
    record.routes.map((item) => {
      item.__type = "Pointer";
      return item;
    })
  );
  await commonPage.value.loadData(commonPage.value.queryState);
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
  await commonPage.value.loadData(commonPage.value.queryState);
};
let fields = reactive({});
const columns = reactive([]);
const formFields = reactive({});
/* 获取table路由并且保存 */
const systemFields = defaultFields.map((item) => item.fieldName);
const loadFields = async () => {
  const result = await findSchema({ className: "Route" });
  if (!result) return;
  Object.keys(result.get("fields")).forEach((key) => {
    fields[key] = result.get("fields")[key];
    if (!systemFields.includes(key)) {
      formFields[key] = result.get("fields")[key];
    }
    if (!systemFields.includes(key) && visibleType.includes(fields[key].type)) {
      columns.push({
        title: fields[key].chineseName,
        dataIndex: key,
        key: key,
        width: 200,
      });
    }
  });
  columns.push({
    title: "操作",
    dataIndex: "operation",
    key: "operation",
    fixed: "right",
    width: 230,
  });
};

const formattingData = (list) => {
  if (!list || !list.length) return [];
  return list.map((item) => {
    Object.keys(item).forEach((key) => {
      if (["updatedAt", "createdAt"].includes(key)) {
        item[key] = moment(item[key]).format("YYYY-MM-DD HH:mm:ss");
      }
    });
    return item;
  });
};

await loadFields();
await findAll("Route");
</script>