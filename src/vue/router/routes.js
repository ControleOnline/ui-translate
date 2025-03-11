export const routes = [{
    path: '/translates/',
    component: () =>  import ('@controleonline/ui-layout/src/vue/layouts/AdminLayout.vue'),
    children: [
      {
        name: 'TranslateIndex',
        path: '',
        component: () =>  import ('@controleonline/ui-translate/src/vue/pages/Menu.vue'),
      },    
      {
        name: "translateDetails",
        path: "id/:id",
        component: () => import("@controleonline/ui-translate/src/vue/pages/Details.vue"),
      }      
    ]
  }];
  
  export default routes
  