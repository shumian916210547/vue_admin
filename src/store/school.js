import * as commonAPI from "@/apis/base";
export default {
  state: {
    schools: [],
    departments: [],
    class: [],
    majors: [],
    courses: [],
    teachers: [],
    check_in_type: [
      {
        name: "签到码",
        objectId: "code",
      } /* ,
      {
        name: "二维码",
        objectId: "qrcode",
      },
      {
        name: "位置",
        objectId: "location",
      }, */,
    ],
  },
  getters: {
    GET_CHECK_IN_TYPE: (state) => {
      return state.check_in_type;
    },

    GETSCHOOLS: (state) => {
      return state.schools;
    },

    GETDEPARTMENTS: (state) => {
      return state.departments;
    },

    GETCLASS: (state) => {
      return state.class;
    },

    GETMAJORS: (state) => {
      return state.majors;
    },

    GETCOURSE: (state) => {
      return state.courses;
    },

    GETTEACHER: (state) => {
      return state.teachers;
    },
  },
  mutations: {
    SETSCHOOLS(state, value) {
      state.schools = value;
    },

    SETDEPARTMENTS(state, value) {
      state.departments = value;
    },

    SETCLASS(state, value) {
      state.class = value;
    },

    SETMAJORS(state, value) {
      state.majors = value;
    },

    SETCOURSE(state, value) {
      state.courses = value;
    },

    SETTEACHER(state, value) {
      state.teachers = value;
    },
  },
  actions: {
    SETSCHOOLS(ctx) {
      commonAPI
        .findList({
          className: "School",

          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETSCHOOLS", result.data);
          }
        });
    },

    SETDEPARTMENTS(ctx) {
      commonAPI
        .findList({
          className: "Department",

          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETDEPARTMENTS", result.data);
          }
        });
    },

    SETCLASS(ctx) {
      commonAPI
        .findList({
          className: "Class",

          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETCLASS", result.data);
          }
        });
    },

    SETMAJORS(ctx) {
      commonAPI
        .findList({
          className: "Major",

          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETMAJORS", result.data);
          }
        });
    },

    SETCOURSE(ctx) {
      commonAPI
        .findList({
          className: "Course",

          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETCOURSE", result.data);
          }
        });
    },

    SETTEACHER(ctx) {
      commonAPI
        .findList({
          className: "Teacher",
          name: "",
        })
        .then((result) => {
          if (result.code == 200) {
            ctx.commit("SETTEACHER", result.data);
          }
        });
    },
  },
  modules: {},
};
